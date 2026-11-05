# Flyer Studio — Product & Technical Architecture

**Working name:** Flyer Studio (Frontlearn)
**Purpose:** A staff member types what they want to announce; the system produces a professional, on-brand school flyer.

---

## 1. Product promise

> "Tell me what you want to announce, and I'll make the flyer."

The system is **not** a design tool. There is no canvas, no drag-and-drop, no layer panel.
The staff member's only job is to supply *information* and pick a *template*.
Everything spatial — type scale, line breaks, spacing, cropping, hierarchy, overflow — is decided by software.

### Non-goals (v1)
- No pixel-level editing by end users.
- No multi-page documents, video, or animation.
- No marketing-site CMS.
- No real-time collaborative editing.

---

## 2. System architecture

```
USER INPUT  ──►  CONTENT MODEL  ──►  TEMPLATE ENGINE  ──►  LAYOUT ENGINE  ──►  RENDERER  ──►  PREVIEW / EXPORT
 (React UI)      (structured fields)  (declarative spec)   (auto-fit/collapse)  (Canvas 2D)    (PNG/JPG/PDF)
```

Four hard boundaries, each in its own module, each independently testable:

| Layer | Module | Responsibility | Knows about |
|---|---|---|---|
| Content model | `engine/content.ts`, `engine/fields.ts` | What a flyer can say | Field vocabulary only |
| Template engine | `engine/templates/*` | How content is *presented* (structure, roles, regions) | Brand + content schema |
| Layout engine | `engine/layout.ts`, `engine/typography.ts` | Where things sit, at what size, in what order | Template spec + brand + content |
| Renderer | `engine/render.ts` | Paints resolved geometry | Resolved layout only |

The renderer receives a **resolved, absolute-coordinate layout**. It never makes layout decisions.
The layout engine never touches a canvas API — it receives a `measureText` function by injection, which keeps it pure and unit-testable.

### Why Canvas 2D and not SVG/DOM
- One rendering path means the **preview is byte-for-byte the export**. No DOM-to-image fidelity gaps.
- Canvas gives exact control over letter-spacing, text baselines, and image cropping.
- Export is a rasterisation of the same scene at a higher scale factor → print quality without a second renderer.

### Why not a framework like Puppeteer/HTML-to-image
- A headless browser is a ~300 MB dependency on a 2-core/2 GB school host, and per-export latency of seconds.
- Canvas rendering is sub-frame and dependency-free.

---

## 3. Data model

### 3.1 Brand (`BrandConfig`) — global, admin-owned
School identity inherited by every template, so identity is entered once.

```
schoolName, tagline, logoUrl
colors: { primary, secondary, accent, ink, paper, muted }
fonts:  { heading, body }              // font keys, not raw CSS
website, phone, email, address
socials: [{ platform, handle }]
defaultCta, footerNote
```

Templates reference brand **roles** (`primary`, `accent`, …), never raw hex. Changing the school colour restyles all 13 templates instantly.

### 3.2 Content (`FlyerContent`) — structured, never one blob
A `Record<string, ContentValue>` where values are `string | string[] | ImageValue | null`.
The key set is the **field vocabulary** (declared once in `engine/fields.ts`):

`eyebrow, headline, subhead, body, program, date, time, venue, fee, deadline, cta, organiser, reference, highlights[], bullets[], phone, email, website, address, image`

This is what makes "tell me about it" work: the free-text parser (below) and the manual form write to **the same vocabulary**, so a parsed flyer and a hand-typed flyer are indistinguishable downstream.

### 3.3 Template (`Template`) — declarative, data not code
A template is JSON-shaped data: style rules + a tree of bands → columns → blocks.

```
Template
├── style        palette roles, type scale, base scale, decorations
├── fields[]     which vocabulary fields this template *expects* (drives the form)
└── layout
    └── bands[]  vertical bands (header / body / footer)
        └── columns[]  horizontal columns inside a band
            └── blocks[]  text | image | facts | cta | logo | divider | space
```

Why bands → columns → blocks: it covers every real flyer geometry (full-bleed image band, split hero, single column, fact grid) with **one** layout vocabulary, and a new template is ~40 lines of data — no new rendering code.

### 3.4 Persistence
JSON document store (`data/db.json`) with atomic writes and an in-memory cache, behind a typed repository module. Chosen over a SQL database because the working set is small (tens of templates, hundreds of flyers) and the school host is modest. The repository interface is the seam: swapping to SQLite/Postgres later touches one file, not the app.

Media lives on disk under `data/uploads/` and is addressed by opaque ids, never by user-supplied paths.

---

## 4. Layout engine — the important part

`resolveLayout(template, brand, content, measure) → ResolvedLayout`

Rules, in order of execution:

1. **Token resolution** — `{{schoolName}}`, `{{website}}`, `{{phone}}`, `{{email}}`, `{{tagline}}`, `{{footerNote}}` in static text.
2. **Presence filtering** — a block whose field is empty is dropped. Fact lists drop empty items; a fact list with nothing left disappears entirely. *(Missing information collapses gracefully.)*
3. **Typographic fitting** (`engine/typography.ts`)
   - Binary-search the font size between the role's `min` and `max` so the text wraps into ≤ `maxLines`.
   - Single-line roles (eyebrow, CTA) shrink to fit width only.
   - If the minimum size still overflows the line budget, the last line is truncated with an ellipsis — text never overlaps.
   - **`shrink` vs `fixed`:** `shrink` roles adapt type size to the content; `fixed` roles (dates, fees, labels) keep their size and truncate instead.
4. **Intrinsic sizing** — block heights are computed from the fitted text, not guessed.
5. **Band composition** — columns are sized proportionally, blocks stack inside them, band height = tallest column.
6. **Overflow resolution** (in priority order)
   1. Drop optional blocks by ascending `priority` (a description is dropped before a headline).
   2. Scale the type scale down (to a floor of ~80 % of the base).
   3. Compress inter-block gaps.
   4. Clip the band and mark the flyer `overflowed` so the UI can warn the user.
7. **Pinning** — bands marked `pin: 'bottom'` (footers) are anchored to the canvas bottom; `pin: 'top'` to the top.
8. **Image fitting** — cover-crop maths with a focal point; the source rect is preserved, so images are never distorted.

The result is absolute geometry plus the exact font, size, and line breaks for every text run. The renderer only paints it.

---

## 5. AI assistance (assist, never replace)

`POST /api/ai/parse { text } → { content, detectedType, suggestedTemplateId, source }`

Two layers:

1. **Heuristic parser (always available, offline, deterministic).** Regex/keyword extraction of dates, times, fees, phone numbers, emails, URLs, CTAs, programme names, and flyer type. Runs first.
2. **Optional LLM layer.** If `LLM_BASE_URL` + `LLM_API_KEY` are configured, an OpenAI-compatible chat call runs first and its structured output is merged over the heuristic result. If the call fails or the key is absent, the system silently falls back — the feature never becomes a blocker.

The AI writes to the same content vocabulary as the manual form, and **always** returns a proposal the user can edit. It never chooses a template silently: it *suggests* one, the user confirms.

---

## 6. Application architecture

| Concern | Choice | Reason |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Fast HMR, tiny build, simple deploy |
| Backend | Express 5 + TypeScript (run via `tsx`) | Small, explicit, no framework overhead |
| State | React context + reducer | The app has one editor; a state library would be dead weight |
| Persistence | JSON document store | Right-sized; swappable behind a repository interface |
| Rendering | Canvas 2D | Preview ≡ export |
| PDF | `jspdf` (rasterised high-DPI page) | Reliable vector-free PDF; no headless browser |
| Auth | Signed session cookie + role (`admin` / `staff`) | Staff create flyers; only admins touch brand/templates |
| Fonts | Self-hosted `@fontsource` woff2 | No Google Fonts runtime dependency; works offline/intranet |

### Separation of concerns
- `src/engine/**` — pure TypeScript, no React, no DOM. Importable by a future Node/SVG/PDF renderer.
- `src/ui/**` — React only.
- `server/**` — HTTP only; it never renders a flyer (except the optional LLM call).

### Security
- Uploads validated by MIME + extension allow-list, size-capped, and re-served from a non-executable directory.
- Media paths are resolved and checked to be inside the uploads root (path-traversal guard).
- Sessions: 32-byte random token, httpOnly + SameSite=Lax cookie, expiry, stored server-side.
- Login throttling per IP; security headers set manually on every response.
- All request bodies validated with Zod schemas.

---

## 7. Template library (v1)

13 templates, each a distinct visual structure, grouped by category:

`Admissions` (2) · `Programme` (2) · `Event` (2) · `Graduation` (1) · `Workshop` (1) · `Seminar` (1) · `Career` (1) · `Intake` (1) · `Deadline` (1) · `Announcement` (1) · `Promo` (1) · `Achievement` (1) · `Scholarship` (1) · `Social square` (1)

Each declares its aspect ratio, expected fields, type scale, palette roles, and structure.

---

## 8. MVP scope

Must work end to end:
1. Choose a template (visual gallery, grouped by category).
2. Enter only the relevant information — the form shows only the fields the template expects.
3. Optional image upload / library pick.
4. Automatic generation with live preview.
5. Corrections: change template, edit fields, swap image, regenerate.
6. Export PNG / JPG / PDF at the chosen size.

Explicitly deferred (architecture must allow them, but they are not built now):
accounts & roles UI polish, analytics, bulk generation, server-side rendering, approval workflows, multilingual content, more templates.

---

## 9. Extension points

- **New template** → add one data file in `src/engine/templates/` and register it. No renderer changes.
- **New content field** → add to `engine/fields.ts`; it immediately appears in every template that lists it.
- **New export format** → implement a renderer in `engine/export.ts` against the resolved layout.
- **New persistence backend** → implement the repository interface in `server/db.ts`.
- **Server-side rendering / batch jobs** → `engine/layout.ts` is pure; pair it with a Node canvas binding to render without a browser.
