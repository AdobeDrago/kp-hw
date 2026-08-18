# Style Switcher Plugin — Design (Milestone 1)

## Summary

A new **DA library plugin** at `tools/style-switcher/`: a panel that runs inside DA's
document editor and shows the **name + variant** of the block the author currently has
selected, updating automatically as they click around the document.

This is milestone 1 of a larger tool. The eventual goal is to *show all the styles
(variants) of a block and let the author switch between them*. Milestone 1 only
**identifies and names** the selected block — the foundation the rest builds on.

## Background

- Existing DA library plugins in this repo (`tools/fragments/`, `tools/template-governance/`)
  establish the pattern: an HTML entry point that loads `https://da.live/nx/utils/sdk.js`,
  a Lit component (importing `{ LitElement, html }` from `../../deps/lit/dist/index.js`),
  styles loaded via `loadStyle(import.meta.url)` from `scripts/utils/styles.js`, and pure
  logic factored into a `*-utils.js` with unit tests under `test/tools/`.
- The DA SDK (`https://da.live/nx/utils/sdk.js`) resolves to `{ context, token, actions }`.
  `actions` includes an **`getSelection()`** method — a `postMessage` round-trip that
  posts `{ action: 'getSelection' }` and resolves with the `details` of the reply
  `{ action: 'sendSelection', details }`. `style-switcher` is the **first** plugin in this
  repo to use it.
- `getSelection()` is **not documented** in the DA developer guide, so its exact return
  shape (selected HTML? plain text? a node?) is unconfirmed. This is the one real risk and
  is addressed by the spike below.
- Two content formats matter (the "DA two formats" gotcha): the document **source** at
  `content.da.live` represents a block as `<div class="blockname variant">`, while the DA
  **editor** represents a block as a `<table>` whose first cell reads
  `Blockname (variant1, variant2)`. `getSelection()` comes from the editor, so the table
  form is the expected payload — but the parser is written to handle **both** defensively.

## Goals

- Author opens the Library panel while editing a DA doc and picks the "Style Switcher" tab.
- With the cursor/selection inside a block, the panel shows that block's name and its
  variant(s).
- The panel updates on its own as the author moves between blocks (polling), with no
  manual action required.
- Works against whatever site the plugin is registered on (org/repo/path read from the SDK
  `context`, never hardcoded).

## Non-goals (milestone 1)

- No listing or preview of a block's *other* available styles/variants.
- No switching/applying a variant, and no content editing.
- No block-variant catalog source (Storybook, `component-*.json`, CSS) — deferred.
- No handling of nested blocks beyond "report the nearest enclosing block."

## Approach

**Approach A (`getSelection()`-only) with a built-in spike.** Poll `getSelection()` and
parse the enclosing block out of its payload; no extra network fetches. Because the
payload shape is unconfirmed, the panel's *unidentified* state **reveals the raw payload**
on screen — so the first real run inside DA doubles as the shape-confirmation spike. If
that reveals `getSelection()` is too thin to locate the enclosing block, the documented
fallback is **Approach B** (also fetch the doc source from `content.da.live` and map the
selection onto the authoritative block list) — noted here, not built in milestone 1.

## Architecture

```
DA editor (Library panel)
        │  postMessage (DA App SDK)
        ▼
tools/style-switcher/style-switcher.html ──imports──▶ style-switcher.js
                                                   │  DA_SDK → { context, token, actions }
                                                   │  poll actions.getSelection() while visible
                                                   ▼
                          style-switcher-utils.js → identifyBlock(payload)
                                                   │      → { name, variants[], raw } | null
                                                   ▼
                          Lit component renders name + variant chips (or raw-payload reveal)
```

### Files

- `tools/style-switcher/style-switcher.html` — entry point: DA SDK `<script>` + module
  script. Copy of the `template-governance.html` shell.
- `tools/style-switcher/style-switcher.js` — Lit component, `DA_SDK` init, polling loop,
  render states.
- `tools/style-switcher/style-switcher.css` — panel styles (loaded via `loadStyle`).
- `tools/style-switcher/style-switcher-utils.js` — **pure** `identifyBlock()` and helpers,
  no DOM-global or SDK dependency beyond `DOMParser` (as used by `template-governance-utils`).
- `test/tools/style-switcher/style-switcher-utils.test.js` — unit tests for the parser.

## `identifyBlock(payload)`

Input: whatever `getSelection()` resolves to (treated as an HTML string; non-string or
empty input → `null`).

Logic:
1. Parse the payload with `DOMParser`.
2. Find the nearest block:
   - **Table form** (expected): the first `<table>`; the block label is its first cell's
     trimmed `textContent`, e.g. `Columns (dark, wide)`.
   - **Div form** (fallback): the first element matching `div[class]` that looks like a
     block; the label is derived from its class list.
3. Parse the label into `{ name, variants }`:
   - `Columns (dark, wide)` → `{ name: 'Columns', variants: ['dark', 'wide'] }`
   - `Cards` → `{ name: 'Cards', variants: [] }`
   - div form `class="columns dark wide"` → `{ name: 'columns', variants: ['dark', 'wide'] }`
4. Skip structural blocks (`metadata`, `section-metadata`) → treat as non-block (`null`),
   matching the `STRUCTURAL_BLOCK_NAMES` convention in `template-governance-utils`.
5. If multiple blocks appear in the payload, use the **first** and expose a `count` so the
   UI can note "N blocks selected".
6. Return `{ name, variants, raw }` (raw = the original label/first-cell text) or `null`.

Pure function; all rendered strings are HTML-escaped by Lit at render time.

## Behavior / states

- **Polling:** `setInterval` at ~1.5 s while the panel is visible; pause on
  `visibilitychange` when hidden, resume and refresh on show — the same lifecycle as
  `template-governance`. An incrementing request token guards against out-of-order
  `getSelection()` responses; state only re-renders when the identified block changes.
- **States:**
  - *loading* — first poll in flight.
  - *block* — block identified: `name` prominent, `variants` as chips (or "no variant"),
    and a "N blocks selected" note when `count > 1`.
  - *no-block* — nothing identifiable: a "Click inside a block to see its style" hint
    **plus a collapsible raw-payload reveal** (the built-in spike).
  - *error* — `getSelection()` threw / rejected: message + Retry.

## Registration (outside this repo)

Enabled via the **library** tab of the site's DA config sheet at
`https://da.live/config#/adobedrago/kp-hw/`, with a row:

| title          | path                                                | icon                          | format |
|----------------|-----------------------------------------------------|-------------------------------|--------|
| Style Switcher | `<hosted URL of tools/style-switcher/style-switcher.html>` | `<hosted URL of a .png icon>` | dialog |

This is a change to shared site configuration. Exact URLs will be proposed once the plugin
is verified working, and made only with explicit user confirmation — not automatically. A
PNG icon isn't in the repo yet and will need to be supplied or created.

## Testing / verification plan

- **Unit tests** for `identifyBlock()` against fixture payloads: table form with variants,
  table form without a variant, div form, a `metadata`/`section-metadata` table (→ null),
  default content / no table (→ null), multiple blocks (→ first + count), and empty/non-
  string input (→ null). Run via `wtr` (`npm test`), matching `template-governance-utils.test.js`.
- **Manual verification (the spike)** in the DA editor via `ref=local` (iframing
  `localhost:3000`) or a branch preview: select known blocks and confirm the name/variants
  render; use the raw-payload reveal to confirm the real `getSelection()` shape and, if
  needed, tighten `identifyBlock()` or escalate to Approach B.
