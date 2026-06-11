# KP Health Article Import — Steps to Follow

A repeatable runbook for importing health-article pages from
**healthy.kaiserpermanente.org** into this AEM Edge Delivery Services (EDS)
project. Follow the steps in order. Sources: [CLAUDE.md](../../CLAUDE.md) and
[import/CLAUDE.md](../../import/CLAUDE.md).

> **Current status (NCA Health & Wellness, [issue #2](https://github.com/AdobeDrago/kp-hw/issues/2)):**
> 482 of 486 articles imported, verified, and live on `*.aem.page`. The 4
> remaining (`adult-adhd`, `diabetes-classes-and-programs2`,
> `diabetes-wellness-coaching`, `diabetes-wellness-coaching1`) are auth-gated and
> need a logged-in scrape or manual authoring.

---

## Before you start (one-time setup)

1. **Get a DA token.** Log in to a [da.live](https://da.live) session, copy the
   IMS access token (browser local storage under `da.live`, or `.env.local.save`
   → `tokenValue`), and put it in `.env` as `DA_IMS_TOKEN=...`.
   - ⚠️ The token is short-lived (~24h). Refresh it before any re-run.
2. **Know the source pattern.** Articles live at
   `https://healthy.kaiserpermanente.org/northern-california/health-wellness/healtharticle.{slug}`
   and are publicly accessible (no auth) — except the 4 gated pages above.

---

## The golden rule: two HTML formats

The #1 cause of broken imports is uploading the wrong HTML format to DA.

| | **Rendered** (`.plain.html`) | **DA authoring source** (`.html`) |
|---|---|---|
| Lives in | local dev preview / what `aem.page` serves | what you upload to `admin.da.live` |
| A block is… | `<div class="block-name">` with nested div rows | a `<table>` whose first row names the block |
| Wrapper | bare section divs | `<body><header></header><main>…</main><footer></footer></body>` |

- Write the **div-nested-div** format to `*.plain.html` for local preview.
- **Convert to the table format before uploading to DA.** If you `PUT` the
  div format to DA, it flattens every block and merges your sections.

DA derives the block CSS class by lowercasing the header cell and hyphenating
spaces (`Section Metadata` → `section-metadata`). The block table's first row
must be a single full-width cell: `<td colspan="N">` (N = number of data
columns). The converters do this automatically.

---

## Step-by-step import workflow

### Step 1 — Run the import

Use the page-import skill (one page at a time):

```
/edge-delivery-services:page-import https://healthy.kaiserpermanente.org/northern-california/health-wellness/healtharticle.{slug}
```

Because all KP health articles share the same structure (**100% default
content, no blocks**), skip the authoring-analysis deliberation and go straight
to HTML generation using the structure below.

### Step 2 — Generate the `.plain.html` (rendered format)

Health articles use **two content sections plus a metadata section**. Import
**only the Main Content zone** — header and footer are EDS auto-blocks.

- **Section 1 — Article content** (`style: tags,share`): H1 → byline
  (`by {Author} | {Date}`) → hero `<picture>` → intro paragraphs → `H2` activity
  sections → ends with a `section-metadata` block.
- **Section 2 — Footnotes** (`style: footnotes`): footnote citations +
  reviewer attribution only. No tags here.
- **Section 3 — Metadata block**: `template: article`, then `tags`, `title`,
  `description` (field order matters).

Authoring rules:
- Everything is default content an author could type in Google Docs.
- **Do not use the `hero` block** — the article image sits inline, not as a banner.
- **Hero image: use the original KP CDN URL** (`content/dam/...`) in a
  `<picture>`. Do not download images locally.
- Preserve inline links (full absolute URLs), `Safety tip:` sentences (keep
  inline — don't split into a block), and footnote `<sup>` superscripts.
- **Tags go only in the Section 3 metadata block** — no inline `Tags:` paragraph.

### Step 3 — Exclude the chrome

Skip: `<header>` nav, Back/Print controls, the share widget, `<footer>`, and
cookie-consent banners.

### Step 4 — Write both output paths

| Target | Path |
|---|---|
| Local (dev preview) | `northern-california/health-wellness/healtharticle-{slug}.plain.html` |
| DA (authoring) | `northern-california/health-wellness/healtharticle-{slug}.html` |

Slug transform: take the source slug, replace the `.` separator with `-`, lowercase.

### Step 5 — Convert to DA table format + upload + verify

```
node import/upload-verify.js
```

This converts every block `<div>` to a `<table>`, wraps sections in
`<body><main>`, uploads via raw `PUT`, then **reads each file back** and retries
(up to 4×) if DA stored a flattened version despite returning 200.

- ⚠️ **Never** use a multipart/`FormData` `POST` to the source endpoint — DA
  re-parses it and flattens the HTML. Use a raw `PUT` with
  `Content-Type: text/html`.
- **No image upload needed** — DA auto-ingests the CDN `<picture>` URLs into its
  media pipeline on upload.

Single-file manual upload (if not batching):

```
curl -X PUT \
  -H "Authorization: Bearer $DA_IMS_TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @{converted-da}.html \
  "https://admin.da.live/source/adobedrago/kp-hw/northern-california/health-wellness/healtharticle-{slug}.html"
```

### Step 6 — Preview and confirm

```
curl -X POST -H "Authorization: Bearer $DA_IMS_TOKEN" \
  "https://admin.hlx.page/preview/AdobeDrago/kp-hw/main/northern-california/health-wellness/healtharticle-{slug}"
```

A correct round-trip shows `<div class="tags share">` for section 1 and
`<div class="footnotes">` for section 2, with `title`/`description` in `<head>`.

Share with the requester:
- DA edit: `https://da.live/edit#/adobedrago/kp-hw/northern-california/health-wellness/healtharticle-{slug}`
- AEM preview: `https://main--kp-hw--adobedrago.aem.page/northern-california/health-wellness/healtharticle-{slug}`

### Full re-run / extend sequence

```
node import/batch-import.js   →   node import/clean-html.js   →   node import/upload-verify.js
```

…then preview via `admin.hlx.page/preview/...`.

---

## Opening a pull request

Every PR description **must** include a testing URL:

```
URL for testing:

- <test url>
```

Use the EDS branch preview:
`https://<branch>--kp-hw--AdobeDrago.aem.page/…`. Note `aem.page` hostnames
can't contain `/`, so a branch named `claude/foo` needs a slash-free mirror
branch (e.g. `foo`) to produce a working preview URL.

---

## General EDS work — use the skills

For anything beyond health-article import, invoke the matching skill instead of
working ad hoc:

| Task | Skill |
|---|---|
| Building / modifying blocks | `edge-delivery-services:building-blocks` |
| Content-driven development | `edge-delivery-services:content-driven-development` |
| Content modeling | `edge-delivery-services:content-modeling` |
| Block inventory / collection | `edge-delivery-services:block-inventory`, `edge-delivery-services:block-collection-and-party` |
| Importing / migrating pages | `edge-delivery-services:page-import` (single); bulk skill for 2+ |
| Testing blocks | `edge-delivery-services:testing-blocks` |
| Debugging EDS issues | the EDS debugging skill |
| Docs search | `edge-delivery-services:docs-search` |

---

## Block inventory reference

These blocks exist in the project but are **not needed** for health articles:
`accordion` `cards` `carousel` `columns` `embed` `footer` `form` `fragment`
`header` `hero` `modal` `quote` `search` `table` `tabs` `video`.

If a future page needs a block (e.g. tabs or a card grid), record the decision
and rationale in [import/CLAUDE.md](../../import/CLAUDE.md).
