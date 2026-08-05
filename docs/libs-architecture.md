# Libs Architecture (Federated Blocks)

How kp-hw shares a runtime + common blocks + global styles with consuming sites,
and how a page resolves — per block — whether to load from the shared **libs**
project (`/libs`) or from the **consuming site**.

- Spec: <https://main--ak-consumer-1--author-kit.aem.page/>
- Reference repos: [`author-kit/ak-libs`](https://github.com/author-kit/ak-libs)
  (provider), [`author-kit/ak-consumer-1`](https://github.com/author-kit/ak-consumer-1)
  (consumer). This repo mirrors both: **kp-hw is the libs provider (`/libs`) and its
  own consumer (root)** — see [repo-structure.md](./repo-structure.md).

---

## The one idea

Two bases, chosen **per block**:

```
federated block  →  libsBase   (the shared /libs project)
everything else  →  codeBase   (the consuming site's own root)
```

- **`libsBase`** — `ak.js` derives it from its **own** `import.meta.url` (it is
  served from `/libs/scripts/ak.js`). Whatever libs deployment a consumer imports
  the runtime from *is* the libsBase.
- **`codeBase`** — the consuming site passes it into `setConfig`; it defaults to
  `libsBase` (so a libs project rendering its own pages loads everything from libs).

This is the ak-libs / Milo model (inverse of deriving the site base from the page
origin).

---

## Page lifecycle

1. **`head.html`** (consumer) links `/libs/styles/styles.css` then `/styles/styles.css`,
   and loads `/scripts/scripts.js`.
2. **Consumer bootstrap** (`scripts/scripts.js`) resolves `libsBase`, imports the
   runtime from it, and `setConfig`s its own `codeBase`.
3. **Federated blocks** load from `${libsBase}/blocks/…`; **site blocks** from
   `${codeBase}/blocks/…`. Federated blocks carry `data-libs="true"` for QA.
4. **Styles cascade**: libs `styles.css` (global tokens) is first; the site's
   `styles.css` (KP sub-brand) is second and wins.

---

## The consumer bootstrap (`scripts/scripts.js`)

Mirrors `ak-consumer-1`. It runs before the runtime exists, so it computes
`libsBase` itself, then imports `ak.js` from there:

```js
const libsBase = (() => {
  // kp-hw hosts its own /libs → default is same-origin `/libs` (prod CDN-mapped,
  // and served directly under preview / `aem up` / tests). `?libs=` overrides.
  const branch = new URLSearchParams(window.location.search).get('libs');
  if (!branch) return '/libs';
  if (branch === 'local') return 'http://localhost:3000/libs';
  return `https://${branch}--kp-hw--adobedrago.aem.live/libs`; // branch deploy
})();

const codeBase = import.meta.url.replace('/scripts/scripts.js', '');

const { setConfig, loadArea } = await import(`${libsBase}/scripts/ak.js`);
setConfig({ codeBase, env: getEnv(), hostnames, locales, linkBlocks, components, decorateArea });
await loadArea();
```

---

## The resolver (`libs/scripts/ak.js`)

```js
import { FEDERATED_BLOCKS } from './libs-config.js';

// setConfig:
const libsBase = import.meta.url.replace('/scripts/ak.js', '');
config = { ...conf, libsBase, codeBase: conf.codeBase ?? libsBase, federatedBlocks: FEDERATED_BLOCKS };

// loadBlock:
const hasLibPrefix = name.startsWith('lib-');        // official convention
const folder = hasLibPrefix ? name.slice(4) : name;
const isFederated = hasLibPrefix || federatedBlocks.has(folder);  // manifest = retrofit path
if (hasLibPrefix) block.classList.add(folder);       // bridge so base CSS applies
const base = isFederated ? libsBase : codeBase;
const blockPath = `${base}/blocks/${folder}/${folder}`;
```

Two ways to federate a block:
- **`lib-` prefix** — author `lib-columns` (spec convention; folder `columns`).
- **Manifest** (`FEDERATED_BLOCKS` in `libs/scripts/libs-config.js`) — a plain name
  resolves to libs, so the **live KP site's authored content is unchanged**.

Both honor **"no lib overrides"**: a federated name always resolves to `/libs`.

---

## Choosing the libs deployment (prod / preview / local)

`libsBase` comes from the consumer bootstrap:

| Context | `libsBase` |
|---|---|
| Production | same-origin `/libs` (CDN-mapped to the libs project — no DNS/SSL/CORS cost) |
| Preview / `aem up` / tests (default) | same-origin `/libs` (kp-hw serves its own) |
| `?libs=<branch>` | `https://<branch>--kp-hw--adobedrago.aem.live/libs` (test a libs branch vs this content) |
| `?libs=local` | `http://localhost:3000/libs` |

Cross-origin (`?libs=`) works with no extra config: aem.live/.page serve code
(JS + CSS) with `access-control-allow-origin: *`, so `import()` of the runtime and
federated blocks resolves cross-origin. Federated blocks reference the runtime
relatively (`../../scripts/ak.js`), so they stay on the libs origin.

---

## Common tasks

**Promote a site block to federated:** `git mv blocks/<x> libs/blocks/<x>`; add
`<x>` to `FEDERATED_BLOCKS`; fix its runtime imports to `../../scripts/…` (now
inside `/libs`). A KP block that needs a federated block's module imports it
absolutely, e.g. `/libs/blocks/card/card-dom.js` (see `related-articles`).

**Add a new federated block:** create `libs/blocks/<x>/` + add to `FEDERATED_BLOCKS`
(or author as `lib-<x>`).

**A consumer needs different behavior:** make a *new* block in the consumer's
`blocks/` — do not shadow a federated one (no overrides).

---

## Verify locally

```bash
npx aem up --no-open --port 3010
```

On the homepage: the runtime loads from `/libs/scripts/ak.js`; `/libs/styles/styles.css`
loads before `/styles/styles.css`; federated blocks resolve from `/libs/blocks/*`
(and carry `data-libs`), KP blocks from `/blocks/*`; header/footer render; KP brand
intact. `npm run lint` (no new errors) and `npx wtr ./test/scripts/*.test.js` pass.

## Key files

| File | Role |
|---|---|
| `libs/scripts/ak.js` | Runtime; `libsBase` = own `import.meta`; `loadBlock` resolves per block |
| `libs/scripts/libs-config.js` | `FEDERATED_BLOCKS` manifest |
| `libs/scripts/scripts.js` | Libs bootstrap (libs served as its own site) |
| `libs/styles/styles.css` | Federated global tokens (brand base) |
| `libs/blocks/*`, `libs/deps/*`, `libs/tools/*` | Federated blocks, deps, tools |
| `scripts/scripts.js` | Consumer bootstrap (resolves libsBase, sets codeBase) |
| `styles/styles.css` | KP sub-brand overrides (wins the cascade) |
| `head.html` | Consumer head (libs styles → site styles → bootstrap) |
| `blocks/*` | KP-specific blocks |
