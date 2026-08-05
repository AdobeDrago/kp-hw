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

Federation is resolved **purely by class-name prefix** via a `PROVIDERS` list —
no manifest (exactly as `ak-libs`):

```js
const PROVIDERS = [{ prefix: 'lib', pathPrefix: '/libs', local: 3000 }];

// setConfig:
const libsBase = import.meta.url.replace('/scripts/ak.js', '');
config = { ...conf, libsBase, codeBase: conf.codeBase ?? libsBase, providers: PROVIDERS };

// loadBlock:
let name = classList[0];
const provider = providers.find((pr) => name.startsWith(`${pr.prefix}-`));  // lib-columns → `lib`
if (provider) {
  name = name.replace(`${provider.prefix}-`, '');   // → columns
  classList.add(name);                              // bridge so base-name CSS applies
  block.dataset.libs = 'true';
}
const base = getCodeBase(env, libsBase, codeBase, provider);  // provider → libsBase, else codeBase
const blockPath = `${base}/blocks/${name}/${name}`;
```

- **`lib-columns`** → the `lib` provider → loaded from `/libs/blocks/columns`.
- **`columns`** (no prefix) → no provider → the consuming site's `/blocks/columns`.

This enforces **"no lib overrides"** structurally: a consumer can have its own
`columns` distinct from the federated `lib-columns`. Header/footer default to
`lib-header`/`lib-footer`, and the auto link-blocks are `lib-fragment` /
`lib-schedule` / `lib-youtube`, so that chrome is federated with no authoring change.

> **Authoring impact:** because there is no manifest, a federated block must be
> authored with its `lib-` prefix in DA (`lib-columns`, `lib-card`, …). A plain
> name always means "this site's own block."

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

**Promote a site block to federated:** `git mv blocks/<x> libs/blocks/<x>`; fix
its runtime imports to `../../scripts/…` (now inside `/libs`); and **re-author the
block in DA as `lib-<x>`** so the prefix routes it to `/libs`. A KP block that
needs a federated block's module imports it absolutely, e.g.
`/libs/blocks/card/card-dom.js` (see `related-articles`).

**Add a new federated block:** create `libs/blocks/<x>/` and author it as `lib-<x>`.

**Add another provider** (e.g. commerce): push an entry onto `PROVIDERS` in
`ak.js` with its own `prefix`/`origin`/`pathPrefix`; blocks authored `<prefix>-…`
then load from that provider.

**A consumer needs different behavior:** make a *new* block in the consumer's
`blocks/` — do not shadow a federated one (no overrides).

---

## Verify locally

```bash
npx aem up --no-open --port 3010
```

On the homepage: the runtime loads from `/libs/scripts/ak.js`; `/libs/styles/styles.css`
loads before `/styles/styles.css`; blocks authored `lib-*` resolve from `/libs/blocks/*`
(and carry `data-libs`); header/footer render; KP brand intact. `npm run lint` (no new
errors) and `npx wtr ./test/scripts/*.test.js` pass.

## Key files

| File | Role |
|---|---|
| `libs/scripts/ak.js` | Runtime; `libsBase` = own `import.meta`; `PROVIDERS` + `loadBlock` resolve per block by prefix |
| `libs/scripts/scripts.js` | Libs bootstrap (libs served as its own site) |
| `libs/styles/styles.css` | Federated global tokens (brand base) |
| `libs/blocks/*` | All 24 federated blocks (incl. KP: classes-*, related-articles*, …) |
| `libs/scripts/utils/*` | Runtime utils + KP utils (`kp-api.js`, `site-config.js`) |
| `libs/deps/*`, `libs/tools/*` | Federated deps + tools |
| `scripts/scripts.js` | Consumer bootstrap (resolves libsBase, sets codeBase) |
| `styles/styles.css` | KP sub-brand overrides (wins the cascade) |
| `head.html` | Consumer head (libs styles → site styles → bootstrap) |
