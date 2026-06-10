# KP Storybook — pilot recipe & notes

Storybook renders the KP design-system "vessel" exports as **native fragment stories**,
on the **current lineage only**, as a seed for AEM Edge Delivery blocks.

This is a **self-contained tool** under `tools/storybook/` with its own dependencies — it is
NOT part of the EDS runtime and is not wired into the root `package.json`.

```bash
cd tools/storybook
npm install        # first time only
npm start          # http://localhost:6006   (alias: npm run storybook)
npm run build      # static build -> tools/storybook/storybook-static
```

- Global setup: [`.storybook/`](../.storybook) — see Phase 0 in issue #4.
- Pilot patterns: [`notifications/`](./notifications), [`card/`](./card) — issue #5.
- Optional: `npm run design-files:extract` unzips the vessel exports from the repo-root
  `design-files/` into `design-files/.extracted/` for authoring new stories.

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

## Phase 2 status (issue #6)

**Done (15 of 17 patterns):** Notifications, Card, Breadcrumbs, Card Group, Search Results,
Hero, Content Toggle, Show More Less, Footer, Modal, Dropdown Menu, Autocomplete Search,
Form, Header, **Skip Link** + Foundations/Breakpoints.

**Not built (blocked — required source isn't in the zip export):**
- **social-share** — the social icon SVGs are absent (the pattern folder ships no `assets/`).
- **icon-links** — content is JS-rendered and depends on an external `fed.kp.org` stylesheet.

These can be completed only if the source icons / data + CSS are provided.

> Header note: covers the compact foundation variant (branding/logo + primary nav + mobile
> menu toggle), imported via `?raw`. Other variants — auth / non-auth / task-flow / maui —
> are deferred.

> Form note: covers the core reusable fields (text input incl. helper/error/disabled,
> select, textarea). Specialized sub-types — password show/strength meter and selectable
> tiles (icon/image/avatar) — are deferred.

> Footer note: kp-footer uses the older `kp-theme-ds2` + `main.css` architecture (no
> `foundation-v` line). Its ~360-line markup is imported verbatim via Vite `?raw` from
> `footer.html` (asset paths pre-rewritten) rather than re-authored. Loading its 771KB
> `main.css` globally is the clearest example of the CSS-dedup debt below.

> Note: when you add a brand-new `stories/<pattern>/` directory, the running dev server's
> story indexer sometimes misses it (no error, just absent from the sidebar). Restart
> `npm run storybook` to force a re-scan.

**Tokens finding:** the only clean token data in the offline export is `theme.json`
(DS2 breakpoints — now a Foundations story). **Colors/spacing/typography are NOT
recoverable** — they're compiled from Sass into hardcoded values (the style guide even
says "use the following Sass variables"). A real `:root { --kp-* }` token layer needs the
**upstream Sass / Style-Dictionary source** — that's a decision/blocker, not a scrape.

**Pattern lineage is heterogeneous** — not every pattern has a clean `foundation-v{N}`
(`ds-foundation`) line. Classification for the remaining patterns:

| Bucket | Patterns | Notes |
|---|---|---|
| Clean CSS, `foundation-v` | ~~card-group, search-results, hero~~ ✅ done | Recipe applied directly |
| Mostly CSS (older arch) | ~~kp-footer~~ ✅ done | `kp-theme-ds2`/main.css; markup via `?raw` |
| Mostly CSS + small JS | ~~content-toggle, show-more-less~~ ✅ done | Vanilla toggle/expand re-implemented |
| JS-heavy (vanilla re-impl) | ~~modal, dropdown-menu, autocomplete-search, form, header~~ ✅ done | Real behavior ported to vanilla JS |
| Older arch (built) | ~~skip-link~~ ✅ done | pure-CSS `:focus` reveal; loads its own `main.css` |
| Blocked (source not in export) | social-share (icon assets missing), icon-links (JS-rendered + external CSS) | Need the source icons / data + CSS to complete |

\* hero variants are `card-overlay`/`text-overlay` vN — confirm the foundation line.

## Known limitations (for Phase 2 — issue #6)

- **CSS duplication:** each pattern loads its full `foundation.css` (~800KB), so the shared
  primitives are duplicated across patterns. Phase 2 should extract per-component CSS deltas /
  dedupe against one shared foundation.
- **No global color tokens:** colors are baked into component CSS, not exposed as variables.
- Minor markup-fidelity polish (e.g. card `eyebrow` styling) to confirm against originals.
