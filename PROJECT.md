# AK Kaiser Permanente — Project Reference

## Overview

This is the **template repository** for Kaiser Permanente secondary sales site migrations.
All secondary employer-specific sites (Google, Roblox, City of San Diego, FEHB, etc.) are
built as content variations of this single template — same blocks, same structure, different
employer-specific copy, images, and CTAs.

**EMA must read this file in full before making any authoring or migration decisions.**

---

## Key References

| Reference | URL |
|---|---|
| Template live site | https://main--ak-kaiserpermanente--adobedrago.aem.page/ |
| Template DA (authoring view) | https://da.live/#/adobedrago/ak-kaiserpermanente |
| GitHub repo | https://github.com/AdobeDrago/ak-kaiserpermanente |

---

## Template Site — Page Structure

Every secondary site mirrors this page structure. Inner page names may differ per employer.

| Page | URL | Primary Purpose |
|---|---|---|
| Homepage | `/` | Employer-specific landing page |
| Plans | `/plans` | Plan options, rates, benefits comparison |
| Retiree Plans | `/retiree-plans` | Medicare/retiree-specific plans |
| Getting Care | `/getting-care` | How to access care |
| Members | `/members-page` | New member resources, wellness rewards |
| Support | `/support` | FAQs, contact specialists |

---

## Template Site — Full Block Inventory Per Page

These are the **exact blocks, variants, and section-metadata styles** used on each page.
Use these as the authoritative mapping reference when migrating secondary sites.

### Homepage `/`

| Section Style | Block | Rows × Cols | Content |
|---|---|---|---|
| `full-width` | `hero landing` | 2 × 1 | Row 1: bg image · Row 2: H1 + body + CTA button |
| `pale-blue` | `columns` | 1 × 2 | Col 1: PSHB/employer specialist contact · Col 2: Medicare specialist contact |
| *(none)* | `columns-media` | 1 × 2 | Col 1: video URL · Col 2: heading + body |
| *(none)* | `tabs` | 2 × 2 | Row 1: tab label list · Row 2+: tab panel (heading + body + image + CTA) |
| *(none)* | `columns align-vertically` | 1 × 2 | Col 1: image · Col 2: heading + body + links |
| *(none)* | `columns` | 1 × 2 | Col 1: in-KP area care list + CTA · Col 2: out-of-KP care list + CTA |
| *(none)* | `hero` | 2 × 1 | Mid-page hero: Row 1: bg image · Row 2: H2 + body |
| *(none)* | `columns align-vertically` | 1 × 2 | Col 1: heading + body + CTA · Col 2: image |
| *(none)* | `cards-icon` | 3 × 2 | 3 rows: Location · Support · Doctors (Col 1: icon · Col 2: label + CTA) |
| *(none)* | `card` × 3 | varies | Specialty care cards (Heart · Maternity · Mental Health) |
| `footnotes` | *(default content)* | — | Legal footnote text only |

### Plans `/plans`

| Section Style | Block | Rows × Cols | Content |
|---|---|---|---|
| *(none)* | `hero landing` | 2 × 1 | Page hero |
| `pale-blue` | `plan-compare` | 3 × 3 | 3 plan columns with features |
| *(none)* | `table striped` × 3 | varies × 3 | Rates per plan (Enrollment Code · Bi-Weekly · Monthly) |
| *(none)* | `accordion` | varies × 2 | Plan documents + forms list |
| `table-grid` | `table caption striped` × 6 | varies × 4 | Summary of Benefits tables side-by-side |
| *(none)* | *(default content)* | — | Enrollment instructions |
| `pale-blue` | `columns` | 1 × 2 | Veteran Care or featured callout |
| *(none)* | `columns` | 1 × 2 | Contact specialist · Ready to enroll |
| `footnotes` | *(default content)* | — | Legal footnotes |

### Retiree Plans `/retiree-plans`

| Section Style | Block | Rows × Cols | Content |
|---|---|---|---|
| *(none)* | `hero landing` | 2 × 1 | Page hero |
| `pale-blue` | *(default content)* | — | Medicare value prop intro text |
| *(none)* | `icons grid` | rows × 2 | Medicare benefit items (Col 1: icon · Col 2: heading + body) |
| *(none)* | `columns` | 1 × 2 | Compare plans CTA · image |
| *(none)* | `accordion` | varies × 2 | Plan documents (2026 + 2025) |
| *(none)* | *(default content)* × 2 | — | PDP section text + links |
| `pale-blue` | `columns` | 1 × 2 | Seminar callout (image · heading + body + CTA) |
| *(none)* | `columns` | 1 × 2 | Contact specialist · Enroll CTA |
| `footnotes` | *(default content)* | — | Legal footnotes |

### Getting Care `/getting-care`

| Section Style | Block | Rows × Cols | Content |
|---|---|---|---|
| *(none)* | `hero landing` | 2 × 1 | Page hero |
| *(none)* | `card` × 3 | varies | Care highlight cards (image · heading · body · CTA) |
| *(none)* | *(default content)* | — | Cost estimator CTA |
| `footnotes` | *(default content)* | — | Legal footnotes |

### Members Page `/members-page`

| Section Style | Block | Rows × Cols | Content |
|---|---|---|---|
| *(none)* | `hero landing` | 2 × 1 | Page hero |
| *(none)* | `columns` | 1 × 2 | Getting started steps |
| *(none)* | `columns` | 1 × 2 | Manage care online feature |
| *(none)* | *(default content)* | — | Brochures & forms links |
| *(none)* | `icons grid` | rows × 2 | Wellness rewards items |
| *(none)* | `columns` | 1 × 2 | Program feature (image · body + CTA) |
| *(none)* | `columns` | 1 × 2 | Member resources |
| `footnotes` | *(default content)* | — | Legal footnotes |

### Support `/support`

| Section Style | Block | Rows × Cols | Content |
|---|---|---|---|
| *(none)* | `hero landing` | 2 × 1 | Page hero |
| *(none)* | *(default content)* | — | Intro text + emergency warning |
| *(none)* | `columns` | 1 × 2 | Contact cards (2 per column) |
| *(none)* | `accordion` | 5 × 2 | FAQs — Coverage & Features |
| *(none)* | `accordion` | 5 × 2 | FAQs — Getting Care |
| `footnotes` | *(default content)* | — | Legal footnotes |

---

## Block Registry

### `hero`

**When to use:** Any full-width banner section with a background image and overlaid headline + CTA.

**Variants:**
| Variant | When to use |
|---|---|
| `landing` | Homepage / primary landing pages — full-bleed image, content card floats right |
| *(default)* | All inner pages — content card floats left |
| `small` | Compact hero, 180px min-height |
| `large` | Tall hero, 720px min-height |
| `full` | Full viewport height |
| `light` | Dark text on light background |
| `dark` | Light text on dark background |
| `center` | Centered text layout |
| `quiet-background` | Blurred background image |

**DA Authoring Format:**
```
| Hero (landing) |                              |
|----------------|------------------------------|
| [bg image]     | [H1] [body text] [CTA link]  |
```

**Section-metadata pairing:**
- Homepage hero: always wrap in `style: full-width` section
- Inner page hero: no section style needed

**Template examples:**
- Homepage (landing): https://main--ak-kaiserpermanente--adobedrago.aem.page/
- Plans (default): https://main--ak-kaiserpermanente--adobedrago.aem.page/plans

---

### `tabs`

**When to use:** Multi-tab content sections where each tab has a heading, body, image, and CTA.
Used for the "Why Kaiser Permanente" section on the homepage.

**Variants:** None.

**DA Authoring Format:**
```
| Tabs |            |
|------|------------|
| [Tab 1 label] | [Tab 1: H3 + body + image + CTA] |
| [Tab 2 label] | [Tab 2: H3 + body + image + CTA] |
| [Tab 3 label] | [Tab 3: H3 + body + image + CTA] |
| [Tab 4 label] | [Tab 4: H3 + body + image + CTA] |
| [Tab 5 label] | [Tab 5: H3 + body + image + CTA] |
```

**Template example:** https://main--ak-kaiserpermanente--adobedrago.aem.page/ (Why Kaiser Permanente section)

---

### `columns`

**When to use:** Any two-column side-by-side content layout. The most common layout block.

**Variants:**
| Variant | When to use |
|---|---|
| *(default)* | Standard two-column layout |
| `align-vertically` | Vertically center both columns (use when image and text need midpoint alignment) |
| `z-pattern` | Alternating column order row by row (zigzag) |
| `image-cover` | Full-bleed image treatment |
| `gap-xs` → `gap-xxl` | Control spacing between columns |

**DA Authoring Format:**
```
| Columns |                          |
|---------|--------------------------|
| [col 1 content] | [col 2 content] |
```

**Template examples:**
- Contact section (homepage): `pale-blue` style, 2 columns
- Coverage map section (homepage): no style, 2 columns
- Veteran Care (plans): `pale-blue` style, image + text

---

### `columns-media`

**When to use:** A video embed paired with adjacent text content.

**Variants:** None.

**DA Authoring Format:**
```
| Columns Media |                        |
|---------------|------------------------|
| [video URL]   | [H2] [body text]       |
```

**Note:** Col 1 must be a raw video URL (Qumucloud, YouTube, Vimeo, or direct .mp4). The block auto-converts it to an embedded player.

**Template example:** https://main--ak-kaiserpermanente--adobedrago.aem.page/ (seamless care experience video section)

---

### `cards-icon`

**When to use:** A repeating grid of icon + label + link items. Used for the Location · Support · Doctors quick-action row.

**Variants:** None. (Layout is responsive-only — single column mobile, row on desktop.)

**DA Authoring Format:**
```
| Cards Icon |                           |
|------------|---------------------------|
| [icon img] | [label text] [CTA link]   |
| [icon img] | [label text] [CTA link]   |
| [icon img] | [label text] [CTA link]   |
```

**Template example:** https://main--ak-kaiserpermanente--adobedrago.aem.page/ (Location · Support · Doctors row)

---

### `card`

**When to use:** A single featured content card with an image, heading, body text, and CTA. Typically used in groups of 3 within one section to form a card row.

**Variants:**
| Variant | When to use |
|---|---|
| *(default)* | Standard card with shadow and border |
| `center` | Centered text alignment |
| `quiet` | No border, no shadow, no background — minimal flat card |

**DA Authoring Format (2 rows: image row + text row):**
```
| Card |
|------|
| [image] |
| [H3 heading] [body text] [CTA link] |
```

> Row 1 = image only. Row 2 = ALL text content (heading, body, CTA) together in one cell.
> Do NOT split heading, body, and CTA into separate rows.

**Note:** Author 3 `card` blocks in the same section to produce a 3-card row layout.

**Template examples:**
- Getting Care: https://main--ak-kaiserpermanente--adobedrago.aem.page/getting-care
- Specialty care row (homepage): 3 card blocks in one section

---

### `accordion`

**When to use:** Expandable/collapsible FAQ items or grouped document links.

**Variants:** None. (Only open/closed state — no authored variants.)

**DA Authoring Format:**
```
| Accordion |                          |
|-----------|--------------------------|
| [Question / label] | [Answer / body content] |
| [Question / label] | [Answer / body content] |
| [Question / label] | [Answer / body content] |
```

**Template examples:**
- Support FAQs: https://main--ak-kaiserpermanente--adobedrago.aem.page/support
- Plan documents: https://main--ak-kaiserpermanente--adobedrago.aem.page/plans

---

### `icons`

**When to use:** A repeating list of icon + text items. Used for benefit highlight lists and wellness rewards.

**Variants:**
| Variant | When to use |
|---|---|
| `grid` | 2-column responsive grid layout — items render 2-across side-by-side (centered alignment). Use when source shows items in a multi-column grid. |
| `list` | Vertical single-column list — items stack one per row (top-aligned). Use when source shows items in a single vertical column on desktop. |

**DA Authoring Format (grid):**
```
| Icons (grid) |                         |
|--------------|-------------------------|
| [icon img]   | [body text]             |
| [icon img]   | [body text]             |
| [icon img]   | [body text]             |
```

**DA Authoring Format (list):**
```
| Icons (list) |                             |
|--------------|-----------------------------|
| [icon img]   | [**Heading**] [body text]   |
| [icon img]   | [**Heading**] [body text]   |
```

**Template examples:**
- Retiree Plans (Medicare benefits): https://main--ak-kaiserpermanente--adobedrago.aem.page/retiree-plans
- Members Page (wellness rewards): https://main--ak-kaiserpermanente--adobedrago.aem.page/members-page

---

### `plan-compare`

**When to use:** Side-by-side plan option comparison. Each column is one plan; rows are feature categories.

**Variants:** None. (Column count is driven by number of plan columns authored.)

**DA Authoring Format:**
```
| Plan Compare |              |              |              |
|--------------|--------------|--------------|--------------|
| [Plan A name]| [Plan B name]| [Plan C name]|              |
| [Feature row]| [Plan A val] | [Plan B val] | [Plan C val] |
| [Feature row]| [Plan A val] | [Plan B val] | [Plan C val] |
```

**Section-metadata pairing:** Always use `style: pale-blue` on the section containing plan-compare.

**Template example:** https://main--ak-kaiserpermanente--adobedrago.aem.page/plans

---

### `table`

**When to use:** Structured data tables — rates, benefits summaries, comparison grids.

**Variants (combinable):**
| Variant | When to use |
|---|---|
| `striped` | Alternating row colors — use for all rate/pricing tables |
| `caption` | First row spans full width as a navy/white caption header |
| `bordered` | Borders on all cells — use for dense data tables |
| `no-header` | Suppress the header row entirely |

**Common combinations:**
- `table striped` — rates tables
- `table caption striped` — Summary of Benefits tables (caption = category name)

**DA Authoring Format (striped):**
```
| Table (striped) |            |          |
|-----------------|------------|----------|
| [Header col 1]  | [Header 2] | [Header 3]|
| [Row 1 data]    | [data]     | [data]   |
```

**DA Authoring Format (caption striped):**
```
| Table (caption striped) |     |           |      |
|-------------------------|-----|-----------|------|
| [Full-width caption]    |     |           |      |
| [Col header]            | [Col header] | [Col header] | [Col header] |
| [Row data]              | [data] | [data] | [data] |
```

**Section-metadata pairing:** Use `style: table-grid` on the section when multiple tables should render side-by-side.

**Template example:** https://main--ak-kaiserpermanente--adobedrago.aem.page/plans

---

### `advanced-tabs`

**When to use:** In repo but **not currently used** on any template page. Do not use unless explicitly required.

---

### `fragment`

**When to use:** Referencing shared reusable content (nav, footer, shared promos). Points to a separate DA document path.

**DA Authoring Format:**
```
| Fragment |
|----------|
| /path/to/fragment-document |
```

---

### `header` / `footer`

Authored as separate DA documents at `/nav` and `/footer`. Not blocks placed within page content.

---

### `youtube`

**When to use:** Embedding a YouTube video (standalone, not paired with text). For video + text use `columns-media` instead.

**DA Authoring Format:**
```
| YouTube |
|---------|
| [YouTube URL] |
```

---

## Section Metadata System

`Section Metadata` is a special 2-column key/value block added at the **bottom of any section** to apply styles to that section's wrapper `<div>`.

### How to Author

```
| Section Metadata |              |
|------------------|--------------|
| style            | pale-blue    |
| spacing          | xl           |
| grid             | 3            |
```

### Available Keys

| Key | Values | Effect |
|---|---|---|
| `style` | See style values below | Applies CSS classes to section |
| `grid` | `2`, `3`, `4`, `5`, `6` | Sets column grid for block-content children |
| `gap` | `xs`, `s`, `m`, `l`, `xl`, `xxl` | Spacing between grid items |
| `spacing` | `xs`, `s`, `m`, `l`, `xl`, `xxl` | Top/bottom padding on section |
| `container` | `2`, `4`, `6` | Max-width constraint |
| `layout` | `bento` | 3-column asymmetric bento grid |
| `background-color` | hex value or `light-scheme` / `dark-scheme` | Section background color |
| `background-image` | image path | Full-bleed background image |

### Style Values (for `style` key)

| Value | Effect |
|---|---|
| `pale-blue` | Light teal background `#f0f7fa` — use for featured/highlighted sections |
| `light` / `highlight` | Soft grey background `#f8f8f8` |
| `dark-blue` | Dark navy background — adjusts link colors for legibility |
| `full-width` | Breaks section out of max-width — **used only on homepage hero** |
| `table-grid` | Renders multiple table blocks side-by-side — **used only on plans page** |
| `footnotes` | Small-print styling with top border — **always last section on every page** |
| `center` | Centers all text in the section |

---

## Design Token Reference

### Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-navy` | `#003b71` | Primary brand navy — headings, buttons |
| `--color-blue` | `#0074ad` | Interactive blue — links, accents |
| `--color-white` | `#ffffff` | Default background |
| `--color-pale-blue` | `#f0f7fa` | Section highlight background |
| `--color-grey-light` | `#f8f8f8` | Subtle section background |

### Spacing Tokens

| Token | Value |
|---|---|
| `--spacing-xxl` | `80px` |
| `--spacing-xl` | `60px` |
| `--spacing-l` | `40px` |
| `--spacing-m` | `24px` |
| `--spacing-s` | `16px` |
| `--spacing-xs` | `8px` |

---

## Content-to-Block Mapping Rules

When analyzing a source page section, apply these rules in order:

| If the source section contains… | Use block | Variant | Section style |
|---|---|---|---|
| Full-width banner image + employer headline + single CTA — **homepage** | `hero` | `landing` | `full-width` |
| Full-width banner image + headline + CTA — **inner page** | `hero` | *(default)* | *(none)* |
| 3–5 tabs each with heading + body + image + CTA | `tabs` | *(none)* | *(none)* |
| Video embed + adjacent heading + body text | `columns-media` | *(none)* | *(none)* |
| Two-column text comparison (lists, bullets, CTAs) | `columns` | *(default)* | *(none)* |
| Two-column layout where image and text need vertical centering | `columns` | `align-vertically` | *(none)* |
| Two-column layout in a highlighted/featured section | `columns` | *(default)* | `pale-blue` |
| 3 items: icon + short label + CTA link (quick actions) | `cards-icon` | *(none)* | *(none)* |
| 3 feature cards each with image + heading + body + CTA | `card` × 3 | *(default)* | *(none)* |
| Benefits/feature list with icons — items displayed in a 2-column grid (2 items per row side-by-side, centered) | `icons` | `grid` | *(none)* |
| Benefits/feature list with icons — items stacked vertically in a single column (1 item per row, top-aligned) | `icons` | `list` | *(none)* |
| Expandable FAQ items or grouped document links | `accordion` | *(none)* | *(none)* |
| Side-by-side plan tier comparison | `plan-compare` | *(none)* | `pale-blue` |
| Pricing/rates data table | `table` | `striped` | *(none)* |
| Benefits summary table with category header | `table` | `caption striped` | `table-grid` (if multiple) |
| Plain headings, paragraphs, links with no repeating pattern | *(default content — no block)* | — | *(none)* |
| Legal disclaimers, footnotes | *(default content — no block)* | — | `footnotes` |

### Block Selection Priority

1. **Check this PROJECT.md first** — use an existing block before considering anything else
2. **Create a variant** of an existing block before creating a new block
3. **Use default content** (no block) for simple text, links, headings — do not over-block
4. **Never create new blocks** for this migration — all required blocks already exist in the repo

---

## DA HTML Output Format

When generating HTML for DA upload, use this exact structure:

### Page Wrapper
```html
<body>
  <header></header>
  <main>
    <!-- sections go here -->
  </main>
  <footer></footer>
</body>
```

### Section with no style
```html
<div>
  <!-- blocks or default content -->
</div>
```

### Section with style
```html
<div class="pale-blue">
  <!-- blocks or default content -->
</div>
```

### Block structure
```html
<div class="hero landing">
  <div>
    <div><picture><source type="image/webp" srcset="[url]"><img loading="lazy" alt="[alt]" src="[url]"></picture></div>
  </div>
  <div>
    <div><h1>Heading</h1><p>Body text</p><p><strong><a href="/link">CTA text</a></strong></p></div>
  </div>
</div>
```

> **Row structure:** Row 1 = background image. Row 2 = text content overlay.
> Image and text are separate rows (vertical), NOT columns in one row (horizontal).

### Rules
- Every block is a `<div class="block-name variant">` — no other wrapper elements
- Each row inside a block is a `<div>` — columns inside a row are nested `<div>` elements
- All text content must be wrapped in `<p>` tags
- All images must use `<picture><source type="image/webp"/><img loading="lazy"/></picture>`
- No `<html>`, `<head>`, or `<body>` tags in individual block HTML snippets
- **IMPORT ALL CONTENT — partial migration is unacceptable**

---

## Secondary Sites Reference

| Employer | URL | Type | Notes |
|---|---|---|---|
| PSHB (Federal) | https://choose.kaiserpermanente.org/pshb | Federal | Full plans + rates + benefits |
| FEHB (Federal) | https://choose.kaiserpermanente.org/fehb | Federal | Full plans + rates + benefits |
| City of San Diego | https://choose.kaiserpermanente.org/cityofsandiego | Employer | Standard template |
| City of Baltimore | https://choose.kaiserpermanente.org/cityofbaltimore | Employer | Standard template |
| City of Atlanta | https://choose.kaiserpermanente.org/cityofatlanta | Employer | Standard template |
| Roblox | https://choose.kaiserpermanente.org/roblox | Employer | Standard template |
| SFHSS | https://choose.kaiserpermanente.org/sfhss | Employer | Standard template |
| AARP | https://choose.kaiserpermanente.org/aarp | Employer | Standard template |
| PepsiCo | https://choose.kaiserpermanente.org/pepsico | Employer | Standard template |
| NVIDIA | https://choose.kaiserpermanente.org/nvidia | Employer | Standard template |
| Google | https://choose.kaiserpermanente.org/google | Employer | Standard template |
