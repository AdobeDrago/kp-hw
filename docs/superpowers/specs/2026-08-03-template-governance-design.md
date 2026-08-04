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
- **(v2)** Reflects the template's actual **section structure** — not just a flat
  block list — including a section's style (from its `section-metadata`), and
  handles block types that repeat across multiple sections (e.g. `columns`, `hero`)
  with count-aware "N of M present" reporting rather than a misleading binary per
  occurrence. See the "v2" section below.
- **(v2)** Lets the author **add a missing block directly from the panel**, pulled
  from the reference document's own markup. This reverses the original read-only
  decision — see Non-goals below and the v2 section for the full design.
- **(v2)** Refreshes automatically while the panel is open, without a manual click,
  polling on an interval. See the v2 section below.

## Non-goals

- ~~**No remediation actions.** Read-only report, no `sendHTML`/`sendText` calls.~~
  **Superseded in v2** — see below. The panel now calls `actions.sendHTML` for the
  "Add" action. Explicit, deliberate reversal of the original decision, made by the
  user after seeing the anatomy-view prototype.
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

## v2: Section-aware anatomy, add-to-page action, and auto-refresh

Built after the original (v1) read-only Missing/Added report was implemented,
reviewed, and manually verified end-to-end. Approved through a round of visual
prototypes (three layout options compared, then a hybrid of two, then corrected
against the real `Homepage` template's actual 11-section structure, then recolored
to Adobe Spectrum 2's official tokens). Supersedes v1's flat block-name diff with a
richer model; the metadata diff (title/template/description keys) is unchanged from
v1 — only block-level analysis changes.

### Why the flat block-name model wasn't enough

The real `Homepage` template document has **11 sections**, and several block types
repeat across multiple sections: `hero` appears twice (section 1, with a `landing`
style variant, and section 7, plain), and `columns` appears **four** times (sections
2, 5, 6, 8 — two of them using the `columns align-vertically` variant, which
collapses to the same base block name `columns` since block identity is the first
class token only). A flat "is this block name present anywhere on the page"
check — v1's model — can't distinguish "the page has all 4 `columns` sections the
template wants" from "the page has just 1 of the 4 `columns` the template wants":
both look identical to a presence-only diff. Confirmed by parsing the real reference
document directly (see the section list in the Data flow section below).

### Data model: sections with counts, not a flat set

Block extraction changes from a flat, deduplicated `string[]` to an ordered list of
sections, each carrying its style (if any) and its (non-deduplicated) block names in
document order:

```
extractSections(html): Array<{ style: string | null, blocks: string[] }>
```

- One entry per direct-child `<div>` of `<main>` (a "section").
- `style` comes from that section's own `section-metadata` child block's `style`
  row, or `null` if the section has none.
- `blocks` is every OTHER direct-child `<div>` with a class, in document order,
  using the same first-class-token naming as before, still excluding the structural
  pseudo-block names `section-metadata`/`metadata` — but now **not deduplicated**,
  and **not flattened across sections** — e.g. the real `Homepage` template's
  section 10 (three side-by-side `card` blocks) yields `blocks: ['card', 'card',
  'card']` for that one section.

From this, block-type counts are just a sum:

```
countBlockOccurrences(sections): Record<string, number>
```

### Diffing with counts: sequential allocation, reversed from the original design

**Original design (v2, first cut):** block types that repeat in the reference would
get a shared *aggregate* status shown identically at every section slot they
occupy — `X of Y present`, colored `missing`/`partial`/`present` by whether `X` was
zero, partial, or fully met. The explicit rationale at the time: a naive
"allocate the page's instances to reference sections in document order, one-by-one"
approach would report specific section slots as definitively satisfied/missing based
on an arbitrary allocation order (which of the page's two `columns` sections is "the
one" satisfying reference section 2 vs. section 5? There's no way to know for
certain), which reads as false precision.

**Reversed after live use.** The user tried the aggregate version in the real DA
editor and found it unhelpful in practice — seeing the same `columns · 3 of 4` badge
repeated at four different section positions doesn't tell you *where* to look; it
reads as noise, not signal. Explicit direction: switch to definitive per-slot
present/missing, even though it means an allocation choice that's arbitrary in a true
tie. Practical clarity ("here's likely where you're short a `columns` section") beats
technical precision about which specific tie-broken slot is "the" gap.

**Current design:** walk the reference's sections in document order, maintaining a
running "remaining available" count per block name (initialized from the current
page's counts). For each block slot in the reference:

- If the running count for that name is `> 0`, mark this slot `present` and
  decrement the count (this instance is "used up" by this slot).
- Otherwise mark this slot `missing`.

This is first-come-first-served in template order — earlier sections in the
reference "claim" the page's existing instances first, so any shortfall surfaces at
the *later* occurrences of a repeated type. There is no `partial` status anymore —
every slot is a clean binary.

```
computeSectionStatuses(referenceSections, currentCounts):
  Array<{ style: string|null, blocks: Array<{
    name: string,
    status: 'present' | 'missing',
  }> }>
```

- `status = 'present'` → render as a plain block chip (no badge) — same treatment
  regardless of whether the block type repeats elsewhere in the reference.
- `status = 'missing'` → dashed red card + an "Add" button. Since `partial` no
  longer exists as a status, **every** missing slot gets an Add button now
  (including repeated-type slots) — the earlier v2 Non-goal withholding Add from
  `partial` blocks no longer applies, since there's no `partial` state to withhold
  it from.

**Added** blocks (present on the page, absent from the reference by name entirely)
are computed and shown exactly as in v1 — unchanged, still informational/neutral,
still not itemized as "beyond quota" for a block type the reference names but at a
higher count than needed (out of scope — see Non-goals).

### UI: section-grouped anatomy view — reoriented around the page, not the template

**Reversed after live use.** The first cut of this view was built by walking the
*reference template's* sections, in template order, and checking each against the
current page. The user tried this and asked for it flipped: **the anatomy should
reflect the page it sits next to** — its own real sections, in its own real order —
**and separately show what the template expects that's missing**, rather than
presenting the template's shape with the page's content checked off against it.
Clarified via a follow-up: when the page has fewer sections than the template,
represent the shortfall as trailing "missing" cards appended after the page's real
sections, not folded into a single summary line.

Current structure:

1. A **completeness bar** at the top — unchanged: one segment per expected block
   *instance* (not per unique name), colored neutral gray if present, green
   (`#079355`, Spectrum 2's positive token) if a segment is fully accounted for, red
   if missing. A one-line summary below it: "`X` of `Y` expected block instances
   present."
2. **One card per the current page's own actual section** (`currentSections`, from
   `extractSections(currentHtml)` — the page's real order, real content), each
   showing:
   - a default-content chip (Spectrum 2 informative `#4B75FF`/`#E5F0FE`) when that
     section has content outside any block — same as before, just now describing
     the page's own section directly rather than a reference-paired one (no more
     positional-index pairing needed for this — the data is already the page's own).
   - plain block-name chips for every block actually in that section — no
     present/missing coloring here, since every block listed *is* on the page; there
     is nothing to flag within a real section.
3. **Trailing "Missing from template" cards**, appended after the page's own
   sections, one per reference-template section that still has at least one unmet
   block after the same sequential (first-come-first-served) allocation described
   below — i.e. `computeSectionStatuses`'s existing output, filtered down to only
   the entries with at least one `'missing'` status. These reuse the original
   present/missing chip treatment (including the Add button on `missing` chips) so
   an author can still add straight from this list; they do **not** show a
   default-content chip (there's no current-page section to describe — by
   definition, these are things the page doesn't have).

**Card labels: no numeric index — a real name, or nothing.** Both card types
originally showed a sequential number (`1`, `2`, `3`...) ahead of the section's
style, if any. The user flagged this as actively misleading on the "Missing from
template" cards specifically: the numbers there don't correspond to any real
section — they're just this filtered list's own count — and reading "1", "2", "3"
invites the (wrong) inference "this is missing from section 1/2/3 of your page" or
"of the template." Fixed by dropping the numeric index everywhere (both card types,
for consistency): the label now shows the section's own `style` value when one
exists (e.g. `pale-blue`), and renders no label at all when it doesn't — never a
fabricated identifier. In practice, most of the real `Homepage` template's sections
have no style set, so many "Missing from template" cards now show no label above
their block chip at all, which is honest: there is no name to give them.
4. A final "Beyond the template" strip listing Added blocks, styled the same
   neutral way as before — unchanged, kept for the same reason as always: a block
   type the reference never names at all is still worth naming as "beyond it,"
   separately from the per-section view.

Colors are Adobe Spectrum 2's official semantic tokens (pulled directly from the
`@adobe/spectrum-tokens` npm package, not approximated) — light theme:

| State | Border/text | Background | Spectrum token (resolved) |
|---|---|---|---|
| Missing | `#D73220` | `#FFEBE8` | `negative-border-color-default` / `negative-subtle-background-color-default` |
| Partial | `#D45B00` | `#FFECCF` | `icon-color-notice` / `notice-subtle-background-color-default` |
| Neutral chrome | `#717171` text, `#E9E9E9` border | `#F3F3F3` | gray scale |

### Default-content indicator (the page's actual structure) — v1 removed, v2 merged in

**v1 (a separate "Your page's actual structure" strip, above the reference-comparison
cards) was built, then removed** — the user tried it live and asked for it to be
removed, no specific reason recorded. Reverted cleanly via `git revert`.

**v2, built right after: the same underlying data (`extractSections`'s
`defaultContent` field), but merged directly into the reference-comparison anatomy
cards** rather than shown as a separate parallel view — explicit user direction
after clarifying that the *separate strip* was the part they didn't want, not the
underlying information. At the time, this needed a positional-pairing heuristic
(`computeSectionStatuses`'s optional third `currentSections` parameter, matching
by original pre-filter index) since the cards were still reference-section-shaped.

**v3, superseded by the page-orientation reversal above:** now that the primary
anatomy cards *are* the current page's own sections directly (`currentSections`,
not reference-derived), the positional-pairing heuristic is no longer needed —
`extractSections`'s `defaultContent` field is read straight off each real page
section, no matching required, no more risk of misattribution.
`computeSectionStatuses`'s third parameter and `defaultContent` output were removed
again — it reverted to its Task-9 two-argument, `{style, blocks}`-only form,
since the trailing "Missing from template" cards (built from its output) don't
describe an existing page section and have nothing to pair.

- `extractSections` still has the `defaultContent: string[]` field (unchanged) —
  the deduplicated, document-order list of lowercase tag names for
  section-direct-child elements that have no class (not a block, not
  `section-metadata`/`metadata`).
- Rendered inside each **page-oriented** anatomy card, above that section's block
  list: a full-width chip (reusing `.block-chip`'s shape) listing the section's
  default-content tags, colored with Spectrum 2's official "informative" token:
  `#4B75FF` border/text on `#E5F0FE` background (`icon-color-informative` /
  `informative-subtle-background-color-default`, resolved from
  `@adobe/spectrum-tokens`, same source as the other status colors).
- Not shown on the trailing "Missing from template" cards — those describe
  template sections the page doesn't have a counterpart for, so there's no page
  content to report.
- This is purely descriptive — default content isn't a violation or a gap to fill
  (a section can legitimately be "just a paragraph," e.g. an article's intro); it's
  informational, styled distinctly from the missing/partial states for exactly that
  reason (informative blue, not negative red or notice orange).

### Add-to-page action

Clicking "Add" on a `missing` block:

1. Extracts that block's exact markup from the **already-fetched reference
   document's HTML** — `findReferenceBlockHtml(referenceHtml, blockName): string |
   null` locates the first section-level block `<div>` whose name matches and
   returns its `outerHTML`.
2. **Converts that div-shaped block markup into a `<table>`** —
   `buildBlockTableHtml(blockOuterHtml): string | null`. See "Why a table, not a
   div" below; this step was missing from the first implementation and is required
   for `sendHTML` to actually produce a real, editable block.
3. Calls `actions.sendHTML(tableHtml)` — the same DA SDK action Fragments uses to
   insert content, sending the reference's real content (images, copy, structure and
   all), not an empty block skeleton.
4. **Does not call `actions.closeLibrary()`** afterward, unlike Fragments — this
   panel is a persistent monitor an author may add several missing pieces from in a
   row, so it stays open.
5. Shows a transient "Adding…" state on that item, then schedules an out-of-cycle
   recheck ~2.5s later (independent of the regular poll interval) to give DA's
   autosave time to land before re-fetching — since, per the "DA source freshness"
   risk above, the panel's view of the current page is only as fresh as the last
   save, adding a block doesn't appear until that save completes.
6. Multiple "Add" clicks on *different* missing blocks can be in flight at once —
   `_pendingAdd` is a `Set` of block names, not a single value, so adding one block
   doesn't block adding another while the first is still settling. (Fixed after the
   first implementation used a single-value guard that silently no-op'd a second
   block's Add click with no feedback — caught in task review.)

**Why a table, not a div — a real gap found via live testing, not a preference.**
The first implementation sent `findReferenceBlockHtml`'s div-shaped output directly
to `sendHTML`. The user reported it "adds the content but does not add the block
table" — confirmed by reading DA's actual editor source (`adobe/da-live`):

- `blocks/edit/da-library/da-library.js`'s `sendHTML` handler parses the sent HTML
  with a **generic** ProseMirror `DOMParser` against `window.view.state.schema` —
  the same schema used everywhere in the editor, whose node types (`paragraph`,
  `table`, `image`, `heading`, etc., defined in the vendored `da-parser` package)
  each have their own `parseDOM` tag-matching rules. **None of them match
  `div[class]`.** A `<div class="columns">` sent this way has no recognized parse
  rule, so ProseMirror falls through to generic handling: content *inside* the div
  (paragraphs, images) still parses fine, but the div itself — the only thing that
  says "this is a `columns` block" — is discarded.
- The div-shaped block markup only ever gets turned into an editable
  table in the canvas via a **different, much larger** function,
  `aem2doc` (in `deps/da-parser`), which runs when DA loads an entire document for
  editing. It walks `<main>`'s section divs looking for classed child divs and
  converts each one to a `<table>` via a helper (`H` in the minified source) — this
  is the reverse of the save-time `prose2aem.js`'s `convertBlocks()`, which turns a
  `.tableWrapper > table` back into the stored `<div class="blockname">` form.
  `sendHTML`'s handler does not call `aem2doc` — it's a one-off content insert, not
  a document load.
- So: to make `sendHTML` produce a real, editable, round-trippable block, the panel
  must do the div→table conversion itself before sending — i.e. reconstruct
  what `convertBlocks()` expects to find, matching its exact shape: first row is a
  single cell containing the block's class names as text (first class, plus any
  remaining classes joined `", "` in parens — e.g. `columns (two-up)`), followed by
  one row per block "row" div, one cell per "cell" div within each row (a cell's
  *inner* HTML becomes the `<td>`'s content, not the cell div itself).

```
buildBlockTableHtml(blockOuterHtml: string): string | null
```

**Insertion position: confirmed mechanism, not an unsolved limitation.** Read
directly from DA's actual editor source
(`adobe/da-live`, `blocks/edit/da-library/da-library.js`):

```js
if (e.data.action === 'sendHTML') {
  const dom = new DOMParser().parseFromString(e.data.details, 'text/html');
  const parsed = proseDOMParser.fromSchema(window.view.state.schema).parse(dom.body);
  const slice = new Slice(parsed.content, 0, 0);
  const { from, to } = window.view.state.selection;
  window.view.dispatch(window.view.state.tr.replaceRange(from, to, slice));
}
```

`sendHTML` inserts at `window.view.state.selection` — the main document editor's
current cursor/selection, a real ProseMirror concept, not an opaque black box. If the
author never clicks into the document body before clicking "Add," the selection
defaults to the very start of the document, which is why an early manual test showed
content landing at the top of the page — not a hard SDK limitation, just cursor
placement the author controls. The panel now shows a hint line ("Click where you want
new content in the page, then use + to add it there.") between the completeness bar
and the anatomy section to make this discoverable, since nothing about DA's Library
panel UI otherwise suggests the insertion point is driven by the *other* iframe's
(the main editor's) cursor state.

### Auto-refresh (polling)

Confirmed there is no push/event mechanism for this: the DA App SDK's action set
(`daFetch`, `sendText`, `sendHTML`, `setHref`, `setHash`, `closeLibrary`,
`getSelection`, `setPrompt`, `showPanel`) has nothing like an `onChange` or document
subscription — read directly from `sdk.js`'s source. So "auto-refresh" means polling:

- Every **3 seconds** while the panel is open and the tab is visible, silently
  re-run the fetch-and-diff pipeline. (Started at 8s; shortened after the user
  tried it live and asked for a faster cadence.)
- Pause the interval on `document.visibilitychange` when hidden; resume (and poll
  once immediately) when visible again — avoids wasted requests while the DA tab
  isn't in focus.
- A poll tick that succeeds and produces a **different** report than what's
  currently shown updates the UI; a poll tick that produces the **same** report is a
  no-op (no re-render, no flicker, especially important since the author may be
  mid-read of the list).
- A poll tick that **fails** (network blip) is silently swallowed and retried next
  tick — it must never overwrite a good, currently-displayed report with an error
  state. Only the *initial* load and an explicit manual "Recheck" click surface
  errors.
- The manual "Recheck" button from v1 is kept, for an immediate check without
  waiting for the next tick (e.g. right after the author makes an edit themselves).

### v2 Non-goals

- **No UI control over where `sendHTML` inserts content** — it always lands at the
  main editor's current cursor/selection (confirmed mechanism, see the Add-to-page
  action section above), which the panel can only hint at via UI copy, not dictate.
- **The sequential allocation is arbitrary when the current page's instances of a
  repeated block type could equally satisfy multiple reference slots** — e.g. if the
  reference wants `columns` in sections 2, 5, 6, and 8, and the page has exactly 2,
  they're assigned to sections 2 and 5 (document order, first-come-first-served),
  not necessarily because those are "actually" the ones the author intended to keep.
  Explicit, accepted tradeoff per the reversal above — practical clarity over
  technical certainty.
- **No handling of "added beyond quota" for a known block type** (e.g. reference
  wants 2 `columns`, page has 5) — the extra 3 are not itemized separately from a
  true "Added" (unknown-to-the-template) block; out of scope for this version.
- **No literal real-time reflection of unsaved keystrokes** — polling reads DA's
  saved source, same staleness characteristic as v1, just refreshed automatically
  instead of only on manual Recheck.
- **No reordering/removal UI** for Added blocks — still purely informational, as in
  v1.

## Testing / verification plan

- Unit tests for `template-governance-utils.js` (template-name resolution and
  metadata-field extraction from a `.metadata` block, DA source-URL building,
  `content.da.live` URL parsing, template-entry lookup, raw-HTML block-name
  extraction including the structural-pseudo-block exclusion, and the diff
  function) — pure functions, no DOM/fetch/SDK mocking, mirroring
  `test/tools/fragments/fragment-utils.test.js`.
- Unit tests (v2) for `extractSections`, `countBlockOccurrences`,
  `computeSectionStatuses` (single-occurrence present/missing, repeat-type
  present/partial/missing, the "not rendered" case for a block-less section), and
  `findReferenceBlockHtml` — same pure-function, no-mocking approach.
- No automated test for `template-governance.js` itself (DOM + `fetch` + DA SDK
  `postMessage` wiring, plus now `setInterval`/`visibilitychange` for polling) —
  consistent with every other `tools/*` DA app in this repo.
- Manual verification (performed live against the real DA editor and real content
  during this task): tag a test page with a `template` metadata row matching
  `Homepage` (or `Support`), confirm the panel finds the matching reference
  document without requiring a prior Preview, confirm Missing/Added lists match a
  manual comparison against the fetched reference HTML, confirm the no-template and
  no-reference states render correctly for pages without/with-an-unrecognized
  template value, confirm Recheck re-runs the pipeline.
- Manual verification (v2, against the real `Homepage` template and a real test
  page): confirm the anatomy view renders all real content-bearing sections in the
  correct order with the correct style labels; confirm single-occurrence blocks show
  clean present/missing; confirm repeat-type blocks (`hero`, `columns`) show the
  matching "X of Y" badge at every section slot they occupy, colored correctly for
  missing (0), partial (some), and satisfied (all); click "Add" on a missing block
  and confirm the reference's real markup lands in the document (via DA's own
  editor, since this plugin cannot verify document state itself) and the panel's
  transient/recheck behavior fires; confirm polling picks up an edit made directly
  in the DA editor within one interval without clicking Recheck; confirm polling
  pauses when the browser tab is hidden and resumes on return.
