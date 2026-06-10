# Storybook → EDS blocks

How the KP "vessel" design system drives building and styling AEM Edge Delivery
(EDS) blocks, using Storybook as the design source of truth (replacing the Figma
flow). This document is the orientation + continuation guide for the effort.

> Status at time of writing: the reference-story side is built; the
> implementation side (story → shipping block) is in progress. See
> [What's built vs. planned](#whats-built-vs-planned).
>
> A friendlier HTML version of the Storybook→block recipe lives at
> [`docs/index.html`](docs/index.html) (open in a browser).

---

## 1. The big idea

There are two contracts in play, and the whole effort is about reconciling them:

- **Storybook components** are driven by **args/props**.
- **EDS blocks** are driven by **authored content** (a table of rows/cells the
  author edits, which `init(el)` decorates into DOM).

The plan threads them together so that **one design (a vessel pattern) produces
one block**, and the Storybook story and the shipping block can never silently
drift apart.

The relationship we want: when a design changes, you re-derive tokens + CSS,
update the story, and a visual parity check tells you exactly where the block no
longer matches. Storybook is the contract; the block is the implementation;
the parity diff is the enforcement.

---

## 2. End-to-end pipeline

```
DESIGN CONTRACT (built)
  KP vessel design system  ──►  Storybook reference story
  (compiled Sass exports)        render(args) + foundation.css
                                          │
                                          ▼
THE EDS BLOCK — one source of truth (Phase 4)
  ┌─────────────────────────────────────────────────────────┐
  │  shared renderer            init(el)                       │
  │  story + init() import it   authored table → args → DOM    │
  │                                                            │
  │  CSS slice + DS tokens      UE content model               │
  │  rescoped off .ds-foundation  generated from argTypes      │
  └─────────────────────────────────────────────────────────┘
                                          │
                                          ▼
VERIFICATION
  visual parity diff  ◄───(fix & re-run)───┐
  block vs reference story                 │
                                          ▼
AUTHORING + RUNTIME (the product)
  author in UE  ──►  EDS decorates  ──►  published page
  fills fields       init() builds DOM    matches design system
```

### Stage by stage

1. **Design contract.** A vessel pattern becomes a cleaned, vanilla HTML/CSS
   Storybook story. Its `render(args)` emits the canonical `.ds-card` markup,
   `argTypes` are the authoring knobs, and it ships a vendored `foundation.css`.
   This is the single thing designers review.

2. **The block (one source of truth).** A vessel pattern maps to exactly one
   block folder (e.g. `blocks/card/`) made of four parts, all derived from the
   reference story:
   - **shared renderer** — the story's `render()` moves *into the block*; both
     the story and `init()` import it. One function produces the DOM, so they
     cannot drift.
   - **`init(el)`** — reads the author's content table, turns it into the same
     `args` the story uses, calls the shared renderer.
   - **CSS slice + DS tokens** — the slice tool extracts just the component's
     rules from the ~800 KB `foundation.css`, strips the
     `.ds-foundation[data-ds-theme=vessel…]` wrapper so they apply on a plain
     EDS block, and points them at the generated `--ds-*` tokens.
   - **UE content model** — `argTypes` generate the Universal Editor field
     definitions, so the author's form mirrors the Storybook controls.

3. **Verification.** The EDS-block harness renders the *real* block
   (table → `init()` → decorated DOM, inside the EDS cascade) beside its
   reference story; a Playwright screenshot diff fails CI if they diverge.

4. **Authoring + runtime.** An author drops the block into a page in Universal
   Editor / DA and fills the fields. EDS serves the page, `init()` decorates,
   the CSS slice + tokens style it — and the published page matches the design
   system because it runs the same renderer and the same extracted DS styling
   the reference story uses.

### Why this arrangement

- **No drift, by construction** — story and block share one renderer and one
  token source.
- **Design changes propagate mechanically** — DS update → re-run `tokens:ds`,
  re-slice CSS, update the story → the parity diff shows what moved.
- **Three audiences, one component** — designers review in Storybook, authors
  edit in UE, visitors get the EDS page; all the same source.

---

## 3. Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Story framework | Vanilla HTML/CSS (`@storybook/html-vite`) | Matches the vessel exports; rendered output maps closely to EDS DOM. |
| Tokens | Derive a namespaced `--ds-*` `:root` layer from the **compiled** CSS catalog | No runtime `var()` in the source; the `.ds-colors__*` / `.pN` classes are a self-documenting catalog. No `.scss` source needed. |
| Token namespace | `--ds-*`, separate from the existing generic palette | The existing `styles.css` `--color-*` scale is unrelated and depended on by current blocks; never touch it. |
| DOM source | **Block owns the renderer; the story imports it** | Single source of truth; ships with EDS; zero story↔block drift. |
| Existing blocks | **Extend/replace**, don't duplicate | Vessel `card` evolves `blocks/card`; reconcile `cards-icon`. New blocks only where none exists (e.g. `notification`). |
| CSS scoping | **Per block** (default: strip the `.ds-foundation` wrapper and rescope to the block root) | Keeps EDS lean; adopt the wrapper only if a slice is too entangled to rescope safely. |
| Token wiring | `styles/ds-tokens.css` kept standalone (not yet `@import`ed into `styles.css`) | Stay off the EDS critical path until a real consumer (a Phase 4 block slice) exists. |

---

## 4. What's built vs. planned

### Built and verified (this is the implementation-side infrastructure, issue #11)

- **Token extractor** — `scripts/extract-ds-tokens.mjs`, run via `npm run tokens:ds`.
  Parses `.storybook/foundation/foundation.css` and emits `styles/ds-tokens.css`:
  **49 colors** (incl. gradients + rgba, each with a paired `--ds-on-*`
  foreground) and a **5-step type scale** as namespaced `--ds-*` custom
  properties.
- **EDS-block harness** — `stories/_eds/eds-harness.js`. `edsBlock({ name, rows,
  variants })` builds the authored block table, wraps it in `main > .section`,
  loads `styles.css` + `ds-tokens.css` + the block's CSS, then runs the block's
  real `init()`. Generic via `import.meta.glob` — mounts any block by name.
- **Harness proof** — `stories/_eds/Card.eds.stories.js` renders the real
  `blocks/card` from an authored table, decorated by its own `init()`, in the
  EDS cascade with correct fonts/colors, beside the vessel `Components/Card`
  reference story. Verified with zero console errors.
- **Storybook config** (`.storybook/main.js`): added a `/styles` staticDir (so
  `@font-face url(/styles/fonts/…)` resolves) and a `viteFinal` that bumps the
  build target to `esnext`.
- **CSS-slice / rescope tool** — `scripts/slice-block-css.mjs`. Brace-aware CSS
  parser (handles the 519 nested `@media` blocks) that keeps only a component's
  rules, strips the theme wrapper (`data-ds-theme`/`data-ds-version`,
  `:not(--unstyled)`, the `.ds-foundation` ancestor) while **keeping
  `data-ds-variant`** so variant rules stay distinct, optionally prefixes a
  block root, and swaps baked color literals for `var(--ds-*)` tokens. Also
  lifts the foundation's `body {}` base typography (color/font) onto the block
  root so the component inherits the same base it assumes — without a site-wide
  wrapper (`--no-base` to skip). Emits a `stylelint-disable` header (generated,
  vendor-derived CSS). Verified on the card pattern: 14.5k lines → 291 rules,
  4 clean variant roots, token swaps applied.
- **Card pilot (#12) — in progress, verified visually.** The vessel card is
  wired end-to-end: `blocks/card/card-dom.js` is the shared renderer (imported
  by both `init()` and the reference story); `blocks/card/card.js` `init()`
  parses the authored table (image row + rich content row, backward-compatible)
  into renderer args and emits the `.ds-card` DOM; `blocks/card/card.css` is the
  generated slice. The EDS-block harness story renders it matching the
  `Components/Card` reference (navy base, Gotham, radius, spacing, CTA system).

### Planned (still open on #11, then #12 / #13)

- **Shared-primitive hoisting** — move foundation rules used across patterns
  (typography, `.button`, icon font, color classes) into global `styles/` so
  block slices don't re-ship them.
- **Playwright visual-parity diff** — the CI job comparing EDS-block story vs
  reference story per variant.
- **Asset pipeline** — convention for migrating icon fonts + SVGs into EDS.
- **Phase 4 pilot** (#12) — take `card` (extend `blocks/card`) and
  `notification` (new) end-to-end through the full block recipe.
- **Phase 5 scale-out** (#13) — remaining patterns; reconcile with existing
  blocks; fold the style-guide foundations into `styles/`.

---

## 5. Run it

```bash
# Storybook dev server (reference stories + EDS-block harness stories)
npm run storybook            # http://localhost:6006

# Production build of Storybook (also a good compile check)
CI=true npm run build-storybook -- --disable-telemetry

# (Re)generate the --ds-* token layer from the vessel foundation
npm run tokens:ds            # writes styles/ds-tokens.css

# Slice one component's CSS out of a pattern foundation (strip wrapper + tokenize)
node scripts/slice-block-css.mjs \
  --src stories/card/foundation.css --match .ds-card --root .card --out <file.css>

# Visual parity gate — diff each EDS block vs its reference story (needs Storybook running)
npm run storybook         # in one terminal
npm run parity            # in another; exits non-zero if any pair exceeds the threshold

# Unzip the vessel design-system exports into design-files/.extracted/
npm run design-files:extract

# Lint (eslint config helix; disallows `continue`/`console`)
npm run lint
```

To view a single story directly (bypassing the manager UI), hit the iframe:
`http://localhost:6006/iframe.html?id=<story-id>&viewMode=story`
(e.g. `eds-blocks-card--default`). Get ids from `http://localhost:6006/index.json`.

---

## 6. File map

```
.storybook/
  main.js              # html-vite config: stories glob, staticDirs, viteFinal (esnext)
  preview.js           # wraps every story in the .ds-foundation[vessel…] theme container
  preview-head.html    # loads the global foundation.css into the preview iframe
  foundation/
    foundation.css     # canonical vessel foundation (~13.8k lines, baked literals) — token source
    assets/fonts/      # kp-icons + Gotham font files

stories/
  README.md            # the reference-story extraction recipe (per-pattern)
  pattern-utils.js     # ensurePatternStyles / assetUrl / el / uid helpers
  Foundation.stories.js
  <pattern>/           # one folder per vessel pattern: <Name>.stories.js + foundation.css + assets/
  _eds/                # EDS-block harness (implementation side)
    eds-harness.js     #   edsBlock({ name, rows, variants }) — mounts a real block from a table
    Card.eds.stories.js#   harness proof against blocks/card

scripts/
  extract-design-files.sh  # unzip vessels → design-files/.extracted/
  extract-ds-tokens.mjs    # compiled foundation.css → styles/ds-tokens.css
  slice-block-css.mjs      # pattern foundation.css → per-block CSS slice (wrapper-stripped, tokenized)
  visual-parity.mjs        # screenshot + pixel-diff each EDS block vs its reference story

styles/
  styles.css           # EDS global styles (existing generic --color-* palette, fonts, grid)
  ds-tokens.css        # GENERATED --ds-* token layer (do not hand-edit)
  fonts/               # Gotham woff files (served at /styles/fonts)

blocks/<name>/         # EDS blocks: <name>.js (init), <name>.css; <name>-dom.js shared renderer
                       #   notification/ also ships icons/ (resolved via new URL(import.meta.url))
ue/models/             # Universal Editor content models (component-*.json built from here)
test/visual/__output__/ # generated parity diff images (eds/ref/diff per pair; gitignored)
design-files/          # vessel zips (gitignored) + .extracted/
```

---

## 7. Issues / risks to keep in mind

- **The `.ds-foundation` wrapper contract.** Every foundation rule is scoped
  under `:where(.ds-foundation[data-ds-theme=vessel][data-ds-variant=basic]
  [data-ds-version="1"])`. EDS pages have no such wrapper, so CSS slices must be
  rescoped (default) or the wrapper adopted (heavy). Decided per block.
- **Type scale is base-only.** The extractor emits the mobile `.pN` values; the
  `min-width:1152px` responsive bump isn't captured yet — add when a block needs it.
- **Shipping CSS weight.** Each pattern's `foundation.css` is ~800 KB and
  duplicates shared primitives. Mitigated by per-block slices + hoisting shared
  primitives to `styles/`. Do not ship full foundations to EDS.
- **Icon-font / SVG asset migration.** Vessel components reference an icon font
  and SVGs that must be brought into EDS with correct runtime paths.
- **UE model drift.** Story `argTypes`, `component-models.json`, and decorated
  DOM can diverge; keep them in sync (auto-generate the model where possible).
- **Existing Lit blocks.** `header` / `hero` / `footer` use Lit — refactor vs.
  keep is a per-block call during scale-out.
- **Gotchas already hit (and fixed) in the harness:**
  - Globbing all blocks pulls in `scripts.js` (top-level await) → needs the
    `esnext` build target (`viteFinal` in `main.js`).
  - A `/styles` staticDir **shadows** Vite's `?inline` transform
    (`/styles/x.css?inline` served as `text/css`). Global styles must load via
    `<link>`; only block CSS (not static-served) uses `?inline`.

---

## 8. Tracking (GitHub issues, repo AdobeDrago/kp-hw)

Reference-story half (getting patterns into Storybook):
- Epic #7 — Storybook for KP vessel design-system → EDS block seeds
- #4 Phase 0 setup · #5 Phase 1 pilot stories · #6 Phase 2 scale-out stories

Implementation half (reference story → shipping EDS block):
- Epic #10 — Vessel reference stories → shipping EDS blocks
- #11 Phase 3 infrastructure (tokens, primitives, harness, parity diff)
- #12 Phase 4 pilot blocks (card + notification)
- #13 Phase 5 scale-out

---

## 8b. Recipe — turn a reference story into an EDS block

The repeatable steps, as proven on `card` and `notification`.

**Prereq:** the pattern's reference story exists under `stories/<pattern>/` with its
`foundation.css` vendored, and `npm run tokens:ds` has been run.

1. **Shared renderer** — `blocks/<name>/<name>-dom.js`: a pure function taking
   content slots → returns the vessel DOM element (`.ds-<name>`). Wire any behavior
   (e.g. dismiss) here. Take resolved asset URLs as params (don't hardcode paths).
2. **Point the reference story at it** — in `stories/<pattern>/<Name>.stories.js`,
   import the renderer; keep `ensurePatternStyles` + asset resolution; pass slots.
   (single source of truth — story and block now share one renderer.)
3. **Block `init(el)`** — `blocks/<name>/<name>.js`: read the variant from the block
   class, parse the authored rows into the renderer's args, then
   `el.replaceChildren(render(args))`. Resolve block-owned assets with
   `new URL('./icons/x.svg', import.meta.url)` (works in Vite and EDS).
4. **Ship assets** — copy any icons/images the component needs into `blocks/<name>/`.
5. **Generate the CSS slice**:
   ```bash
   node scripts/slice-block-css.mjs \
     --src stories/<pattern>/foundation.css \
     --match .ds-<name>[,.primitive] --root .<name> --out blocks/<name>/<name>.css
   ```
6. **EDS harness stories** — `stories/_eds/<Name>.eds.stories.js`: one story per
   reference variant, authored as a table that yields the same content (same
   wrapping width / `section` framing as the reference). Use `edsBlock({ name,
   rows, variants, section })`.
7. **Add parity pairs** — extend `PAIRS` in `scripts/visual-parity.mjs`
   (selector = `.ds-<name>`).
8. **Verify** — `npm run storybook`, then `npm run parity`; iterate the slice/CSS
   until pairs pass. Lint with `npx eslint` + `npx stylelint`.

## 9. Next steps

Pilot (#12) — done: **both `card` and `notification`** are wired end-to-end
(shared renderer, `init()`, sliced CSS, per-variant EDS stories mirroring the
reference) and gated by `npm run parity`. All 8 pairs pass: card basic/large/
thumbnail ~1–2% (anti-aliasing + 2px rounding shift), notification informational/
alert/error/success/dismissible ~0.3% (no size mismatch). `notification` ships
its icons in `blocks/notification/icons/`, resolved via
`new URL('./icons/x.svg', import.meta.url)` (works in both Vite and EDS); dismiss
is a vanilla handler in the renderer (no vendor JS).

Remaining to close #12:

1. **UE content models** — author `ue/models/blocks/notification.json` and extend
   `card.json` with the vessel slots (status/variant via block class), then
   rebuild `component-*.json` (`npm run build:json`).
2. **Action buttons** (notification `withActions`) aren't authorable yet (fixed
   Cancel/Retry) — not paired in the gate. Decide the authoring model if needed.

Parity-gate notes:
- Requires a running Storybook; for CI, build (`build-storybook`) + serve the
  static output, then point `--url` at it. This also dodges the dev-server
  indexer flakiness (the `stories/_eds/` glob intermittently drops after edits;
  a clean restart with `rm -rf node_modules/.cache/storybook` re-indexes).
- Tune `--max-diff` / `--pixel-threshold` as more blocks are added; the 2px
  rounding shift is worth chasing if a stricter threshold is wanted.

Then **shared-primitive hoisting** (#11): `.button` and base typography are
currently duplicated into each slice (card.css is ~2k lines because it carries
the whole `.button` system). Hoist shared primitives into global `styles/` and
have slices reference them, so block CSS stays lean.
