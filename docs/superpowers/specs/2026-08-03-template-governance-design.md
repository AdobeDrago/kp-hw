# Template Governance Plugin — Design

## Summary

A new **DA library plugin**, `tools/template-governance/`, built the same way as
`tools/fragments/`: a Lit component wired to the DA App SDK, registered in the site's
DA config sheet, opening in the same Library panel Fragments already uses. It does
**not** insert anything into the document — it's a read-only report. It looks at the
page currently open in the DA editor, reads its declared `<meta name="template">`
value, looks that name up in the project's own template library
(`docs/library/templates.json`, DA's built-in "create new page from template" config),
fetches the matching reference document, and diffs the current page's blocks and
metadata directly against it.

**This supersedes the original design's "derive an expected shape by sampling many
peer pages" approach.** That approach was designed under the assumption that no
canonical reference existed for a template. It turns out one already does — DA's own
project template library — which is a strictly better source of truth: one
hand-authored, intentional reference document per template, instead of a statistical
inference over whatever pages happen to exist.

## Background

- `docs/library/templates.json`, `docs/library/blocks.json`, and
  `docs/library/icons.json` are DA's standard project library config — they power the
  "Insert from Library" panel's Templates/Blocks/Icons tabs that authors already use
  when creating pages. This is a different, pre-existing mechanism from the
  `<meta name="template">` + `templates/<name>/{css,js}` convention this repo also has
  (see [scripts/scripts.js:100](../../../scripts/scripts.js#L100)) — the CSS/JS
  convention drives runtime behavior for a couple of specific content types
  (`article`, `health-encyclopedia-article`); the library's `templates.json` is about
  giving authors a starting layout when they create a new page. They share the word
  "template" but were, until this task, unrelated. Per explicit direction from the
  user, page metadata's `template` value and `templates.json`'s keys **are meant to
  match** (case-insensitively) — i.e. going forward, a page's declared template should
  name one of the library's templates.
- `docs/library/templates.json` (fetched and inspected directly for this design, via
  `https://main--kp-hw--adobedrago.aem.page/docs/library/templates.json`) currently
  has two entries:
  ```json
  {
    "data": [
      { "key": "Homepage", "value": "https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage" },
      { "key": "Support", "value": "https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/support" }
    ]
  }
  ```
  Both reference documents are real, hand-authored pages with actual block markup
  (`hero`, `columns`, `columns-media`, `tabs`, `accordion`, etc.) — confirmed by
  fetching them directly.
- **Observed but out of scope to fix:** both entries' `value` URLs point at a
  different DA site — `ak-kaiserpermanente`, not this project's own `kp-hw` — even
  though `kp-hw` has its own copies at the same relative path
  (`docs/library/templates/homepage.html`, `.../support.html`, confirmed via the DA
  admin `list` API and near-identical in size to the `ak-kaiserpermanente` versions).
  This plugin takes `templates.json` at face value and follows whatever URL it names,
  same as DA's own "Insert from Library" feature would — it does not attempt to
  detect or correct this. Worth the user's awareness, not this task's problem to fix.
- No page in `kp-hw` currently declares `<meta name="template">` matching `Homepage`
  or `Support` (checked the site's own homepage and a couple of other root pages) —
  adoption of the meta tag is still ahead of this task, not behind it. The plugin
  handles this the same way it handles any untagged page: a neutral "nothing to
  check" state, not an error.
- **Revised during manual verification (superseding what follows in this bullet
  originally): the plugin does not use `.aem.page` preview fetches at all.** The
  first working version fetched the current page via `buildPreviewUrl` (unauthenticated
  `.aem.page`), which requires the page to have been previewed at least once — a real
  page being actively edited (e.g. a brand-new draft) 404s until an author manually
  clicks Preview. Confirmed directly: a freshly-edited test page 404'd on
  `.aem.page` immediately after a metadata edit, and started working only after an
  explicit Preview action. This defeats the point of a governance check meant to run
  *before* publishing. The fix: fetch the current page (and everything else) from
  **DA's raw source** instead — `https://content.da.live/{org}/{repo}{path}`,
  authenticated with the DA SDK's `token` (a `Bearer` header) — which reflects the
  last-saved DA content regardless of preview state. Confirmed directly: the same
  test page 404'd on `.aem.page` but returned 200 immediately from
  `content.da.live` with the token.
- **DA's raw source has no `<head>` at all — this changes how template/metadata are
  read.** Fetching `https://content.da.live/adobedrago/kp-hw/index-copy` returns only
  a `<body>`; there is no `<head>`, no `<meta>` tags. Page metadata (title,
  description, template, etc.) instead lives in a `<div class="metadata">` block
  **inside** `<body>` — the same key/value table shape as any other block:
  ```html
  <div class="metadata">
    <div><div><p>title</p></div><div><p>Home</p></div></div>
    <div><div><p>template</p></div><div><p>homepage</p></div></div>
  </div>
  ```
  Confirmed by comparing the same document's raw source against its `.aem.page`
  preview render side-by-side: the preview's `<head>` has `<meta name="template"
  content="homepage">` plus a dozen more auto-generated tags (`og:title`,
  `og:description`, `twitter:*`, `viewport`, etc., synthesized from the `.metadata`
  block's `title`/`description` plus page content) that **do not exist** in the raw
  source at all. This means `resolveTemplateFromHtml` and `extractMetadataFields`
  must read the `.metadata` block, not `<head>` — and, critically, **both the
  current page and the reference document must be read via the same mechanism**
  (both source, or both preview) or the metadata diff becomes meaningless: a
  source-fetched page's handful of author-entered keys compared against a
  preview-fetched page's dozen synthesized keys would report nearly everything as
  "Missing" every time, regardless of the page's actual content.
- **Raw source also contains structural pseudo-blocks that must be filtered out of
  block extraction.** `<div class="section-metadata">` (a section's style directive)
  and `<div class="metadata">` (the page metadata block itself) both match the same
  "direct child of a section `<div>`, has a class" shape as a real content block —
  confirmed directly in the same raw-source fetch above, where `section-metadata`
  appears as a sibling of real blocks like `columns`/`hero`. Both get consumed and
  removed by the rendering pipeline (confirmed: 0 occurrences of `class="metadata"`
  in the same document's `.aem.page` preview), so a source-fetched page would report
  both as spurious "Added" findings unless explicitly excluded.
- Block structure (real content blocks, once the above two names are excluded) is
  otherwise identifiable straight from raw fetched HTML, without executing any JS:
  authored EDS markup already has each block as a `<div>` whose class is the block
  name (e.g. `<div class="hero landing">` → block name `hero`), as a direct child of
  a section `<div>` under `<main>`. Confirmed the class list matches between a
  document's raw source and its preview render once `section-metadata`/`metadata`
  are excluded.
- The DA App SDK (`https://da.live/nx/utils/sdk.js`, read directly for this design)
  exposes `actions`: `daFetch`, `sendText`, `sendHTML`, `setHref`, `setHash`,
  `closeLibrary`, `getSelection`, `setPrompt`, `showPanel` — no action reads the
  current document's in-progress (unsaved) content, which is why this design reads
  from DA's saved source rather than needing such an action. `context` is whatever
  the DA parent app posts as `e.data`; `tools/fragments/fragments.js` only reads
  `context.org`/`context.repo`/`context.ref`. **`context.path` is confirmed present**
  — verified directly inside the real DA editor via a temporary debug log: for a
  document open at `/index-copy`, `context` was
  `{ org: "adobedrago", repo: "kp-hw", path: "/index-copy", ref: "main", view: "canvas" }`.
  `context.ref` is no longer used by this design at all (DA source has no branch/ref
  concept — `content.da.live/{org}/{repo}{path}` always serves the current saved
  content), so only `org`, `repo`, `path`, and the SDK's `token` are read.
- Library plugins register the same way as Fragments — a row in the **library** tab
  of the site's DA config sheet (`https://da.live/config#/adobedrago/kp-hw/`) with
  `title`, `path`, `icon`, `format`. This is what surfaces the plugin in DA's Library
  panel (the "right column" the panel opens in).

## Goals

- Author opens the Library panel while editing a DA doc, picks the "Template
  Governance" tab.
- Panel reads the current page's declared template name from
  `<meta name="template">`.
- Panel looks that name up (case-insensitively) in `docs/library/templates.json`,
  fetches the matching reference document, and extracts its block names and metadata
  fields.
- Reports **Missing** — blocks/metadata present in the reference template but absent
  from the current page. This is the actionable governance signal (a required section
  got deleted, standard metadata never got set, etc.).
- Reports **Added** — blocks/metadata present in the current page but not part of the
  base template — shown for context, **not styled as a violation**. A template is a
  starting point; real pages are expected to add content beyond it, so flagging every
  addition as a problem would be constant noise. (See Non-goals/rationale below.)
- Works against whatever site/org/repo the plugin is registered on (read from SDK
  context, not hardcoded) for the current page; follows `templates.json`'s own
  `value` URL for the reference document, whatever site it points to.

## Non-goals

- **No remediation actions.** Read-only report, no `sendHTML`/`sendText` calls.
- **No statistical sampling / peer-page crawling.** Superseded by this revision —
  there's a single authoritative reference per template now, so there's nothing to
  infer.
- **No treatment of "Added" as a failure.** Explicit rationale: `templates.json`
  entries are starting layouts for new pages, not exhaustive schemas. A real
  `Homepage`-templated page is expected to have far more content than the bare
  template. Only "Missing" is a governance concern in this version.
- **No block-order or heading-structure checking.** Presence/absence only.
- **No cross-template rules** (e.g. "articles must link to a hub page").
- **No fix to the `templates.json` cross-site URL situation** — noted above, not
  addressed here.
- **No change to the existing `<meta name="template">` + `templates/<name>/{css,js}`
  CSS/JS-loading convention**, and no attempt to reconcile it with `templates.json`
  beyond reading the same meta tag value.
- **No change to `blocks/fragment/fragment.js` or any existing template/block code.**

## Architecture

```
DA editor (Library panel, same surface Fragments uses)
        │  postMessage (DA App SDK)
        ▼
tools/template-governance/template-governance.html ──imports──▶ template-governance.js
                                                                       │
                                                    DA_SDK → { context, token }
                                                                       │
                    1. Fetch current page's own DA source
                       (buildSourceUrl(context.path, org, repo), Bearer token)
                       → resolve template name from its .metadata block
                                                                       │
                    2. Fetch this site's docs/library/templates.json
                       (buildSourceUrl('/docs/library/templates.json', org, repo), Bearer token)
                       → find entry whose key matches the template name
                         (case-insensitive)
                                                                       │
                    3. Validate the matched entry's `value` URL is a real
                       content.da.live URL (parseContentDaUrl), then fetch it
                       directly (Bearer token) — it may name a different org/repo
                                                                       │
                    4. Extract block-name set + metadata-field set from both the
                       current page's HTML and the reference document's HTML
                       (raw-markup class names, .metadata block key/value rows —
                       no JS execution, structural pseudo-blocks excluded)
                                                                       │
                    5. Diff: missing = reference − current, added = current − reference
                                                                       │
                    6. Render Missing (actionable) / Added (informational) lists
```

### Files

- New: `tools/template-governance/template-governance.html` — same shape as
  `tools/fragments/fragments.html` (DA SDK script tag + module script tag).
- New: `tools/template-governance/template-governance.js` — DA SDK glue + Lit
  component (`<template-governance-report>`), mirroring `fragments.js`'s structure
  (`connectedCallback` kicks off the pipeline, `_status` state machine for
  loading/no-template/no-reference/error/ready, request-token guard against
  out-of-order async work). Reads `context.org`/`context.repo`/`context.path` and
  `token` from the DA SDK — no `context.ref` (source fetches have no ref concept).
- New: `tools/template-governance/template-governance.css` — panel styles, reusing
  the `.status-container` loading/empty/error convention from `fragments.css`, plus a
  modifier per finding-list section so "Missing" (actionable) and "Added"
  (informational) read as visually distinct.
- New: `tools/template-governance/template-governance-utils.js` — pure, unit-tested
  helpers: template-name resolution and metadata-field extraction (both from the
  `.metadata` block), DA source-URL building, `content.da.live` URL parsing,
  template-entry lookup, raw-HTML block-name extraction (excluding structural
  pseudo-blocks), and the diff itself. Mirrors the `fragment-utils.js` split so the
  core logic is testable without mocking DOM/fetch/SDK.

## Data flow / behavior

1. **Resolve current page's template.** Fetch the current page's own DA source
   (`buildSourceUrl(context.path, org, repo)`, with an `Authorization: Bearer
   {token}` header) and read the template name from its `.metadata` block (the row
   whose key is `template`, case-insensitively). If there's no `.metadata` block or
   no `template` row, render the "no template declared" state and stop.
2. **Look up the reference entry.** Fetch
   `buildSourceUrl('/docs/library/templates.json', org, repo)` (same auth), parse its
   `data` array (`{ key, value }` rows), and find the row whose `key` matches the
   resolved template name case-insensitively. If none matches, render a "no
   reference for this template" state and stop (distinct from "no template
   declared").
3. **Fetch the reference document.** The matched row's `value` is already a
   `https://content.da.live/{org}/{repo}{path}` URL — validate it with
   `parseContentDaUrl` (returns `null` for a malformed/unexpected URL, in which case
   render "no reference for this template" rather than attempt the fetch), then
   fetch that URL directly with the same auth header. No URL reconstruction needed —
   `entry.value` is already the exact resource to fetch, which may name a different
   org/repo than the page being edited.
4. **Extract.** From both the current page's HTML and the reference document's HTML,
   extract:
   - **Block names** — the class name of each direct-child `<div>` of a section
     `<div>` under `<main>` in the raw (undecorated) markup, deduplicated, excluding
     the structural pseudo-block names `section-metadata` and `metadata` (both are
     authoring directives consumed by the rendering pipeline, never real content).
   - **Metadata fields** — the key (first cell) of each row in the `.metadata` block,
     deduplicated. (Not `<head>` — raw DA source has no `<head>`.)
5. **Diff.** `missing` = reference's set minus current page's set (per block names
   and metadata fields, computed separately then combined for display).
   `added` = current page's set minus reference's set.
6. **Render.** Header shows the resolved template name. Two sections: **Missing**
   (styled as the actionable list) and **Added** (styled neutrally — informational,
   not a warning). Each empty list renders "None" text rather than an empty `<ul>`.
   A "Recheck" button re-runs the whole pipeline (no cache to invalidate — both
   fetches are cheap, so there's no need for the `sessionStorage` caching the
   sampling-based design required).
7. Every async stage is guarded by an incrementing request token — the same
   out-of-order-response guard `fragments.js` already uses.

## States / error handling

- **Loading** — shown while resolving the template and fetching the reference doc;
  reuses the `.status-container` convention.
- **No template declared** — neutral state: "This page doesn't declare a template —
  nothing to check."
- **No reference for this template** — neutral state: "Template '<name>' isn't in
  this site's template library — can't compare against it." (Distinct from "no
  template declared" — this means a name was declared, just not a recognized one.)
- **Error** — network failure fetching the current page, `templates.json`, or the
  reference document renders an error message with a Retry button.
- All rendered names (block names, metadata field names, template name) go through
  Lit's default text interpolation (HTML-escaped) — no `innerHTML` used for any
  fetched/derived string.

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

- **`context.path` availability — resolved.** Confirmed present during manual
  verification (see Background above); no longer an open risk.
- **DA source freshness — improved, not just accepted.** Reading from
  `content.da.live` rather than `.aem.page` preview means the report reflects the
  last-*saved* state rather than the last-*previewed* state — strictly fresher than
  the original design, and removes the "must preview first" limitation entirely.
  There is still no way to read literally unsaved keystrokes mid-edit (no SDK action
  exposes that), which remains an accepted limitation.
- **Metadata-block extraction assumes DA's standard 2-column table shape.** Every
  `.metadata` row is assumed to be `<div><div>…key…</div><div>…value…</div></div>` —
  confirmed against a real fetched document, and this is DA's universal block-table
  convention (the same shape `section-metadata` and every other authored block use),
  not something specific to this project.
- **The structural-pseudo-block denylist (`section-metadata`, `metadata`) is a
  fixed, hardcoded list, not derived.** If DA introduces another block-like
  authoring directive with the same "consumed during rendering" behavior in the
  future, it would need to be added to this list manually — not a concern for the
  two directives that exist today, but worth knowing this isn't self-updating.
- **`templates.json` growth/maintenance is outside this plugin's control.** As more
  templates are added to the library (or the cross-site URL situation noted above
  gets fixed), the plugin picks them up automatically — no code change needed — but
  if a template's reference document is deleted or moved without updating
  `templates.json`, the plugin will show the "Error" state.

## Testing / verification plan

- Unit tests for `template-governance-utils.js` (template-name resolution and
  metadata-field extraction from a `.metadata` block, DA source-URL building,
  `content.da.live` URL parsing, template-entry lookup, raw-HTML block-name
  extraction including the structural-pseudo-block exclusion, and the diff
  function) — pure functions, no DOM/fetch/SDK mocking, mirroring
  `test/tools/fragments/fragment-utils.test.js`.
- No automated test for `template-governance.js` itself (DOM + `fetch` + DA SDK
  `postMessage` wiring) — consistent with every other `tools/*` DA app in this repo.
- Manual verification (performed live against the real DA editor and real content
  during this task): tag a test page with a `template` metadata row matching
  `Homepage` (or `Support`), confirm the panel finds the matching reference
  document without requiring a prior Preview, confirm Missing/Added lists match a
  manual comparison against the fetched reference HTML, confirm the no-template and
  no-reference states render correctly for pages without/with-an-unrecognized
  template value, confirm Recheck re-runs the pipeline.
