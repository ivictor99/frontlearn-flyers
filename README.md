# Flyer Studio

A school flyer generator. A staff member supplies the information, picks a template, and
gets a designed flyer they can download — without touching a design tool.

> I provide the information. The system handles the design. I receive a professional
> school flyer.

## Running and publishing

`DEPLOY.md` has the full guide: running it locally, the `.env` file, pushing to
GitHub (token, SSH or the GitHub CLI), and deploying with Docker, Render/Railway or a
school server behind nginx.

## Quick start

```bash
npm install
npm run dev        # Vite on :5173 + API on :4010
```

Production:

```bash
npm run build      # bundles the client into dist/client
npm start          # Express serves the API and the built client on :4010
```

Seeded accounts (override with `ADMIN_USERNAME` / `ADMIN_PASSWORD`):

| Role  | Username | Password   |
| ----- | -------- | ---------- |
| Admin | `admin`  | `frontlearn` |
| Staff | `staff`  | `staff123`  |

## The flow

1. **Choose a template** — 16 built-in designs across admissions, programmes, intakes,
   events, workshops, seminars, careers, graduation, scholarships, achievements, general
   announcements and social posts.
2. **Add the details** — only the fields that template actually uses are shown. Nothing
   is required; empty sections close themselves.
3. **Add a picture** — upload one or pick from the school library.
4. **Preview** — the live preview is a real render of the same engine the export uses,
   so what you see is exactly what you download.
5. **Download** — PNG, JPG or PDF at the template's native size.

`Write it in your own words` (Assist) reads a pasted message and fills the flyer in. It
is assistive only: it suggests a template and a set of fields, and the user confirms
before anything is applied.

## Architecture

The whole product is one pipeline. The engine is deliberately separate from the UI so
it can be tested, reused and extended without touching React.

```
USER INPUT → CONTENT MODEL → TEMPLATE ENGINE → LAYOUT ENGINE → RENDERER → PREVIEW → EXPORT
```

| Stage | Where | What it does |
| --- | --- | --- |
| Content model | `src/engine/content.ts` | Normalises the fields the user typed. |
| Template model | `src/engine/templates/*` | A template is *data*: style, bands, columns, blocks. |
| Layout engine | `src/engine/layout.ts` | Pure TypeScript. Measures, fits, wraps, crops, resolves overflow. |
| Renderer | `src/engine/render.ts` | Canvas 2D. Paints the resolved geometry — nothing else. |
| Preview | `src/ui/components/FlyerCanvas.tsx` | Calls the renderer on a live canvas. |
| Export | `src/engine/export.ts` | Same renderer, higher scale, PNG/JPG/PDF. |

Because preview and export share one render path, they cannot drift apart.

### Why Canvas 2D

One renderer, no DOM measurement races, exact control over cropping and kerning, and a
single code path from screen to PDF. The layout engine never touches the DOM: it is
handed a `MeasureText` function, which keeps it pure and unit-testable.

### Template model

```
Template
├── style      background, type scale, text roles, logo treatment
└── bands[]    vertical sections
    └── columns[]
        └── blocks[]   text | facts | list | image | cta | logo | divider | space | rule
```

Adding a template is a data-only change — no engine or UI edits.

Colours are **roles**, not hex codes (`primary`, `secondary`, `accent`, `ink`, `paper`,
`muted`). Templates reference roles, so changing the brand restyles every flyer at once.

### Layout resolution order

1. Resolve colour tokens against the brand.
2. Filter out blocks whose content is missing; collapse empty sections.
3. Fit each text block to its box (binary search on font size, line budget, ellipsis).
4. Measure intrinsic block heights.
5. Compose bands: flow bands stack, top/bottom bands pin, flexible bands absorb the
   remaining space.
6. Resolve overflow — shrink type, then shrink pictures, then drop the least important
   optional blocks, then compress gaps. The headline is never dropped.
7. Cover-crop images around their focal point.

### Brand

Admin-managed: logo, school name, tagline, palette, heading/body fonts, contact
defaults, footer note and default call to action. Every template inherits it.

## Project layout

`STRUCTURE.md` is the full map: what belongs in every file, the build order, and a
"where do I change…" table.

```
src/engine/     the engine: types, brand, fields, typography, layout, render, export
src/engine/templates/   the 16 built-in templates
src/engine/parser/      free-text → content model
src/ui/        React app: studio, gallery, brand admin, template admin
server/        Express API, JSON store, sessions, uploads
scripts/       Playwright checks (smoke, end-to-end export, admin flows)
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Client and API together |
| `npm run build` | Production client build |
| `npm start` | Serve the built client and the API |
| `npm test` | Engine unit tests (vitest) |
| `npm run typecheck` | Type-check client and server |
| `npm run structure` | Print the file tree and every file's public API |
| `npx tsx scripts/trim-logo.ts <in.png> public/logo.png` | Trim the empty margin off a logo PNG |
| `npx tsx scripts/smoke.ts` | Screenshot the main screens |
| `npx tsx scripts/e2e.ts` | Upload a picture, export PNG/JPG/PDF |
| `npx tsx scripts/e2e-admin.ts` | Assist, brand and template admin flows |

## Optional AI

The parser is a deterministic heuristic and works offline. To add a language model,
set `LLM_BASE_URL` and `LLM_API_KEY`; its output is merged over the heuristic result and
falls back silently if the call fails. AI never decides the layout — it only suggests
content, and the user confirms.

## The school logo

`public/logo.png` is the default logo, served at `/logo.png`. The brand stores the
image's intrinsic size (`logoWidth` / `logoHeight`) so the engine can size the logo box
without loading the file; if a school has no logo file, the school name is set as a
wordmark instead. Uploading a new logo in the brand admin updates the size for you.

## Data

`data/db.json` is a small JSON store (templates, brand, media, saved flyers);
`data/uploads/` holds uploaded images, served from `/media/*`. Both are created on first
run. Sessions are signed, httpOnly cookies with `admin` and `staff` roles.
