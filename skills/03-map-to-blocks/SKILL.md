# Skill: Map Content to Blocks

**Version:** 1.0.0
**Invoked by:** `migrate-secondary-site`

---

## Purpose

For each section in the content manifest, determine the correct block, variant,
and section-metadata style to use — referencing both the mapping rules in PROJECT.md
and the visual block snapshots in `skills/03-map-to-blocks/snapshots/`.

---

## When to Use

- Third step of every secondary site migration
- After `skills/02-extract-page-content` has produced a complete content manifest

---

## Before Starting

Read `PROJECT.md` → **Content-to-Block Mapping Rules** section in full.
It contains the primary decision table for all block assignments.

---

## Workflow

### Step 3a — Load Visual References

The `snapshots/` folder in this directory contains screenshots of every block
as rendered on the live template site. Reference these images when making
block decisions, especially for ambiguous layout patterns.

| Snapshot File | Block | Variant | HTML Class |
|---|---|---|---|
| `hero-landing.png` | `hero` | `landing` | `class="hero landing"` |
| `hero-default.png` | `hero` | *(none)* | `class="hero"` |
| `tabs.png` | `tabs` | *(none)* | `class="tabs"` |
| `columns.png` | `columns` | *(none)* | `class="columns"` |
| `columns-align-vertically.png` | `columns` | `align-vertically` | `class="columns align-vertically"` |
| `columns-media.png` | `columns-media` | *(none)* | `class="columns-media"` |
| `cards-icon.png` | `cards-icon` | *(none)* | `class="cards-icon"` |
| `card.png` | `card` | *(none)* | `class="card"` |
| `accordion.png` | `accordion` | *(none)* | `class="accordion"` |
| `icons-grid.png` | `icons` | `grid` | `class="icons grid"` |
| `icons-list.png` | `icons` | `list` | `class="icons list"` |
| `plan-compare.png` | `plan-compare` | *(none)* | `class="plan-compare"` |
| `table-striped.png` | `table` | `striped` | `class="table striped"` |
| `table-caption-striped.png` | `table` | `caption striped` | `class="table caption striped"` |

---

### Step 3b — Define Section Boundaries

Before mapping blocks, establish where each section begins and ends.

**Section boundary rules:**
- Most blocks → one block per section
- **Card rows** → heading + all cards (typically 3) share ONE section
- **Table rate groups** → heading + all sibling `table striped` blocks share ONE section
- **Summary of benefits** → heading + all `table caption striped` blocks share ONE section
- A heading or intro text that introduces a block belongs **in the same section** as that block
- Standalone default content (headings, paragraphs, lists — no block) gets its own section
- Default content can have a section style (e.g. `pale-blue`) even with no block
- The legal/footnote text is always the last section

**Section-metadata note:**
The Section Style column in the mapping plan drives the `section-metadata` block that gets added at the
bottom of each section in the generated HTML. All section wrappers are plain `<div>` elements — EDS reads
the `section-metadata` block at render time and applies classes/data attributes itself.
`hero landing` on the homepage gets `style: full-width` in its section-metadata.
`hero landing` on inner pages has no section-metadata — plain `<div>` wrapper only.

---

### Step 3c — Map Each Section

For each section in the content manifest, make three decisions:

**Decision 1: Block or default content?**
Ask: can this content be authored as plain headings, paragraphs, and links in
a Word/Google Doc without any special table structure?
- YES → use **default content** (no block)
- NO → proceed to Decision 2

**Decision 2: Which block and variant?**
Apply the mapping rules from PROJECT.md. When the decision is unclear, compare
the section's content pattern against the snapshots in the `snapshots/` folder.

**Decision 3: Which section-metadata style?**
Determine if the section has a distinct background or layout requirement:
- Light teal/blue background → `style: pale-blue`
- Hero section on homepage only → `style: full-width`
- Multiple tables side by side → `style: table-grid`
- Legal/footnote text (always last section) → `style: footnotes`
- No special styling → no section-metadata needed (plain `<div>` wrapper)

---

### Step 3d — Apply Block Selection Priority

Follow this priority order — do not skip steps:

1. **Use an existing block from PROJECT.md** — the block already exists in the repo
2. **Use a variant** of an existing block (e.g. `columns align-vertically`)
3. **Use default content** for simple text, links, and headings
4. **Never create a new block** — all required blocks already exist

---

### Step 3e — Resolve Ambiguous Block Decisions

When the right block isn't immediately obvious, apply these tie-breaker rules:

| Ambiguity | Rule |
|---|---|
| `columns` vs `icons list` | Use `icons list` if icons/images are the primary visual element with short supporting labels. Use `columns` if text content is the primary element. |
| `icons grid` vs `icons list` | Look at the **desktop layout** of the source page. If items are arranged 2-across in a grid → `icons grid`. If items are stacked vertically with one item per row → `icons list`. The content format (bold headings, body text) does NOT determine the variant — the **layout pattern** does. |
| `accordion` vs `tabs` | Use `tabs` if items have equal visual weight and are displayed side-by-side. Use `accordion` if items are collapsible Q&A or expand-on-demand patterns. |
| Heading sits between two sections | The heading belongs in the same section as the block it introduces. If no block follows, it is standalone default content. |
| Section content matches no block | Map to default content. In the mapping plan, note: `default content — no block match` and describe the content pattern. Flag in Step 5 for review. |
| Page has no hero section | Do not force a hero. Map the first section to whatever content is actually there. |
| Page has no footnotes/legal text | Omit the footnotes section from the mapping plan entirely. |
| Text paragraph + adjacent decorative image | Do NOT force into `columns align-vertically`. If the text (heading + body + CTA) can stand alone as default content, keep it as default content in its own section. Place the image inside the next section's block if it relates to that block's content (e.g. a map image inside the columns block about care coverage areas). |
| `default content` vs `columns align-vertically` | Use `columns align-vertically` only when the source site clearly presents two equal-weight content areas side by side (e.g. steps list + phone app screenshot). If one side is purely decorative or the text dominates, use default content for the text and incorporate the image into the relevant block. |

---

### Step 3f — Output the Mapping Plan

For each page, produce a mapping plan before any HTML is generated:

```
## Mapping Plan — [Page Name] ([URL])

| Section | Content Summary | Block | Variant | Section Style |
|---------|----------------|-------|---------|---------------|
| 1 | Full-width hero, "Experience health care, made for Googlers" | hero | landing | full-width |
| 2 | Light blue bg, 2-col contact info (PSHB + Medicare specialist) | columns | — | pale-blue |
| 3 | Video embed + "A seamless care experience" heading + body | columns-media | — | — |
| 4 | 5-tab Why KP section | tabs | — | — |
| 5 | 2-col: video links image + heading + body | columns | align-vertically | — |
| 6 | 2-col: in-KP care list + out-of-KP care list | columns | — | — |
| 7 | Mid-page hero: "Care for growing families" | hero | — | — |
| 8 | 2-col: "Get informed" + image | columns | align-vertically | — |
| 9 | 3-row icon grid: Location · Support · Doctors | cards-icon | — | — |
| 10 | 3 specialty care feature cards | card ×3 | — | — |
| 11 | Legal footnotes | default content | — | footnotes |
```

Once the mapping plan is complete, proceed directly to HTML generation.

---

## Output

A complete section-by-section mapping plan for every page.

Continue directly to Step 4 (`skills/04-generate-da-html`) for HTML generation — do not pause or wait.
