import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import { config as loadEnv } from 'dotenv';
import { attachUser, hashPassword } from './auth';
import { store, ROOT_DIR, UPLOAD_DIR } from './db';
import { router } from './routes';

/**
 * Flyer Studio server.
 *
 * Serves the JSON API, the uploaded media library and (in production) the
 * built front-end. The server never renders a flyer — that is the browser's
 * job — so it stays small and fast on modest school hardware.
 */

// Optional .env file — every value has a working default.
loadEnv();

const PORT = Number(process.env.PORT ?? 4010);
const HOST = process.env.HOST ?? '0.0.0.0';
const CLIENT_DIR = join(ROOT_DIR, 'dist', 'client');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// --- security headers -------------------------------------------------------
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(attachUser);

// --- media library ----------------------------------------------------------
app.use(
  '/media',
  express.static(UPLOAD_DIR, {
    maxAge: '7d',
    index: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
    },
  }),
);

// --- api --------------------------------------------------------------------
app.use('/api', router);

// --- front-end --------------------------------------------------------------
if (existsSync(CLIENT_DIR)) {
  app.use(express.static(CLIENT_DIR, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api|\/media).*/, (_req, res) => {
    res.sendFile(join(CLIENT_DIR, 'index.html'));
  });
}

// --- errors -----------------------------------------------------------------
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  const status = /allowed|too large|file/i.test(message) ? 400 : 500;
  if (status === 500) console.error('[server]', error);
  res.status(status).json({ error: message });
});

// --- seed the first administrator ------------------------------------------
function seedUsers(): void {
  if (store.users.length > 0) return;
  const now = new Date().toISOString();
  const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'frontlearn';
  const admin = hashPassword(adminPassword);
  const staff = hashPassword(process.env.STAFF_PASSWORD ?? 'staff123');
  store.update((db) => {
    db.users.push(
      {
        id: 'user-admin',
        username: adminUser,
        passwordHash: admin.hash,
        salt: admin.salt,
        role: 'admin',
        createdAt: now,
      },
      {
        id: 'user-staff',
        username: 'staff',
        passwordHash: staff.hash,
        salt: staff.salt,
        role: 'staff',
        createdAt: now,
      },
    );
  });
  console.log(`[server] created administrator "${adminUser}" — change the password after first sign-in.`);
}

seedUsers();

app.listen(PORT, HOST, () => {
  console.log(`[server] Flyer Studio API listening on http://${HOST}:${PORT}`);
});
