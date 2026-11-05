# Flyer Studio — Structural Map

Every file, what belongs in it, and where to edit when you want to change something.
Regenerate the tree at any time with `npm run structure`.

---

## 1. The hierarchy

```
flyer-studio/
│
├── ARCHITECTURE.md              198   Product + technical architecture (the "why")
├── README.md                    139   Getting started, scripts, project layout
├── STRUCTURE.md                     ← this file: the maintainer's map
├── index.html                     17   Vite HTML shell (title, meta, #root)
├── package.json                   45   Dependencies + npm scripts
├── tsconfig.json                  26   Client TS config (paths @engine/* @ui/*)
├── tsconfig.server.json           24   Server TS config (include: ["server"])
├── vite.config.ts                 31   React plugin, aliases, /api + /media proxy → 4010
│
├── public/                             Static files copied into the build, served at the root
│   └── logo.png                        The school logo (default brand logo)
│
├── data/                               Runtime data (git-ignored in spirit)
│   ├── db.json                        Brand, templates, media, saved flyers, users
│   └── uploads/                       Uploaded images, served at /media/*
│
├── dist/client/                       Production build output (npm run build)
├── shots/                             Screenshots written by the Playwright checks
│
├── scripts/
│   ├── structure.ts                   Prints this hierarchy + per-file exports
│   ├── trim-logo.ts             52   Removes the transparent margin from a logo PNG
│   ├── smoke.ts                 104   Screenshots the main screens, asserts no console errors
│   ├── e2e.ts                   117   Upload a picture → export PNG/JPG/PDF → save a draft
│   └── e2e-admin.ts             104   Assist flow, brand edits, template admin actions
│
├── server/                            Express API (TypeScript, run with tsx)
│   ├── index.ts                 103   App wiring: middleware, static media, SPA fallback, listen
│   ├── routes.ts                492   Every REST endpoint (auth, brand, templates, media, flyers, ai)
│   ├── db.ts                    165   JSON document store, atomic writes, seeding
│   ├── auth.ts                  131   scrypt hashing, sessions, role guards, login throttle
│   └── imageinfo.ts              80   Reads image dimensions from the file header
│
└── src/
    ├── main.tsx                   24   React entry: mounts <App/> in <AppProvider>
    ├── App.tsx                    92   App shell: top bar, banner, routes
    ├── styles.css               1307   The entire stylesheet (one file, design tokens at the top)
    │
    ├── engine/                        ── Pure TypeScript. No React, no DOM except the injected measurer.
    │   ├── types.ts              395   Every type contract in the system
    │   ├── brand.ts              172   Font stacks, aspect specs, default brand, colour utilities
    │   ├── fields.ts              61   The content vocabulary (field list, labels, groups)
    │   ├── typography.ts         228   Wrapping, fitting, ellipsis, scale-to-fit
    │   ├── measure.ts             67   Cached text measurement (canvas-backed, injectable)
    │   ├── image.ts               92   Image cache/loader, cover-crop, focal point
    │   ├── icons.ts              133   Nine vector icon painters
    │   ├── content.ts            107   Content model helpers (normalise, merge, score)
    │   ├── layout.ts             876   THE LAYOUT ENGINE
    │   ├── render.ts             513   THE RENDERER (Canvas 2D)
    │   ├── export.ts             146   Paint → PNG / JPG / PDF
    │   │
    │   ├── parser/
    │   │   └── heuristics.ts     381   Free text → content model (+ optional LLM merge on the server)
    │   │
    │   ├── templates/                  A template is DATA, not code.
    │   │   ├── common.ts           78   makeTemplate() factory, role helpers, contact rows
    │   │   ├── index.ts            71   Registry: BUILTIN_TEMPLATES, categories, templateById
    │   │   ├── admissions.ts      293   admissions-open, admissions-closing
    │   │   ├── programmes.ts      266   course-feature, course-list
    │   │   ├── events.ts          613   event-poster, event-banner, workshop-bold, seminar-clean, career-connect
    │   │   ├── special.ts         532   graduation-classic, scholarship, achievement-celebrate, new-intake
    │   │   └── promo.ts           367   promo-offer, general-announcement, social-square
    │   │
    │   └── __tests__/
    │       ├── layout.test.ts     202   Layout + typography regression tests
    │       └── parser.test.ts      81   Parser regression tests
    │
    └── ui/                            ── React app. Knows about the engine, never the reverse.
        ├── api.ts                  79   fetch wrapper (ApiError), MediaItem/UserInfo/FlyerRecord types
        ├── store.tsx              174   AppProvider, useApp, useLocalDraft, toasts
        │
        ├── components/
        │   ├── FlyerCanvas.tsx     98   Live preview canvas (fits the stage, repaints on change)
        │   ├── TemplateThumb.tsx   118   Small real render used in the gallery and picker
        │   ├── FieldEditor.tsx     66   One input for one field (text / long text / list)
        │   └── ImagePicker.tsx    109   Upload, pick from the library, or remove
        │
        └── pages/
            ├── Studio.tsx         380   The main screen: pick → fill → preview → export
            ├── Gallery.tsx         81   Filterable template gallery
            ├── BrandPage.tsx      293   Brand admin with a live preview
            ├── TemplatesAdmin.tsx 574  Template list + data-driven band/block editor
            └── Login.tsx           77   Sign-in
```

### Why this shape

The engine is a **pure library**: `src/engine` imports no React and touches no DOM except
through an injected `MeasureText`. That is what makes it unit-testable and what lets the
server reuse the same layout code. The UI depends on the engine; the engine never
depends on the UI.

---

## 2. What belongs in each file

### 2.1 Configuration files

| File | Contents |
| --- | --- |
| `package.json` | Scripts: `dev`, `build`, `start`, `test`, `typecheck`, `structure`. Dependencies: react 19, express 5, multer, zod, jspdf, nanoid. Dev: vite 7, typescript 5.9, vitest 3, playwright. |
| `tsconfig.json` | Client config. `strict`, `noUnusedLocals`, `noUnusedParameters`, paths `@engine/*` → `src/engine/*`, `@ui/*` → `src/ui/*`. |
| `tsconfig.server.json` | Server config. `include: ["server"]` only — widen it and browser-only engine files pull in DOM lib errors. |
| `vite.config.ts` | React plugin, the two aliases, `server.host = '0.0.0.0'`, `allowedHosts: ['.e2b.app','localhost']`, proxy `/api` and `/media` → `http://127.0.0.1:4010`, `build.outDir = 'dist/client'`. |
| `index.html` | `<div id="root">`, title, meta viewport, theme colour. Nothing else — no CDN links. |

### 2.2 `src/engine/types.ts` — every contract in one place

Nothing else in the engine declares a type. If you need a new shape, it goes here first.

```ts
export type FontKey = 'jakarta' | 'inter' | 'serif';

export interface BrandColors {
  primary: string; secondary: string; accent: string;
  ink: string; paper: string; muted: string;
}

export interface BrandConfig {
  schoolName: string; tagline: string;
  logoUrl: string | null;
  logoWidth: number | null;     // intrinsic size of the logo file
  logoHeight: number | null;    // used to size the logo box in a flyer
  colors: BrandColors;
  fonts: { heading: FontKey; body: FontKey };
  website: string; phone: string; email: string; address: string;
  socials: { platform: string; handle: string }[];
  defaultCta: string; footerNote: string;
}

export interface ImageValue {
  url: string; width: number; height: number;
  focalX: number;   // 0..1 focal point for cover-cropping
  focalY: number;
  alt?: string;
}

export type ContentValue = string | string[] | ImageValue | null;
export type FlyerContent = Record<string, ContentValue>;

export type TextRole =
  | 'eyebrow' | 'headline' | 'subhead' | 'body' | 'label' | 'value' | 'cta' | 'meta';
```

The two most important structural types:

```ts
export interface LayoutBlock {
  id: string;
  kind: BlockKind;          // text | facts | list | image | cta | logo | divider | space | rule
  field?: string;            // which content field this renders
  role: TextRole;
  text?: string;             // static copy, supports {{token}}
  items?: FactItem[];
  gap?: number; align?: Align; width?: number;
  style?: Partial<TextStyle>;
  image?: ImageSpec;
  height?: number; pill?: boolean;
  pillStyle?: { fill?: string; textColor?: string; paddingX?: number; paddingY?: number; radius?: number };
  priority?: number;         // higher = kept longer when the layout overflows
  essential?: boolean;       // never dropped
  factsColumns?: number; cellAlign?: 'left' | 'center';
  listStyle?: ListStyle; maxItems?: number; listGap?: number;
  factColors?: { label?: string; value?: string; icon?: string };
  offsetX?: number; offsetY?: number;   // used for overlapping elements
  color?: string; thickness?: number;
}

export interface LayoutBand {
  id: string;
  height?: number; minHeight?: number;
  bg?: Fill;
  padX?: number; padY?: number; gap?: number; colGap?: number;
  align?: Align;
  columns?: LayoutColumn[];   // columns in a band sum to 1
  blocks?: LayoutBlock[];     // or a simple single-column band
  pin?: 'top' | 'bottom';     // pinned bands keep their position
  offsetY?: number;
  flex?: boolean;             // absorbs leftover space so the content fills the canvas
  inset?: { left?: number; right?: number };
}
```

The renderer's only input — everything above resolves into these:

```ts
export interface ResolvedLayout {
  width: number; height: number;
  background: Fill;
  bands: ResolvedBand[];
  blocks: ResolvedBlock[];   // flat list with absolute x/y/w/h
  decorations: Decoration[];
  scale: number;
}
```

### 2.3 `src/engine/brand.ts` — fonts, sizes, colours

```ts
export const FONT_STACKS: Record<FontKey, string>;
export const FONT_KEYS: FontKey[];
export const FONT_LABELS: Record<FontKey, string>;
export const ASPECTS: Record<AspectKey, AspectSpec>;   // square | portrait | story | landscape | a4
export const DEFAULT_BRAND: BrandConfig;
export const BRAND_PRESETS: { id: string; name: string; colors: BrandColors }[];

export function brandFontStack(brand: BrandConfig, family: 'heading' | 'body'): string;
export function shade(hex: string, amount: number): string;
export function withAlpha(hex: string, alpha: number): string;
export function parseHex(hex: string): { r: number; g: number; b: number };
export function toHex({ r, g, b }: { r: number; g: number; b: number }): string;
export function luminance(hex: string): number;
export function readableOn(bg: string, light?: string, dark?: string): string;

/** Token resolution — this is how a template inherits the brand. */
export type ColorToken =
  | 'primary' | 'secondary' | 'accent' | 'ink' | 'paper' | 'muted'
  | 'primary-soft' | 'secondary-soft' | 'accent-soft'
  | 'on-primary' | 'on-secondary' | 'on-accent';

export function resolveColor(value: string | undefined, brand: BrandConfig): string | undefined;
```

`resolveColor` accepts a token (`'accent'`), a soft variant (`'accent-soft'`), an
on-colour (`'on-primary'`), or a raw hex. Templates only ever use tokens.

### 2.4 `src/engine/fields.ts` — the content vocabulary

This is the list of things a flyer can contain. Adding a field means editing this file.

```ts
export type FieldType = 'text' | 'longtext' | 'list' | 'image';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  group: string;
  placeholder?: string;
  hint?: string;
  compact?: boolean;   // renders side by side with the next field
}

export const FIELDS: FieldDef[];
export const FIELD_MAP: Record<string, FieldDef>;
export const FIELD_GROUPS: { id: string; label: string }[];
export const BRAND_BACKED_FIELDS: string[];   // phone/email/website fall back to the brand

export function fieldLabel(key: string): string;
export function isCompactField(key: string): boolean;
```

Current vocabulary: `eyebrow, headline, subhead, body, program, date, time, venue, fee,
deadline, cta, organiser, reference, highlights[], bullets[], phone, email, website,
address, image`.

### 2.5 `src/engine/typography.ts` — text fitting

```ts
export interface FitOptions {
  text: string;
  family: string; weight: number; tracking: number;
  maxWidth: number; maxHeight?: number;
  minSize: number; maxSize: number;
  maxLines: number; lineHeightRatio: number;
  transform: 'none' | 'uppercase';
  fit: 'shrink' | 'fixed' | 'grow';
}

export interface FitResult {
  lines: string[]; size: number; lineHeight: number;
  width: number; height: number; truncated: boolean;
}

export function wrapTextDetailed(text, measure, font, maxWidth): { lines: string[]; hardBroken: boolean };
export function wrapText(text, measure, font, maxWidth): string[];
export function ellipsize(text: string, measure, font, maxWidth: number): string;
export function fitText(opts: FitOptions, measure: MeasureText): FitResult;
export function scaleFit(fit: FitResult, maxHeight: number, minRatio?: number): FitResult;
```

`hardBroken` matters: when a word is longer than the line (an email, a URL) the fitter
**shrinks the type instead of splitting the word**. Without it, `admissions@school.ac.ke`
breaks across two lines.

### 2.6 `src/engine/measure.ts` — measuring text

```ts
export function setMeasurementContext(next: CanvasRenderingContext2D | null): void;
export function createMeasurer(): MeasureText;      // (text, font) => px width, cached
export function clearMeasurementCache(): void;
```

The measurer is injected into the layout engine. That single seam is why the engine is
testable: in tests you swap in a fake measurer instead of a canvas.

### 2.7 `src/engine/image.ts` — pictures

```ts
export function loadImage(url: string): Promise<HTMLImageElement | null>;
export async function loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>>;
export function coverCrop(img, box, focal): CropRect;   // fill the box, keep the focal point
export function focalFor(value: ImageValue): { x: number; y: number };
```

### 2.8 `src/engine/icons.ts` — the nine icons

```ts
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,     // phone | mail | globe | calendar | pin | money | clock | tag | check
  x: number, y: number, size: number, color: string,
): void;
```

Each icon is a pure vector painter — no image assets, no network.

### 2.9 `src/engine/content.ts` — the content model

```ts
export function emptyContent(): FlyerContent;
export function normalizeContent(content: FlyerContent): FlyerContent;
export function getString(content: FlyerContent, key: string): string;
export function getList(content: FlyerContent, key: string): string[];
export function getImage(content: FlyerContent, key?: string): ImageValue | null;
export function hasValue(content: FlyerContent, key: string): boolean;
export function fieldsForTemplate(template: Template): string[];
export function missingFields(template: Template, content: FlyerContent): string[];
export function unusedFields(template: Template, content: FlyerContent): string[];
export function mergeContent(current: FlyerContent, incoming: FlyerContent): FlyerContent;
export function contentScore(template: Template, content: FlyerContent): { filled: number; total: number };
```

`mergeContent` is what the Assist feature calls — incoming values fill blanks but never
overwrite what the user typed.

### 2.10 `src/engine/layout.ts` — the layout engine (876 lines)

The heart of the product. Pure: input is `(template, brand, content, options)`, output is
a `ResolvedLayout` with absolute coordinates.

**Internal map:**

| Function | Line | Responsibility |
| --- | --- | --- |
| `resolveTemplateTokens` | 68 | Replaces `{{schoolName}}`, `{{phone}}`… in static text. |
| `contentString` / `contentImage` | 93 / 101 | Read a field, with brand fallbacks. |
| `styleFor` | 109 | Merge the role style with the block override; resolve colour tokens. |
| `placeX` | 128 | Convert `align` + width into an absolute x. |
| `compose` | 152 | The band composer (see below). |
| `prepareBlock` | 322 | Measure a block: text fitting, list rows, facts cells, image maths, logo box. |
| `resolveLayout` | 758 | Public entry point. |
| `defaultPriority` / `isEssential` | 834 / 845 | Overflow priority model. |
| `collectDroppable` | 849 | The blocks that may be dropped, worst first. |
| `measureLines` | 866 | Shared text measuring helper. |

**Resolution order inside `compose`:**

1. Resolve colour tokens against the brand.
2. Drop blocks whose content is missing; collapse empty bands.
3. Fit each text block to its box (binary search on size, line budget, ellipsis).
4. Measure intrinsic heights.
5. Stack bands: pinned top/bottom bands keep their position, flow bands stack.
6. Resolve overflow:
   - type scale 0.94 → 0.88
   - image scale 0.85 → 0.72 → 0.6
   - drop the least important optional blocks
   - type scale 0.82 → 0.76, image 0.5
   - drop the remaining optional blocks
   - gap compression 0.8 → 0.6 → 0.4
7. Flexible bands (`flex: true`) absorb the leftover space — the extra goes into a single
   gap above the closing block, so the call to action sits at the bottom.

**The priority model** (used only when a template genuinely overflows):

| Block | Priority | Never dropped |
| --- | --- | --- |
| headline | 0 | ✅ yes |
| cta | 1 | |
| eyebrow, subhead | 2 | |
| image | 3 | |
| facts | 4 | |
| logo | 5 | |
| list | 6 | |
| body | 7 | |

Dropping happens **worst first**. An earlier version of this file sorted ascending and
dropped the call to action before the body text — that bug is the reason the ordering is
written down here.

### 2.11 `src/engine/render.ts` — the renderer (513 lines)

Paints a `ResolvedLayout` onto a canvas. It never decides anything about layout; it
only draws what it is given.

| Function | Line | Responsibility |
| --- | --- | --- |
| `renderFlyer` | 30 | Public entry: background, decorations, bands, blocks. |
| `paintFill` | 68 | Solid, linear and radial fills. |
| `paintDecoration` | 141 | Circles, dots, rules, accent shapes. |
| `paintBlock` | 208 | Dispatch per block kind. |
| `paintPill` | 312 | Rounded label / call-to-action pill. |
| `paintImage` | 329 | Cover-cropped picture with optional overlay. |
| `paintLogo` | 363 | Logo image or wordmark; shrinks the wordmark to fit its box. |
| `drawRun` / `drawText` | 418 / 455 | Letter-spacing aware text drawing. |
| `roundRectPath` | 478 | Rounded rectangle path helper. |
| `paintGuides` | 504 | Optional layout guides (debug only). |

### 2.12 `src/engine/export.ts` — preview and export share one path

```ts
export interface PaintOptions {
  template: Template; brand: BrandConfig; content: FlyerContent;
  scale?: number; assets?: Record<string, { width: number; height: number }>;
  guides?: boolean;
}

export async function paintFlyer(canvas: HTMLCanvasElement, options: PaintOptions): Promise<ResolvedLayout>;
export async function renderToCanvas(options): Promise<RenderResult>;
export async function exportFlyer(options: ExportOptions): Promise<void>;   // png | jpg | pdf
```

`paintFlyer` is what the live preview calls **and** what the export calls. That is the
whole reason the preview cannot drift from the download.

PDF sizing: design pixels are 96 dpi, so the page is `designPx * 0.75` points. A4
templates use a real A4 sheet.

### 2.13 `src/engine/parser/heuristics.ts` — read a message, fill the flyer

```ts
export interface ParseResult {
  content: FlyerContent;
  detectedType: TemplateCategory;
  suggestedTemplateId: string;
  confidence: number;
  source: 'heuristic' | 'llm';
  notes: string[];
}

export function detectCategory(text: string): { category: TemplateCategory; confidence: number };
export function parseFreeText(input: string): ParseResult;
```

Purely offline and deterministic. The server may merge an LLM result over it
(`parseWithOptionalLlm` in `server/routes.ts`) but never replaces it silently.

### 2.14 `src/engine/templates/` — templates are data

`common.ts` gives you the factory:

```ts
export function roles(overrides?: Partial<Record<TextRole, Partial<TextStyle>>>): Record<TextRole, TextStyle>;
export function makeTemplate(input: TemplateInput): Template;
export function contactFacts(): FactItem[];
export const SIDES = 72;     // page margin in design units

export interface TemplateInput {
  id: string; name: string; category: TemplateCategory; description: string;
  aspect: AspectKey; fields: string[]; background: Fill;
  roles?: Record<TextRole, TextStyle>;
  decorations?: Decoration[];
  bands: LayoutBand[];
  scale?: number;                       // global type multiplier (default 0.92)
  logo?: { maxWidth: number; maxHeight: number };
}
```

A template file looks like this — copy this shape to add your own:

```ts
export const myTemplate = makeTemplate({
  id: 'my-template',
  name: 'My Template',
  category: 'announcement',
  description: 'One line shown in the gallery.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'date', 'cta'],
  background: { type: 'solid', color: 'paper' },
  roles: roles({ headline: { size: 72, weight: 800, color: 'ink' } }),
  bands: [
    {
      id: 'hero',
      bg: { type: 'solid', color: 'primary' },
      padX: SIDES, padY: 56, gap: 20,
      columns: [{ w: 1, blocks: [
        { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', color: 'accent' },
        { id: 'headline', kind: 'text', field: 'headline', role: 'headline', essential: true },
        { id: 'subhead',  kind: 'text', field: 'subhead',  role: 'subhead' },
      ] }],
    },
    {
      id: 'body',
      flex: true,
      padX: SIDES, padY: 40, gap: 22,
      columns: [{ w: 1, blocks: [
        { id: 'body', kind: 'text', field: 'body', role: 'body' },
        { id: 'cta',  kind: 'cta',  field: 'cta',  role: 'cta', pill: true },
      ] }],
    },
  ],
});
```

Register it in `templates/index.ts`:

```ts
export const BUILTIN_TEMPLATES: Template[] = [
  myTemplate, /* … */
];
```

### 2.15 `server/` — the API

`server/index.ts` — app wiring. Security headers, JSON body limit, static `/media`,
SPA fallback, `listen(0.0.0.0, 4010)`.

`server/db.ts` — the store:

```ts
export const store = new Store();
export interface Database {
  brand: BrandConfig;
  templates: Template[];
  media: MediaItem[];
  flyers: FlyerRecord[];
  users: UserRecord[];
  sessions: SessionRecord[];
}
```

`server/auth.ts` — scrypt password hashing, signed httpOnly session cookie, `requireAuth`
/ `requireAdmin` guards, per-IP login throttle.

`server/routes.ts` — the endpoint list:

| Method | Path | Guard | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness. |
| POST | `/api/auth/login` | — | Sign in (throttled). |
| POST | `/api/auth/logout` | — | Sign out. |
| GET | `/api/auth/me` | — | Current user. |
| GET | `/api/bootstrap` | — | Brand + templates + media in one call. |
| GET | `/api/brand` | — | Read the brand. |
| PUT | `/api/brand` | admin | Save the brand. |
| POST | `/api/brand/reset` | admin | Restore the default brand. |
| GET | `/api/templates` | — | All templates. |
| POST | `/api/templates` | admin | Create a template. |
| PUT | `/api/templates/:id` | admin | Edit a template. |
| POST | `/api/templates/:id/duplicate` | admin | Copy a template. |
| POST | `/api/templates/:id/toggle` | admin | Activate / deactivate. |
| DELETE | `/api/templates/:id` | admin | Delete. |
| GET | `/api/media` | — | Image library. |
| POST | `/api/media` | auth | Upload an image (multipart). |
| DELETE | `/api/media/:id` | admin | Remove an image. |
| GET | `/api/flyers` | auth | Saved drafts. |
| POST | `/api/flyers` | auth | Save a draft. |
| PUT | `/api/flyers/:id` | auth | Update a draft. |
| DELETE | `/api/flyers/:id` | auth | Delete a draft. |
| POST | `/api/ai/parse` | auth | Free text → content model. |

### 2.16 `src/ui/` — the React app

| File | Contents |
| --- | --- |
| `api.ts` | `api.get/post/put/del` wrapper that throws `ApiError`; `MediaItem`, `UserInfo`, `FlyerRecord` types. |
| `store.tsx` | `AppProvider` + `useApp()`: brand, templates, media, flyers, user, `notify()` toasts, `useLocalDraft()` (localStorage). |
| `components/FlyerCanvas.tsx` | The live preview. A `ResizeObserver` fits the canvas into the stage, preserving the aspect. |
| `components/TemplateThumb.tsx` | A small **real render** (not a screenshot) plus `DEMO_CONTENT` and per-template demo copy. |
| `components/FieldEditor.tsx` | Renders the right input for a field: text, long text, or a list. |
| `components/ImagePicker.tsx` | Upload, pick from the library, remove. |
| `pages/Studio.tsx` | The main screen: template picker → field editor → preview → export → save draft. Also hosts the Assist box. |
| `pages/Gallery.tsx` | Filterable gallery of every template. |
| `pages/BrandPage.tsx` | Brand admin with a live preview that repaints as you type. |
| `pages/TemplatesAdmin.tsx` | Template table plus a data-driven band/block editor. |
| `pages/Login.tsx` | Sign-in. |
| `App.tsx` | Top bar, banner, routes (`/`, `/templates`, `/brand`, `/admin/templates`, `/login`). |
| `main.tsx` | Mounts `<App/>` inside `<AppProvider>`. |

---

## 3. Build order

If you rebuild the project from scratch, create the files in this order — each layer
only imports from the layers above it.

```
 1.  src/engine/types.ts            no imports
 2.  src/engine/brand.ts            ← types
 3.  src/engine/fields.ts           ← types
 4.  src/engine/typography.ts       ← types
 5.  src/engine/measure.ts          ← types
 6.  src/engine/image.ts            ← types
 7.  src/engine/icons.ts            ← types
 8.  src/engine/content.ts          ← types
 9.  src/engine/layout.ts           ← types, typography, measure, brand, content, image
10.  src/engine/render.ts           ← types, brand, icons
11.  src/engine/export.ts           ← layout, render, measure, image, brand
12.  src/engine/templates/common.ts ← types, layout (DEFAULT_ROLE_STYLE)
13.  src/engine/templates/*.ts      ← common, types
14.  src/engine/templates/index.ts  ← the template files
15.  src/engine/parser/heuristics.ts← types, content
16.  src/engine/__tests__/*         ← the engine
17.  server/db.ts                   ← engine types
18.  server/auth.ts                 ← db
19.  server/imageinfo.ts            ← (node only)
20.  server/routes.ts               ← db, auth, engine parser
21.  server/index.ts                ← routes, db, auth
22.  src/ui/api.ts                  ← (fetch only)
23.  src/ui/store.tsx               ← api, engine types
24.  src/ui/components/*            ← api, store, engine
25.  src/ui/pages/*                 ← components, store, api, engine
26.  src/App.tsx, src/main.tsx      ← pages
27.  src/styles.css                 ← everything visual
28.  index.html, vite.config.ts, tsconfig*.json, package.json
```

---

## 4. "Where do I change…?"

| I want to… | Edit |
| --- | --- |
| Add a template | `src/engine/templates/<category>.ts` + register in `templates/index.ts` |
| Change the type size of one element in a template | the block's `style` in the template file |
| Change the type size of a role across all templates | `DEFAULT_ROLE_STYLE` in `src/engine/layout.ts`, or the template's `roles()` overrides |
| Add a content field | `FIELDS` in `src/engine/fields.ts`, then use `field: 'newKey'` in a template |
| Add a colour role | `BrandColors` + `resolveColor` in `src/engine/brand.ts`, then the brand admin UI |
| Add an icon | `src/engine/icons.ts` (`IconName` + one painter) |
| Add a flyer size | `ASPECTS` in `src/engine/brand.ts` |
| Change how text wraps or shrinks | `src/engine/typography.ts` |
| Change what gets dropped when a flyer overflows | `defaultPriority` / `isEssential` in `src/engine/layout.ts` |
| Change how a picture is cropped | `coverCrop` / `focalFor` in `src/engine/image.ts` |
| Change the export resolution or file format | `src/engine/export.ts` (`ASPECTS[].exportScale`) |
| Change the preview chrome | `src/styles.css` + `src/ui/components/FlyerCanvas.tsx` |
| Add a screen | `src/ui/pages/` + a route in `src/App.tsx` |
| Add an API endpoint | `server/routes.ts` |
| Change the data that is stored | `Database` in `server/db.ts` |
| Replace the school logo | `public/logo.png` + `DEFAULT_BRAND.logoWidth/logoHeight` in `src/engine/brand.ts` |
| Trim the empty margin off a logo | `npx tsx scripts/trim-logo.ts <in.png> public/logo.png` |

---

## 5. Conventions that keep this editable

1. **Templates are data.** Never add template-specific logic to the engine. If a design
   needs something the block model cannot express, add a *capability* to the model, not
   a special case for one template.
2. **Colours are roles.** Templates never hard-code a hex value; they use
   `'primary' | 'secondary' | 'accent' | 'ink' | 'paper' | 'muted'` and their
   `-soft` / `on-` variants. This is what makes "change the brand, restyle everything"
   work.
3. **The engine never imports React or the DOM.** The only browser dependency is the
   injected `MeasureText`. Keep it that way and the engine stays testable and reusable
   on the server.
4. **Preview and export share `paintFlyer`.** Never render the flyer a second way.
5. **The layout engine decides; the renderer obeys.** If you find yourself computing a
   position in `render.ts`, that calculation belongs in `layout.ts`.
6. **Empty is a valid state.** Every template must look intentional with nothing filled
   in, and must not break when a field is missing.
7. **Missing text shrinks; it does not overflow.** `fitText` handles the range of
   content lengths; never clip by hand.

---

## 6. The logo pipeline

The school logo is the one piece of artwork in the system, and it is handled in three
places so it always lands correctly:

| Step | Where | What happens |
| --- | --- | --- |
| Store | `public/logo.png` | Served at `/logo.png`; copied into `dist/client` on build. |
| Size | `BrandConfig.logoWidth` / `logoHeight` | The intrinsic pixel size, so the engine can size the logo box without loading the image. |
| Draw | `prepareBlock` → `case 'logo'` in `src/engine/layout.ts` | Fits the image into `style.logo.maxWidth × maxHeight`, preserving the aspect. |
| Fallback | `paintLogo` in `src/engine/render.ts` | If there is no file, the school name is set as a wordmark instead. |

Two rules keep it looking right:

1. **Trim the transparent margin.** A logo exported with 20% of its width empty will
   look small in its box. `npx tsx scripts/trim-logo.ts uploads/my-logo.png public/logo.png`
   crops it to the artwork.
2. **Keep the dimensions in step with the file.** After replacing the file, update
   `logoWidth` / `logoHeight` in `DEFAULT_BRAND` (`src/engine/brand.ts`) and in
   `data/db.json`. Uploading a logo through the brand admin does this for you.

---

## 7. Keeping the map current

```bash
npm run structure        # prints the tree with line counts and every file's exports
npm run typecheck        # client + server
npm test                 # engine unit tests
npx tsx scripts/smoke.ts        # screenshots the screens, asserts no console errors
npx tsx scripts/e2e.ts          # upload → export PNG/JPG/PDF → save a draft
npx tsx scripts/e2e-admin.ts    # assist, brand, template admin
```

If you add a file, add it to this document. The tree in section 1 is the index; the
tables in section 2 are the map; section 4 is the lookup for "where do I change…?".
