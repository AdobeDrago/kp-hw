# Repository Structure

How `kp-hw` is organized for enterprise, multi-site use under the **Libs
Architecture** (<https://docs.da.live/media/libs-arch.pdf>). For the runtime
mechanics and code examples, see [libs-architecture.md](./libs-architecture.md).

---

## Two roles in one repo

`kp-hw` is the federated **libs** project (the `fedlibs` role): it owns global
brand, common blocks, and the shared runtime that consuming sites pull at runtime.
In this POC it also acts as its own **consuming site**, so both halves live here:

```
kp-hw/
├── libs/                        ← FEDERATED ("libs") — shared across all sites
│   ├── scripts/
│   │   ├── libs.js              ← federated runtime entry (aka aem.js); re-exports scripts/ak.js
│   │   └── libs-config.js       ← FEDERATED_BLOCKS manifest (17) + resolveLibsBase()
│   ├── styles/
│   │   └── libs.css             ← global brand tokens (grid, spacing, palette, type) — loads FIRST
│   └── blocks/                  ← common/global blocks (17)
│       ├── accordion/  columns/  tabs/  youtube/
│       ├── card/  cards-icon/  columns-media/  hero/  advanced-tabs/
│       ├── header/  (+ assets/)  footer/  fragment/
│       ├── icons/  section-metadata/  schedule/  plan-compare/  table/
│
├── blocks/                      ← SITE-SPECIFIC blocks (KP-unique to this site)
│   ├── classes-search/  classes-results/      (KP Lucid Search feature)
│   ├── related-articles/  related-articles-lucid/  article-collection/
│   ├── breadcrumbs/  notification/
│
├── scripts/                     ← site + runtime scripts
│   ├── scripts.js               ← SITE entry: env detection, config, loadArea (loaded by head.html)
│   ├── ak.js                    ← the shared runtime impl (federated; setConfig + loadBlock resolver)
│   └── utils/                   ← site-owned runtime utils
├── styles/
│   ├── styles.css               ← SITE (KP sub-brand) token overrides — loads AFTER libs.css
│   └── ds-tokens.css            ← generated design-token reference (build-time only)
├── templates/                   ← page templates (article, health-encyclopedia-article)
├── head.html                    ← loads libs.css → styles.css → scripts.js
│
├── config/  aem-edge-functions/  well-known/  workers/   ← platform/edge config
├── ue/  component-*.json         ← Universal Editor models/definitions/filters
├── stories/  .storybook/  tools/storybook/               ← Storybook (design-system parity)
├── test/                         ← unit tests (web-test-runner)
└── docs/                         ← this documentation
```

---

## Block taxonomy: common vs site

| | **Common / Global** | **Site-specific** |
|---|---|---|
| Lives in | `libs/blocks/` | `blocks/` |
| Served from | `libsBase` (`/libs`, or a pinned deployment) | `siteBase` (the site) |
| Owned by | Libs / foundation team | Site dev team |
| Examples | `header`, `footer`, `hero`, `card`, `columns`, `tabs`, `plan-compare`, … (17) | `classes-search`, `classes-results`, `related-articles`, `breadcrumbs`, `notification`, … |
| Listed in | `FEDERATED_BLOCKS` (`libs/scripts/libs-config.js`) | (everything not in the manifest) |

**Selection criteria used here:** the 17 federated blocks are the common, reusable
building blocks and unified chrome (header/footer) — the shared brand surface that
should stay consistent across sites. Blocks stay site-local when they're tied to
*this* site's data/features: the KP Lucid Search blocks (`classes-search`,
`classes-results`, `related-articles-lucid`), content-feed blocks
(`related-articles`, `article-collection`), and other KP-specific pieces
(`breadcrumbs`, `notification`).

A block name appears in **exactly one** tree. To move a block between trees, move
the folder and update `FEDERATED_BLOCKS` (see libs-architecture.md → Common tasks).

---

## Ownership model

- **Libs / foundation team** owns `libs/**` and certain root files (`head.html`
  load order, the shared runtime `scripts/ak.js`). Changes here roll out to **all**
  consuming sites on deploy — no per-site PR or pull required.
- **Site dev teams** own their site's `blocks/**` and `styles/styles.css`. They:
  - mix federated blocks with their own custom blocks (no forking of common code),
  - re-skin the global brand via token overrides in `styles.css` (sub-brand tweaks),
  - build site-only blocks when a federated block doesn't fit, and
  - override a federated block locally when needed (ship `/blocks/<name>` + drop it
    from the manifest).

This is the "guardrails with central control" model: global identity stays
consistent because federated block styles/tokens are owned centrally, while each
site keeps ergonomic freedom over its own surface.

---

## Cascade & branding

Two token layers, loaded in order by `head.html`:

1. `libs/styles/libs.css` — **global** design-system base (neutral palette,
   spacing scale, generic type). The shared brand foundation.
2. `styles/styles.css` — **site** sub-brand overrides (`/* KP brand colors */`,
   `/* KP fonts */`, etc.). Loads second, so the site wins for any token it
   re-declares (e.g. `--font-family`, `--spacing-l`, `--color-navy`).

A new sub-brand = a new consuming site's `styles.css` overriding the same tokens —
no change to `libs`.

---

## Standing up a new consuming site

1. Create a new EDS site repo (e.g. `site-2`) with its own `blocks/`,
   `styles/styles.css`, `scripts/scripts.js`, and `head.html`.
2. Point it at the libs project: load the shared runtime from libs and set
   `<meta name="libs" content="https://main--kp-hw--adobedrago.aem.live">` (or run
   same-origin if the site vendors `/libs`).
3. Load `libs.css` before `styles.css` in the site's `head.html`.
4. Put the site's sub-brand token overrides in its `styles.css`.
5. Author pages using federated blocks (`columns`, `tabs`, …) alongside the site's
   own blocks — they resolve automatically per the manifest.

The site inherits every federated block and future libs update without a code pull.

---

## Versioning & rollout

- **Rollout:** consuming sites fetch libs **at runtime**, so when the libs team
  deploys, every site gets the update on its next page load — no downstream PR.
- **Pinning (prod/stage/local):** a site chooses which libs deployment it consumes
  via `<meta name="libs">` (see `resolveLibsBase` in `libs/scripts/libs-config.js`).
  Point at `main--…` for latest, or a ref-specific host to pin a version.
- **Pre-merge impact check:** because a federated block is served from a URL, a
  libs engineer can point a staging site's `<meta name="libs">` at their branch
  deployment and see the change across consuming surfaces **before** merging.

---

## Related docs

- [libs-architecture.md](./libs-architecture.md) — runtime lifecycle, resolver
  code, and common tasks.
- Root `CLAUDE.md` — KP Lucid Search API blocks (`classes-search`,
  `classes-results`) and the proxy pattern.
- `STORYBOOK.md` — design-system parity; the EDS harness renders both `blocks/`
  and `libs/blocks/`.
