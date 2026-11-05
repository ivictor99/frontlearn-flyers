import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { DEFAULT_BRAND, FONT_KEYS } from '../src/engine/brand';
import { parseFreeText } from '../src/engine/parser/heuristics';
import type { Template } from '../src/engine/types';
import {
  clearFailures,
  createSession,
  destroySession,
  isThrottled,
  readCookie,
  recordFailure,
  requireAdmin,
  requireAuth,
  SESSION_COOKIE,
  throttleKey,
  verifyPassword,
} from './auth';
import { store, UPLOAD_DIR } from './db';
import { fileSize, readImageSize } from './imageinfo';
import type { AuthedRequest } from './auth';

export const router: Router = Router();

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = ALLOWED_TYPES.get(file.mimetype) ?? '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed.'));
  },
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'flyer-studio' });
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

router.post('/auth/login', (req, res) => {
  const key = throttleKey(req);
  if (isThrottled(key)) {
    res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
    return;
  }
  const parsed = z.object({ username: z.string().min(1), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter your username and password.' });
    return;
  }
  const { username, password } = parsed.data;
  const user = store.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user || !verifyPassword(password, user)) {
    recordFailure(key);
    res.status(401).json({ error: 'Those details do not match our records.' });
    return;
  }
  clearFailures(key);
  const token = createSession(user.id);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1',
    maxAge: 1000 * 60 * 60 * 12,
    path: '/',
  });
  res.json({ user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/auth/logout', (req, res) => {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (token) destroySession(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

router.get('/auth/me', (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role } });
});

// ---------------------------------------------------------------------------
// Bootstrap — one call gives the client everything it needs
// ---------------------------------------------------------------------------

router.get('/bootstrap', (req: AuthedRequest, res) => {
  res.json({
    brand: store.brand,
    templates: store.templates.filter((t) => t.active || req.user?.role === 'admin'),
    media: store.media,
    user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null,
  });
});

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour');

const brandSchema = z.object({
  schoolName: z.string().min(1).max(80),
  tagline: z.string().max(160),
  logoUrl: z.string().nullable(),
  logoWidth: z.number().int().positive().nullable(),
  logoHeight: z.number().int().positive().nullable(),
  colors: z.object({
    primary: hex,
    secondary: hex,
    accent: hex,
    ink: hex,
    paper: hex,
    muted: hex,
  }),
  fonts: z.object({
    heading: z.enum(FONT_KEYS),
    body: z.enum(FONT_KEYS),
  }),
  website: z.string().max(120),
  phone: z.string().max(60),
  email: z.string().max(120),
  address: z.string().max(160),
  socials: z.array(z.object({ platform: z.string().max(40), handle: z.string().max(80) })).max(8),
  defaultCta: z.string().max(60),
  footerNote: z.string().max(200),
});

router.get('/brand', (_req, res) => {
  res.json(store.brand);
});

router.put('/brand', requireAdmin, (req, res) => {
  const parsed = brandSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Some brand details are not valid.', issues: parsed.error.issues });
    return;
  }
  store.update((db) => {
    db.brand = parsed.data;
  });
  res.json(store.brand);
});

router.post('/brand/reset', requireAdmin, (_req, res) => {
  store.update((db) => {
    db.brand = { ...DEFAULT_BRAND };
  });
  res.json(store.brand);
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const templateSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  description: z.string().max(240),
  aspect: z.enum(['square', 'portrait', 'story', 'landscape', 'a4']),
  active: z.boolean(),
  fields: z.array(z.string()).max(40),
  style: z.record(z.string(), z.any()),
  layout: z.record(z.string(), z.any()),
  previewUrl: z.string().nullable().optional(),
});

function sanitiseTemplate(input: z.infer<typeof templateSchema>, id: string): Template {
  const now = new Date().toISOString();
  return {
    id,
    name: input.name,
    category: input.category as Template['category'],
    description: input.description,
    aspect: input.aspect,
    active: input.active,
    builtin: false,
    fields: input.fields,
    style: input.style as unknown as Template['style'],
    layout: input.layout as unknown as Template['layout'],
    previewUrl: input.previewUrl ?? undefined,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

router.get('/templates', (_req, res) => {
  res.json(store.templates);
});

router.post('/templates', requireAdmin, (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'The template definition is not valid.', issues: parsed.error.issues });
    return;
  }
  const id = `custom-${randomUUID().slice(0, 8)}`;
  const template = sanitiseTemplate(parsed.data, id);
  store.update((db) => {
    db.templates.push(template);
  });
  res.status(201).json(template);
});

router.put('/templates/:id', requireAdmin, (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'The template definition is not valid.', issues: parsed.error.issues });
    return;
  }
  const id = String(req.params.id);
  const existing = store.templates.find((t) => t.id === id);
  if (!existing) {
    res.status(404).json({ error: 'Template not found.' });
    return;
  }
  const updated = sanitiseTemplate(parsed.data, id);
  updated.createdAt = existing.createdAt;
  updated.builtin = existing.builtin;
  updated.version = existing.version + 1;
  store.update((db) => {
    db.templates = db.templates.map((t) => (t.id === id ? updated : t));
  });
  res.json(updated);
});

router.post('/templates/:id/duplicate', requireAdmin, (req, res) => {
  const source = store.templates.find((t) => t.id === String(req.params.id));
  if (!source) {
    res.status(404).json({ error: 'Template not found.' });
    return;
  }
  const copy: Template = {
    ...JSON.parse(JSON.stringify(source)),
    id: `custom-${randomUUID().slice(0, 8)}`,
    name: `${source.name} (copy)`,
    builtin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  store.update((db) => {
    db.templates.push(copy);
  });
  res.status(201).json(copy);
});

router.post('/templates/:id/toggle', requireAdmin, (req, res) => {
  const id = String(req.params.id);
  const existing = store.templates.find((t) => t.id === id);
  if (!existing) {
    res.status(404).json({ error: 'Template not found.' });
    return;
  }
  const active = !existing.active;
  store.update((db) => {
    db.templates = db.templates.map((t) => (t.id === id ? { ...t, active, updatedAt: new Date().toISOString() } : t));
  });
  res.json({ id, active });
});

router.delete('/templates/:id', requireAdmin, (req, res) => {
  const id = String(req.params.id);
  const existing = store.templates.find((t) => t.id === id);
  if (!existing) {
    res.status(404).json({ error: 'Template not found.' });
    return;
  }
  store.update((db) => {
    db.templates = db.templates.filter((t) => t.id !== id);
  });
  res.json({ ok: true, id });
});

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

router.get('/media', (_req, res) => {
  res.json(store.media);
});

router.post('/media', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image was uploaded.' });
    return;
  }
  const dimensions = readImageSize(req.file.path);
  if (!dimensions) {
    unlinkSync(req.file.path);
    res.status(400).json({ error: 'That file could not be read as an image.' });
    return;
  }
  const ext = ALLOWED_TYPES.get(req.file.mimetype) ?? '.jpg';
  const item = {
    id: randomUUID(),
    url: `/media/${req.file.filename}`,
    name: req.file.originalname.slice(0, 120),
    width: dimensions.width,
    height: dimensions.height,
    size: fileSize(req.file.path),
    mime: req.file.mimetype,
    createdAt: new Date().toISOString(),
  };
  void ext;
  store.update((db) => {
    db.media.unshift(item);
  });
  res.status(201).json(item);
});

router.delete('/media/:id', requireAdmin, (req, res) => {
  const item = store.media.find((m) => m.id === String(req.params.id));
  if (!item) {
    res.status(404).json({ error: 'Image not found.' });
    return;
  }
  const filename = item.url.replace(/^\/media\//, '');
  const target = join(UPLOAD_DIR, filename);
  if (target.startsWith(UPLOAD_DIR) && existsSync(target)) {
    try {
      unlinkSync(target);
    } catch {
      /* the record is removed regardless */
    }
  }
  store.update((db) => {
    db.media = db.media.filter((m) => m.id !== item.id);
    if (db.brand.logoUrl === item.url) db.brand.logoUrl = null;
  });
  res.json({ ok: true, id: item.id });
});

// ---------------------------------------------------------------------------
// Saved flyers
// ---------------------------------------------------------------------------

const flyerSchema = z.object({
  name: z.string().min(1).max(120),
  templateId: z.string().min(1),
  content: z.record(z.string(), z.any()),
});

router.get('/flyers', requireAuth, (_req, res) => {
  res.json(store.flyers);
});

router.post('/flyers', requireAuth, (req: AuthedRequest, res) => {
  const parsed = flyerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'The flyer details are not valid.' });
    return;
  }
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    name: parsed.data.name,
    templateId: parsed.data.templateId,
    content: parsed.data.content,
    createdAt: now,
    updatedAt: now,
    createdBy: req.user?.username ?? 'unknown',
  };
  store.update((db) => {
    db.flyers.unshift(record);
  });
  res.status(201).json(record);
});

router.put('/flyers/:id', requireAuth, (req: AuthedRequest, res) => {
  const parsed = flyerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'The flyer details are not valid.' });
    return;
  }
  const existing = store.flyers.find((f) => f.id === String(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Flyer not found.' });
    return;
  }
  const updated = {
    ...existing,
    name: parsed.data.name,
    templateId: parsed.data.templateId,
    content: parsed.data.content,
    updatedAt: new Date().toISOString(),
  };
  store.update((db) => {
    db.flyers = db.flyers.map((f) => (f.id === existing.id ? updated : f));
  });
  res.json(updated);
});

router.delete('/flyers/:id', requireAuth, (req: AuthedRequest, res) => {
  const existing = store.flyers.find((f) => f.id === String(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Flyer not found.' });
    return;
  }
  store.update((db) => {
    db.flyers = db.flyers.filter((f) => f.id !== existing.id);
  });
  res.json({ ok: true, id: existing.id });
});

// ---------------------------------------------------------------------------
// AI assistance
// ---------------------------------------------------------------------------

router.post('/ai/parse', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ text: z.string().max(4000) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide some text to work with.' });
    return;
  }
  const result = await parseWithOptionalLlm(parsed.data.text);
  res.json(result);
});

async function parseWithOptionalLlm(text: string) {
  const base = parseFreeText(text);
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  if (!apiKey || !baseUrl) return base;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You extract structured flyer content for a school. Reply with JSON only using keys: headline, eyebrow, subhead, body, program, date, time, venue, fee, deadline, cta, highlights (array), bullets (array). Use null for unknown values. Keep the wording the user wrote.',
          },
          { role: 'user', content: text },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) return base;
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const content: Record<string, unknown> = { ...base.content };
    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'string' && !value.trim()) continue;
      content[key] = value;
    }
    return { ...base, content, source: 'llm' as const };
  } catch {
    return base;
  } finally {
    clearTimeout(timeout);
  }
}
