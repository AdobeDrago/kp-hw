# Template Governance Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tools/template-governance/` — a DA library plugin that, for the page currently open in the DA editor, resolves its declared `template` metadata value, looks it up in the project's own `docs/library/templates.json` template library, fetches the matching reference document, and shows a section-by-section anatomy of the page: which blocks are missing or present (definitive per section slot, per Task 9's revision — no ambiguous "partial" state), plus a metadata Missing/Added list and an "Add to page" action that inserts a missing block's real markup from the reference document. Refreshes automatically on an interval while open.

**Architecture:** A pure-function module (`template-governance-utils.js`) provides source-URL building, template-name resolution, `content.da.live` URL parsing, template-entry lookup, section-and-count-aware block extraction/diffing, metadata extraction/diffing, and reference-block lookup — all testable without DOM/fetch/SDK mocking. `template-governance.js` wires the DA App SDK (`context`, `token`, `actions`) to a Lit custom element that fetches the current page, looks up and fetches the one matching reference document, computes the anatomy, renders it, handles the Add action, and polls on an interval for auto-refresh.

**Tech Stack:** Vanilla ES modules, Lit (vendored at `deps/lit/dist/index.js`, imported by relative path — matches `tools/scheduler/scheduler.js`, not the `da-lit` importmap bare specifier), `scripts/utils/styles.js#loadStyle` for shadow-DOM CSS, `@web/test-runner` + `@esm-bundle/chai` for unit tests (existing repo test stack, see `test/tools/fragments/fragment-utils.test.js`).

## Global Constraints

- The reference for a template is the single document named by `docs/library/templates.json` — no statistical sampling, no crawling the DA content tree, no `sessionStorage` caching.
- "Added" (page has it, reference doesn't, by name) is **informational, not a violation** — rendered neutrally, separate from Missing/Partial. Rationale: `templates.json` entries are starting layouts, not exhaustive schemas; real pages are expected to have more content than the bare template. A block type the reference wants *more* of than the page has (an "over-count", e.g. reference wants 2 `columns` and the page has 5) is out of scope — not itemized as a separate case.
- **Revised after manual verification (Task 4):** the plugin does not use `.aem.page` preview fetches. All fetches go through DA's raw source, `https://content.da.live/{org}/{repo}{path}`, authenticated with an `Authorization: Bearer {token}` header (the DA SDK's `token`) — the preview-based approach required every page to have been manually previewed at least once before the panel would work at all, which defeats the point of a pre-publish governance check. Raw DA source has no `<head>`; template/metadata resolution reads the `.metadata` block instead (see Task 4).
- `context.ref` is not used anywhere in this plugin — DA source has no branch/ref concept. `context.org`, `context.repo`, `context.path`, the SDK's `token`, and (as of Task 7) `actions` are read.
- **Block identity vs. count — revised after live use (Task 9):** Task 6 originally gave a block name that appears more than once in the reference a shared aggregate status (`X of Y present`) applied identically at every section slot it occupies, specifically to avoid claiming any one specific occurrence was "the" satisfied slot. The user tried this live and found it unhelpful (the same badge repeated at every slot doesn't say *where* to look) and explicitly asked for definitive per-slot present/missing instead. Task 9 replaces the aggregate approach with sequential (first-come-first-served, template document order) allocation — every slot gets a clean binary `status: 'present' | 'missing'`, no more `'partial'`. This is an accepted, deliberate tradeoff: arbitrary in a true tie, but more actionable in practice.
- **The "Add" action reverses the plugin's original read-only design (Task 7), by explicit user direction given after reviewing the anatomy-view prototype.** It calls `actions.sendHTML` with the reference document's own block markup (not a synthesized empty skeleton), for every `missing` block slot (there's no more `partial` state to withhold it from, after Task 9). It does not call `actions.closeLibrary()` — the panel stays open. `sendHTML` inserts at the main document editor's current cursor/selection (confirmed from `adobe/da-live`'s source, not a guess) — the panel shows a hint telling the author to click where they want it first, since there's no way to pass a target position through the SDK.
- **Auto-refresh (Task 7) polls every `POLL_INTERVAL_MS` ms** while the panel is open and the tab is visible (paused on `document.visibilitychange` when hidden, resumed + immediately re-polled when visible again). Started at `8000` per the plan below; **revised to `3000` after the user tried it live and asked for a faster cadence** (post-Task-7 fix round, see ledger). A poll tick is silent: it never flips the UI to a loading state, never surfaces an error (a failed poll is swallowed and retried next tick), and only re-renders if the computed report actually changed from what's displayed. The manual "Recheck" button is not silent — it shows loading and surfaces errors, for an immediate check without waiting for the next tick.
- **Add-to-page insertion position (Task 7) is confirmed, not unsolved:** `sendHTML` inserts at the main document editor's current ProseMirror selection (confirmed from `adobe/da-live`'s `blocks/edit/da-library/da-library.js` source) — not a fixed/unsolvable position. A post-Task-7 fix round added a hint line in the panel telling the author to click where they want content before clicking Add, since the panel can't otherwise convey that the insertion point is driven by the other iframe's cursor state.
- **Colors for status states (Task 7, revised by Task 9) are Adobe Spectrum 2's official values**, pulled from the `@adobe/spectrum-tokens` npm package (not approximated): missing `#D73220` border/text on `#FFEBE8` background; the completeness bar's fully-present segments use the positive/success token `#079355`; neutral chrome `#E9E9E9` border, `#717171` secondary text, `#F3F3F3` card background, `#292929`/`#505050` for darker text on neutral backgrounds. The `partial`/notice color pairing (`#D45B00`/`#FFECCF`) introduced in Task 7 is removed in Task 9 along with the `partial` status itself. The existing purple/blue gradient CTA buttons (Recheck, Retry) are unchanged — this recoloring applies to status indicators only, not general UI chrome.
- Import Lit via `../../deps/lit/dist/index.js` (relative path), matching `tools/scheduler/scheduler.js:1` — not a bare `da-lit` specifier.
- Style the shadow root via `loadStyle(import.meta.url)` from `scripts/utils/styles.js`, matching `tools/scheduler/scheduler.js:6,19` and `tools/fragments/fragments.js`.
- The DA config "library" sheet registration (`https://da.live/config#/adobedrago/kp-hw/`) is an external, shared-config change. It is **not** performed by any task below — the final task ends with the exact row to propose to the user, who must confirm it themselves, same pattern as the Fragments plugin's rollout.
- `npm run lint` must pass (ESLint via `@adobe/eslint-config-helix`, Airbnb-based; `tools/template-governance/template-governance.css` is not in the `lint:css` glob — `blocks/**/*.css` and `styles/*.css` — so stylelint on it is a manual spot-check only, same situation as `tools/fragments/fragments.css`).
- `npm test` must pass (`@web/test-runner`, tests live under `test/`, mirroring the source tree).

---

### Task 1: Template resolution and template-library lookup helpers

**Files:**
- Create: `tools/template-governance/template-governance-utils.js`
- Test: `test/tools/template-governance/template-governance-utils.test.js`

**Interfaces:**
- Produces (consumed by Task 2's `diffSets` caller and by `template-governance.js` in Task 3):
  - `buildPreviewUrl(path: string, org: string, repo: string, ref?: string): string`
  - `resolveTemplateFromHtml(html: string): string | null`
  - `parseContentDaUrl(url: string): { org: string, repo: string, path: string } | null`
  - `findTemplateEntry(entries: Array<{key: string, value: string}>, templateName: string): {key: string, value: string} | null`

- [ ] **Step 1: Write the failing tests**

Create `test/tools/template-governance/template-governance-utils.test.js`:

```js
import { expect } from '@esm-bundle/chai';
import {
  buildPreviewUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
} from '../../../tools/template-governance/template-governance-utils.js';

describe('template-governance-utils.js', () => {
  describe('buildPreviewUrl', () => {
    it('builds a preview URL for a path', () => {
      const url = buildPreviewUrl('/docs/library/templates/homepage', 'adobedrago', 'ak-kaiserpermanente', 'main');
      expect(url).to.equal('https://main--ak-kaiserpermanente--adobedrago.aem.page/docs/library/templates/homepage');
    });

    it('defaults ref to main', () => {
      expect(buildPreviewUrl('/foo', 'adobedrago', 'kp-hw')).to.equal('https://main--kp-hw--adobedrago.aem.page/foo');
    });
  });

  describe('resolveTemplateFromHtml', () => {
    it('reads the template name from the meta tag', () => {
      const html = '<html><head><meta name="template" content="Homepage"></head><body></body></html>';
      expect(resolveTemplateFromHtml(html)).to.equal('Homepage');
    });

    it('returns null when the meta tag is absent', () => {
      expect(resolveTemplateFromHtml('<html><head></head><body></body></html>')).to.equal(null);
    });

    it('returns null when the meta tag is present but empty', () => {
      const html = '<html><head><meta name="template" content=""></head><body></body></html>';
      expect(resolveTemplateFromHtml(html)).to.equal(null);
    });
  });

  describe('parseContentDaUrl', () => {
    it('parses org, repo, and path from a content.da.live URL', () => {
      const result = parseContentDaUrl('https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage');
      expect(result).to.deep.equal({
        org: 'adobedrago',
        repo: 'ak-kaiserpermanente',
        path: '/docs/library/templates/homepage',
      });
    });

    it('returns null for a URL that is not a content.da.live URL', () => {
      expect(parseContentDaUrl('https://example.com/adobedrago/kp-hw/foo')).to.equal(null);
    });
  });

  describe('findTemplateEntry', () => {
    const entries = [
      { key: 'Homepage', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage' },
      { key: 'Support', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/support' },
    ];

    it('finds an entry by key, case-insensitively', () => {
      expect(findTemplateEntry(entries, 'homepage')).to.deep.equal(entries[0]);
    });

    it('returns null when no entry matches', () => {
      expect(findTemplateEntry(entries, 'article')).to.equal(null);
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — `tools/template-governance/template-governance-utils.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `tools/template-governance/template-governance-utils.js`:

```js
export function buildPreviewUrl(path, org, repo, ref = 'main') {
  return `https://${ref}--${repo}--${org}.aem.page${path}`;
}

export function resolveTemplateFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const meta = doc.head.querySelector('meta[name="template"]');
  const value = meta?.content?.trim();
  return value || null;
}

const CONTENT_DA_ORIGIN = 'https://content.da.live';

export function parseContentDaUrl(url) {
  if (!url.startsWith(`${CONTENT_DA_ORIGIN}/`)) return null;
  const [org, repo, ...pathParts] = url.slice(CONTENT_DA_ORIGIN.length + 1).split('/');
  if (!org || !repo || !pathParts.length) return null;
  return { org, repo, path: `/${pathParts.join('/')}` };
}

export function findTemplateEntry(entries, templateName) {
  const target = templateName.trim().toLowerCase();
  return entries.find((entry) => entry.key?.trim().toLowerCase() === target) || null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS

- [ ] **Step 5: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js
git commit -m "feat: add template resolution and template-library lookup helpers"
```

---

### Task 2: Raw-HTML extraction and diff helpers

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js`
- Modify: `test/tools/template-governance/template-governance-utils.test.js`

**Interfaces:**
- Produces (consumed by `template-governance.js` in Task 3):
  - `extractBlockNames(html: string): string[]` — unique block names (first class token of each section-level block `<div>`), in document order.
  - `extractMetadataFields(html: string): string[]` — unique `meta[name]`/`meta[property]` key values, in document order.
  - `diffSets(currentSet: string[], referenceSet: string[]): { missing: string[], added: string[] }` — `missing` = names in `referenceSet` absent from `currentSet`; `added` = names in `currentSet` absent from `referenceSet`.

- [ ] **Step 1: Write the failing tests**

Append to `test/tools/template-governance/template-governance-utils.test.js` (add `extractBlockNames, extractMetadataFields, diffSets` to the existing import):

```js
describe('extractBlockNames', () => {
  it('extracts the block name (first class) from each section-level block div', () => {
    const html = `
      <html><body><main>
        <div>
          <div class="hero landing"><div>content</div></div>
        </div>
        <div>
          <div class="columns two-up"><div>a</div><div>b</div></div>
          <p>default content, not a block</p>
        </div>
      </main></body></html>
    `;
    expect(extractBlockNames(html)).to.deep.equal(['hero', 'columns']);
  });

  it('returns an empty array when there is no main element', () => {
    expect(extractBlockNames('<html><body></body></html>')).to.deep.equal([]);
  });

  it('deduplicates repeated block names', () => {
    const html = `
      <html><body><main>
        <div><div class="hero"><div>a</div></div></div>
        <div><div class="hero"><div>b</div></div></div>
      </main></body></html>
    `;
    expect(extractBlockNames(html)).to.deep.equal(['hero']);
  });
});

describe('extractMetadataFields', () => {
  it('extracts meta name and property keys', () => {
    const html = `
      <html><head>
        <meta name="template" content="Homepage">
        <meta property="og:title" content="Hello">
        <meta charset="utf-8">
      </head><body></body></html>
    `;
    expect(extractMetadataFields(html)).to.deep.equal(['template', 'og:title']);
  });

  it('returns an empty array when there are no matching meta tags', () => {
    expect(extractMetadataFields('<html><head></head><body></body></html>')).to.deep.equal([]);
  });
});

describe('diffSets', () => {
  it('reports reference names missing from the current set', () => {
    const { missing } = diffSets(['hero'], ['hero', 'columns']);
    expect(missing).to.deep.equal(['columns']);
  });

  it('reports current names not present in the reference set', () => {
    const { added } = diffSets(['hero', 'extra-block'], ['hero']);
    expect(added).to.deep.equal(['extra-block']);
  });

  it('reports no findings when the sets match exactly', () => {
    expect(diffSets(['hero'], ['hero'])).to.deep.equal({ missing: [], added: [] });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — `extractBlockNames`/`extractMetadataFields`/`diffSets` don't exist yet.

- [ ] **Step 3: Write the implementation**

Append to `tools/template-governance/template-governance-utils.js`:

```js
export function extractBlockNames(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  const names = [];
  main.querySelectorAll(':scope > div > div[class]').forEach((block) => {
    const [name] = block.classList;
    if (name && !names.includes(name)) names.push(name);
  });
  return names;
}

export function extractMetadataFields(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const names = [];
  doc.head.querySelectorAll('meta[name], meta[property]').forEach((meta) => {
    const key = meta.getAttribute('name') || meta.getAttribute('property');
    if (key && !names.includes(key)) names.push(key);
  });
  return names;
}

export function diffSets(currentSet, referenceSet) {
  const missing = referenceSet.filter((name) => !currentSet.includes(name));
  const added = currentSet.filter((name) => !referenceSet.includes(name));
  return { missing, added };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS — all `describe` blocks across the whole file green.

- [ ] **Step 5: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js
git commit -m "feat: add raw-HTML extraction and diff helpers for template governance"
```

---

### Task 3: Report component, styles, and DA SDK glue

**Files:**
- Create: `tools/template-governance/template-governance.html`
- Create: `tools/template-governance/template-governance.css`
- Create: `tools/template-governance/template-governance.js`

**Interfaces:**
- Consumes (from Tasks 1–2): `buildPreviewUrl`, `resolveTemplateFromHtml`, `parseContentDaUrl`, `findTemplateEntry`, `extractBlockNames`, `extractMetadataFields`, `diffSets` — all from `./template-governance-utils.js`.
- Consumes (existing repo utilities): `loadStyle` (default export) from `../../scripts/utils/styles.js`; `LitElement`, `html` from `../../deps/lit/dist/index.js`; default export `DA_SDK` from `https://da.live/nx/utils/sdk.js`.
- Produces: custom element `<template-governance-report>` (tag name `template-governance-report`). No events are dispatched — this component never mutates the document.

There is no automated test for this task — it wires together the DOM, `fetch`, and the DA App SDK's `postMessage` handshake, none of which this repo's test setup mocks (consistent with `tools/fragments/fragments.js`, `tools/scheduler/scheduler.js`, and `tools/quick-edit/quick-edit.js`). Verification is manual, in Task 4.

- [ ] **Step 1: Create `template-governance.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Template Governance</title>
</head>
<body style="margin: 0; padding: 0; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <script src="https://da.live/nx/utils/sdk.js"></script>
  <script type="module" src="./template-governance.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `template-governance.css`**

```css
:host {
  display: block;
  height: 100%;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.status-container {
  display: flex;
  place-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 6px 20px;
  height: 90%;
  animation: fade-in-out 2s ease-in-out infinite;
}

.status-container .status {
  width: 100%;
  text-align: center;
  margin: 0;
}

@keyframes fade-in-out {
  0%, 100% {
    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }
}

.governance-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgb(222 222 222);
}

.report-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.btn-recheck {
  flex-shrink: 0;
  padding: 6px 16px;
  border: none;
  border-radius: 18px;
  background-image: linear-gradient(95.85deg, #b539c8 0%, #7155fa 66%, #3b63fb 100%);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.report-section {
  padding: 12px 20px;
}

.report-section-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
}

.finding-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.finding-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
}

.finding-type {
  font-size: 11px;
  text-transform: uppercase;
  color: #666;
}

.finding-empty {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.btn-retry {
  padding: 6px 16px;
  border: none;
  border-radius: 18px;
  background-image: linear-gradient(95.85deg, #b539c8 0%, #7155fa 66%, #3b63fb 100%);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 3: Create `template-governance.js`**

```js
import { LitElement, html } from '../../deps/lit/dist/index.js';
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import loadStyle from '../../scripts/utils/styles.js';
import {
  buildPreviewUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
  extractBlockNames,
  extractMetadataFields,
  diffSets,
} from './template-governance-utils.js';

const styles = await loadStyle(import.meta.url);

const EL_NAME = 'template-governance-report';
const TEMPLATES_JSON_PATH = '/docs/library/templates.json';

async function fetchText(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
  return resp.text();
}

async function fetchReferenceHtml(templatesJsonUrl, templateName) {
  const json = JSON.parse(await fetchText(templatesJsonUrl));
  const entry = findTemplateEntry(json.data || [], templateName);
  if (!entry) return null;
  const parsed = parseContentDaUrl(entry.value);
  if (!parsed) return null;
  return fetchText(buildPreviewUrl(parsed.path, parsed.org, parsed.repo, 'main'));
}

async function buildReport(org, repo, ref, currentHtml) {
  const templateName = resolveTemplateFromHtml(currentHtml);
  if (!templateName) return { status: 'no-template' };

  const templatesJsonUrl = buildPreviewUrl(TEMPLATES_JSON_PATH, org, repo, ref);
  const referenceHtml = await fetchReferenceHtml(templatesJsonUrl, templateName);
  if (!referenceHtml) return { status: 'no-reference', template: templateName };

  const blockDiff = diffSets(extractBlockNames(currentHtml), extractBlockNames(referenceHtml));
  const metaDiff = diffSets(extractMetadataFields(currentHtml), extractMetadataFields(referenceHtml));

  return {
    status: 'ready',
    template: templateName,
    missing: [
      ...blockDiff.missing.map((name) => ({ type: 'block', name })),
      ...metaDiff.missing.map((name) => ({ type: 'metadata', name })),
    ],
    added: [
      ...blockDiff.added.map((name) => ({ type: 'block', name })),
      ...metaDiff.added.map((name) => ({ type: 'metadata', name })),
    ],
  };
}

class TemplateGovernanceReport extends LitElement {
  static properties = {
    org: { attribute: false },
    repo: { attribute: false },
    ref: { attribute: false },
    path: { attribute: false },
    _status: { state: true },
    _report: { state: true },
  };

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [styles];
    this._status = 'loading';
    this._report = null;
    this._requestId = 0;
    this.load();
  }

  async load() {
    this._requestId += 1;
    const requestId = this._requestId;
    this._status = 'loading';
    try {
      const currentHtml = await fetchText(buildPreviewUrl(this.path, this.org, this.repo, this.ref));
      const report = await buildReport(this.org, this.repo, this.ref, currentHtml);
      if (requestId !== this._requestId) return;
      this._report = report;
      this._status = report.status;
    } catch (error) {
      if (requestId !== this._requestId) return;
      // eslint-disable-next-line no-console
      console.error('Failed to build template governance report', error);
      this._status = 'error';
    }
  }

  renderFindingList(title, findings, emptyText) {
    return html`
      <div class="report-section">
        <p class="report-section-title">${title}</p>
        ${findings.length ? html`
          <ul class="finding-list">
            ${findings.map((finding) => html`
              <li class="finding-item">
                <span class="finding-type">${finding.type}</span>
                <span class="finding-name">${finding.name}</span>
              </li>
            `)}
          </ul>
        ` : html`<p class="finding-empty">${emptyText}</p>`}
      </div>
    `;
  }

  renderStatus() {
    if (this._status === 'loading') {
      return html`<div class="status-container"><p class="status">Checking against its template…</p></div>`;
    }
    if (this._status === 'no-template') {
      return html`<div class="status-container"><p class="status">This page doesn't declare a template — nothing to check.</p></div>`;
    }
    if (this._status === 'no-reference') {
      return html`<div class="status-container"><p class="status">Template "${this._report.template}" isn't in this site's template library — can't compare against it.</p></div>`;
    }
    return html`
      <div class="status-container">
        <p class="status">Couldn't build the governance report.</p>
        <button class="btn-retry" @click=${() => this.load()}>Retry</button>
      </div>
    `;
  }

  render() {
    if (this._status !== 'ready') return this.renderStatus();

    return html`
      <div class="governance-app">
        <div class="report-header">
          <p class="report-title">${this._report.template}</p>
          <button class="btn-recheck" @click=${() => this.load()}>Recheck</button>
        </div>
        ${this.renderFindingList('Missing', this._report.missing, 'None — looks consistent with its template.')}
        ${this.renderFindingList('Added', this._report.added, 'No content beyond the base template.')}
      </div>
    `;
  }
}

customElements.define(EL_NAME, TemplateGovernanceReport);

(async function init() {
  const { context } = await DA_SDK;

  const report = document.createElement(EL_NAME);
  report.org = context.org;
  report.repo = context.repo;
  report.ref = context.ref;
  report.path = context.path;

  document.body.append(report);
}());
```

- [ ] **Step 4: Lint**

Run: `npx eslint tools/template-governance/template-governance.js`
Run: `npx stylelint tools/template-governance/template-governance.css`
Expected: no errors. (As noted in Global Constraints, the stylelint run here is a manual spot-check, not part of `npm run lint:css`.)

- [ ] **Step 5: Commit**

```bash
git add tools/template-governance/template-governance.js tools/template-governance/template-governance.css tools/template-governance/template-governance.html
git commit -m "feat: build template-governance report component and DA SDK glue"
```

---

### Task 4: Rework template/metadata resolution to use DA source instead of preview

**Why this task exists:** manual verification (this plan's former Task 4, now Task 5) found that fetching the current page via `.aem.page` preview requires the page to have been manually previewed at least once — confirmed directly: a freshly-edited test page 404'd on preview immediately after a metadata edit, and only worked after an explicit Preview action. This defeats the point of a pre-publish governance check. The fix is to read everything from DA's raw source (`content.da.live`) instead, authenticated with the DA SDK's `token`. This uncovered a second, deeper issue: DA's raw source has no `<head>` at all — page metadata lives in a `<div class="metadata">` block inside `<body>` instead — so template/metadata resolution has to change from reading `<head>` meta tags to reading that block, and block extraction needs to exclude that same `.metadata` block (and its sibling `section-metadata` style-directive blocks) as pseudo-blocks, since both get consumed and removed by the rendering pipeline and would otherwise show up as spurious "Added" findings. See the design spec's Background section for the full investigation (raw source vs. preview HTML dumps, confirmed empirically).

Also confirmed during that same manual verification: `context.path` **is** present on the DA SDK's `context` (`{ org: "adobedrago", repo: "kp-hw", path: "/index-copy", ref: "main", view: "canvas" }`) — the design spec's one open risk is resolved, no further spike needed. `context.ref` is dropped entirely by this task — DA source has no branch/ref concept, so it's unused going forward.

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js` — full-file replacement (not an append — several Task 1/2 functions change behavior, one is removed, one is added)
- Modify: `test/tools/template-governance/template-governance-utils.test.js` — full-file replacement to match
- Modify: `tools/template-governance/template-governance.js` — fetch mechanism, token threading, drop `ref`

**Interfaces:**
- Removes: `buildPreviewUrl` (no longer used anywhere in this plugin — everything is a DA source fetch now)
- Adds: `buildSourceUrl(path: string, org: string, repo: string): string` — `https://content.da.live/{org}/{repo}{path}`
- Changes behavior (same names/signatures, different implementation): `resolveTemplateFromHtml(html: string): string | null` — now reads the `.metadata` block's `template` row instead of `<head> meta[name="template"]`; `extractMetadataFields(html: string): string[]` — now reads the `.metadata` block's row keys instead of `<head>` meta tags; `extractBlockNames(html: string): string[]` — same shape, now excludes `section-metadata` and `metadata` as structural pseudo-blocks
- Unchanged: `parseContentDaUrl`, `findTemplateEntry`, `diffSets`

- [ ] **Step 1: Replace the test file with the rewritten test suite (RED)**

Replace the entire contents of `test/tools/template-governance/template-governance-utils.test.js`:

```js
import { expect } from '@esm-bundle/chai';
import {
  buildSourceUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
  extractBlockNames,
  extractMetadataFields,
  diffSets,
} from '../../../tools/template-governance/template-governance-utils.js';

describe('template-governance-utils.js', () => {
  describe('buildSourceUrl', () => {
    it('builds a DA source URL for a path', () => {
      expect(buildSourceUrl('/index-copy', 'adobedrago', 'kp-hw')).to.equal('https://content.da.live/adobedrago/kp-hw/index-copy');
    });
  });

  describe('resolveTemplateFromHtml', () => {
    it('reads the template name from the .metadata block', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>title</p></div><div><p>Home</p></div></div>
            <div><div><p>template</p></div><div><p>Homepage</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(resolveTemplateFromHtml(html)).to.equal('Homepage');
    });

    it('matches the template row key case-insensitively', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>Template</p></div><div><p>Homepage</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(resolveTemplateFromHtml(html)).to.equal('Homepage');
    });

    it('returns null when there is no .metadata block', () => {
      expect(resolveTemplateFromHtml('<html><body><main></main></body></html>')).to.equal(null);
    });

    it('returns null when the .metadata block has no template row', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>title</p></div><div><p>Home</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(resolveTemplateFromHtml(html)).to.equal(null);
    });
  });

  describe('parseContentDaUrl', () => {
    it('parses org, repo, and path from a content.da.live URL', () => {
      const result = parseContentDaUrl('https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage');
      expect(result).to.deep.equal({
        org: 'adobedrago',
        repo: 'ak-kaiserpermanente',
        path: '/docs/library/templates/homepage',
      });
    });

    it('returns null for a URL that is not a content.da.live URL', () => {
      expect(parseContentDaUrl('https://example.com/adobedrago/kp-hw/foo')).to.equal(null);
    });
  });

  describe('findTemplateEntry', () => {
    const entries = [
      { key: 'Homepage', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage' },
      { key: 'Support', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/support' },
    ];

    it('finds an entry by key, case-insensitively', () => {
      expect(findTemplateEntry(entries, 'homepage')).to.deep.equal(entries[0]);
    });

    it('returns null when no entry matches', () => {
      expect(findTemplateEntry(entries, 'article')).to.equal(null);
    });
  });

  describe('extractBlockNames', () => {
    it('extracts the block name (first class) from each section-level block div', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
          </div>
          <div>
            <div class="columns two-up"><div>a</div><div>b</div></div>
            <p>default content, not a block</p>
          </div>
        </main></body></html>
      `;
      expect(extractBlockNames(html)).to.deep.equal(['hero', 'columns']);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractBlockNames('<html><body></body></html>')).to.deep.equal([]);
    });

    it('deduplicates repeated block names', () => {
      const html = `
        <html><body><main>
          <div><div class="hero"><div>a</div></div></div>
          <div><div class="hero"><div>b</div></div></div>
        </main></body></html>
      `;
      expect(extractBlockNames(html)).to.deep.equal(['hero']);
    });

    it('excludes structural pseudo-blocks (section-metadata, metadata)', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
          </div>
          <div>
            <div class="hero"><div>content</div></div>
          </div>
          <div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractBlockNames(html)).to.deep.equal(['hero']);
    });
  });

  describe('extractMetadataFields', () => {
    it('extracts the key from each row of the .metadata block', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>title</p></div><div><p>Home</p></div></div>
            <div><div><p>template</p></div><div><p>Homepage</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(extractMetadataFields(html)).to.deep.equal(['title', 'template']);
    });

    it('returns an empty array when there is no .metadata block', () => {
      expect(extractMetadataFields('<html><body><main></main></body></html>')).to.deep.equal([]);
    });
  });

  describe('diffSets', () => {
    it('reports reference names missing from the current set', () => {
      const { missing } = diffSets(['hero'], ['hero', 'columns']);
      expect(missing).to.deep.equal(['columns']);
    });

    it('reports current names not present in the reference set', () => {
      const { added } = diffSets(['hero', 'extra-block'], ['hero']);
      expect(added).to.deep.equal(['extra-block']);
    });

    it('reports no findings when the sets match exactly', () => {
      expect(diffSets(['hero'], ['hero'])).to.deep.equal({ missing: [], added: [] });
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — `buildSourceUrl` doesn't exist yet, and `resolveTemplateFromHtml`/`extractMetadataFields`/`extractBlockNames` still implement the old `<head>`-based behavior, so their new test cases fail against the old implementation.

- [ ] **Step 3: Replace the implementation file (GREEN)**

Replace the entire contents of `tools/template-governance/template-governance-utils.js`:

```js
const CONTENT_DA_ORIGIN = 'https://content.da.live';
const STRUCTURAL_BLOCK_NAMES = new Set(['section-metadata', 'metadata']);

export function buildSourceUrl(path, org, repo) {
  return `${CONTENT_DA_ORIGIN}/${org}/${repo}${path}`;
}

function getMetadataRows(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const metadataBlock = doc.querySelector('.metadata');
  if (!metadataBlock) return [];
  return [...metadataBlock.children]
    .map((row) => {
      const cells = [...row.children];
      return { key: cells[0]?.textContent?.trim(), value: cells[1]?.textContent?.trim() };
    })
    .filter((row) => row.key);
}

export function resolveTemplateFromHtml(html) {
  const templateRow = getMetadataRows(html).find((row) => row.key.toLowerCase() === 'template');
  return templateRow?.value || null;
}

export function extractMetadataFields(html) {
  const names = [];
  getMetadataRows(html).forEach((row) => {
    if (!names.includes(row.key)) names.push(row.key);
  });
  return names;
}

export function parseContentDaUrl(url) {
  if (!url.startsWith(`${CONTENT_DA_ORIGIN}/`)) return null;
  const [org, repo, ...pathParts] = url.slice(CONTENT_DA_ORIGIN.length + 1).split('/');
  if (!org || !repo || !pathParts.length) return null;
  return { org, repo, path: `/${pathParts.join('/')}` };
}

export function findTemplateEntry(entries, templateName) {
  const target = templateName.trim().toLowerCase();
  return entries.find((entry) => entry.key?.trim().toLowerCase() === target) || null;
}

export function extractBlockNames(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  const names = [];
  main.querySelectorAll(':scope > div > div[class]').forEach((block) => {
    const [name] = block.classList;
    if (name && !STRUCTURAL_BLOCK_NAMES.has(name) && !names.includes(name)) names.push(name);
  });
  return names;
}

export function diffSets(currentSet, referenceSet) {
  const missing = referenceSet.filter((name) => !currentSet.includes(name));
  const added = currentSet.filter((name) => !referenceSet.includes(name));
  return { missing, added };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS — all `describe` blocks green.

- [ ] **Step 5: Update `template-governance.js` to fetch via DA source with the token**

Replace the entire contents of `tools/template-governance/template-governance.js`:

```js
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { LitElement, html } from '../../deps/lit/dist/index.js';
import loadStyle from '../../scripts/utils/styles.js';
import {
  buildSourceUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
  extractBlockNames,
  extractMetadataFields,
  diffSets,
} from './template-governance-utils.js';

const styles = await loadStyle(import.meta.url);

const EL_NAME = 'template-governance-report';
const TEMPLATES_JSON_PATH = '/docs/library/templates.json';

async function fetchText(url, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
  return resp.text();
}

async function fetchReferenceHtml(templatesJsonUrl, templateName, token) {
  const json = JSON.parse(await fetchText(templatesJsonUrl, token));
  const entry = findTemplateEntry(json.data || [], templateName);
  if (!entry || typeof entry.value !== 'string') return null;
  if (!parseContentDaUrl(entry.value)) return null;
  return fetchText(entry.value, token);
}

async function buildReport(org, repo, currentHtml, token) {
  const templateName = resolveTemplateFromHtml(currentHtml);
  if (!templateName) return { status: 'no-template' };

  const templatesJsonUrl = buildSourceUrl(TEMPLATES_JSON_PATH, org, repo);
  const referenceHtml = await fetchReferenceHtml(templatesJsonUrl, templateName, token);
  if (!referenceHtml) return { status: 'no-reference', template: templateName };

  const blockDiff = diffSets(extractBlockNames(currentHtml), extractBlockNames(referenceHtml));
  const metaDiff = diffSets(
    extractMetadataFields(currentHtml),
    extractMetadataFields(referenceHtml),
  );

  return {
    status: 'ready',
    template: templateName,
    missing: [
      ...blockDiff.missing.map((name) => ({ type: 'block', name })),
      ...metaDiff.missing.map((name) => ({ type: 'metadata', name })),
    ],
    added: [
      ...blockDiff.added.map((name) => ({ type: 'block', name })),
      ...metaDiff.added.map((name) => ({ type: 'metadata', name })),
    ],
  };
}

class TemplateGovernanceReport extends LitElement {
  static properties = {
    org: { attribute: false },
    repo: { attribute: false },
    path: { attribute: false },
    token: { attribute: false },
    _status: { state: true },
    _report: { state: true },
  };

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [styles];
    this._status = 'loading';
    this._report = null;
    this._requestId = 0;
    this.load();
  }

  async load() {
    this._requestId += 1;
    const requestId = this._requestId;
    this._status = 'loading';
    try {
      const sourceUrl = buildSourceUrl(this.path, this.org, this.repo);
      const currentHtml = await fetchText(sourceUrl, this.token);
      const report = await buildReport(this.org, this.repo, currentHtml, this.token);
      if (requestId !== this._requestId) return;
      this._report = report;
      this._status = report.status;
    } catch (error) {
      if (requestId !== this._requestId) return;
      // eslint-disable-next-line no-console
      console.error('Failed to build template governance report', error);
      this._status = 'error';
    }
  }

  renderFindingList(title, findings, emptyText, variant) {
    return html`
      <div class="report-section report-section-${variant}">
        <p class="report-section-title">${title}</p>
        ${findings.length ? html`
          <ul class="finding-list">
            ${findings.map((finding) => html`
              <li class="finding-item">
                <span class="finding-type">${finding.type}</span>
                <span class="finding-name">${finding.name}</span>
              </li>
            `)}
          </ul>
        ` : html`<p class="finding-empty">${emptyText}</p>`}
      </div>
    `;
  }

  renderStatus() {
    if (this._status === 'loading') {
      return html`<div class="status-container"><p class="status">Checking against its template…</p></div>`;
    }
    if (this._status === 'no-template') {
      return html`<div class="status-container"><p class="status">This page doesn't declare a template — nothing to check.</p></div>`;
    }
    if (this._status === 'no-reference') {
      return html`<div class="status-container"><p class="status">Template "${this._report.template}" isn't in this site's template library — can't compare against it.</p></div>`;
    }
    return html`
      <div class="status-container">
        <p class="status">Couldn't build the governance report.</p>
        <button class="btn-retry" @click=${() => this.load()}>Retry</button>
      </div>
    `;
  }

  render() {
    if (this._status !== 'ready') return this.renderStatus();

    return html`
      <div class="governance-app">
        <div class="report-header">
          <p class="report-title">${this._report.template}</p>
          <button class="btn-recheck" @click=${() => this.load()}>Recheck</button>
        </div>
        ${this.renderFindingList('Missing', this._report.missing, 'None — looks consistent with its template.', 'missing')}
        ${this.renderFindingList('Added', this._report.added, 'No content beyond the base template.', 'added')}
      </div>
    `;
  }
}

customElements.define(EL_NAME, TemplateGovernanceReport);

(async function init() {
  const { context, token } = await DA_SDK;

  const report = document.createElement(EL_NAME);
  report.org = context.org;
  report.repo = context.repo;
  report.path = context.path;
  report.token = token;

  document.body.append(report);
}());
```

Note: this also removes the temporary `console.log('template-governance context:', context)` debug line that was added during Task 5's (then-Task-4's) manual verification — `context.path` is now confirmed present, so the debug line is no longer needed.

- [ ] **Step 6: Lint**

Run: `npx eslint tools/template-governance/template-governance.js tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js`
Expected: no errors.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all pass, including the rewritten `template-governance-utils.test.js` suite.

- [ ] **Step 8: Commit**

```bash
git add tools/template-governance/template-governance.js tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js
git commit -m "fix: read template-governance content from DA source instead of preview"
```

---

### Task 6: Section-and-count-aware block extraction and diff helpers

**Why this task exists:** the real `Homepage` template has 11 sections and several block types repeat across sections (`hero` twice, `columns` four times, including a `columns align-vertically` style variant that collapses to the same base name `columns`). The flat, deduplicated block-name set from Tasks 2/4 can't distinguish "the page has all 4 `columns` slots" from "the page has just 1 of the 4" — both look identical to a presence-only check. This task replaces block-level extraction/diffing with a section-and-count-aware model. Approved through visual prototyping with the user (three layout options, a hybrid, then corrected against the real template's actual structure). See the design spec's "v2" section for the full rationale, including why a naive per-section allocation (deciding *which specific* occurrence of a repeated block is "the satisfied one") was considered and rejected as false precision — repeated block types get a shared aggregate `X of Y` status at every slot they occupy instead.

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js` — full-file replacement (removes `extractBlockNames`, which nothing will call after this task; adds `extractSections`, `countBlockOccurrences`, `computeSectionStatuses`, `computeAddedBlocks`, `findReferenceBlockHtml`; keeps `buildSourceUrl`, `resolveTemplateFromHtml`, `extractMetadataFields`, `parseContentDaUrl`, `findTemplateEntry`, `diffSets` unchanged — metadata diffing still uses the flat `diffSets` approach, only block diffing changes)
- Modify: `test/tools/template-governance/template-governance-utils.test.js` — full-file replacement to match

**Interfaces:**
- Removes: `extractBlockNames` (superseded — nothing needs a flat block-name list anymore)
- Adds:
  - `extractSections(html: string): Array<{ style: string | null, blocks: string[] }>` — one entry per direct-child `<div>` of `<main>` (a section); `style` from that section's own `section-metadata` block's `style` row (or `null`); `blocks` is every other direct-child block `<div>`'s name, in document order, **not deduplicated**, excluding `section-metadata`/`metadata`.
  - `countBlockOccurrences(sections: Array<{blocks: string[]}>): Record<string, number>` — total instances of each block name across all sections.
  - `computeSectionStatuses(referenceSections: Array<{style, blocks}>, currentCounts: Record<string, number>): Array<{ style: string|null, blocks: Array<{ name: string, status: 'present'|'missing'|'partial', have: number, total: number }> }>` — one entry per reference section that has at least one real block (block-less sections, like the real template's footnotes section, are omitted). `total` is that name's reference-wide count; `have` is the current page's reference-wide count for that name; `status` is `'missing'` when `have <= 0`, `'partial'` when `0 < have < total`, `'present'` otherwise.
  - `computeAddedBlocks(currentCounts: Record<string, number>, referenceCounts: Record<string, number>): string[]` — block names present in `currentCounts` with no key at all in `referenceCounts`.
  - `findReferenceBlockHtml(referenceHtml: string, blockName: string): string | null` — the `outerHTML` of the first block `<div>` (anywhere in `<main>`, any section) whose name matches, or `null`.
- Unchanged (consumed by Task 7 exactly as before): `buildSourceUrl`, `resolveTemplateFromHtml`, `extractMetadataFields`, `parseContentDaUrl`, `findTemplateEntry`, `diffSets`.

- [ ] **Step 1: Replace the test file (RED)**

Replace the entire contents of `test/tools/template-governance/template-governance-utils.test.js`:

```js
import { expect } from '@esm-bundle/chai';
import {
  buildSourceUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
  extractSections,
  countBlockOccurrences,
  computeSectionStatuses,
  computeAddedBlocks,
  findReferenceBlockHtml,
  extractMetadataFields,
  diffSets,
} from '../../../tools/template-governance/template-governance-utils.js';

describe('template-governance-utils.js', () => {
  describe('buildSourceUrl', () => {
    it('builds a DA source URL for a path', () => {
      expect(buildSourceUrl('/index-copy', 'adobedrago', 'kp-hw')).to.equal('https://content.da.live/adobedrago/kp-hw/index-copy');
    });
  });

  describe('resolveTemplateFromHtml', () => {
    it('reads the template name from the .metadata block', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>title</p></div><div><p>Home</p></div></div>
            <div><div><p>template</p></div><div><p>Homepage</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(resolveTemplateFromHtml(html)).to.equal('Homepage');
    });

    it('returns null when there is no .metadata block', () => {
      expect(resolveTemplateFromHtml('<html><body><main></main></body></html>')).to.equal(null);
    });
  });

  describe('parseContentDaUrl', () => {
    it('parses org, repo, and path from a content.da.live URL', () => {
      const result = parseContentDaUrl('https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage');
      expect(result).to.deep.equal({
        org: 'adobedrago',
        repo: 'ak-kaiserpermanente',
        path: '/docs/library/templates/homepage',
      });
    });

    it('returns null for a URL that is not a content.da.live URL', () => {
      expect(parseContentDaUrl('https://example.com/adobedrago/kp-hw/foo')).to.equal(null);
    });
  });

  describe('findTemplateEntry', () => {
    const entries = [
      { key: 'Homepage', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage' },
      { key: 'Support', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/support' },
    ];

    it('finds an entry by key, case-insensitively', () => {
      expect(findTemplateEntry(entries, 'homepage')).to.deep.equal(entries[0]);
    });

    it('returns null when no entry matches', () => {
      expect(findTemplateEntry(entries, 'article')).to.equal(null);
    });
  });

  describe('extractSections', () => {
    it('returns one entry per section with its blocks in order and the section style', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
          </div>
          <div>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
      ]);
    });

    it('excludes the page metadata block from a section\'s blocks', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="columns"><div>a</div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['columns'] }]);
    });

    it('records multiple block instances within one section in order, not deduplicated', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="card"><div>a</div></div>
            <div class="card"><div>b</div></div>
            <div class="card"><div>c</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['card', 'card', 'card'] }]);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractSections('<html><body></body></html>')).to.deep.equal([]);
    });
  });

  describe('countBlockOccurrences', () => {
    it('sums block occurrences across all sections', () => {
      const sections = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      expect(countBlockOccurrences(sections)).to.deep.equal({ hero: 1, columns: 2 });
    });

    it('returns an empty object for no sections', () => {
      expect(countBlockOccurrences([])).to.deep.equal({});
    });
  });

  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'columns-media', status: 'present', have: 1, total: 1 }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'tabs', status: 'missing', have: 0, total: 1 }] },
      ]);
    });

    it('marks a repeated block partial at every slot when some but not all instances are present', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 1 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['partial', 'partial']);
      expect(statuses.map((s) => s.blocks[0].total)).to.deep.equal([2, 2]);
      expect(statuses.map((s) => s.blocks[0].have)).to.deep.equal([1, 1]);
    });

    it('marks a repeated block present at every slot once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });
  });

  describe('computeAddedBlocks', () => {
    it('returns block names present on the page but absent from the reference', () => {
      expect(computeAddedBlocks({ hero: 1, 'promo-banner': 1 }, { hero: 1 })).to.deep.equal(['promo-banner']);
    });

    it('returns an empty array when nothing is added', () => {
      expect(computeAddedBlocks({ hero: 1 }, { hero: 2 })).to.deep.equal([]);
    });
  });

  describe('findReferenceBlockHtml', () => {
    it('returns the outer HTML of the first matching block', () => {
      const html = `
        <html><body><main>
          <div><div class="hero"><div>content</div></div></div>
        </main></body></html>
      `;
      expect(findReferenceBlockHtml(html, 'hero')).to.equal('<div class="hero"><div>content</div></div>');
    });

    it('returns null when no block matches', () => {
      const html = '<html><body><main><div><div class="hero"></div></div></main></body></html>';
      expect(findReferenceBlockHtml(html, 'tabs')).to.equal(null);
    });

    it('returns null when there is no main element', () => {
      expect(findReferenceBlockHtml('<html><body></body></html>', 'hero')).to.equal(null);
    });
  });

  describe('extractMetadataFields', () => {
    it('extracts the key from each row of the .metadata block', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>title</p></div><div><p>Home</p></div></div>
            <div><div><p>template</p></div><div><p>Homepage</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(extractMetadataFields(html)).to.deep.equal(['title', 'template']);
    });

    it('returns an empty array when there is no .metadata block', () => {
      expect(extractMetadataFields('<html><body><main></main></body></html>')).to.deep.equal([]);
    });
  });

  describe('diffSets', () => {
    it('reports reference names missing from the current set', () => {
      const { missing } = diffSets(['hero'], ['hero', 'columns']);
      expect(missing).to.deep.equal(['columns']);
    });

    it('reports current names not present in the reference set', () => {
      const { added } = diffSets(['hero', 'extra-block'], ['hero']);
      expect(added).to.deep.equal(['extra-block']);
    });

    it('reports no findings when the sets match exactly', () => {
      expect(diffSets(['hero'], ['hero'])).to.deep.equal({ missing: [], added: [] });
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — `extractSections`, `countBlockOccurrences`, `computeSectionStatuses`, `computeAddedBlocks`, `findReferenceBlockHtml` don't exist yet.

- [ ] **Step 3: Replace the implementation file (GREEN)**

Replace the entire contents of `tools/template-governance/template-governance-utils.js`:

```js
export function buildSourceUrl(path, org, repo) {
  return `https://content.da.live/${org}/${repo}${path}`;
}

function getMetadataRows(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const metadataBlock = doc.querySelector('.metadata');
  if (!metadataBlock) return [];
  return [...metadataBlock.children]
    .map((row) => {
      const cells = [...row.children];
      return { key: cells[0]?.textContent?.trim(), value: cells[1]?.textContent?.trim() };
    })
    .filter((row) => row.key);
}

export function resolveTemplateFromHtml(html) {
  const templateRow = getMetadataRows(html).find((row) => row.key.toLowerCase() === 'template');
  return templateRow?.value || null;
}

export function extractMetadataFields(html) {
  const names = [];
  getMetadataRows(html).forEach((row) => {
    if (!names.includes(row.key)) names.push(row.key);
  });
  return names;
}

const CONTENT_DA_ORIGIN = 'https://content.da.live';

export function parseContentDaUrl(url) {
  if (!url.startsWith(`${CONTENT_DA_ORIGIN}/`)) return null;
  const [org, repo, ...pathParts] = url.slice(CONTENT_DA_ORIGIN.length + 1).split('/');
  if (!org || !repo || !pathParts.length) return null;
  return { org, repo, path: `/${pathParts.join('/')}` };
}

export function findTemplateEntry(entries, templateName) {
  const target = templateName.trim().toLowerCase();
  return entries.find((entry) => entry.key?.trim().toLowerCase() === target) || null;
}

const STRUCTURAL_BLOCK_NAMES = new Set(['section-metadata', 'metadata']);

export function extractSections(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  return [...main.children].map((section) => {
    let style = null;
    const blocks = [];
    [...section.children].forEach((child) => {
      const [name] = child.classList;
      if (!name) return;
      if (name === 'section-metadata') {
        const rows = [...child.querySelectorAll(':scope > div')];
        const styleRow = rows.find(
          (row) => row.children[0]?.textContent?.trim().toLowerCase() === 'style',
        );
        if (styleRow) style = styleRow.children[1]?.textContent?.trim() || style;
        return;
      }
      if (STRUCTURAL_BLOCK_NAMES.has(name)) return;
      blocks.push(name);
    });
    return { style, blocks };
  });
}

export function countBlockOccurrences(sections) {
  const counts = {};
  sections.forEach((section) => {
    section.blocks.forEach((name) => {
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return counts;
}

export function computeSectionStatuses(referenceSections, currentCounts) {
  const referenceCounts = countBlockOccurrences(referenceSections);
  return referenceSections
    .filter((section) => section.blocks.length > 0)
    .map((section) => ({
      style: section.style,
      blocks: section.blocks.map((name) => {
        const total = referenceCounts[name] || 0;
        const have = currentCounts[name] || 0;
        let status;
        if (have <= 0) status = 'missing';
        else if (have < total) status = 'partial';
        else status = 'present';
        return {
          name, status, have, total,
        };
      }),
    }));
}

export function computeAddedBlocks(currentCounts, referenceCounts) {
  return Object.keys(currentCounts).filter((name) => !(name in referenceCounts));
}

export function findReferenceBlockHtml(referenceHtml, blockName) {
  const doc = new DOMParser().parseFromString(referenceHtml, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return null;
  const allBlocks = [...main.children].flatMap((section) => [...section.children]);
  const match = allBlocks.find((child) => child.classList[0] === blockName);
  return match ? match.outerHTML : null;
}

export function diffSets(currentSet, referenceSet) {
  const missing = referenceSet.filter((name) => !currentSet.includes(name));
  const added = currentSet.filter((name) => !referenceSet.includes(name));
  return { missing, added };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS — all `describe` blocks green.

- [ ] **Step 5: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js`
Expected: no errors.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: passes. `npm test` only runs files under `test/`, so `template-governance.js` (the component, not touched by this task, and still importing the now-removed `extractBlockNames`) is not exercised by this command and won't cause a failure here — it's fixed in Task 7 next. Do not fix `template-governance.js` in this task.

- [ ] **Step 7: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js
git commit -m "feat: add section-and-count-aware block extraction and diff helpers"
```

---

### Task 7: Anatomy UI, add-to-page action, and auto-refresh polling

**Why this task exists:** replaces the v1 flat Missing/Added block report with a section-grouped anatomy view built on Task 6's data model, adds a one-click "Add to page" action that inserts a missing block's real markup from the reference document (reversing the plugin's original read-only design, by explicit user direction), and adds interval-based polling so the panel updates without a manual click. The metadata Missing/Added report is unchanged in substance, just recolored to match. See the design spec's "v2" section for full rationale.

**Files:**
- Modify: `tools/template-governance/template-governance.js` — full-file replacement
- Modify: `tools/template-governance/template-governance.css` — full-file replacement

**Interfaces:**
- Consumes (from Task 6, all in `./template-governance-utils.js`): `buildSourceUrl`, `resolveTemplateFromHtml`, `parseContentDaUrl`, `findTemplateEntry`, `extractSections`, `countBlockOccurrences`, `computeSectionStatuses`, `computeAddedBlocks`, `findReferenceBlockHtml`, `extractMetadataFields`, `diffSets`.
- Consumes (DA App SDK, in addition to what Task 4 already reads): `actions.sendHTML` — the component now reads `actions` from `await DA_SDK` in `init()` and threads it into the component as a property, in addition to `context.org`/`context.repo`/`context.path` and `token`.
- No automated test for this task — component wiring (DOM, `fetch`, DA SDK `postMessage`, `setInterval`, `visibilitychange`), consistent with every other `tools/*` DA app and with Tasks 3/4's precedent. Verification is manual, in Task 8.

- [ ] **Step 1: Replace `template-governance.js`**

Replace the entire contents of `tools/template-governance/template-governance.js`:

```js
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { LitElement, html } from '../../deps/lit/dist/index.js';
import loadStyle from '../../scripts/utils/styles.js';
import {
  buildSourceUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
  extractSections,
  countBlockOccurrences,
  computeSectionStatuses,
  computeAddedBlocks,
  findReferenceBlockHtml,
  extractMetadataFields,
  diffSets,
} from './template-governance-utils.js';

const styles = await loadStyle(import.meta.url);

const EL_NAME = 'template-governance-report';
const TEMPLATES_JSON_PATH = '/docs/library/templates.json';
const POLL_INTERVAL_MS = 8000;
const ADD_RECHECK_DELAY_MS = 2500;

async function fetchText(url, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
  return resp.text();
}

async function fetchReferenceHtml(templatesJsonUrl, templateName, token) {
  const json = JSON.parse(await fetchText(templatesJsonUrl, token));
  const entry = findTemplateEntry(json.data || [], templateName);
  if (!entry || typeof entry.value !== 'string') return null;
  if (!parseContentDaUrl(entry.value)) return null;
  return fetchText(entry.value, token);
}

async function buildReport(org, repo, currentHtml, token) {
  const templateName = resolveTemplateFromHtml(currentHtml);
  if (!templateName) return { status: 'no-template' };

  const templatesJsonUrl = buildSourceUrl(TEMPLATES_JSON_PATH, org, repo);
  const referenceHtml = await fetchReferenceHtml(templatesJsonUrl, templateName, token);
  if (!referenceHtml) return { status: 'no-reference', template: templateName };

  const referenceSections = extractSections(referenceHtml);
  const currentSections = extractSections(currentHtml);
  const currentCounts = countBlockOccurrences(currentSections);
  const referenceCounts = countBlockOccurrences(referenceSections);

  const sections = computeSectionStatuses(referenceSections, currentCounts);
  const addedBlocks = computeAddedBlocks(currentCounts, referenceCounts);

  const totalExpected = Object.values(referenceCounts).reduce((sum, n) => sum + n, 0);
  const totalPresent = Object.keys(referenceCounts).reduce(
    (sum, name) => sum + Math.min(currentCounts[name] || 0, referenceCounts[name]),
    0,
  );

  const metaDiff = diffSets(extractMetadataFields(currentHtml), extractMetadataFields(referenceHtml));

  return {
    status: 'ready',
    template: templateName,
    referenceHtml,
    sections,
    addedBlocks,
    totalExpected,
    totalPresent,
    missingMeta: metaDiff.missing,
    addedMeta: metaDiff.added,
  };
}

class TemplateGovernanceReport extends LitElement {
  static properties = {
    org: { attribute: false },
    repo: { attribute: false },
    path: { attribute: false },
    token: { attribute: false },
    actions: { attribute: false },
    _status: { state: true },
    _report: { state: true },
    _pendingAdd: { state: true },
  };

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [styles];
    this._status = 'loading';
    this._report = null;
    this._pendingAdd = null;
    this._requestId = 0;
    this._pollHandle = null;
    this.load();

    this._visibilityHandler = () => {
      if (document.hidden) {
        this.stopPolling();
      } else {
        this.startPolling();
        this.load({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
    if (!document.hidden) this.startPolling();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopPolling();
    document.removeEventListener('visibilitychange', this._visibilityHandler);
  }

  startPolling() {
    this.stopPolling();
    this._pollHandle = setInterval(() => this.load({ silent: true }), POLL_INTERVAL_MS);
  }

  stopPolling() {
    if (this._pollHandle) {
      clearInterval(this._pollHandle);
      this._pollHandle = null;
    }
  }

  async load({ silent = false } = {}) {
    this._requestId += 1;
    const requestId = this._requestId;
    if (!silent) this._status = 'loading';
    try {
      const currentHtml = await fetchText(buildSourceUrl(this.path, this.org, this.repo), this.token);
      const report = await buildReport(this.org, this.repo, currentHtml, this.token);
      if (requestId !== this._requestId) return;
      const changed = JSON.stringify(report) !== JSON.stringify(this._report);
      if (!silent || changed) {
        this._report = report;
        this._status = report.status;
      }
    } catch (error) {
      if (requestId !== this._requestId) return;
      if (!silent) {
        // eslint-disable-next-line no-console
        console.error('Failed to build template governance report', error);
        this._status = 'error';
      }
    }
  }

  async handleAdd(blockName) {
    if (!this._report || this._pendingAdd) return;
    const blockHtml = findReferenceBlockHtml(this._report.referenceHtml, blockName);
    if (!blockHtml) return;
    this._pendingAdd = blockName;
    this.actions.sendHTML(blockHtml);
    setTimeout(() => {
      this._pendingAdd = null;
      this.load({ silent: true });
    }, ADD_RECHECK_DELAY_MS);
  }

  renderFindingList(title, findings, emptyText, variant) {
    return html`
      <div class="report-section report-section-${variant}">
        <p class="report-section-title">${title}</p>
        ${findings.length ? html`
          <ul class="finding-list">
            ${findings.map((finding) => html`
              <li class="finding-item">
                <span class="finding-type">${finding.type}</span>
                <span class="finding-name">${finding.name}</span>
              </li>
            `)}
          </ul>
        ` : html`<p class="finding-empty">${emptyText}</p>`}
      </div>
    `;
  }

  renderBar() {
    const { totalExpected, totalPresent } = this._report;
    const segments = Array.from({ length: totalExpected }, (_, i) => i < totalPresent);
    return html`
      <div class="completeness-bar">
        ${segments.map((present) => html`
          <span class="bar-segment ${present ? 'bar-segment-present' : 'bar-segment-missing'}"></span>
        `)}
      </div>
      <p class="bar-summary">${totalPresent} of ${totalExpected} expected block instances present</p>
    `;
  }

  renderBlock(block) {
    if (block.status === 'present') {
      return html`<div class="block-chip">${block.name}</div>`;
    }
    if (block.status === 'partial') {
      return html`
        <div class="block-chip block-chip-partial">
          <span>${block.name}</span>
          <span>${block.have} of ${block.total}</span>
        </div>
      `;
    }
    const label = block.total > 1 ? `${block.name} · ${block.have} of ${block.total}` : block.name;
    const isPending = this._pendingAdd === block.name;
    return html`
      <div class="block-chip block-chip-missing">
        <span>${label}</span>
        ${isPending
          ? html`<span class="block-pending">Adding…</span>`
          : html`
            <button
              class="btn-add"
              aria-label="Add ${block.name} to page"
              @click=${() => this.handleAdd(block.name)}
            ><span aria-hidden="true">+</span></button>
          `}
      </div>
    `;
  }

  renderSection(section, index) {
    const label = section.style ? `${index + 1} · ${section.style}` : `${index + 1}`;
    return html`
      <div class="section-card">
        <p class="section-label">${label}</p>
        ${section.blocks.map((block) => this.renderBlock(block))}
      </div>
    `;
  }

  renderAdded() {
    if (!this._report.addedBlocks.length) return '';
    return html`
      <div class="added-strip">
        <p class="added-label">Beyond the template</p>
        ${this._report.addedBlocks.map((name) => html`<div class="block-chip block-chip-added">${name}</div>`)}
      </div>
    `;
  }

  renderStatus() {
    if (this._status === 'loading') {
      return html`<div class="status-container"><p class="status">Checking against its template…</p></div>`;
    }
    if (this._status === 'no-template') {
      return html`<div class="status-container"><p class="status">This page doesn't declare a template — nothing to check.</p></div>`;
    }
    if (this._status === 'no-reference') {
      return html`<div class="status-container"><p class="status">Template "${this._report.template}" isn't in this site's template library — can't compare against it.</p></div>`;
    }
    return html`
      <div class="status-container">
        <p class="status">Couldn't build the governance report.</p>
        <button class="btn-retry" @click=${() => this.load()}>Retry</button>
      </div>
    `;
  }

  render() {
    if (this._status !== 'ready') return this.renderStatus();

    return html`
      <div class="governance-app">
        <div class="report-header">
          <p class="report-title">${this._report.template}</p>
          <button class="btn-recheck" @click=${() => this.load()}>Recheck</button>
        </div>
        ${this.renderBar()}
        <div class="anatomy">
          ${this._report.sections.map((section, index) => this.renderSection(section, index))}
        </div>
        ${this.renderAdded()}
        ${this.renderFindingList(
          'Missing metadata',
          this._report.missingMeta.map((name) => ({ type: 'metadata', name })),
          'None — looks consistent with its template.',
          'missing',
        )}
        ${this.renderFindingList(
          'Added metadata',
          this._report.addedMeta.map((name) => ({ type: 'metadata', name })),
          'No metadata beyond the base template.',
          'added',
        )}
      </div>
    `;
  }
}

customElements.define(EL_NAME, TemplateGovernanceReport);

(async function init() {
  const { context, token, actions } = await DA_SDK;

  const report = document.createElement(EL_NAME);
  report.org = context.org;
  report.repo = context.repo;
  report.path = context.path;
  report.token = token;
  report.actions = actions;

  document.body.append(report);
}());
```

- [ ] **Step 2: Replace `template-governance.css`**

Replace the entire contents of `tools/template-governance/template-governance.css`:

```css
:host {
  display: block;
  height: 100%;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.status-container {
  display: flex;
  place-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 6px 20px;
  height: 90%;
  animation: fade-in-out 2s ease-in-out infinite;
}

.status-container .status {
  width: 100%;
  text-align: center;
  margin: 0;
}

@keyframes fade-in-out {
  0%, 100% {
    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }
}

.governance-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #E9E9E9;
}

.report-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.btn-recheck {
  flex-shrink: 0;
  padding: 6px 16px;
  border: none;
  border-radius: 18px;
  background-image: linear-gradient(95.85deg, #b539c8 0%, #7155fa 66%, #3b63fb 100%);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.completeness-bar {
  display: flex;
  gap: 2px;
  padding: 12px 20px 0;
}

.bar-segment {
  flex: 1;
  height: 8px;
  border-radius: 2px;
  background: #E9E9E9;
}

.bar-segment-missing {
  background: #D73220;
}

.bar-summary {
  margin: 6px 0 0;
  padding: 0 20px;
  font-size: 12px;
  color: #717171;
}

.anatomy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 20px;
}

.section-card {
  border: 1px solid #E9E9E9;
  border-radius: 6px;
  padding: 8px;
}

.section-label {
  margin: 0 0 6px;
  font-size: 10px;
  color: #717171;
}

.block-chip {
  background: #F3F3F3;
  border: 1px solid #E9E9E9;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  color: #292929;
}

.block-chip + .block-chip {
  margin-top: 4px;
}

.block-chip-partial {
  background: #FFECCF;
  border-color: #D45B00;
  color: #D45B00;
  display: flex;
  justify-content: space-between;
}

.block-chip-missing {
  background: #FFEBE8;
  border: 1px dashed #D73220;
  color: #D73220;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.block-chip-added {
  color: #505050;
}

.btn-add {
  width: 22px;
  height: 22px;
  padding: 0;
  flex-shrink: 0;
  border: 1px solid #D73220;
  border-radius: 50%;
  background: #fff;
  color: #D73220;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.block-pending {
  font-size: 11px;
  color: #D73220;
}

.added-strip {
  padding: 4px 20px 12px;
  border-bottom: 1px solid #E9E9E9;
}

.added-label {
  font-size: 10px;
  color: #717171;
  margin: 0 0 6px;
}

.report-section {
  padding: 12px 20px;
  border-left: 3px solid transparent;
}

.report-section-missing {
  border-left-color: #D73220;
}

.report-section-added {
  border-left-color: #E9E9E9;
}

.report-section-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
}

.report-section-missing .report-section-title {
  color: #D73220;
}

.report-section-added .report-section-title {
  color: #717171;
  font-weight: 600;
}

.report-section-missing .finding-type {
  color: #D73220;
  font-weight: 700;
}

.report-section-added .finding-type {
  color: #717171;
  font-weight: 400;
}

.finding-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.finding-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
}

.finding-type {
  font-size: 11px;
  text-transform: uppercase;
  color: #717171;
}

.finding-empty {
  margin: 0;
  color: #717171;
  font-size: 13px;
}

.btn-retry {
  padding: 6px 16px;
  border: none;
  border-radius: 18px;
  background-image: linear-gradient(95.85deg, #b539c8 0%, #7155fa 66%, #3b63fb 100%);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 3: Lint**

Run: `npx eslint tools/template-governance/template-governance.js`
Run: `npx stylelint tools/template-governance/template-governance.css`
Expected: no errors (stylelint here is a manual spot-check, as noted in Global Constraints).

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all pass — this fixes the dangling `extractBlockNames` import Task 6 flagged, since this task's replacement no longer references it.

- [ ] **Step 5: Commit**

```bash
git add tools/template-governance/template-governance.js tools/template-governance/template-governance.css
git commit -m "feat: build section-anatomy UI, add-to-page action, and auto-refresh polling"
```

---

### Task 9: Sequential per-section allocation for repeated block types

**Why this task exists:** Task 6 gave a block name that repeats in the reference (e.g. `columns`, `hero`) a shared aggregate status (`X of Y present`) applied identically at every section slot it occupies, specifically to avoid a "false precision" claim about which one specific occurrence is satisfied. The user tried this live in the DA editor and found it unhelpful: seeing `columns · 3 of 4` repeated at four different section positions doesn't say *where* to look. Explicit direction: switch to definitive per-slot present/missing via sequential (first-come-first-served, template document order) allocation, accepting that the specific slot assignment is arbitrary in a true tie — practical clarity over technical certainty. See the design spec's "Diffing with counts: sequential allocation, reversed from the original design" section for the full rationale.

This is a **targeted modification**, not a full-file replacement — only the `computeSectionStatuses` function (and its tests) and the `renderBlock` method (and one CSS rule) change; everything else in both files stays as-is.

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js` — replace only the `computeSectionStatuses` function body
- Modify: `test/tools/template-governance/template-governance-utils.test.js` — replace only the `describe('computeSectionStatuses', ...)` block
- Modify: `tools/template-governance/template-governance.js` — replace only the `renderBlock` method
- Modify: `tools/template-governance/template-governance.css` — remove the now-unused `.block-chip-partial` rule

**Interfaces:**
- Changes: `computeSectionStatuses(referenceSections, currentCounts): Array<{ style: string|null, blocks: Array<{ name: string, status: 'present'|'missing' }> }>` — drops `have`/`total` fields and the `'partial'` status entirely; every slot is now a clean binary, assigned by walking `referenceSections` in order and consuming a running per-name "remaining available" count seeded from `currentCounts`.
- Unchanged: `extractSections`, `countBlockOccurrences`, `computeAddedBlocks`, `findReferenceBlockHtml`, `resolveTemplateFromHtml`, `extractMetadataFields`, `parseContentDaUrl`, `findTemplateEntry`, `diffSets`, `buildSourceUrl` — none of these are touched by this task.
- `renderBlock` in `template-governance.js` no longer has a `'partial'` rendering branch; every `'missing'` block (single-occurrence or repeated-type) now shows a plain block name (no `have`/`total` suffix) with an Add button, since there's no longer a status to distinguish "give it an Add button" from "withhold it."

- [ ] **Step 1: Replace the `computeSectionStatuses` test block (RED)**

In `test/tools/template-governance/template-governance-utils.test.js`, replace this entire `describe('computeSectionStatuses', ...)` block:

```js
  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'columns-media', status: 'present', have: 1, total: 1 }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'tabs', status: 'missing', have: 0, total: 1 }] },
      ]);
    });

    it('marks a repeated block partial at every slot when some but not all instances are present', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 1 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['partial', 'partial']);
      expect(statuses.map((s) => s.blocks[0].total)).to.deep.equal([2, 2]);
      expect(statuses.map((s) => s.blocks[0].have)).to.deep.equal([1, 1]);
    });

    it('marks a repeated block present at every slot once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });
  });
```

with:

```js
  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'columns-media', status: 'present' }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'tabs', status: 'missing' }] },
      ]);
    });

    it('allocates repeated-block instances to reference sections in document order, first-come-first-served', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present', 'missing']);
    });

    it('marks every slot of a repeated block present once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('marks every slot of a repeated block missing when the page has none', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['hero'] },
      ];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['missing', 'missing']);
    });

    it('allocates independently across multiple instances of the same block within one section', () => {
      const reference = [{ style: null, blocks: ['card', 'card', 'card'] }];
      const statuses = computeSectionStatuses(reference, { card: 1 });
      expect(statuses[0].blocks.map((b) => b.status)).to.deep.equal(['present', 'missing', 'missing']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — the new test assertions (no `have`/`total` fields, sequential-allocation expectations) don't match the current aggregate-based implementation.

- [ ] **Step 3: Replace the `computeSectionStatuses` function (GREEN)**

In `tools/template-governance/template-governance-utils.js`, replace this function:

```js
export function computeSectionStatuses(referenceSections, currentCounts) {
  const referenceCounts = countBlockOccurrences(referenceSections);
  return referenceSections
    .filter((section) => section.blocks.length > 0)
    .map((section) => ({
      style: section.style,
      blocks: section.blocks.map((name) => {
        const total = referenceCounts[name] || 0;
        const have = currentCounts[name] || 0;
        let status;
        if (have <= 0) status = 'missing';
        else if (have < total) status = 'partial';
        else status = 'present';
        return {
          name, status, have, total,
        };
      }),
    }));
}
```

with:

```js
export function computeSectionStatuses(referenceSections, currentCounts) {
  const remaining = { ...currentCounts };
  return referenceSections
    .filter((section) => section.blocks.length > 0)
    .map((section) => ({
      style: section.style,
      blocks: section.blocks.map((name) => {
        const available = remaining[name] || 0;
        if (available > 0) {
          remaining[name] = available - 1;
          return { name, status: 'present' };
        }
        return { name, status: 'missing' };
      }),
    }));
}
```

Note: `countBlockOccurrences` is no longer called from inside this function (it's still exported and still used elsewhere — do not remove it, do not remove its import/usage in `template-governance.js`, only this one function's body changes).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS — all `describe` blocks green.

- [ ] **Step 5: Replace the `renderBlock` method in the component**

In `tools/template-governance/template-governance.js`, replace this method:

```js
  renderBlock(block) {
    if (block.status === 'present') {
      return html`<div class="block-chip">${block.name}</div>`;
    }
    if (block.status === 'partial') {
      return html`
        <div class="block-chip block-chip-partial">
          <span>${block.name}</span>
          <span>${block.have} of ${block.total}</span>
        </div>
      `;
    }
    const label = block.total > 1 ? `${block.name} · ${block.have} of ${block.total}` : block.name;
    const isPending = this._pendingAdd.has(block.name);
    return html`
      <div class="block-chip block-chip-missing">
        <span>${label}</span>
        ${isPending
          ? html`<span class="block-pending">Adding…</span>`
          : html`
            <button
              class="btn-add"
              aria-label="Add ${block.name} to page"
              @click=${() => this.handleAdd(block.name)}
            ><span aria-hidden="true">+</span></button>
          `}
      </div>
    `;
  }
```

with:

```js
  renderBlock(block) {
    if (block.status === 'present') {
      return html`<div class="block-chip">${block.name}</div>`;
    }
    const isPending = this._pendingAdd.has(block.name);
    return html`
      <div class="block-chip block-chip-missing">
        <span>${block.name}</span>
        ${isPending
          ? html`<span class="block-pending">Adding…</span>`
          : html`
            <button
              class="btn-add"
              aria-label="Add ${block.name} to page"
              @click=${() => this.handleAdd(block.name)}
            ><span aria-hidden="true">+</span></button>
          `}
      </div>
    `;
  }
```

- [ ] **Step 6: Remove the now-unused `.block-chip-partial` CSS rule**

In `tools/template-governance/template-governance.css`, delete this rule entirely (nothing references the `block-chip-partial` class anymore after Step 5):

```css
.block-chip-partial {
  background: #FFECCF;
  border-color: #D45B00;
  color: #D45B00;
  display: flex;
  justify-content: space-between;
}
```

- [ ] **Step 7: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js`
Run: `npx stylelint tools/template-governance/template-governance.css`
Expected: no errors.

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js tools/template-governance/template-governance.css
git commit -m "fix: switch repeated block types to sequential per-section allocation"
```

---

### Task 10: Convert reference block markup to a table before sending Add

**Why this task exists:** the user reported that clicking "Add" inserts content but not a real, editable block — confirmed by reading DA's actual editor source (`adobe/da-live`). `sendHTML`'s handler (`blocks/edit/da-library/da-library.js`) parses the sent HTML with a generic ProseMirror parser whose node types have no `parseDOM` rule for `div[class]` — only literal tags like `table`, `p`, `img`. The div-shaped block markup (`<div class="columns">...</div>`, what `findReferenceBlockHtml` returns) only becomes an editable block-table via a much larger function, `aem2doc` (in the vendored `da-parser` package), which runs on full-document load, not on a one-off `sendHTML` insert. To make `sendHTML` produce a real block, this plugin must reconstruct the `<table>` shape itself — the reverse of `prose2aem.js`'s save-time `convertBlocks()` (which turns a `.tableWrapper > table` into the stored div form): first row = a single cell with the block's class names as text (first class, plus remaining classes joined `", "` in parens), then one row per block "row" div, one cell per "cell" div within each row, using each cell div's *inner* HTML as the `<td>`'s content. See the design spec's "Why a table, not a div" subsection for the full trace through DA's source.

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js` — add one new function (append, do not touch anything else)
- Modify: `test/tools/template-governance/template-governance-utils.test.js` — add tests for the new function (append)
- Modify: `tools/template-governance/template-governance.js` — import the new function and use it in `handleAdd` before calling `sendHTML` (targeted change to `handleAdd` and the import list only)

**Interfaces:**
- Adds: `buildBlockTableHtml(blockOuterHtml: string): string | null` — parses the given block `<div>`'s outer HTML, reconstructs it as a `<table>` matching DA's authoring convention, returns the table's outer HTML as a string, or `null` if the input doesn't parse to an element.
- Unchanged: every other function in `template-governance-utils.js`.
- `handleAdd` in `template-governance.js` changes from calling `this.actions.sendHTML(blockHtml)` directly to calling `this.actions.sendHTML(tableHtml)` where `tableHtml = buildBlockTableHtml(blockHtml)`, with a null-check.

- [ ] **Step 1: Write the failing tests**

Append to `test/tools/template-governance/template-governance-utils.test.js` (add `buildBlockTableHtml` to the existing import list):

```js
describe('buildBlockTableHtml', () => {
  it('builds a table with a single-cell name row and one row per block row', () => {
    const blockHtml = '<div class="columns"><div><div>a</div><div>b</div></div><div><div>c</div><div>d</div></div></div>';
    const table = buildBlockTableHtml(blockHtml);
    expect(table).to.equal(
      '<table><tr><td colspan="2">columns</td></tr><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>',
    );
  });

  it('joins additional classes into the name row in parens', () => {
    const blockHtml = '<div class="columns two-up"><div><div>a</div></div></div>';
    const table = buildBlockTableHtml(blockHtml);
    expect(table).to.equal('<table><tr><td colspan="1">columns (two-up)</td></tr><tr><td>a</td></tr></table>');
  });

  it('treats a row with no cell divs as a single cell using the row\'s own inner HTML', () => {
    const blockHtml = '<div class="hero"><div><h1>Title</h1></div></div>';
    const table = buildBlockTableHtml(blockHtml);
    expect(table).to.equal('<table><tr><td colspan="1">hero</td></tr><tr><td><h1>Title</h1></td></tr></table>');
  });

  it('uses a cell\'s inner HTML as the td content, not the cell div itself', () => {
    const blockHtml = '<div class="tabs"><div><div><p>Tab content</p></div></div></div>';
    const table = buildBlockTableHtml(blockHtml);
    expect(table).to.equal('<table><tr><td colspan="1">tabs</td></tr><tr><td><p>Tab content</p></td></tr></table>');
  });

  it('returns null when the input has no element to parse', () => {
    expect(buildBlockTableHtml('')).to.equal(null);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — `buildBlockTableHtml` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Append to `tools/template-governance/template-governance-utils.js`:

```js
export function buildBlockTableHtml(blockOuterHtml) {
  const doc = new DOMParser().parseFromString(blockOuterHtml, 'text/html');
  const blockDiv = doc.body.firstElementChild;
  if (!blockDiv) return null;

  const [name, ...variants] = [...blockDiv.classList];
  const nameText = variants.length ? `${name} (${variants.join(', ')})` : name;

  const rows = [...blockDiv.children].filter((el) => el.tagName === 'DIV');
  const rowCells = rows.map(
    (row) => [...row.children].filter((el) => el.tagName === 'DIV'),
  );
  const maxCols = Math.max(1, ...rowCells.map((cells) => cells.length || 1));

  const bodyRowsHtml = rows.map((row, i) => {
    const cells = rowCells[i];
    if (!cells.length) return `<tr><td>${row.innerHTML}</td></tr>`;
    return `<tr>${cells.map((cell) => `<td>${cell.innerHTML}</td>`).join('')}</tr>`;
  }).join('');

  return `<table><tr><td colspan="${maxCols}">${nameText}</td></tr>${bodyRowsHtml}</table>`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS.

- [ ] **Step 5: Wire it into `handleAdd`**

In `tools/template-governance/template-governance.js`, add `buildBlockTableHtml` to the existing import from `./template-governance-utils.js` (alongside `findReferenceBlockHtml` etc.).

Replace this method:

```js
  async handleAdd(blockName) {
    if (!this._report || this._pendingAdd.has(blockName)) return;
    const blockHtml = findReferenceBlockHtml(this._report.referenceHtml, blockName);
    if (!blockHtml) return;
    this._pendingAdd.add(blockName);
    this._pendingAdd = new Set(this._pendingAdd);
    this.actions.sendHTML(blockHtml);
    setTimeout(() => {
      this._pendingAdd.delete(blockName);
      this._pendingAdd = new Set(this._pendingAdd);
      this.load({ silent: true });
    }, ADD_RECHECK_DELAY_MS);
  }
```

with:

```js
  async handleAdd(blockName) {
    if (!this._report || this._pendingAdd.has(blockName)) return;
    const blockHtml = findReferenceBlockHtml(this._report.referenceHtml, blockName);
    if (!blockHtml) return;
    const tableHtml = buildBlockTableHtml(blockHtml);
    if (!tableHtml) return;
    this._pendingAdd.add(blockName);
    this._pendingAdd = new Set(this._pendingAdd);
    this.actions.sendHTML(tableHtml);
    setTimeout(() => {
      this._pendingAdd.delete(blockName);
      this._pendingAdd = new Set(this._pendingAdd);
      this.load({ silent: true });
    }, ADD_RECHECK_DELAY_MS);
  }
```

- [ ] **Step 6: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js`
Expected: no errors.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js
git commit -m "fix: convert reference block markup to a table before sending Add"
```

---

### Task 11: Default-content indicator for the current page's actual structure — REVERTED

**Built, then removed.** The user tried this live in the DA editor and asked to have it removed (no specific reason recorded). Reverted cleanly via `git revert` of this task's commit, rather than by hand-editing the code back out — so the four files this task touched are back to their exact pre-Task-11 state. The task's original rationale is kept below for the historical record; none of it reflects the current plugin.

**Why this task existed:** the anatomy cards built so far only show blocks, aligned to the reference template's section order — they say nothing about "default content" (headings, paragraphs, lists authored directly in a section, not wrapped in any block). The user asked for a clearer, separate view of the page's real, actual structure that surfaces this — specifically naming the exact tag types present (e.g. `h2, p`), not a generic "text" label, styled with Adobe Spectrum 2's official "informative" color (`#4B75FF` border/text, `#E5F0FE` background — pulled from `@adobe/spectrum-tokens`, same source as the other status colors). Approved via prototype, placed above the existing reference-comparison anatomy cards.

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js` — targeted change to `extractSections` only (adds a `defaultContent` field to its return shape)
- Modify: `test/tools/template-governance/template-governance-utils.test.js` — replace the `describe('extractSections', ...)` block to match the new field, add new default-content-specific cases
- Modify: `tools/template-governance/template-governance.js` — targeted changes: `buildReport`'s return object gains `currentSections`; a new `renderCurrentStructure` method; `render()` calls it
- Modify: `tools/template-governance/template-governance.css` — append new rules (append only, nothing removed)

**Interfaces:**
- Changes: `extractSections(html): Array<{ style: string|null, blocks: string[], defaultContent: string[] }>` — `defaultContent` is the deduplicated, document-order list of lowercase tag names for section-direct-child elements that have no class (i.e. aren't a block or `section-metadata`/`metadata`). `style`/`blocks` behavior is unchanged.
- Unchanged: `computeSectionStatuses`, `countBlockOccurrences`, `computeAddedBlocks`, `findReferenceBlockHtml`, `buildBlockTableHtml`, and every other function — none of them read `defaultContent`, so their behavior is unaffected by the new field being present on the objects they consume.
- `buildReport`'s report object gains a `currentSections` key (the current page's own `extractSections(currentHtml)` result, already computed locally in that function — just now also returned).

- [ ] **Step 1: Replace the `describe('extractSections', ...)` test block (RED)**

In `test/tools/template-governance/template-governance-utils.test.js`, replace this entire block:

```js
  describe('extractSections', () => {
    it('returns one entry per section with its blocks in order and the section style', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
          </div>
          <div>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
      ]);
    });

    it('excludes the page metadata block from a section\'s blocks', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="columns"><div>a</div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['columns'] }]);
    });

    it('records multiple block instances within one section in order, not deduplicated', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="card"><div>a</div></div>
            <div class="card"><div>b</div></div>
            <div class="card"><div>c</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['card', 'card', 'card'] }]);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractSections('<html><body></body></html>')).to.deep.equal([]);
    });
  });
```

with:

```js
  describe('extractSections', () => {
    it('returns one entry per section with its blocks in order and the section style', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
          </div>
          <div>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: ['hero'], defaultContent: [] },
        { style: null, blocks: ['columns'], defaultContent: [] },
      ]);
    });

    it('excludes the page metadata block from a section\'s blocks', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="columns"><div>a</div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['columns'], defaultContent: [] }]);
    });

    it('records multiple block instances within one section in order, not deduplicated', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="card"><div>a</div></div>
            <div class="card"><div>b</div></div>
            <div class="card"><div>c</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['card', 'card', 'card'], defaultContent: [] }]);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractSections('<html><body></body></html>')).to.deep.equal([]);
    });

    it('records the tag names of default (non-block) content, deduplicated and in order', () => {
      const html = `
        <html><body><main>
          <div>
            <h2>Heading</h2>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: [], defaultContent: ['h2', 'p'] }]);
    });

    it('records both default content and blocks in the same section', () => {
      const html = `
        <html><body><main>
          <div>
            <h2>Intro</h2>
            <p>Some text</p>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: null, blocks: ['columns'], defaultContent: ['h2', 'p'] },
      ]);
    });

    it('does not count section-metadata or the page metadata block as default content', () => {
      const html = `
        <html><body><main>
          <div>
            <p>Some text</p>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: [], defaultContent: ['p'] },
      ]);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — the new tests assert `defaultContent`, which the current implementation doesn't produce.

- [ ] **Step 3: Replace the `extractSections` function (GREEN)**

In `tools/template-governance/template-governance-utils.js`, replace this function:

```js
export function extractSections(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  return [...main.children].map((section) => {
    let style = null;
    const blocks = [];
    [...section.children].forEach((child) => {
      const [name] = child.classList;
      if (!name) return;
      if (name === 'section-metadata') {
        const rows = [...child.querySelectorAll(':scope > div')];
        const styleRow = rows.find(
          (row) => row.children[0]?.textContent?.trim().toLowerCase() === 'style',
        );
        if (styleRow) style = styleRow.children[1]?.textContent?.trim() || style;
        return;
      }
      if (STRUCTURAL_BLOCK_NAMES.has(name)) return;
      blocks.push(name);
    });
    return { style, blocks };
  });
}
```

with:

```js
export function extractSections(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  return [...main.children].map((section) => {
    let style = null;
    const blocks = [];
    const defaultContent = [];
    [...section.children].forEach((child) => {
      const [name] = child.classList;
      if (!name) {
        const tag = child.tagName.toLowerCase();
        if (!defaultContent.includes(tag)) defaultContent.push(tag);
        return;
      }
      if (name === 'section-metadata') {
        const rows = [...child.querySelectorAll(':scope > div')];
        const styleRow = rows.find(
          (row) => row.children[0]?.textContent?.trim().toLowerCase() === 'style',
        );
        if (styleRow) style = styleRow.children[1]?.textContent?.trim() || style;
        return;
      }
      if (STRUCTURAL_BLOCK_NAMES.has(name)) return;
      blocks.push(name);
    });
    return { style, blocks, defaultContent };
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS.

- [ ] **Step 5: Return `currentSections` from `buildReport`**

In `tools/template-governance/template-governance.js`, replace this return statement (the end of `buildReport`):

```js
  return {
    status: 'ready',
    template: templateName,
    referenceHtml,
    sections,
    addedBlocks,
    totalExpected,
    totalPresent,
    missingMeta: metaDiff.missing,
    addedMeta: metaDiff.added,
  };
}
```

with:

```js
  return {
    status: 'ready',
    template: templateName,
    referenceHtml,
    currentSections,
    sections,
    addedBlocks,
    totalExpected,
    totalPresent,
    missingMeta: metaDiff.missing,
    addedMeta: metaDiff.added,
  };
}
```

(`currentSections` is already computed earlier in this same function via `const currentSections = extractSections(currentHtml);` — this step only adds it to the returned object, no other change.)

- [ ] **Step 6: Add the `renderCurrentStructure` method**

In `tools/template-governance/template-governance.js`, insert this new method immediately after the `renderBar()` method (right after `renderBar()`'s closing `}`, before `renderBlock(block)`):

```js
  renderCurrentStructure() {
    if (!this._report.currentSections.length) return '';
    return html`
      <div class="current-structure">
        <p class="current-structure-label">Your page's actual structure</p>
        ${this._report.currentSections.map((section, index) => html`
          <div class="section-card">
            <p class="section-label">${index + 1}</p>
            <div class="chip-row">
              ${section.defaultContent.length ? html`
                <span class="chip chip-default-content">${section.defaultContent.join(', ')}</span>
              ` : ''}
              ${section.blocks.map((name) => html`<span class="chip chip-block">${name}</span>`)}
            </div>
          </div>
        `)}
      </div>
    `;
  }
```

- [ ] **Step 7: Wire it into `render()`**

In `tools/template-governance/template-governance.js`, replace this line in `render()`:

```js
        <p class="add-hint">Click where you want new content in the page, then use + to add it there.</p>
        <div class="anatomy">
```

with:

```js
        <p class="add-hint">Click where you want new content in the page, then use + to add it there.</p>
        ${this.renderCurrentStructure()}
        <div class="anatomy">
```

- [ ] **Step 8: Append new CSS rules**

Append to the end of `tools/template-governance/template-governance.css`:

```css
.current-structure {
  padding: 12px 20px;
  border-bottom: 1px solid #E9E9E9;
}

.current-structure-label {
  font-size: 11px;
  color: #717171;
  margin: 0 0 8px;
}

.current-structure .section-card {
  margin-bottom: 6px;
}

.current-structure .section-card:last-child {
  margin-bottom: 0;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chip {
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 12px;
}

.chip-block {
  background: #F3F3F3;
  border: 1px solid #E9E9E9;
  color: #292929;
}

.chip-default-content {
  background: #E5F0FE;
  border: 1px solid #4B75FF;
  color: #4B75FF;
}
```

- [ ] **Step 9: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js`
Run: `npx stylelint tools/template-governance/template-governance.css`
Expected: no errors.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 11: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js tools/template-governance/template-governance.css
git commit -m "feat: add default-content indicator for the page's actual structure"
```

---

### Task 12: Merge the default-content indicator into the existing anatomy cards

**Why this task exists:** Task 11 built a default-content indicator as a separate "Your page's actual structure" strip, above the reference-comparison anatomy cards. The user tried it live and asked for it to be removed (Task 11 was reverted via `git revert` — see its entry above). When asked what to do with the underlying information, the user clarified: keep showing the specific default-content tag names (h1, h2, p, etc.), but merge them into the *existing* reference-comparison anatomy cards instead of a separate parallel view. This task re-adds `extractSections`'s `defaultContent` field (identical to Task 11's version) and threads it through `computeSectionStatuses` into the existing per-section cards, using **positional (by original reference-section index, before filtering) pairing** between the current page's sections and the reference's — an accepted heuristic, not verified identity (see the design spec's updated "Default-content indicator" section for the full rationale, including why this pairing can misattribute content if sections were reordered relative to the template).

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js` — targeted changes to `extractSections` and `computeSectionStatuses` only
- Modify: `test/tools/template-governance/template-governance-utils.test.js` — replace the `describe('extractSections', ...)` and `describe('computeSectionStatuses', ...)` blocks to match
- Modify: `tools/template-governance/template-governance.js` — targeted changes: the `computeSectionStatuses` call site in `buildReport`, and `renderSection`
- Modify: `tools/template-governance/template-governance.css` — append one new rule

**Interfaces:**
- Changes: `extractSections(html): Array<{ style, blocks, defaultContent: string[] }>` — same as Task 11's version (deduplicated, document-order lowercase tag names for unclassed section-direct-children).
- Changes: `computeSectionStatuses(referenceSections, currentCounts, currentSections = []): Array<{ style, defaultContent: string[], blocks: Array<{name, status}> }>` — gains the optional third parameter and a `defaultContent` field per returned (surviving) section, positionally paired to `currentSections[originalIndex]` (the index into `referenceSections` *before* the block-less-section filter runs).
- Unchanged: `countBlockOccurrences`, `computeAddedBlocks`, `findReferenceBlockHtml`, `buildBlockTableHtml`, `resolveTemplateFromHtml`, `extractMetadataFields`, `parseContentDaUrl`, `findTemplateEntry`, `diffSets`, `buildSourceUrl`, the polling lifecycle, the Add-handler logic.

- [ ] **Step 1: Replace the `describe('extractSections', ...)` test block (RED)**

In `test/tools/template-governance/template-governance-utils.test.js`, replace this entire block:

```js
  describe('extractSections', () => {
    it('returns one entry per section with its blocks in order and the section style', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
          </div>
          <div>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
      ]);
    });

    it('excludes the page metadata block from a section\'s blocks', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="columns"><div>a</div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['columns'] }]);
    });

    it('records multiple block instances within one section in order, not deduplicated', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="card"><div>a</div></div>
            <div class="card"><div>b</div></div>
            <div class="card"><div>c</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['card', 'card', 'card'] }]);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractSections('<html><body></body></html>')).to.deep.equal([]);
    });
  });
```

with:

```js
  describe('extractSections', () => {
    it('returns one entry per section with its blocks in order and the section style', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
          </div>
          <div>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: ['hero'], defaultContent: [] },
        { style: null, blocks: ['columns'], defaultContent: [] },
      ]);
    });

    it('excludes the page metadata block from a section\'s blocks', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="columns"><div>a</div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['columns'], defaultContent: [] }]);
    });

    it('records multiple block instances within one section in order, not deduplicated', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="card"><div>a</div></div>
            <div class="card"><div>b</div></div>
            <div class="card"><div>c</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['card', 'card', 'card'], defaultContent: [] }]);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractSections('<html><body></body></html>')).to.deep.equal([]);
    });

    it('records the tag names of default (non-block) content, deduplicated and in order', () => {
      const html = `
        <html><body><main>
          <div>
            <h2>Heading</h2>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: [], defaultContent: ['h2', 'p'] }]);
    });

    it('records both default content and blocks in the same section', () => {
      const html = `
        <html><body><main>
          <div>
            <h2>Intro</h2>
            <p>Some text</p>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: null, blocks: ['columns'], defaultContent: ['h2', 'p'] },
      ]);
    });

    it('does not count section-metadata or the page metadata block as default content', () => {
      const html = `
        <html><body><main>
          <div>
            <p>Some text</p>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: [], defaultContent: ['p'] },
      ]);
    });
  });
```

- [ ] **Step 2: Replace the `describe('computeSectionStatuses', ...)` test block**

Replace this entire block:

```js
  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'columns-media', status: 'present' }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'tabs', status: 'missing' }] },
      ]);
    });

    it('allocates repeated-block instances to reference sections in document order, first-come-first-served', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present', 'missing']);
    });

    it('marks every slot of a repeated block present once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('marks every slot of a repeated block missing when the page has none', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['hero'] },
      ];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['missing', 'missing']);
    });

    it('allocates independently across multiple instances of the same block within one section', () => {
      const reference = [{ style: null, blocks: ['card', 'card', 'card'] }];
      const statuses = computeSectionStatuses(reference, { card: 1 });
      expect(statuses[0].blocks.map((b) => b.status)).to.deep.equal(['present', 'missing', 'missing']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });
  });
```

with:

```js
  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, defaultContent: [], blocks: [{ name: 'columns-media', status: 'present' }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, defaultContent: [], blocks: [{ name: 'tabs', status: 'missing' }] },
      ]);
    });

    it('allocates repeated-block instances to reference sections in document order, first-come-first-served', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present', 'missing']);
    });

    it('marks every slot of a repeated block present once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('marks every slot of a repeated block missing when the page has none', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['hero'] },
      ];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['missing', 'missing']);
    });

    it('allocates independently across multiple instances of the same block within one section', () => {
      const reference = [{ style: null, blocks: ['card', 'card', 'card'] }];
      const statuses = computeSectionStatuses(reference, { card: 1 });
      expect(statuses[0].blocks.map((b) => b.status)).to.deep.equal(['present', 'missing', 'missing']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });

    it('defaults defaultContent to an empty array when no currentSections argument is given', () => {
      const reference = [{ style: null, blocks: ['hero'] }];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses[0].defaultContent).to.deep.equal([]);
    });

    it('pairs each surviving reference section with the current page section at the same original index', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
      ];
      const current = [
        { style: null, blocks: ['hero'], defaultContent: ['h1', 'p'] },
        { style: null, blocks: ['columns'], defaultContent: ['p'] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1, columns: 1 }, current);
      expect(statuses.map((s) => s.defaultContent)).to.deep.equal([['h1', 'p'], ['p']]);
    });

    it('preserves the original reference index when pairing, even when an earlier section is filtered out', () => {
      const reference = [
        { style: 'footnotes', blocks: [] },
        { style: null, blocks: ['hero'] },
      ];
      const current = [
        { style: null, blocks: [], defaultContent: ['ignored-because-filtered-out'] },
        { style: null, blocks: ['hero'], defaultContent: ['h2'] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 }, current);
      expect(statuses).to.have.lengthOf(1);
      expect(statuses[0].defaultContent).to.deep.equal(['h2']);
    });

    it('defaults to an empty array when there is no current section at the corresponding index', () => {
      const reference = [{ style: null, blocks: ['hero'] }];
      const statuses = computeSectionStatuses(reference, { hero: 1 }, []);
      expect(statuses[0].defaultContent).to.deep.equal([]);
    });
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — `extractSections` doesn't produce `defaultContent` yet, and `computeSectionStatuses` doesn't accept a third argument or return `defaultContent` yet.

- [ ] **Step 4: Replace `extractSections`**

Replace this function:

```js
export function extractSections(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  return [...main.children].map((section) => {
    let style = null;
    const blocks = [];
    [...section.children].forEach((child) => {
      const [name] = child.classList;
      if (!name) return;
      if (name === 'section-metadata') {
        const rows = [...child.querySelectorAll(':scope > div')];
        const styleRow = rows.find(
          (row) => row.children[0]?.textContent?.trim().toLowerCase() === 'style',
        );
        if (styleRow) style = styleRow.children[1]?.textContent?.trim() || style;
        return;
      }
      if (STRUCTURAL_BLOCK_NAMES.has(name)) return;
      blocks.push(name);
    });
    return { style, blocks };
  });
}
```

with:

```js
export function extractSections(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  return [...main.children].map((section) => {
    let style = null;
    const blocks = [];
    const defaultContent = [];
    [...section.children].forEach((child) => {
      const [name] = child.classList;
      if (!name) {
        const tag = child.tagName.toLowerCase();
        if (!defaultContent.includes(tag)) defaultContent.push(tag);
        return;
      }
      if (name === 'section-metadata') {
        const rows = [...child.querySelectorAll(':scope > div')];
        const styleRow = rows.find(
          (row) => row.children[0]?.textContent?.trim().toLowerCase() === 'style',
        );
        if (styleRow) style = styleRow.children[1]?.textContent?.trim() || style;
        return;
      }
      if (STRUCTURAL_BLOCK_NAMES.has(name)) return;
      blocks.push(name);
    });
    return { style, blocks, defaultContent };
  });
}
```

- [ ] **Step 5: Replace `computeSectionStatuses`**

Replace this function:

```js
export function computeSectionStatuses(referenceSections, currentCounts) {
  const remaining = { ...currentCounts };
  return referenceSections
    .filter((section) => section.blocks.length > 0)
    .map((section) => ({
      style: section.style,
      blocks: section.blocks.map((name) => {
        const available = remaining[name] || 0;
        if (available > 0) {
          remaining[name] = available - 1;
          return { name, status: 'present' };
        }
        return { name, status: 'missing' };
      }),
    }));
}
```

with:

```js
export function computeSectionStatuses(referenceSections, currentCounts, currentSections = []) {
  const remaining = { ...currentCounts };
  return referenceSections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.blocks.length > 0)
    .map(({ section, index }) => ({
      style: section.style,
      defaultContent: currentSections[index]?.defaultContent || [],
      blocks: section.blocks.map((name) => {
        const available = remaining[name] || 0;
        if (available > 0) {
          remaining[name] = available - 1;
          return { name, status: 'present' };
        }
        return { name, status: 'missing' };
      }),
    }));
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS.

- [ ] **Step 7: Pass `currentSections` into `computeSectionStatuses` in `buildReport`**

In `tools/template-governance/template-governance.js`, replace this line:

```js
  const sections = computeSectionStatuses(referenceSections, currentCounts);
```

with:

```js
  const sections = computeSectionStatuses(referenceSections, currentCounts, currentSections);
```

- [ ] **Step 8: Render the default-content chip inside each existing anatomy card**

Replace this method:

```js
  renderSection(section, index) {
    const label = section.style ? `${index + 1} · ${section.style}` : `${index + 1}`;
    return html`
      <div class="section-card">
        <p class="section-label">${label}</p>
        ${section.blocks.map((block) => this.renderBlock(block))}
      </div>
    `;
  }
```

with:

```js
  renderSection(section, index) {
    const label = section.style ? `${index + 1} · ${section.style}` : `${index + 1}`;
    return html`
      <div class="section-card">
        <p class="section-label">${label}</p>
        ${section.defaultContent.length ? html`
          <div class="block-chip block-chip-default-content">${section.defaultContent.join(', ')}</div>
        ` : ''}
        ${section.blocks.map((block) => this.renderBlock(block))}
      </div>
    `;
  }
```

- [ ] **Step 9: Append the CSS rule**

Append to the end of `tools/template-governance/template-governance.css`:

```css
.block-chip-default-content {
  background: #E5F0FE;
  border: 1px solid #4B75FF;
  color: #4B75FF;
}
```

- [ ] **Step 10: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js`
Run: `npx stylelint tools/template-governance/template-governance.css`
Expected: no errors.

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js tools/template-governance/template-governance.css
git commit -m "feat: merge default-content indicator into the existing anatomy cards"
```

---

### Task 13: Reorient the anatomy view around the page, not the template

**Why this task exists:** the anatomy cards built so far are shaped by the reference template — one card per template section, in template order, each checked against the current page. The user asked for this reversed: the anatomy should reflect the page's own actual sections (its own order, its own count), with what the template expects that the page is missing shown as trailing "Missing from template" cards appended after the page's real sections — not the other way around. See the design spec's "UI: section-grouped anatomy view — reoriented around the page, not the template" section for the full rationale.

This task also **reverts part of Task 12**: `computeSectionStatuses`'s third parameter and `defaultContent` output are removed again, since the page-oriented cards now read `defaultContent` directly off the page's own sections (`currentSections`) with no pairing needed at all — the positional-pairing heuristic Task 12 introduced is no longer used anywhere.

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js` — revert `computeSectionStatuses` to its Task 9 (two-argument, no `defaultContent`) form
- Modify: `test/tools/template-governance/template-governance-utils.test.js` — revert the `describe('computeSectionStatuses', ...)` block to match (drop the `defaultContent`/pairing-specific tests Task 12 added; keep the `extractSections` describe block exactly as-is, unchanged)
- Modify: `tools/template-governance/template-governance.js` — `buildReport`'s call site and return object, split `renderSection` into `renderPageSection`/`renderMissingSection`, rewrite `render()`
- Modify: `tools/template-governance/template-governance.css` — append one new rule

**Interfaces:**
- Reverts: `computeSectionStatuses(referenceSections, currentCounts): Array<{ style, blocks: Array<{name, status}> }>` — back to exactly its Task 9 shape (no third parameter, no `defaultContent` field).
- `buildReport`'s returned report object: drops `sections`, adds `currentSections` (the page's own `extractSections` result — already computed locally, just now also returned) and `missingSections` (the reference-derived sections that still have at least one `'missing'` block, i.e. `computeSectionStatuses`'s output filtered).
- `renderPageSection(section, index)` — new; renders one card per `currentSections` entry: plain block-name chips (no status coloring — everything in a real page section is, by definition, present), plus the default-content chip when present.
- `renderMissingSection(section, index)` — new (renamed/adapted from the old `renderSection`); renders one card per `missingSections` entry, reusing `renderBlock` exactly as before (present/missing chip treatment, Add button on missing) — no default-content chip.
- Unchanged: `extractSections` (including its `defaultContent` field — still needed, just consumed directly now instead of via `computeSectionStatuses`), `countBlockOccurrences`, `computeAddedBlocks`, `findReferenceBlockHtml`, `buildBlockTableHtml`, `renderBlock`, the polling lifecycle, the Add-handler logic.

- [ ] **Step 1: Revert the `describe('computeSectionStatuses', ...)` test block**

Replace this entire block:

```js
  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, defaultContent: [], blocks: [{ name: 'columns-media', status: 'present' }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, defaultContent: [], blocks: [{ name: 'tabs', status: 'missing' }] },
      ]);
    });

    it('allocates repeated-block instances to reference sections in document order, first-come-first-served', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present', 'missing']);
    });

    it('marks every slot of a repeated block present once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('marks every slot of a repeated block missing when the page has none', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['hero'] },
      ];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['missing', 'missing']);
    });

    it('allocates independently across multiple instances of the same block within one section', () => {
      const reference = [{ style: null, blocks: ['card', 'card', 'card'] }];
      const statuses = computeSectionStatuses(reference, { card: 1 });
      expect(statuses[0].blocks.map((b) => b.status)).to.deep.equal(['present', 'missing', 'missing']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });

    it('defaults defaultContent to an empty array when no currentSections argument is given', () => {
      const reference = [{ style: null, blocks: ['hero'] }];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses[0].defaultContent).to.deep.equal([]);
    });

    it('pairs each surviving reference section with the current page section at the same original index', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
      ];
      const current = [
        { style: null, blocks: ['hero'], defaultContent: ['h1', 'p'] },
        { style: null, blocks: ['columns'], defaultContent: ['p'] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1, columns: 1 }, current);
      expect(statuses.map((s) => s.defaultContent)).to.deep.equal([['h1', 'p'], ['p']]);
    });

    it('preserves the original reference index when pairing, even when an earlier section is filtered out', () => {
      const reference = [
        { style: 'footnotes', blocks: [] },
        { style: null, blocks: ['hero'] },
      ];
      const current = [
        { style: null, blocks: [], defaultContent: ['ignored-because-filtered-out'] },
        { style: null, blocks: ['hero'], defaultContent: ['h2'] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 }, current);
      expect(statuses).to.have.lengthOf(1);
      expect(statuses[0].defaultContent).to.deep.equal(['h2']);
    });

    it('defaults to an empty array when there is no current section at the corresponding index', () => {
      const reference = [{ style: null, blocks: ['hero'] }];
      const statuses = computeSectionStatuses(reference, { hero: 1 }, []);
      expect(statuses[0].defaultContent).to.deep.equal([]);
    });
  });
```

with:

```js
  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'columns-media', status: 'present' }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'tabs', status: 'missing' }] },
      ]);
    });

    it('allocates repeated-block instances to reference sections in document order, first-come-first-served', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present', 'missing']);
    });

    it('marks every slot of a repeated block present once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('marks every slot of a repeated block missing when the page has none', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['hero'] },
      ];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['missing', 'missing']);
    });

    it('allocates independently across multiple instances of the same block within one section', () => {
      const reference = [{ style: null, blocks: ['card', 'card', 'card'] }];
      const statuses = computeSectionStatuses(reference, { card: 1 });
      expect(statuses[0].blocks.map((b) => b.status)).to.deep.equal(['present', 'missing', 'missing']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS. (This is a revert to a previously-passing state, so no RED phase is expected here — the test suite goes straight from "failing because the old defaultContent-aware tests no longer match the about-to-be-reverted implementation" to "passing" once Step 3 lands. Do Step 3 immediately after this step, then re-run once to confirm PASS.)

- [ ] **Step 3: Revert `computeSectionStatuses`**

Replace this function:

```js
export function computeSectionStatuses(referenceSections, currentCounts, currentSections = []) {
  const remaining = { ...currentCounts };
  return referenceSections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.blocks.length > 0)
    .map(({ section, index }) => ({
      style: section.style,
      defaultContent: currentSections[index]?.defaultContent || [],
      blocks: section.blocks.map((name) => {
        const available = remaining[name] || 0;
        if (available > 0) {
          remaining[name] = available - 1;
          return { name, status: 'present' };
        }
        return { name, status: 'missing' };
      }),
    }));
}
```

with:

```js
export function computeSectionStatuses(referenceSections, currentCounts) {
  const remaining = { ...currentCounts };
  return referenceSections
    .filter((section) => section.blocks.length > 0)
    .map((section) => ({
      style: section.style,
      blocks: section.blocks.map((name) => {
        const available = remaining[name] || 0;
        if (available > 0) {
          remaining[name] = available - 1;
          return { name, status: 'present' };
        }
        return { name, status: 'missing' };
      }),
    }));
}
```

- [ ] **Step 4: Run the tests once more to confirm they pass**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: PASS.

- [ ] **Step 5: Update `buildReport`**

Replace this:

```js
  const sections = computeSectionStatuses(referenceSections, currentCounts, currentSections);
  const addedBlocks = computeAddedBlocks(currentCounts, referenceCounts);

  const totalExpected = Object.values(referenceCounts).reduce((sum, n) => sum + n, 0);
  const totalPresent = Object.keys(referenceCounts).reduce(
    (sum, name) => sum + Math.min(currentCounts[name] || 0, referenceCounts[name]),
    0,
  );

  const metaDiff = diffSets(
    extractMetadataFields(currentHtml),
    extractMetadataFields(referenceHtml),
  );

  return {
    status: 'ready',
    template: templateName,
    referenceHtml,
    sections,
    addedBlocks,
    totalExpected,
    totalPresent,
    missingMeta: metaDiff.missing,
    addedMeta: metaDiff.added,
  };
}
```

with:

```js
  const sections = computeSectionStatuses(referenceSections, currentCounts);
  const missingSections = sections.filter(
    (section) => section.blocks.some((block) => block.status === 'missing'),
  );
  const addedBlocks = computeAddedBlocks(currentCounts, referenceCounts);

  const totalExpected = Object.values(referenceCounts).reduce((sum, n) => sum + n, 0);
  const totalPresent = Object.keys(referenceCounts).reduce(
    (sum, name) => sum + Math.min(currentCounts[name] || 0, referenceCounts[name]),
    0,
  );

  const metaDiff = diffSets(
    extractMetadataFields(currentHtml),
    extractMetadataFields(referenceHtml),
  );

  return {
    status: 'ready',
    template: templateName,
    referenceHtml,
    currentSections,
    missingSections,
    addedBlocks,
    totalExpected,
    totalPresent,
    missingMeta: metaDiff.missing,
    addedMeta: metaDiff.added,
  };
}
```

- [ ] **Step 6: Split `renderSection` into `renderPageSection` and `renderMissingSection`**

Replace this method:

```js
  renderSection(section, index) {
    const label = section.style ? `${index + 1} · ${section.style}` : `${index + 1}`;
    return html`
      <div class="section-card">
        <p class="section-label">${label}</p>
        ${section.defaultContent.length ? html`
          <div class="block-chip block-chip-default-content">${section.defaultContent.join(', ')}</div>
        ` : ''}
        ${section.blocks.map((block) => this.renderBlock(block))}
      </div>
    `;
  }
```

with:

```js
  renderPageSection(section, index) {
    const label = section.style ? `${index + 1} · ${section.style}` : `${index + 1}`;
    return html`
      <div class="section-card">
        <p class="section-label">${label}</p>
        ${section.defaultContent.length ? html`
          <div class="block-chip block-chip-default-content">${section.defaultContent.join(', ')}</div>
        ` : ''}
        ${section.blocks.map((name) => html`<div class="block-chip">${name}</div>`)}
      </div>
    `;
  }

  renderMissingSection(section, index) {
    const label = section.style ? `${index + 1} · ${section.style}` : `${index + 1}`;
    return html`
      <div class="section-card">
        <p class="section-label">${label}</p>
        ${section.blocks.map((block) => this.renderBlock(block))}
      </div>
    `;
  }
```

- [ ] **Step 7: Rewrite `render()`**

Replace this:

```js
  render() {
    if (this._status !== 'ready') return this.renderStatus();

    return html`
      <div class="governance-app">
        <div class="report-header">
          <p class="report-title">${this._report.template}</p>
          <button class="btn-recheck" @click=${() => this.load()}>Recheck</button>
        </div>
        ${this.renderBar()}
        <p class="add-hint">Click where you want new content in the page, then use + to add it there.</p>
        <div class="anatomy">
          ${this._report.sections.map((section, index) => this.renderSection(section, index))}
        </div>
        ${this.renderAdded()}
        ${this.renderFindingList(
          'Missing metadata',
          this._report.missingMeta.map((name) => ({ type: 'metadata', name })),
          'None — looks consistent with its template.',
          'missing',
        )}
        ${this.renderFindingList(
          'Added metadata',
          this._report.addedMeta.map((name) => ({ type: 'metadata', name })),
          'No metadata beyond the base template.',
          'added',
        )}
      </div>
    `;
  }
```

with:

```js
  render() {
    if (this._status !== 'ready') return this.renderStatus();

    return html`
      <div class="governance-app">
        <div class="report-header">
          <p class="report-title">${this._report.template}</p>
          <button class="btn-recheck" @click=${() => this.load()}>Recheck</button>
        </div>
        ${this.renderBar()}
        <p class="add-hint">Click where you want new content in the page, then use + to add it there.</p>
        <div class="anatomy">
          ${this._report.currentSections.map((section, index) => this.renderPageSection(section, index))}
        </div>
        ${this._report.missingSections.length ? html`
          <p class="missing-from-template-label">Missing from template</p>
          <div class="anatomy">
            ${this._report.missingSections.map((section, index) => this.renderMissingSection(section, index))}
          </div>
        ` : ''}
        ${this.renderAdded()}
        ${this.renderFindingList(
          'Missing metadata',
          this._report.missingMeta.map((name) => ({ type: 'metadata', name })),
          'None — looks consistent with its template.',
          'missing',
        )}
        ${this.renderFindingList(
          'Added metadata',
          this._report.addedMeta.map((name) => ({ type: 'metadata', name })),
          'No metadata beyond the base template.',
          'added',
        )}
      </div>
    `;
  }
```

- [ ] **Step 8: Append the CSS rule**

Append to the end of `tools/template-governance/template-governance.css`:

```css
.missing-from-template-label {
  padding: 8px 20px 0;
  margin: 0;
  font-size: 11px;
  color: #717171;
}
```

- [ ] **Step 9: Lint**

Run: `npx eslint tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js`
Run: `npx stylelint tools/template-governance/template-governance.css`
Expected: no errors.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 11: Commit**

```bash
git add tools/template-governance/template-governance-utils.js test/tools/template-governance/template-governance-utils.test.js tools/template-governance/template-governance.js tools/template-governance/template-governance.css
git commit -m "feat: reorient anatomy view around the page's own sections"
```

---

### Task 14: Manual verification and registration hand-off

This task has no code changes. It confirms the full plugin (v1 read/no-preview rework from Task 4, v2's section anatomy/add-to-page/polling from Tasks 6–7, sequential allocation from Task 9, block-table conversion from Task 10, and the page-oriented anatomy view with trailing "Missing from template" cards from Task 13) works against real content, and hands off the one remaining step (site config registration) that requires the user's own action.

Additionally for this final pass, confirm: the primary anatomy cards are ordered and numbered by the CURRENT PAGE's own real sections (not the template's), each showing that section's actual blocks (plain, no status coloring) plus a blue "informative" chip (`#4B75FF`/`#E5F0FE`) listing default-content tag names (e.g. `h2, p`) when present; confirm a "Missing from template" label and a second set of cards appears AFTER the page's own sections, only for template sections still missing at least one block, with the usual present/missing coloring and Add buttons on those; confirm a page whose sections fully satisfy the template renders zero "Missing from template" cards (and no label).

**Files:** none committed.

- [ ] **Step 1: Start the local dev server**

Run: `aem up`
Expected: serves the site locally. Note the port it reports — it's usually `3000`, but running inside a git worktree (as this branch does) picks a different per-branch port automatically; use whatever port the server actually printed, not a hardcoded assumption.

- [ ] **Step 2: Sanity-check the file loads without syntax/import errors**

Open `http://localhost:<port>/tools/template-governance/template-governance.html` directly in a browser and check the devtools console.
Expected: no red console errors about failed module resolution. The page will otherwise appear blank/stuck — expected outside DA's iframe, since `await DA_SDK` never resolves without DA's `postMessage` handshake.

- [ ] **Step 3: Add a temporary local DA library config row**

Go to `https://da.live/config#/adobedrago/kp-hw/` and add a temporary row to the **library** tab: `title: Template Governance (local)`, `path: http://localhost:<port>/tools/template-governance/template-governance.html`, `icon: <any placeholder .png URL>`, `format: dialog`.

- [ ] **Step 4: Test inside the real DA editor**

1. No page in `kp-hw` currently declares a `template` metadata value matching `Homepage`/`Support`, so first pick (or create) a draft/test page and temporarily set its page metadata's `template` field to `Homepage` (via DA's page metadata sheet, matching the `docs/library/templates.json` key) — this is a temporary edit for testing, to be reverted in this step's last part. **Do not click Preview on this page** — the panel should not require it.
2. Open that document for editing in `https://da.live/edit#/adobedrago/kp-hw/...`.
3. Open the Library panel and select the "Template Governance (local)" tab.
4. Confirm the completeness bar and section anatomy render **without requiring a Preview**: resolved template name (`Homepage`), a bar showing some fraction of the real `Homepage` template's total block instances present, and one card per real content-bearing section (the real template has 11 sections total but one — the footnotes/metadata-only section — has no content block and should not render a card). Confirm section style labels (e.g. `full-width`, `pale-blue`) appear where the reference declares them.
5. Confirm repeat-type blocks (`hero`, `columns` in the real template) show a definitive `present`/`missing` at every section slot — via sequential, first-come-first-served allocation in template order (Task 9) — not an aggregate `X of Y` badge. Every `missing` slot (single-occurrence or repeated-type) gets the dashed red (`#D73220`) treatment and an Add button.
6. Confirm the completeness bar's fully-satisfied segments render green (`#079355`), not the neutral default.
7. Click "Add" on a missing block. Confirm: the button shows an "Adding…" transient state (and that adding a *different* missing block while this one is still pending also works, not silently blocked), the reference's real content (not an empty skeleton) lands in the document **as a real, editable block table** — a table with the block name in its first row and the reference's actual content in the rows after, not loose paragraphs (this is what Task 10 fixes; confirm it actually renders as DA's native block-table UI, not just text) — at the main editor's current cursor position (verify in DA's own editor view — this plugin cannot introspect document state itself; per the panel's hint text, click into the document first to control where it lands), the panel does NOT close, and the panel automatically rechecks a few seconds later reflecting the addition (that block's status should move from `missing` to `present`). Also confirm that after this lands and the page is saved/previewed, the block actually renders correctly on the live page (round-trips back to the expected `<div class="blockname">` form).
8. Without clicking Recheck, make a small edit directly in the DA editor (e.g. add another block) and confirm the panel picks it up automatically within about 3 seconds (polling), without a manual click.
9. Switch to a different browser tab (or minimize) for a few seconds, then switch back; confirm no console errors accumulated and the panel resumes updating (visibility pause/resume).
10. Change the test page's `template` metadata to something not in the library (e.g. `Bogus`) and confirm the "isn't in this site's template library" state renders.
11. Clear the test page's `template` metadata entirely and confirm the "doesn't declare a template" state renders.
12. Force the error state (e.g. via devtools, block the current page's own source fetch) and confirm the error message with a working Retry button renders — and confirm that a background poll failure (as opposed to an explicit Retry) does NOT surface this error state over a previously-good report.
13. Confirm the Missing/Added metadata lists (unchanged in substance from v1) still render below the anatomy view.
14. Revert the test page's metadata back to its original state, and remove the temporary "Template Governance (local)" row from the config sheet.

- [ ] **Step 5: Propose permanent registration**

Once Step 4 passes, propose this row for the **library** tab of `https://da.live/config#/adobedrago/kp-hw/` (do not add it without the user's explicit go-ahead):

| title | path | icon | format |
|---|---|---|---|
| Template Governance | `https://main--kp-hw--adobedrago.aem.live/tools/template-governance/template-governance.html` | *(needs a hosted `.png` icon — none exists in the repo yet; ask the user to supply one or approve a placeholder)* | dialog |

- [ ] **Step 6: Run the full test and lint suite one more time**

Run: `npm test`
Run: `npm run lint`
Expected: both pass, confirming nothing else in the repo broke.
