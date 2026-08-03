# Template Governance Plugin — Design

## Summary

A new **DA library plugin**, `tools/template-governance/`, built the same way as
`tools/fragments/`: a Lit component wired to the DA App SDK, registered in the site's
DA config sheet, opening in the same Library panel Fragments already uses. Unlike
Fragments, it does **not** insert anything into the document — it's a read-only report.
It looks at the page currently open in the DA editor, determines its declared
`template`, samples other live pages that already use that template, derives what's
"typical" for it (which blocks appear, which metadata fields are set), and reports
where the current page diverges: missing pieces that are common for its template, and
unusual pieces that aren't.

## Background

- This project already has a `template` concept: pages declare
  `<meta name="template">` (see [scripts/scripts.js:100](../../../scripts/scripts.js#L100),
  [scripts/ak.js:81](../../../scripts/ak.js#L81)), which drives loading
  `templates/<name>/<name>.css` and `.js`. Two templates currently exist:
  `templates/article/` and `templates/health-encyclopedia-article/`.
  `scripts/scripts.js` also has a URL-based fallback: pages matching
  `/healtharticle[.-]/` are treated as `article` even without the meta tag.
- There is **no existing definition of what a template's page should contain** — no
  required-blocks list, no required-metadata list, no schema. This plugin's job is to
  derive that on the fly from real pages rather than requiring one to be hand-authored
  (see decisions below).
- `helix-query.yaml` defines two relevant per-folder query indices:
  `healtharticles` (scoped to `/northern-california/health-wellness/**`) and `blog`
  (scoped to `/blog/**`). The `healtharticles` index has a `featured` property that,
  due to what looks like a copy/paste artifact from the `blog` index, actually selects
  `meta[name="template"]` rather than `meta[name="featured"]`. This is a pre-existing
  quirk in the index config, not something this task fixes — but it means, for pages
  under that folder, the query index conveniently already exposes each page's template
  value under the `featured` key.
- Block structure is identifiable straight from raw fetched HTML, without executing any
  JS: authored EDS markup already has each block as a `<div>` whose class is the block
  name (e.g. `<div class="hero">`), as a direct child of a section `<div>` under
  `<main>`. Runtime decoration (`ak.js`'s `loadBlock`) later adds `data-block-name`,
  `block`, and wrapper classes like `block-content` — none of which exist in the raw,
  un-decorated markup, so extraction must key off the plain class name on the raw
  fetched HTML, not the decorated selectors used elsewhere in the codebase (e.g.
  `.block-content > div[class]` in `ak.js`, which only exists post-decoration).
- The DA App SDK (`https://da.live/nx/utils/sdk.js`, fetched and read directly for this
  design) exposes `actions`: `daFetch`, `sendText`, `sendHTML`, `setHref`, `setHash`,
  `closeLibrary`, `getSelection`, `setPrompt`, `showPanel`. There is **no action to read
  the current document's in-progress (unsaved) content** — only `getSelection` (current
  selection) and the send/set actions (write direction). `context` is whatever the DA
  parent app posts as `e.data`; `tools/fragments/fragments.js` only reads
  `context.org`/`context.repo`/`context.ref` from it. Whether `context.path` (the
  currently-open document's path) is present is **not confirmed** from the SDK source
  alone — this is a first-task spike item (see Open risks below).
- Library plugins register the same way as Fragments — a row in the **library** tab of
  the site's DA config sheet (`https://da.live/config#/adobedrago/kp-hw/`) with
  `title`, `path`, `icon`, `format`. This is what surfaces the plugin in DA's Library
  panel (the "right column" the panel opens in) — no different mechanism is needed for
  a "right column" placement; it's the same surface Fragments already uses.

## Goals

- Author opens the Library panel while editing a DA doc, picks the "Template
  Governance" tab.
- Panel determines the current page's declared template (metadata, with the existing
  URL-based fallback for `article`).
- Panel finds other pages already using that same template, derives which blocks and
  metadata fields are typical for it, and diffs the current page against that.
- Reports two things: **Missing** (typical for this template, absent here) and
  **Unusual** (present here, rare for this template).
- Works against whatever site/org/repo the plugin is registered on (read from SDK
  context, not hardcoded), consistent with Fragments.

## Non-goals

- **No remediation actions.** This is a report, not an editor — no `sendHTML`/`sendText`
  calls, no "fix it" buttons. (Confirmed with the user — read-only was the explicit
  choice over quick-fix actions.)
- **No hand-authored rules file.** Nothing like `templates/<name>/governance.json` is
  introduced — the "expected shape" of a template is derived by sampling live pages,
  not declared. (Also an explicit choice — "derived automatically" over a repo-authored
  or DA-content-authored rule set.)
- **No block-order or heading-structure checking.** Presence/absence only, in v1.
- **No cross-template rules** (e.g. "articles must link to a hub page").
- **No fix to the `healtharticles`/`featured` query-index quirk** — the plugin works
  around it (reads the value, ignores the misleading key name) rather than correcting
  `helix-query.yaml`.
- **No change to `blocks/fragment/fragment.js` or any existing template/block code.**

## Architecture

```
DA editor (Library panel, same surface Fragments uses)
        │  postMessage (DA App SDK)
        ▼
tools/template-governance/template-governance.html ──imports──▶ template-governance.js
                                                                       │
                                                    DA_SDK → { context, token, actions }
                                                                       │
                          1. Resolve current page's template
                             (fetch current page's own preview HTML, read
                             <meta name="template">, apply URL fallback)
                                                                       │
                          2. Discover peer pages sharing that template
                             (a) try query-index.json for the page's section, else
                             (b) crawl DA admin `list` API, scoped to the current
                                 page's top-level folder, capped and session-cached
                                                                       │
                          3. Sample up to ~15 peers, fetch each peer's preview HTML,
                             extract block-name set + metadata-field set per page
                             (raw-markup class names — no JS execution)
                                                                       │
                          4. Aggregate frequencies → "expected" (≥60% of peers) /
                             "rare" (<15% of peers)
                                                                       │
                          5. Extract the same two sets for the current page, diff
                             against the aggregate, render Missing / Unusual lists
```

### Files

- New: `tools/template-governance/template-governance.html` — same shape as
  `tools/fragments/fragments.html` (DA SDK script tag + module script tag, no
  importmap, matching the already-cleaned-up Fragments pattern).
- New: `tools/template-governance/template-governance.js` — DA SDK glue + Lit
  component (`<template-governance-report>`), mirroring `fragments.js`'s structure
  (`connectedCallback` kicks off the pipeline, `_status` state machine for
  loading/empty/error/ready, request-token guard against out-of-order async work).
- New: `tools/template-governance/template-governance.css` — panel styles, reusing the
  `.status-container` loading/empty/error convention from `fragments.css`.
- New: `tools/template-governance/template-governance-utils.js` — pure, unit-tested
  helpers: template resolution, URL building (query-index and admin `list`), raw-HTML
  block/metadata extraction, frequency aggregation, and the diff itself. Mirrors the
  `fragment-utils.js` split so the core logic is testable without mocking DOM/fetch/SDK.

## Data flow / behavior

1. **Resolve current template.** Fetch the current page's own preview HTML
   (`https://{ref}--{repo}--{org}.aem.page{path}`, same URL shape as
   `buildPreviewUrl` in `fragment-utils.js`) and read
   `head > meta[name="template"]`. If absent, apply the same fallback
   `scripts.js` uses: URL matches `/healtharticle[.-]/` → `article`. If still absent,
   render the "no template declared" state and stop (no error, no diff to run).
2. **Discover peers.**
   - If the current page's path falls under a folder with a known
     `query-index.json` (per `helix-query.yaml`'s `include` globs), fetch it and filter
     rows whose template-bearing property matches the resolved template.
   - Otherwise, recursively crawl the DA admin `list` API
     (`https://admin.da.live/list/{org}/{repo}{path}`), scoped by default to the
     current page's top-level folder (e.g. `/northern-california/health-wellness`,
     derived from the current page's path, not hardcoded), reading each `.html`
     entry's preview HTML for its `<meta name="template">`. Capped at a fixed max
     number of visited entries (constant, e.g. 500) to bound request volume.
   - Cache the resulting per-template bucket in `sessionStorage`, keyed by
     `org/repo/ref/scopeRoot/template`, so re-opening the panel doesn't re-crawl. A
     "Rescan" control clears the cache for the current key and re-runs discovery.
3. **Sample and extract.** From the matched bucket (excluding the current page itself),
   take up to a fixed sample size (constant, e.g. 15). Fetch each sampled page's
   preview HTML and extract:
   - **Block names** — the class name of each direct-child `<div>` of a section `<div>`
     under `<main>` in the raw (undecorated) markup.
   - **Metadata fields** — the `name`/`property` of each `<meta>` tag in `<head>`.
   Each fetch failure is skipped (doesn't fail the whole sample); the panel notes the
   effective sample size used.
4. **Aggregate.** For blocks and metadata separately, compute the fraction of sampled
   peers containing each name. Names at or above the "expected" threshold (constant,
   e.g. 0.6) form the expected set; names at or below the "rare" threshold (constant,
   e.g. 0.15) form the rare set.
5. **Diff current page.** Extract the same two sets (blocks, metadata) for the current
   page itself (same extraction function as step 3, reused). Compute:
   - **Missing** = expected set − current page's set.
   - **Unusual** = current page's set ∩ rare set.
6. **Render.** Header shows the resolved template name and sample size used (e.g.
   "article — checked against 12 peer pages"). Two lists below: Missing, Unusual (each
   empty list renders "None — looks consistent with its template" rather than an empty
   `<ul>`). A "Rescan" button re-runs discovery and diff from scratch, ignoring the
   session cache for the current key.
7. Every async stage (template resolution, discovery, sampling, extraction) is guarded
   by an incrementing request token, the same out-of-order-response guard
   `fragments.js` already uses, since opening the panel on a fast series of different
   documents shouldn't let a stale response overwrite a newer one.

## States / error handling

- **Loading** — shown while resolving the template, discovering peers, and sampling;
  a single status message is enough (no need to expose every sub-stage), reusing the
  `.status-container` convention.
- **No template declared** — neutral state, not an error: "This page doesn't declare a
  template — nothing to check."
- **No peers found** — "No other pages found for template '<name>' — can't derive an
  expected shape yet." (Distinct from "no template declared.")
- **Error** — network failure fetching the current page's own preview, or a
  discovery/sampling stage that fails outright (e.g. DA admin `list` request
  unauthorized), renders an error message with a Retry button, following the Fragments
  pattern.
- All rendered names (block names, metadata field names, template name) go through
  Lit's default text interpolation (HTML-escaped) — no `innerHTML` used for any
  fetched/derived string, consistent with Fragments' handling of third-party data.

## Registration (outside this repo)

Same mechanism as Fragments — a row in the **library** tab of the site's DA config
sheet at `https://da.live/config#/adobedrago/kp-hw/`:

| title | path | icon | format |
|---|---|---|---|
| Template Governance | `<hosted URL of tools/template-governance/template-governance.html>` | `<hosted URL of a .png icon>` | dialog |

This is a change to shared site configuration. As with Fragments, it will be proposed
with exact URLs once the plugin is verified working, and made only with the user's
explicit confirmation — not performed automatically as part of implementation. A PNG
icon isn't currently available in the repo for this plugin and will need to be
supplied or created.

## Open risks / assumptions to verify early

- **`context.path` availability.** Fragments never reads the currently-open document's
  path from `DA_SDK`'s `context`, so this design's core assumption — that the plugin
  can know which page it was opened from — is unconfirmed against the actual runtime
  payload. First implementation task should log the full `context` object inside the
  real DA editor and confirm a usable path field exists before building the rest of
  the pipeline on top of it. If it's absent, the fallback is deriving path from the
  preview iframe's own referrer/parent origin, which is a materially different (and
  less reliable) mechanism and would need re-scoping.
- **Preview staleness.** Both the current page and its peers are read via their
  `.aem.page` preview render, not DA's live edit buffer (no SDK action exposes
  unsaved content). The report reflects each page as of its last preview, which may
  lag behind in-progress edits. This is a known, accepted limitation, not a bug to
  design around — same characteristic Fragments' preview iframe already has.
- **Query-index coverage is partial.** Only folders with a matching `helix-query.yaml`
  index get the fast discovery path; everywhere else falls back to the admin crawl.
  This is fine functionally (the crawl always works) but means discovery latency varies
  a lot by where the current page lives.

## Testing / verification plan

- Unit tests for `template-governance-utils.js` (template resolution/fallback, URL
  building for both discovery paths, raw-HTML block/metadata extraction, frequency
  aggregation, and the diff function) — pure functions, no DOM/fetch/SDK mocking,
  mirroring `test/tools/fragments/fragment-utils.test.js`.
- No automated test for `template-governance.js` itself (DOM + `fetch` + DA SDK
  `postMessage` wiring) — consistent with every other `tools/*` DA app in this repo,
  which are manually verified against the live DA editor.
- Manual verification against real content once the `context.path` risk above is
  resolved: open a page known to declare `article` or `health-encyclopedia-article`,
  confirm peer discovery finds a sensible bucket, confirm Missing/Unusual lists match
  a manual spot-check of a couple of sampled peers, confirm the no-template and
  no-peers states render correctly, confirm Rescan re-runs discovery.
