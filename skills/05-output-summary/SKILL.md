# Skill: Output Summary

**Version:** 1.0.0
**Invoked by:** `migrate-secondary-site`

---

## Purpose

After all HTML files are generated, produce a structured migration summary report.
Gives the business owner and team a clear picture of what was migrated, what blocks
were used, and what — if anything — needs manual review before DA upload.

---

## When to Use

- Final step of every secondary site migration
- After `skills/04-generate-da-html` has produced all HTML files

---

## Workflow

### Step 5a — Compile Migration Stats

From the generated HTML files, count:
- Total pages migrated
- Total sections across all pages
- Each block type and how many times it was used

---

### Step 5b — Flag Items for Review

Identify any sections or content that may need human review:
- **All external image URLs** — every image in the generated HTML still points to the source CDN (`choose.kaiserpermanente.org/content/dam/...`). These work immediately but should be replaced with DA media URLs (`./media_[hash].[ext]`) after the business owner uploads images to DA
- **Images with missing alt text** — every `alt=""` that was auto-filled because the source had no alt text
- **Malformed image URLs** — any image src that appeared broken or malformed in the source
- **Missing employer logo** — if the nav employer logo could not be found
- **Sections mapped to default content due to no block match** — list the page, section number, and a brief description of the content pattern
- **Embedded content that could not be migrated** — forms, iframes, unsupported video embeds; include the source URL
- Sections that used default content but may benefit from a block
- Employer-specific content that may need brand/legal approval
- Phone numbers, plan codes, or enrollment URLs that should be verified

---

### Step 5c — Produce the Report

Output the complete migration summary in this format:

```
# Migration Summary — [Employer Name]
Source: [source URL]
Date: [today's date]

---

## Files Generated

| # | File | Destination (DA path) | Description |
|---|------|-----------------------|-------------|
| — | nav.html | /fragments/nav/header | Site navigation |
| 1 | index.html | /[employer-name]/index | Home page |
| 2 | plans.html | /[employer-name]/plans | Plans & Benefits |
| 3 | getting-care.html | /[employer-name]/getting-care | Getting Care |
| ... | | | |

---

## Pages Migrated

| # | Page | HTML File | Sections | Blocks Used |
|---|------|-----------|----------|-------------|
| 1 | Home | index.html | 11 | hero landing, columns, columns-media, tabs, cards-icon, card ×3 |
| 2 | Plans | plans.html | 9 | hero landing, plan-compare, table ×3, accordion, table ×6 |
| 3 | Getting Care | getting-care.html | 4 | hero landing, card ×3 |
| ... | | | | |

Total pages: [N]
Total sections: [N]

---

## Block Usage Summary

| Block | Variant | Times Used |
|-------|---------|------------|
| hero | landing | [N] |
| hero | default | [N] |
| tabs | — | [N] |
| columns | default | [N] |
| columns | align-vertically | [N] |
| columns-media | — | [N] |
| cards-icon | — | [N] |
| card | default | [N] |
| accordion | — | [N] |
| icons | grid | [N] |
| plan-compare | — | [N] |
| table | striped | [N] |
| table | caption striped | [N] |

---

## Items Requiring Review

- [ ] [Description of item needing attention — page, section, reason]
- [ ] [Any image that couldn't be fetched]
- [ ] [Any content that was ambiguous]

---

## Next Steps — Uploading to DA

1. Go to: https://da.live/#/adobedrago/ak-kaiserpermanente/
2. Upload the nav file first — it lives outside the employer folder:
   - `nav.html` → `/fragments/nav/header`
3. Create a new folder for this employer: `/[employer-name]/`
4. Upload each page HTML file to its corresponding path:
   - `index.html` → `/[employer-name]/index`
   - `plans.html` → `/[employer-name]/plans`
   - `getting-care.html` → `/[employer-name]/getting-care`
   - *(and so on for each page)*
5. Preview each page at:
   `https://main--ak-kaiserpermanente--adobedrago.aem.page/[employer-name]/`
6. Review the items flagged above before publishing

---

## Fork Setup Requirement — Footer

The footer does not need to be uploaded to DA. It is loaded at runtime from the
central template site. However, this requires a one-time code change in the forked
repo's `blocks/footer/footer.js`:

```js
// Change this line:
const FOOTER_PATH = '/fragments/nav/footer';

// To this:
const FOOTER_PATH = 'https://main--ak-kaiserpermanente--adobedrago.aem.page/fragments/nav/footer';
```

This change must be made before the site goes live. It is a fork setup step —
not part of the DA content upload.

> **Localization note:** Secondary sites do not currently have non-English pages,
> so this approach works as-is (English locale prefix is `''`, so the absolute URL
> is used correctly). If Spanish or other language pages are added in the future,
> `footer.js` will need to be updated again — the current implementation prepends
> `locale.prefix` to the path, which breaks with absolute URLs. At that point,
> replace the `loadFragment` call with:
> ```js
> const FOOTER_BASE = 'https://main--ak-kaiserpermanente--adobedrago.aem.page';
> const fragment = await loadFragment(`${FOOTER_BASE}${locale.prefix}${FOOTER_PATH}`);
> ```
> This also requires the template site to have localized footer documents at
> `/es/fragments/nav/footer`, `/de/fragments/nav/footer`, etc.
```

---

## Output

The complete migration summary report.
This is the final deliverable of the migration skill pipeline.
