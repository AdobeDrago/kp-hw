# Libs Architecture (Federated Blocks)

How this repo shares common blocks/styles/runtime across sites, and how a page
decides — per block — whether to load from the shared **libs** project or from
the **consuming site**.

- Concept & diagram: <https://docs.da.live/media/libs-arch.pdf>
- In this org, **`kp-hw` is the federated "libs" project** (the `fedlibs` role in
  the diagram). It hosts `/libs/...`; consuming sites fetch that at runtime while
  keeping their own `/blocks`.

> This repo is currently **both** the libs provider **and** a consuming site — a
> page here loads common blocks from `/libs` and KP-specific blocks from `/blocks`
> on the same page. That's the whole POC.

---

## The one idea

Every block, style, and template used to resolve from a **single** base
(`codeBase`). The libs architecture makes that base resolution **per block**:

```
federated block  →  libsBase  (the shared /libs project)
everything else  →  siteBase  (the consuming site's own /blocks)
```

A small manifest says which blocks are federated; the runtime picks the base.

---

## What is federated today

`libs/scripts/libs-config.js` is the single source of truth:

```js
export const FEDERATED_BLOCKS = new Set([
  'accordion', 'advanced-tabs', 'card', 'cards-icon',
  'columns', 'columns-media', 'footer', 'fragment',
  'header', 'hero', 'icons', 'plan-compare',
  'schedule', 'section-metadata', 'table', 'tabs', 'youtube',
]);
```

Everything else stays site-local under `/blocks` — the KP-unique blocks:
`classes-search`, `classes-results`, `related-articles`, `related-articles-lucid`,
`article-collection`, `breadcrumbs`, `notification`.

---

## Page lifecycle (mapped to the spec's 6 steps)

1. **Page load** — `head.html` loads the site's `scripts.js`.
2. **Libs runtime loads** — `scripts.js` imports the federated runtime
   (`scripts/ak.js`, exposed as `/libs/scripts/libs.js` — aka `aem.js`): section
   decoration, block loading, links/buttons, templates.
3. **Libs styles load** — `/libs/styles/libs.css` (global brand tokens) — **first**.
4. **Site styles load** — `/styles/styles.css` (KP sub-brand overrides) — **after**,
   so the site wins the cascade.
5. **Site block loads** — `loadBlock` sees a non-federated block → `${siteBase}/blocks/...`.
6. **Federated block loads** — `loadBlock` sees a federated block → `${libsBase}/blocks/...`.

Steps 3–4 are wired in `head.html`:

```html
<link rel="stylesheet" href="/libs/styles/libs.css"/>   <!-- global brand: first -->
<link rel="stylesheet" href="/styles/styles.css"/>      <!-- site sub-brand: after -->
```

---

## The resolver (base selection)

`scripts/ak.js` computes both bases once, then `loadBlock` chooses per block.

**Config** (`setConfig`):

```js
import { FEDERATED_BLOCKS, resolveLibsBase } from '../libs/scripts/libs-config.js';

// siteBase = this site's root (where /blocks & /styles/styles.css live)
const siteBase = `${import.meta.url.replace('/scripts/ak.js', '')}`;

config = {
  ...conf,
  siteBase,
  libsBase: resolveLibsBase(siteBase),   // same-origin `/libs` by default
  federatedBlocks: FEDERATED_BLOCKS,
  codeBase: siteBase,                    // site-owned templates/utils resolve here
};
```

**Per-block resolution** (`loadBlock`):

```js
const { siteBase, libsBase, federatedBlocks } = getConfig();
const name = block.classList[0];

const isFederated = federatedBlocks?.has(name);
const base = isFederated ? libsBase : siteBase;
if (isFederated) block.dataset.libs = 'true';   // QA/demo marker

const blockPath = `${base}/blocks/${name}/${name}`;
await (await import(`${blockPath}.js`)).default(block);
loadStyle(`${blockPath}.css`);
```

At runtime you'll see (on a page that uses both):

```
GET /libs/blocks/columns/columns.js   200   ← federated
GET /libs/blocks/tabs/tabs.js         200   ← federated
GET /blocks/hero/hero.js              200   ← site
GET /blocks/card/card.js              200   ← site
```

Federated blocks carry `data-libs="true"` in the DOM so QA can see the split.

---

## Choosing the libs deployment (prod / stage / local)

`resolveLibsBase(siteBase)` (in `libs/scripts/libs-config.js`) resolves in order:

1. `<meta name="libs" content="…">` — an absolute origin/URL or absolute path.
   Pins a specific libs deployment for that page/environment.
2. Same-origin `${siteBase}/libs` — the default.

```html
<!-- Point a site at an external libs deployment -->
<meta name="libs" content="https://main--kp-hw--adobedrago.aem.live">
<!-- now federated blocks load from https://main--kp-hw--adobedrago.aem.live/libs/blocks/... -->
```

When `libsBase` is external, also serve `libs.css` from there (swap the `head.html`
link, or inject it from `libs.js`).

**Federated blocks depend on the provider's shared runtime and utils.** They live
in `libs/blocks/<name>/` and reference the provider's `/scripts` tree one level up
(`../../../scripts/...`) — the runtime (`ak.js`) and shared utils (`picture.js`,
`env.js`, `observer.js`). Because a federated block is always **served from the
libs-provider origin**, those `../../../scripts/...` paths resolve against that same
origin, so the block stays self-contained cross-origin. Sibling federated blocks
are referenced normally (e.g. `footer` → `../fragment/fragment.js`).

---

## Common tasks

**Federate an existing site block** (e.g. `table`):
1. `git mv blocks/table libs/blocks/table`
2. Add `'table'` to `FEDERATED_BLOCKS` in `libs/scripts/libs-config.js`
3. Fix provider imports one level deeper: `../../scripts/…` → `../../../scripts/…`
   (runtime + shared utils stay in the provider `/scripts` tree — single source of
   truth). Sibling federated-block imports (`../otherblock/…`) are unchanged.
4. If the block ships block-absolute asset URLs (like `header`'s
   `/blocks/header/assets/…`), rewrite them to `/libs/blocks/<name>/assets/…` and
   update any Storybook `staticDirs`.
5. If a Storybook story imports the block by path, repoint it to `../../libs/blocks/…`.

**Un-federate / let a site override a federated block:**
- Remove the name from `FEDERATED_BLOCKS` (it now resolves from the site), **or**
- Ship a site-local `/blocks/<name>/` and drop the name from the manifest — the
  site copy wins.

**Add a brand-new federated block:** create `libs/blocks/<name>/` and add `<name>`
to `FEDERATED_BLOCKS`.

---

## Verify locally

```bash
npx aem up --no-open --port 3005
```

Open a page that uses federated blocks (the homepage uses `header`, `footer`,
`hero`, `card`, `columns`, `tabs`, …) and check the Network panel: those load from
`/libs/blocks/...`, while a KP-unique block like `classes-search` loads from
`/blocks/...`; `/libs/styles/libs.css` loads before `/styles/styles.css`. Federated
blocks have `data-libs="true"` in the DOM.

---

## Files

| File | Role |
|---|---|
| `libs/scripts/libs-config.js` | `FEDERATED_BLOCKS` manifest (17 blocks) + `resolveLibsBase()` |
| `libs/scripts/libs.js` | Federated runtime entry (aka `aem.js`); re-exports `scripts/ak.js` |
| `libs/styles/libs.css` | Federated global brand tokens (loaded first) |
| `libs/blocks/*` | The 17 federated blocks (incl. `header` + its `assets/`) |
| `scripts/ak.js` | Runtime: `setConfig` computes bases; `loadBlock` picks per block |
| `scripts/utils/*` | Provider runtime utils (`ak.js` + `picture/env/observer`) — shared by site & federated blocks |
| `styles/styles.css` | Site (KP) sub-brand token overrides (loaded after libs.css) |
| `head.html` | Loads `libs.css` before `styles.css` |
| `blocks/*` | Site-specific blocks (KP-unique) |
