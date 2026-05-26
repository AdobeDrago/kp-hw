# Skill: Generate DA HTML

**Version:** 1.0.0
**Invoked by:** `migrate-secondary-site`

---

## Purpose

Using the confirmed mapping plan and content manifest, generate one DA-compatible
HTML file per page. Each file is structured exactly as DA expects — ready for upload.

---

## When to Use

- Fourth step of every secondary site migration
- After `skills/03-map-to-blocks` has produced a confirmed mapping plan

## When NOT to Use

- Before the mapping plan is confirmed
- Modifying block CSS or JS code

---

## Before Starting

Re-read `PROJECT.md` → **DA HTML Output Format** section.
It contains the exact structural rules and code examples for every block type.

---

## Workflow

### Step 4a — Build Each Section

For each section in the mapping plan, generate the HTML using the rules below.

---

#### Section Structure Rules

Each top-level `<div>` inside `<main>` = one section.

**All section wrappers use a plain `<div>` — no classes or data attributes on the wrapper.**

Styling and layout are controlled by a `section-metadata` block placed at the **bottom** of any section that needs it. EDS reads this block at render time and applies the appropriate classes and data attributes.

**When to add section-metadata:**

| Section type | Keys to include |
|---|---|
| Hero (landing) — homepage only | `style: full-width` |
| Light blue/teal background | `style: pale-blue` |
| Card row — 2 cards | `grid: 2`, `gap: s`, `spacing: m` |
| Card row — 3 cards | `grid: 3`, `gap: s`, `spacing: m` |
| Card row — 4 cards | `grid: 4`, `gap: s`, `spacing: m` |
| Table rates group — 2 tables | `grid: 2`, `gap: xl`, `spacing: md` |
| Table rates group — 3 tables | `grid: 3`, `gap: xl`, `spacing: md` |
| Summary of benefits | `style: table-grid` |
| Footnotes | `style: footnotes` |
| All other sections | No section-metadata needed |

**Section-metadata block format:**

```html
<div class="section-metadata">
  <div>
    <div>[key]</div>
    <div>[value]</div>
  </div>
  <!-- one row per key-value pair -->
</div>
```

Single value example (`pale-blue`):
```html
<div class="section-metadata">
  <div>
    <div>style</div>
    <div>pale-blue</div>
  </div>
</div>
```

Multiple keys example (card row, 3 cards):
```html
<div class="section-metadata">
  <div>
    <div>grid</div>
    <div>3</div>
  </div>
  <div>
    <div>gap</div>
    <div>s</div>
  </div>
  <div>
    <div>spacing</div>
    <div>m</div>
  </div>
</div>
```

**Grouping rules:**
- Most blocks → one block per section
- Card rows → heading + all cards in ONE section + section-metadata with matching `grid` count
- Table rates groups → heading + all sibling tables in ONE section + section-metadata with matching `grid` count
- Summary of benefits → heading + all `table caption striped` blocks in ONE section with `style: table-grid`
- A heading or intro text that introduces a block belongs in the **same section** as that block
- Standalone default content (headings, paragraphs, lists, links — no block) gets its own section
- Default content can also have section styling (e.g. `pale-blue`) with no block

---

#### Default Content Sections

Plain headings, paragraphs, and links. No wrapping block div needed.

```html
<div>
  <h2>Section heading</h2>
  <p>Body paragraph text here.</p>
  <p><a href="/link">Link text</a></p>
</div>
```

For a `footnotes` styled section:
```html
<div>
  <p><sup>1</sup> Footnote text exactly as written.</p>
  <p><sup>2</sup> Second footnote text.</p>
  <div class="section-metadata">
    <div>
      <div>style</div>
      <div>footnotes</div>
    </div>
  </div>
</div>
```

---

#### Image URL Handling

Use the **full absolute URL** from the source site for all images. Do not modify, shorten, or make URLs relative.

```
src="https://choose.kaiserpermanente.org/content/dam/kp/secondsales/.../hero.jpg"
```

This matches the standard EDS import approach. The KP source CDN is publicly accessible, so images will load correctly from DA. The business owner can replace them with DA media URLs (`./media_[hash].[ext]`) after uploading images to DA — but this is a post-migration step, not a blocker.

Every external image URL must be listed in the Step 5 migration summary for review.

---

#### Hero — Landing (homepage)

```html
<div>
  <div class="hero landing">
    <div>
      <div>
        <picture>
          <source type="image/webp" srcset="[full-absolute-image-url]?format=webply&optimize=medium" media="(min-width: 600px)">
          <source type="image/webp" srcset="[full-absolute-image-url]?format=webply&optimize=medium">
          <img loading="lazy" alt="[alt text]" src="[full-absolute-image-url]">
        </picture>
      </div>
      <div>
        <h1>[Employer-specific headline]</h1>
        <p>[Body text]</p>
        <p><strong><a href="[CTA href]">[CTA text]</a></strong></p>
      </div>
    </div>
  </div>
  <div class="section-metadata">
    <div>
      <div>style</div>
      <div>full-width</div>
    </div>
  </div>
</div>
```

#### Hero — Default (inner pages)

```html
<div>
  <div class="hero">
    <div>
      <div>
        <picture>
          <source type="image/webp" srcset="[full-absolute-image-url]?format=webply&optimize=medium" media="(min-width: 600px)">
          <source type="image/webp" srcset="[full-absolute-image-url]?format=webply&optimize=medium">
          <img loading="lazy" alt="[alt text]" src="[full-absolute-image-url]">
        </picture>
      </div>
      <div>
        <h2>[Page heading]</h2>
        <p>[Body text]</p>
      </div>
    </div>
  </div>
</div>
```

---

#### Tabs

```html
<div>
  <div class="tabs">
    <div>
      <div>[Tab 1 label]</div>
      <div>
        <h3>[Tab 1 heading]</h3>
        <p>[Tab 1 body]</p>
        <p><a href="[href]">[CTA text]</a></p>
        <picture>
          <source type="image/webp" srcset="[full-absolute-image-url]">
          <img loading="lazy" alt="[alt]" src="[full-absolute-image-url]">
        </picture>
      </div>
    </div>
    <div>
      <div>[Tab 2 label]</div>
      <div>
        <h3>[Tab 2 heading]</h3>
        <p>[Tab 2 body]</p>
      </div>
    </div>
    <!-- repeat for each tab -->
  </div>
</div>
```

---

#### Columns (default)

```html
<div>
  <div class="columns">
    <div>
      <div>
        <h3>[Left heading]</h3>
        <p>[Left body]</p>
      </div>
      <div>
        <h3>[Right heading]</h3>
        <p>[Right body]</p>
      </div>
    </div>
  </div>
</div>
```

For `pale-blue` section style, add section-metadata inside the section:
```html
<div>
  <div class="columns">
    ...
  </div>
  <div class="section-metadata">
    <div>
      <div>style</div>
      <div>pale-blue</div>
    </div>
  </div>
</div>
```

For `align-vertically` variant:
```html
<div class="columns align-vertically">
```

---

#### Columns Media

```html
<div>
  <div class="columns-media">
    <div>
      <div><a href="[video-url]">[video-url]</a></div>
      <div>
        <h2>[Heading]</h2>
        <p>[Body text]</p>
      </div>
    </div>
  </div>
</div>
```

---

#### Cards Icon

```html
<div>
  <div class="cards-icon">
    <div>
      <div>
        <picture>
          <source type="image/webp" srcset="[full-absolute-icon-url]">
          <img loading="lazy" alt="[alt]" src="[full-absolute-icon-url]">
        </picture>
      </div>
      <div>
        <p><strong>[Label]</strong></p>
        <p><a href="[href]">[CTA text]</a></p>
      </div>
    </div>
    <!-- repeat for each card -->
  </div>
</div>
```

---

#### Card — with image

```html
<div>
  <div class="card">
    <div>
      <picture>
        <source type="image/webp" srcset="[full-absolute-image-url]">
        <img loading="lazy" alt="[alt]" src="[full-absolute-image-url]">
      </picture>
    </div>
    <div>
      <h3>[Card heading]</h3>
      <p>[Card body]</p>
    </div>
    <div>
      <p><a href="[href]">[CTA text]</a></p>
    </div>
  </div>
  <!-- repeat for each card in the row -->
</div>
```

#### Card — text only (no image)

Use when the source content has no image — heading, body text, lists, and links only.

```html
<div>
  <div class="card">
    <div>
      <h3>[Card heading]</h3>
      <p>[Card body]</p>
      <ul>
        <li>[List item]</li>
        <li>[List item]</li>
      </ul>
      <p><a href="[href]">[CTA text]</a></p>
    </div>
  </div>
  <!-- repeat for each card in the row -->
</div>
```

> **Card row section-metadata:** When multiple cards share a section, add `section-metadata` with `grid`, `gap`, and `spacing` at the bottom of the section — after the last card block. See Section Structure Rules above for the correct values per card count.

---

#### Accordion

```html
<div>
  <div class="accordion">
    <div>
      <div><p>[Question / label]</p></div>
      <div><p>[Answer / body content]</p></div>
    </div>
    <div>
      <div><p>[Question 2]</p></div>
      <div><p>[Answer 2]</p></div>
    </div>
    <!-- repeat for each item -->
  </div>
</div>
```

---

#### Icons (grid)

```html
<div>
  <div class="icons grid">
    <div>
      <div>
        <picture>
          <source type="image/webp" srcset="[full-absolute-icon-url]">
          <img loading="lazy" alt="[alt]" src="[full-absolute-icon-url]">
        </picture>
      </div>
      <div><p>[Body text]</p></div>
    </div>
    <!-- repeat for each item -->
  </div>
</div>
```

#### Icons (list)

```html
<div>
  <div class="icons list">
    <div>
      <div>
        <picture>
          <source type="image/webp" srcset="[full-absolute-icon-url]">
          <img loading="lazy" alt="[alt]" src="[full-absolute-icon-url]">
        </picture>
      </div>
      <div>
        <p><strong>[Item heading]</strong></p>
        <p>[Body text]</p>
      </div>
    </div>
  </div>
</div>
```

---

#### Plan Compare

```html
<div>
  <div class="plan-compare">
    <div>
      <div><p><strong>[Plan A Name]</strong></p></div>
      <div><p><strong>[Plan B Name]</strong></p></div>
      <div><p><strong>[Plan C Name]</strong></p></div>
    </div>
    <div>
      <div><p>[Feature label]</p></div>
      <div><p>[Plan A value]</p></div>
      <div><p>[Plan B value]</p></div>
      <div><p>[Plan C value]</p></div>
    </div>
    <!-- repeat rows for each feature -->
  </div>
  <div class="section-metadata">
    <div>
      <div>style</div>
      <div>pale-blue</div>
    </div>
  </div>
</div>
```

---

#### Table (striped)

```html
<div>
  <div class="table striped">
    <div>
      <div><p>[Col 1 header]</p></div>
      <div><p>[Col 2 header]</p></div>
      <div><p>[Col 3 header]</p></div>
    </div>
    <div>
      <div><p>[Row 1 data]</p></div>
      <div><p>[Row 1 data]</p></div>
      <div><p>[Row 1 data]</p></div>
    </div>
    <!-- repeat for each data row -->
  </div>
</div>
```

#### Table (caption striped) — for Summary of Benefits

```html
<div>
  <div class="table caption striped">
    <div>
      <div><p>[Caption — spans full width]</p></div>
    </div>
    <div>
      <div><p>[Col header 1]</p></div>
      <div><p>[Col header 2]</p></div>
      <div><p>[Col header 3]</p></div>
      <div><p>[Col header 4]</p></div>
    </div>
    <div>
      <div><p>[Data]</p></div>
      <div><p>[Data]</p></div>
      <div><p>[Data]</p></div>
      <div><p>[Data]</p></div>
    </div>
  </div>
  <!-- additional table caption striped blocks side by side -->
  <div class="section-metadata">
    <div>
      <div>style</div>
      <div>table-grid</div>
    </div>
  </div>
</div>
```

---

### Step 4b — Assemble the Full Page

Wrap all sections in the page wrapper:

```html
<body>
  <header></header>
  <main>
    <!-- all section divs go here, top to bottom -->
  </main>
  <footer></footer>
</body>
```

---

### Step 4c — Handle Edge Cases

Apply these rules before generating HTML for any section.

#### Content that cannot be migrated

| Situation | What to do |
|---|---|
| Embedded form | Output any visible heading and body text as default content. Add a plain link to the form URL if one exists. Flag in Step 5. |
| iFrame embed (non-video) | Cannot migrate. Output a default content section with a note: `<p>[Embedded content — manual migration required: [iframe src URL]]</p>`. Flag in Step 5. |
| Non-YouTube video | Use `columns-media` with the video URL as a link if there is accompanying text. If no accompanying text, output as a default content link. Flag in Step 5. |
| PDF / download link | Treat as a regular `<a href>` link. No special handling needed. |

#### Missing or absent content

| Situation | What to do |
|---|---|
| Page has no hero | Do not force one. Start with the first meaningful content section. |
| Page has no legal/footnote text | Omit the `<div class="footnotes">` section entirely. |
| Employer logo not found in nav | Output `<picture></picture>` as an empty placeholder. Flag in Step 5. |

#### Image issues

| Situation | What to do |
|---|---|
| Image has no alt text | Use `alt=""`. Flag every instance in Step 5. |
| Image src is relative (e.g. `../../img/photo.jpg`) | Reconstruct as an absolute URL using the source site origin. |
| Image is a tracking pixel or 1×1 spacer | Skip it — do not include in the output. |
| Image URL appears malformed | Include as-is. Flag in Step 5. The business owner will catch it during preview. |

---

### Step 4d — Validate Before Output

Before producing the final HTML file, verify:

- [ ] Section count matches the mapping plan
- [ ] Every heading, paragraph, link, and phone number from the content manifest is present
- [ ] Every image has a `<picture>` wrapper with `loading="lazy"`
- [ ] Every section wrapper is a plain `<div>` — no classes or data attributes on wrappers
- [ ] Every section that needs styling has a `section-metadata` block at its bottom
- [ ] If legal/footnote text exists, it is the last section with `style: footnotes` in its section-metadata
- [ ] No `<html>` or `<head>` tags present
- [ ] No placeholder text — all content is real

---

### Footer — Not Generated

The footer is identical across all secondary sites and is maintained centrally on
the template site. Each forked repo's `blocks/footer/footer.js` is configured to
load the footer directly from the template site at runtime — no `footer.html` is
needed per site, and EMA does not generate one.

> If a fork's `footer.js` has not yet been updated, the `FOOTER_PATH` constant
> must be changed to the absolute template URL:
> `https://main--ak-kaiserpermanente--adobedrago.aem.page/fragments/nav/footer`
> This is a one-time fork setup step, not a migration step.

---

### Step 4e — Generate the Nav File

Using the nav manifest from `skills/01-discover-pages`, generate a single `nav.html`
file to be uploaded to DA at `/fragments/nav/header`.

The nav has three sections — one `<div>` per section inside `<main>`.

#### Nav Structure

```html
<body>
  <header></header>
  <main>

    <!-- Section 1: Utility bar -->
    <!-- If utility links were found: -->
    <div>
      <ul>
        <li><a href="[href]">[Link text]</a></li>
        <!-- repeat for each utility link from the nav manifest -->
      </ul>
    </div>
    <!-- If Section 1 is empty: -->
    <div></div>

    <!-- Section 2: Brand bar -->
    <div>
      <p>
        <picture>
          <img loading="lazy" alt="Kaiser Permanente" src="https://main--ak-kaiserpermanente--adobedrago.aem.page/fragments/nav/media_129252eb0ed4a8d722c06c7b18a6640ff53eeb536.svg">
        </picture>
      </p>
      <p>
        <picture>
          <img loading="lazy" alt="[Employer logo alt]" src="[full-absolute-employer-logo-url]">
        </picture>
      </p>
      <p><a href="https://healthy.kaiserpermanente.org/register">Register</a></p>
      <p><span class="icon icon-profilecircle"></span><a href="https://healthy.kaiserpermanente.org/sign-on">Sign In</a></p>
    </div>

    <!-- Section 3: Primary nav links (use site-relative paths from nav manifest) -->
    <div>
      <ul>
        <li><a href="/" title="Home">Home</a></li>
        <li><a href="[site-relative-path]">[Link text]</a></li>
        <!-- repeat for each nav link; only the Home link uses title="Home" -->
      </ul>
    </div>

  </main>
  <footer></footer>
</body>
```

#### Key Rules

- **KP logo** — always the fixed absolute URL above; never scrape from source
- **Employer logo** — use the full absolute URL from the nav manifest
- **Section 3 links** — use site-relative paths (e.g. `/plans`, `/getting-care`), never source URLs
- **Home link** — always `href="/"` with `title="Home"`; all other links have no `title` attribute
- **Section 1 empty** — if no utility bar was found, output `<div></div>` (required as section placeholder)

---

## Output

One complete, validated HTML file per page **plus** one `nav.html` file.

Page files are named after the page path (e.g. `index.html`, `plans.html`, `support.html`).
`nav.html` is uploaded to DA at `/fragments/nav/header` (not under the employer folder).

All files are passed to `skills/05-output-summary` for the migration report.

**IMPORT ALL CONTENT. Partial migration is unacceptable.**
