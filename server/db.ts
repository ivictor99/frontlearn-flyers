import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BRAND } from '../src/engine/brand';
import { BUILTIN_TEMPLATES } from '../src/engine/templates';
import type { BrandConfig, FlyerContent, Template } from '../src/engine/types';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = resolve(here, '..');
export const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(ROOT_DIR, 'data');
export const UPLOAD_DIR = join(DATA_DIR, 'uploads');
const DB_FILE = join(DATA_DIR, 'db.json');

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  size: number;
  mime: string;
  createdAt: string;
}

export interface FlyerRecord {
  id: string;
  name: string;
  templateId: string;
  content: FlyerContent;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Database {
  brand: BrandConfig;
  templates: Template[];
  media: MediaItem[];
  flyers: FlyerRecord[];
  users: UserRecord[];
  sessions: SessionRecord[];
}

function emptyDb(): Database {
  return {
    brand: { ...DEFAULT_BRAND },
    templates: [],
    media: [],
    flyers: [],
    users: [],
    sessions: [],
  };
}

function ensureDirs(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * The document store.
 *
 * A small JSON file with an in-memory cache and atomic writes. The public API
 * is intentionally narrow so it can be replaced by a database later without
 * touching the routes.
 */
export class Store {
  private db: Database;

  constructor() {
    ensureDirs();
    this.db = this.load();
  }

  private load(): Database {
    if (existsSync(DB_FILE)) {
      try {
        const parsed = JSON.parse(readFileSync(DB_FILE, 'utf8')) as Database;
        const merged = { ...emptyDb(), ...parsed };
        merged.brand = { ...DEFAULT_BRAND, ...(parsed.brand ?? {}) };
        this.seedTemplates(merged);
        return merged;
      } catch (error) {
        console.error('[db] could not read db.json, starting fresh:', error);
      }
    }
    const fresh = emptyDb();
    this.seedTemplates(fresh);
    this.save(fresh);
    return fresh;
  }

  private seedTemplates(db: Database): void {
    const existing = new Set(db.templates.map((t) => t.id));
    let changed = false;
    for (const template of BUILTIN_TEMPLATES) {
      if (!existing.has(template.id)) {
        db.templates.push(template);
        changed = true;
      }
    }
    if (changed) this.save(db);
  }

  private save(db: Database): void {
    const tmp = `${DB_FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
    renameSync(tmp, DB_FILE);
    this.db = db;
  }

  read(): Database {
    return this.db;
  }

  /** Apply a mutation and persist it atomically. */
  update<T>(mutator: (db: Database) => T): T {
    const draft: Database = JSON.parse(JSON.stringify(this.db));
    const result = mutator(draft);
    this.save(draft);
    return result;
  }

  get brand(): BrandConfig {
    return this.db.brand;
  }

  get templates(): Template[] {
    return this.db.templates;
  }

  get media(): MediaItem[] {
    return this.db.media;
  }

  get flyers(): FlyerRecord[] {
    return this.db.flyers;
  }

  get users(): UserRecord[] {
    return this.db.users;
  }

  get sessions(): SessionRecord[] {
    return this.db.sessions;
  }
}

export const store = new Store();
