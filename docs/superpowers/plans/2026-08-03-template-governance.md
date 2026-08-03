# Template Governance Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tools/template-governance/` — a read-only DA library plugin that, for the page currently open in the DA editor, resolves its declared `<meta name="template">` value, looks it up in the project's own `docs/library/templates.json` template library, fetches the matching reference document, and reports which blocks/metadata are Missing (in the reference, not on the page) or Added (on the page, not in the reference).

**Architecture:** A pure-function module (`template-governance-utils.js`) provides preview-URL building, template-name resolution, `content.da.live` URL parsing, template-entry lookup, raw-HTML block/metadata extraction, and set diffing — all testable without DOM/fetch/SDK mocking. `template-governance.js` wires the DA App SDK (`context`) to a Lit custom element that fetches the current page, looks up and fetches the one matching reference document, diffs, and renders a two-list report. No document mutation, no peer-page sampling or crawling — this is a direct diff against a single authoritative reference.

**Tech Stack:** Vanilla ES modules, Lit (vendored at `deps/lit/dist/index.js`, imported by relative path — matches `tools/scheduler/scheduler.js`, not the `da-lit` importmap bare specifier), `scripts/utils/styles.js#loadStyle` for shadow-DOM CSS, `@web/test-runner` + `@esm-bundle/chai` for unit tests (existing repo test stack, see `test/tools/fragments/fragment-utils.test.js`).

## Global Constraints

- This plugin is **read-only** — no calls to `actions.sendHTML`, `actions.sendText`, or any other document-mutating SDK action.
- The reference for a template is the single document named by `docs/library/templates.json` — no statistical sampling, no crawling the DA content tree, no `sessionStorage` caching (both fetches involved are cheap, so a "Recheck" button just re-runs the pipeline).
- "Added" (page has it, reference doesn't) is **informational, not a violation** — rendered in a separate, neutrally-styled section from "Missing". Rationale: `templates.json` entries are starting layouts, not exhaustive schemas; real pages are expected to have more content than the bare template.
- **Revised after manual verification (Task 4 below):** the plugin does not use `.aem.page` preview fetches. All fetches go through DA's raw source, `https://content.da.live/{org}/{repo}{path}`, authenticated with an `Authorization: Bearer {token}` header (the DA SDK's `token`) — because the preview-based approach required every page to have been manually previewed at least once before the panel would work at all, which defeats the point of a pre-publish governance check. Raw DA source has no `<head>`; template/metadata resolution reads the `.metadata` block instead (see Task 4).
- `context.ref` is not used anywhere in this plugin — DA source has no branch/ref concept. Only `context.org`, `context.repo`, `context.path`, and the SDK's `token` are read.
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

### Task 5: Manual verification and registration hand-off

This task has no code changes. It confirms the reworked plugin (Task 4) works against real content without requiring a prior Preview, and hands off the one remaining step (site config registration) that requires the user's own action.

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

1. No page in `kp-hw` currently declares a `template` metadata value matching `Homepage`/`Support`, so first pick (or create) a draft/test page and temporarily set its page metadata's `template` field to `Homepage` (via DA's page metadata sheet, matching the `docs/library/templates.json` key) — this is a temporary edit for testing, to be reverted in this step's last part. **Do not click Preview on this page** — the whole point of Task 4's rework is that this should work without it.
2. Open that document for editing in `https://da.live/edit#/adobedrago/kp-hw/...`.
3. Open the Library panel and select the "Template Governance (local)" tab.
4. Confirm the report renders **without requiring a Preview**: resolved template name (`Homepage`), and Missing/Added lists. Since a fresh/mostly-empty test page will be missing nearly everything the real `Homepage` reference has (`hero`, `columns`, `columns-media`, `tabs`, etc.), expect a substantial Missing list — that's the expected, correct behavior for an unpopulated page. Confirm the Missing list does NOT include `section-metadata` or `metadata` as spurious entries.
5. Click "Recheck" and confirm it re-runs the fetch/diff (e.g. visible via a brief loading state).
6. Change the test page's `template` metadata to something not in the library (e.g. `Bogus`) and confirm the "isn't in this site's template library" state renders.
7. Clear the test page's `template` metadata entirely and confirm the "doesn't declare a template" state renders.
8. Force the error state (e.g. via devtools, block the current page's own source fetch) and confirm the error message with a working Retry button renders.
9. Revert the test page's metadata back to its original state, and remove the temporary "Template Governance (local)" row from the config sheet.

- [ ] **Step 5: Propose permanent registration**

Once Step 4 passes, propose this row for the **library** tab of `https://da.live/config#/adobedrago/kp-hw/` (do not add it without the user's explicit go-ahead):

| title | path | icon | format |
|---|---|---|---|
| Template Governance | `https://main--kp-hw--adobedrago.aem.live/tools/template-governance/template-governance.html` | *(needs a hosted `.png` icon — none exists in the repo yet; ask the user to supply one or approve a placeholder)* | dialog |

- [ ] **Step 6: Run the full test and lint suite one more time**

Run: `npm test`
Run: `npm run lint`
Expected: both pass, confirming nothing else in the repo broke.
