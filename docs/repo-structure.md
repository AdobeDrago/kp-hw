# Repository Structure

How `kp-hw` is organized under the **Libs (Federated) Architecture**, mirroring the
reference repos built by the pattern's author:
[`author-kit/ak-libs`](https://github.com/author-kit/ak-libs) (the provider) and
[`author-kit/ak-consumer-1`](https://github.com/author-kit/ak-consumer-1) (a
consumer). Spec: <https://main--ak-consumer-1--author-kit.aem.page/>. For the
runtime mechanics see [libs-architecture.md](./libs-architecture.md).

## kp-hw is a hybrid: provider **and** its own consumer

- **`/libs/`** is the federated layer (the `ak-libs` role): the shared runtime,
  global styles, and common blocks. Other sites consume it at runtime.
- **The repo root** is kp-hw's own consumer layer (the `ak-consumer-1` role): its
  bootstrap, sub-brand styles, and KP-specific blocks — it consumes `/libs`.

A future "Site-A" is then just this root layer lifted into its own repo.

```
kp-hw/
├── head.html                 ← consumer: links /libs/styles/styles.css → /styles/styles.css,
│                                loads /libs/deps/rum.js + /scripts/scripts.js
├── 404.html, helix-query.yaml, eslint.config.js, package.json, README, LICENSE …
│
├── libs/                     ← FEDERATED LAYER (mirrors ak-libs)
│   ├── scripts/
│   │   ├── ak.js             ← the runtime (aem.js). libsBase = its own import.meta.url
│   │   ├── scripts.js        ← libs bootstrap (for /libs served as its own site)
│   │   ├── libs-config.js    ← FEDERATED_BLOCKS manifest
│   │   ├── lazy.js, postlcp.js, utils/*
│   ├── styles/styles.css     ← federated global tokens (the brand base)
│   ├── blocks/*              ← 17 federated blocks (accordion, card, columns, header, footer, …)
│   ├── deps/*                ← lit, rum.js
│   └── tools/{da,quick-edit,scheduler,sidekick}
│
├── scripts/scripts.js        ← CONSUMER bootstrap: resolves libsBase, imports ak.js from it,
│                                setConfig({ codeBase: <root>, env, KP linkBlocks, ue wiring })
│   scripts/*.mjs, *.sh        ← build-only dev tooling (stay at root)
├── styles/styles.css         ← KP sub-brand overrides + KP @font-face (Gotham); + styles/fonts/, ds-tokens.css, error.css
├── blocks/*                  ← KP-specific: classes-search, classes-results, related-articles,
│                                related-articles-lucid, article-collection, breadcrumbs, notification
├── img/*                     ← KP brand assets (favicons/icons/logos; loaded via codeBase)
├── templates/  ue/ + component-*.json  config/  aem-edge-functions/  workers/  well-known/
├── utils/{kp-api.js, site-config.js}   tools/{fragments, storybook}   stories/  test/
```

## Block taxonomy

| | **Federated** | **Site-specific** |
|---|---|---|
| Lives in | `libs/blocks/` | `blocks/` |
| Loaded from | `libsBase` (`/libs`) | `codeBase` (the site root) |
| Owned by | Libs / foundation team | Site dev team |
| Examples | `header`, `footer`, `hero`, `card`, `columns`, `tabs`, … (17) | `classes-*`, `related-articles*`, `article-collection`, `breadcrumbs`, `notification` |

A block is federated either by the `lib-` name prefix (`lib-columns`) **or** by
being in `FEDERATED_BLOCKS` (author-transparent — keeps the live KP content
unchanged). Per the spec's **"no lib overrides"**, a federated name always
resolves to libs; a consumer needing different behavior makes a *new* block.

## Ownership & the seven principles

The libs team owns `libs/**` (runtime, global styles, common blocks) and controls
certain root files. Site teams own their root layer (KP `blocks/`, `styles.css`,
`templates/`, `ue/`, edge functions). The spec's principles this realizes:

1. **No duplicate code** — one runtime + block set under `/libs`, consumed, never forked.
2. **Evergreen** — consumers get the latest libs at runtime; no downstream pull.
3. **No lib overrides** — federated names always resolve to libs.
4. **Sensible customizations** — site blocks/styles live at root.
5. **Blast-radius** — `?libs=<branch>` previews a libs change against real content.
6. **Zero perf degradation** — `/libs` is **same-origin** in production (CDN-mapped), no DNS/SSL/CORS cost.
7. **Selective promotion** — only org-wide-value blocks are promoted into `/libs`.

## Standing up a new consuming site (Site-A)

A consumer is a **tiny shell** (like `ak-consumer-1`): copy kp-hw's root consumer
layer — `head.html`, `scripts/scripts.js`, `styles/styles.css`, its own `blocks/`
— into a new EDS repo, point `libsBase` at kp-hw's deployed `/libs`
(production: same-origin `/libs` via CDN/worker mapping; preview: `?libs=<branch>`),
and author. It inherits every federated block and future libs update with no code
pull. See [libs-architecture.md](./libs-architecture.md) for the bootstrap code.
