# Template Governance Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tools/template-governance/` — a DA library plugin that, for the page currently open in the DA editor, resolves its declared `template` metadata value, looks it up in the project's own `docs/library/templates.json` template library, fetches the matching reference document, and shows a section-by-section anatomy of the page: which blocks are missing, partially present (for block types the template repeats), or present, plus a metadata Missing/Added list and an "Add to page" action that inserts a missing block's real markup from the reference document. Refreshes automatically on an interval while open.

**Architecture:** A pure-function module (`template-governance-utils.js`) provides source-URL building, template-name resolution, `content.da.live` URL parsing, template-entry lookup, section-and-count-aware block extraction/diffing, metadata extraction/diffing, and reference-block lookup — all testable without DOM/fetch/SDK mocking. `template-governance.js` wires the DA App SDK (`context`, `token`, `actions`) to a Lit custom element that fetches the current page, looks up and fetches the one matching reference document, computes the anatomy, renders it, handles the Add action, and polls on an interval for auto-refresh.

**Tech Stack:** Vanilla ES modules, Lit (vendored at `deps/lit/dist/index.js`, imported by relative path — matches `tools/scheduler/scheduler.js`, not the `da-lit` importmap bare specifier), `scripts/utils/styles.js#loadStyle` for shadow-DOM CSS, `@web/test-runner` + `@esm-bundle/chai` for unit tests (existing repo test stack, see `test/tools/fragments/fragment-utils.test.js`).

## Global Constraints

- The reference for a template is the single document named by `docs/library/templates.json` — no statistical sampling, no crawling the DA content tree, no `sessionStorage` caching.
- "Added" (page has it, reference doesn't, by name) is **informational, not a violation** — rendered neutrally, separate from Missing/Partial. Rationale: `templates.json` entries are starting layouts, not exhaustive schemas; real pages are expected to have more content than the bare template. A block type the reference wants *more* of than the page has (an "over-count", e.g. reference wants 2 `columns` and the page has 5) is out of scope — not itemized as a separate case.
- **Revised after manual verification (Task 4):** the plugin does not use `.aem.page` preview fetches. All fetches go through DA's raw source, `https://content.da.live/{org}/{repo}{path}`, authenticated with an `Authorization: Bearer {token}` header (the DA SDK's `token`) — the preview-based approach required every page to have been manually previewed at least once before the panel would work at all, which defeats the point of a pre-publish governance check. Raw DA source has no `<head>`; template/metadata resolution reads the `.metadata` block instead (see Task 4).
- `context.ref` is not used anywhere in this plugin — DA source has no branch/ref concept. `context.org`, `context.repo`, `context.path`, the SDK's `token`, and (as of Task 7) `actions` are read.
- **Block identity vs. count (Task 6):** a block name that appears more than once in the reference gets a shared aggregate status (`X of Y present`) applied identically at every section slot it occupies — never a per-slot binary claiming one specific occurrence is "the" satisfied one and another isn't. A block name appearing exactly once gets a clean binary present/missing.
- **The "Add" action reverses the plugin's original read-only design (Task 7), by explicit user direction given after reviewing the anatomy-view prototype.** It calls `actions.sendHTML` with the reference document's own block markup (not a synthesized empty skeleton), for `missing` blocks only (single-occurrence or fully-zero repeat-type) — never for `partial` blocks. It does not call `actions.closeLibrary()` — the panel stays open. There is no SDK capability to control *where* the inserted content lands; this is a known, accepted limitation of the DA App SDK, not something to work around.
- **Auto-refresh (Task 7) polls every `POLL_INTERVAL_MS = 8000` ms** while the panel is open and the tab is visible (paused on `document.visibilitychange` when hidden, resumed + immediately re-polled when visible again). A poll tick is silent: it never flips the UI to a loading state, never surfaces an error (a failed poll is swallowed and retried next tick), and only re-renders if the computed report actually changed from what's displayed. The manual "Recheck" button is not silent — it shows loading and surfaces errors, for an immediate check without waiting for the next tick.
- **Colors for status states (Task 7) are Adobe Spectrum 2's official values**, pulled from the `@adobe/spectrum-tokens` npm package (not approximated): missing `#D73220` border/text on `#FFEBE8` background; partial `#D45B00` border/text on `#FFECCF` background; neutral chrome `#E9E9E9` border, `#717171` secondary text, `#F3F3F3` card background, `#292929`/`#505050` for darker text on neutral backgrounds. The existing purple/blue gradient CTA buttons (Recheck, Retry) are unchanged — this recoloring applies to status indicators only, not general UI chrome.
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

### Task 8: Manual verification and registration hand-off

This task has no code changes. It confirms the full plugin (v1 read/no-preview rework from Task 4, plus v2's section anatomy, add-to-page action, and polling from Tasks 6–7) works against real content, and hands off the one remaining step (site config registration) that requires the user's own action.

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
5. Confirm repeat-type blocks (`hero`, `columns` in the real template) show the shared `X of Y` badge at every section slot they occupy, colored amber/notice (`#D45B00`) when partially satisfied — not a false-precision binary claiming one specific slot is satisfied and another isn't.
6. Confirm single-occurrence missing blocks (e.g. `tabs`, `cards-icon`) render with the dashed red (`#D73220`) treatment and an Add button; confirm `partial` blocks do NOT show an Add button, per the Global Constraints.
7. Click "Add" on a missing block. Confirm: the button shows an "Adding…" transient state, the reference's real block markup (not an empty skeleton) lands in the document (verify in DA's own editor view — this plugin cannot introspect document state itself), the panel does NOT close, and the panel automatically rechecks a few seconds later reflecting the addition (that block's status should move from `missing` toward `present`/`partial`).
8. Without clicking Recheck, make a small edit directly in the DA editor (e.g. add another block) and confirm the panel picks it up automatically within about 8 seconds (polling), without a manual click.
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
