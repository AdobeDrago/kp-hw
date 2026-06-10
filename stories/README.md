# KP Storybook — pilot recipe & notes

Storybook renders the KP design-system "vessel" exports as **native fragment stories**,
on the **current lineage only**, as a seed for AEM Edge Delivery blocks.

- Run: `npm run storybook` (http://localhost:6006)
- Global setup: [`.storybook/`](../.storybook) — see Phase 0 in issue #4.
- Pilot patterns: [`notifications/`](./notifications), [`card/`](./card) — issue #5.

## How the foundation/CSS layering works

- `.storybook/foundation/foundation.css` (style-guide) loads globally via `preview-head.html`
  — provides the **icon font + `@font-face` + base typography/primitives**. It does **not**
  carry a global color palette or component styles.
- Every story is wrapped by the global decorator in
  `<div class="ds-foundation sg-spacing kp-theme-ds2" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="1">`
  because `foundation.css` scopes all rules under that exact selector.
- Each **pattern** ships its own large self-contained `foundation.css` (primitives + that
  component). We vendor it to `stories/<pattern>/foundation.css`, serve `stories/` statically
  at `/sb/` (see `staticDirs`), and inject it per-story via `ensurePatternStyles()` in
  [`pattern-utils.js`](./pattern-utils.js). Serving it as a static file (not a Vite import)
  means its `url(assets/...)` references resolve at runtime and missing background images
  just 404 gracefully.

## Per-pattern recipe (repeatable for the remaining 15)

1. Extract the vessel: `npm run design-files:extract` (unzips to `design-files/.extracted/`).
2. Pick the **current-lineage** variant(s): the `*-foundation-v{N}` files (newest N), whose
   `<body>` is `class="...ds-foundation" data-ds-variant="basic" data-ds-version="1"`. These
   are built for the shared `foundation.css` layer (older `vessel-v1/v2` / `ds1` lines aren't).
3. Strip the page chrome: drop `<head>`, `<header>`, `demo-nav`, the "Skeleton View" controls,
   and the vendor `<script>`s. Keep only the component element (e.g. `.ds-notification`,
   `.ds-card`).
4. Vendor `foundation.css` + only the assets the component references into `stories/<pattern>/`.
5. Write `<Component>.stories.js`: a `render(args)` that builds the element, with `argTypes`
   for the meaningful knobs (variant, text, booleans). Reference assets via `assetUrl()`.
6. Re-implement interactivity in **vanilla JS** (we deliberately do not load the ~400KB vendor
   `main.js`). e.g. notifications' dismiss = `node.querySelector('.dismiss').onclick = () => node.remove()`.
7. Verify in the dev server + the **Accessibility** tab.

## EDS-seed notes

### Notifications → `blocks/notification`
- **Content model:** status `variant` (informational | alert | error | success) → leading icon;
  heading; body (rich text, may contain a link); optional dismiss; optional Cancel/Retry actions.
- **DOM:** `section.ds-notification[.ds-notification--dismiss]` › `__icon` (img) › `__main`/`__main-icon`
  › `__header > __heading` + `__body > p`; optional `__action-buttons`.
- **Behavior to port:** dismiss (remove/hide). Icons are static SVGs per variant.
- **CSS slice needed:** the `.ds-notification*` rules from the pattern `foundation.css`.

### Card → `blocks/cards`
- **Content model:** `variant` (basic | large | thumbnail | video); optional eyebrow, subtitle;
  required title; summary (omit for thumbnail); optional image (required for large/thumbnail/video);
  CTA label + style (`-action` | `-primary`); video adds a play-button overlay.
- **DOM:** `div.ds-card[ .ds-card__option--vertical]` › optional `__image` (img [+ `__video-play-button`])
  › `__content` › `__eyebrow?` `__title` `__subtitle?` `__summary?` `__button-container > __cta > button`.
- **CSS slice needed:** the `.ds-card*` rules from the pattern `foundation.css`.

## Known limitations (for Phase 2 — issue #6)

- **CSS duplication:** each pattern loads its full `foundation.css` (~800KB), so the shared
  primitives are duplicated across patterns. Phase 2 should extract per-component CSS deltas /
  dedupe against one shared foundation.
- **No global color tokens:** colors are baked into component CSS, not exposed as variables.
- Minor markup-fidelity polish (e.g. card `eyebrow` styling) to confirm against originals.
