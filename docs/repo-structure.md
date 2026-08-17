# Repository Structure

How `kp-hw` is organized under the **Libs (Federated) Architecture**, mirroring the
reference repos built by the pattern's author:
[`author-kit/ak-libs`](https://github.com/author-kit/ak-libs) (the provider) and
[`author-kit/ak-consumer-1`](https://github.com/author-kit/ak-consumer-1) (a
consumer). Spec: <https://main--ak-consumer-1--author-kit.aem.page/>. For the
runtime mechanics see [libs-architecture.md](./libs-architecture.md).

## kp-hw is a hybrid: provider **and** its own consumer

- **`/libs/`** is the federated layer (the `ak-libs` role): the shared runtime,
  global styles, **all blocks**, deps, tools, and KP utils. Other sites consume it
  at runtime.
- **The repo root** is kp-hw's own consumer shell (the `ak-consumer-1` role): its
  bootstrap, sub-brand styles, templates, and UE config — it consumes `/libs`.
  Every block now lives in `/libs`, so the root has **no `/blocks`** of its own.

A future "Site-A" is then just this root shell lifted into its own repo.

```
kp-hw/
├── head.html                 ← consumer: links /libs/styles/styles.css → /styles/styles.css,
│                                loads /libs/deps/rum.js + /scripts/scripts.js
├── 404.html, helix-query.yaml, eslint.config.js, package.json, README, LICENSE …
│
├── libs/                     ← FEDERATED LAYER (mirrors ak-libs)
│   ├── scripts/
│   │   ├── ak.js             ← the runtime (aem.js). libsBase = own import.meta; PROVIDERS resolve by prefix
│   │   ├── scripts.js        ← libs bootstrap (for /libs served as its own site)
│   │   ├── lazy.js, postlcp.js, utils/*
│   ├── styles/styles.css     ← federated global tokens (the brand base)
│   ├── blocks/*              ← ALL 24 blocks (accordion, card, columns, header, footer, …
│   │                            AND KP: classes-search, related-articles, article-collection, …)
│   ├── scripts/utils/*       ← runtime utils + KP utils (kp-api.js, site-config.js)
│   ├── deps/*                ← lit, rum.js
│   └── tools/{da,quick-edit,scheduler,sidekick}
│
├── scripts/scripts.js        ← CONSUMER bootstrap: resolves libsBase, imports ak.js from it,
│                                setConfig({ codeBase: <root>, env, ue wiring })
│   scripts/*.mjs, *.sh        ← build-only dev tooling (stay at root)
├── styles/styles.css         ← KP sub-brand overrides + KP @font-face (Gotham); + styles/fonts/, ds-tokens.css, error.css
├── img/*                     ← KP brand assets (favicons/icons/logos; loaded via codeBase)
├── templates/  ue/ + component-*.json  config/  aem-edge-functions/  workers/  well-known/
├── tools/{fragments, storybook}   stories/  test/
```

(No root `/blocks` or `/utils` — everything moved to `/libs`.)

## Block taxonomy

All 24 blocks are now federated (`/libs/blocks/`, loaded from `libsBase`). kp-hw's
root keeps no blocks of its own — it's a thin consumer shell. A *different* consumer
(Site-A) could still add its own blocks under its root `/blocks` (loaded from
`codeBase`); those would use plain names, federated ones use `lib-`.

A block is federated **by the `lib-` name prefix** (`lib-columns`) — resolved via
the `PROVIDERS` list in `ak.js`, no manifest (as `ak-libs`). A plain name always
means "this site's own block", so per the spec's **"no lib overrides"** a consumer
can have its own `columns` distinct from the federated `lib-columns`. (Header/footer
default to `lib-header`/`lib-footer`; the auto link-blocks are `lib-fragment` /
`lib-schedule` / `lib-youtube`.)

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
