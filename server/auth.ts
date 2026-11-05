import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { store } from './db';
import type { UserRecord } from './db';

/**
 * Authentication.
 *
 * Small and explicit: scrypt-hashed passwords, opaque session tokens stored
 * server-side, an httpOnly cookie, and a simple per-IP throttle on login.
 */

export const SESSION_COOKIE = 'flyer_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt ?? randomBytes(16).toString('hex');
  const hash = scryptSync(password, useSalt, 64).toString('hex');
  return { hash, salt: useSalt };
}

export function verifyPassword(password: string, user: UserRecord): boolean {
  const { hash } = hashPassword(password, user.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(user.passwordHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSession(userId: string): string {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  store.update((db) => {
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
    db.sessions.push({
      token,
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    });
  });
  return token;
}

export function destroySession(token: string): void {
  store.update((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}

export function userForToken(token: string | undefined): UserRecord | null {
  if (!token) return null;
  const session = store.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  return store.users.find((u) => u.id === session.userId) ?? null;
}

export interface AuthedRequest extends Request {
  user?: UserRecord;
}

export function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  const user = userForToken(token);
  if (user) req.user = user;
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Please sign in to continue.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Please sign in to continue.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'This action needs administrator access.' });
    return;
  }
  next();
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Login throttling
// ---------------------------------------------------------------------------

const attempts = new Map<string, { count: number; resetAt: number }>();

export function throttleKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';
  return ip;
}

export function isThrottled(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= 8;
}

export function recordFailure(key: string): void {
  const entry = attempts.get(key) ?? { count: 0, resetAt: Date.now() + 60_000 };
  entry.count += 1;
  attempts.set(key, entry);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
