# Secondary Site Migration Guide

A guide for migrating a Kaiser Permanente secondary sales site into AEM Edge Delivery Services using the Experience Modernization Agent (EMA).

---

## Before you start

Complete these steps once per new employer site, before running EMA:

**1. Create and configure the fork**
- Fork this repository (`AdobeDrago/ak-kaiserpermanente`) into a new GitHub repo named `kp-{employer}`
  - Example: `https://github.com/{org}/kp-google`
- DA automatically creates a workspace that mirrors the forked repo:
  - Example: `https://da.live/#/{org}/kp-google`
- Set up the `.page` / `.live` preview and publish environments

**2. Update the footer**

In the forked repo's `blocks/footer/footer.js`, change `FOOTER_PATH` to load the shared footer from the template site:

```js
// Change this:
const FOOTER_PATH = '/fragments/nav/footer';

// To this:
const FOOTER_PATH = 'https://main--ak-kaiserpermanente--adobedrago.aem.page/fragments/nav/footer';
```

This is done once per fork. Skip this step if it has already been done.

**3. Have the source URL ready**

You need the root URL of the secondary site to migrate.

**Example:** `https://choose.kaiserpermanente.org/google`

---

## How to run EMA

Go to the [Experience Modernization Agent](https://aemcoder.adobe.io/) and type:

```
Migrate https://choose.kaiserpermanente.org/[employer] to AEM
```

EMA will run each step and pause to show you its output before moving on. Review what EMA produces at each pause and type **"continue"** (or correct any issues) to proceed.

---

## What EMA does

EMA runs five steps in sequence:

### Step 1 — Discover pages
EMA fetches the source site homepage and extracts:
- Every page in the site (from the navigation)
- The full nav structure (utility bar, logos, primary links)

**EMA pauses here.** Review the page inventory and nav manifest. Confirm all pages are found before proceeding.

### Step 2 — Extract content
For each page, EMA reads the HTML and captures every section in plain language — all headings, body text, images, links, phone numbers, and legal copy, exactly as written. Nothing is summarised or skipped.

**EMA pauses here.** Review the content manifest for any pages that look wrong or incomplete.

### Step 3 — Map to blocks
EMA assigns the correct AEM block and section style to every section on every page, using the block library defined in this repository. EMA references block screenshots to resolve ambiguous layouts.

**EMA pauses here.** Review the mapping plan. This is the best point to catch incorrect block assignments before HTML is generated.

### Step 4 — Generate HTML
EMA produces one DA-ready HTML file per page, plus one `nav.html` for the site header. All content from the manifest is included — a partial migration is never acceptable.

### Step 5 — Migration summary
EMA produces a full report: pages migrated, blocks used, and a checklist of items to review before publishing.

---

## What EMA produces

### Files

Files upload directly to the root of the DA workspace for the forked repo — there is no employer subfolder. The workspace itself is the employer's site.

| File | DA upload path |
|---|---|
| `nav.html` | `/fragments/nav/header` |
| `index.html` | `/index` |
| `plans.html` | `/plans` |
| `getting-care.html` | `/getting-care` |
| *(one file per page)* | `/[page-name]` |

### Migration summary

The summary includes:
- Total pages, sections, and block usage counts
- A checklist of every item that needs human review before publishing

---

## What EMA will NOT do

- **Push to DA or GitHub** — EMA produces files; uploading is a manual step
- **Create new blocks** — only blocks already in this repository are used
- **Edit CSS or JavaScript** — code changes are out of scope
- **Translate or rewrite content** — all content is migrated exactly as it appears on the source site
- **Replace images** — images remain on the source CDN until you upload them to DA and update the URLs

---

## Uploading to DA

1. Go to your DA workspace: `https://da.live/#/{org}/kp-{employer}/`
   - Example: `https://da.live/#/adobedrago/kp-google`
2. Upload `nav.html` → `/fragments/nav/header`
3. Upload each page file to the root of the workspace:
   - `index.html` → `/index`
   - `plans.html` → `/plans`
   - `getting-care.html` → `/getting-care`
   - *(and so on for each page)*
4. Preview the site at:
   `https://main--kp-{employer}--{org}.aem.page/`
   - Example: `https://main--kp-google--adobedrago.aem.page/`

---

## Before you publish

The migration summary will flag these items for review:

| Item | What to do |
|---|---|
| **External image URLs** | Images load immediately from the source CDN. After uploading images to DA, replace source URLs with DA media URLs (`./media_[hash].[ext]`) |
| **Missing alt text** | Images with no alt text in the source were auto-filled with `alt=""`. Add descriptive alt text for accessibility. |
| **Unmigrated content** | Forms, iframes, or unsupported embeds that need manual handling. The flagged item includes the source URL. |
| **No-match sections** | Sections that didn't fit any block and were output as default content. Review whether a block should be applied. |
| **Missing employer logo** | If the nav employer logo wasn't found during scraping, a placeholder was used. Replace it with the correct image. |
