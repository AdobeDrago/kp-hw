# Template Governance Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tools/template-governance/` — a read-only DA library plugin that, for the page currently open in the DA editor, resolves its declared template, samples other live pages sharing that template, derives which blocks/metadata are typical for it, and reports what the current page is missing or has unusually.

**Architecture:** A pure-function module (`template-governance-utils.js`) provides template resolution, preview-URL building, two peer-discovery paths (query-index lookup and DA admin tree crawl), raw-HTML block/metadata extraction, and frequency-based diffing — all testable without DOM/fetch/SDK mocking. `template-governance.js` wires the DA App SDK (`context`, `token`) to a Lit custom element that orchestrates discovery (with a `sessionStorage` cache), sampling, extraction, and renders a two-list report (Missing / Unusual). No document mutation — this plugin never calls `actions.sendHTML`/`sendText`.

**Tech Stack:** Vanilla ES modules, Lit (vendored at `deps/lit/dist/index.js`, imported by relative path — matches `tools/scheduler/scheduler.js`, not the `da-lit` importmap bare specifier), `scripts/utils/styles.js#loadStyle` for shadow-DOM CSS, `@web/test-runner` + `@esm-bundle/chai` for unit tests (existing repo test stack, see `test/tools/fragments/fragment-utils.test.js`).

## Global Constraints

- This plugin is **read-only** — no calls to `actions.sendHTML`, `actions.sendText`, or any other document-mutating SDK action. (Explicit design decision.)
- No hand-authored per-template rules file is introduced — the "expected shape" of a template is derived at runtime by sampling live peer pages. (Explicit design decision.)
- No block-order or heading-structure checks, no cross-template rules — presence/absence of blocks and metadata only, in this version.
- Thresholds and caps are named constants, not magic numbers: `EXPECTED_THRESHOLD = 0.6`, `RARE_THRESHOLD = 0.15` (in `template-governance-utils.js`), `SAMPLE_SIZE = 15`, `MAX_CRAWL_ENTRIES = 500` (in `template-governance.js`).
- Import Lit via `../../deps/lit/dist/index.js` (relative path), matching `tools/scheduler/scheduler.js:1` — not a bare `da-lit` specifier.
- Style the shadow root via `loadStyle(import.meta.url)` from `scripts/utils/styles.js`, matching `tools/scheduler/scheduler.js:6,19` and `tools/fragments/fragments.js`.
- The DA config "library" sheet registration (`https://da.live/config#/adobedrago/kp-hw/`) is an external, shared-config change. It is **not** performed by any task below — Task 6 ends with the exact row to propose to the user, who must confirm it themselves, same pattern as the Fragments plugin's rollout.
- `npm run lint` must pass (ESLint via `@adobe/eslint-config-helix`, Airbnb-based; `tools/template-governance/template-governance.css` is not in the `lint:css` glob — `blocks/**/*.css` and `styles/*.css` — so stylelint on it is a manual spot-check only, same situation as `tools/fragments/fragments.css`).
- `npm test` must pass (`@web/test-runner`, tests live under `test/`, mirroring the source tree).

---

### Task 1: Template resolution and preview-URL helpers

**Files:**
- Create: `tools/template-governance/template-governance-utils.js`
- Test: `test/tools/template-governance/template-governance-utils.test.js`

**Interfaces:**
- Produces (consumed by later tasks and by `template-governance.js`):
  - `buildPreviewUrl(path: string, org: string, repo: string, ref?: string): string`
  - `resolveTemplateFromHtml(html: string, pathname: string): string | null`

- [ ] **Step 1: Write the failing tests**

Create `test/tools/template-governance/template-governance-utils.test.js`:

```js
import { expect } from '@esm-bundle/chai';
import {
  buildPreviewUrl,
  resolveTemplateFromHtml,
} from '../../../tools/template-governance/template-governance-utils.js';

describe('template-governance-utils.js', () => {
  describe('buildPreviewUrl', () => {
    it('builds a preview URL for a path', () => {
      const url = buildPreviewUrl('/northern-california/health-wellness/healtharticle.foo', 'adobedrago', 'kp-hw', 'main');
      expect(url).to.equal('https://main--kp-hw--adobedrago.aem.page/northern-california/health-wellness/healtharticle.foo');
    });

    it('defaults ref to main', () => {
      expect(buildPreviewUrl('/foo', 'adobedrago', 'kp-hw')).to.equal('https://main--kp-hw--adobedrago.aem.page/foo');
    });
  });

  describe('resolveTemplateFromHtml', () => {
    it('reads the template from the meta tag when present', () => {
      const html = '<html><head><meta name="template" content="article"></head><body></body></html>';
      expect(resolveTemplateFromHtml(html, '/some/path')).to.equal('article');
    });

    it('falls back to "article" for healtharticle URLs when the meta tag is absent', () => {
      const html = '<html><head></head><body></body></html>';
      expect(resolveTemplateFromHtml(html, '/northern-california/health-wellness/healtharticle.foo')).to.equal('article');
    });

    it('returns null when there is no meta tag and the URL does not match the fallback', () => {
      const html = '<html><head></head><body></body></html>';
      expect(resolveTemplateFromHtml(html, '/some/other/path')).to.equal(null);
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
const HTML_EXT = '.html';
const ARTICLE_URL_PATTERN = /healtharticle[.-]/;

export function buildPreviewUrl(path, org, repo, ref = 'main') {
  return `https://${ref}--${repo}--${org}.aem.page${path}`;
}

export function resolveTemplateFromHtml(html, pathname) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const meta = doc.head.querySelector('meta[name="template"]');
  if (meta?.content) return meta.content;
  if (ARTICLE_URL_PATTERN.test(pathname)) return 'article';
  return null;
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
git commit -m "feat: add template resolution and preview-url helpers for template governance"
```

---

### Task 2: Peer-discovery helpers (query-index lookup, scope root, DA admin crawl support)

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js`
- Modify: `test/tools/template-governance/template-governance-utils.test.js`

**Interfaces:**
- Consumes: `HTML_EXT` (module-private constant already defined in Task 1)
- Produces (consumed by `template-governance.js` in Task 5):
  - `resolveQueryIndexEntry(pathname: string): { target: string, templateField: string } | null`
  - `resolveScopeRoot(pathname: string): string`
  - `buildListUrl(org: string, repo: string, path: string): string`
  - `toSiteRelativePath(daPath: string, org: string, repo: string): string`
  - `stripHtmlExt(path: string): string`
  - `classifyListEntries(daItems: Array<{path, name, ext?}>, org: string, repo: string): { folders: string[], pages: string[] }` — `folders` and `pages` are site-relative paths; `pages` have `.html` stripped.

- [ ] **Step 1: Write the failing tests**

Append to `test/tools/template-governance/template-governance-utils.test.js` (add these `describe` blocks inside the existing top-level `describe('template-governance-utils.js', ...)`, and add the new names to the existing `import` statement):

```js
// Add to the existing import:
//   resolveQueryIndexEntry,
//   resolveScopeRoot,
//   buildListUrl,
//   toSiteRelativePath,
//   stripHtmlExt,
//   classifyListEntries,

describe('resolveQueryIndexEntry', () => {
  it('returns the health-wellness query index entry for a matching path', () => {
    const entry = resolveQueryIndexEntry('/northern-california/health-wellness/healtharticle.foo');
    expect(entry).to.deep.equal({
      target: '/northern-california/health-wellness/query-index.json',
      templateField: 'featured',
    });
  });

  it('returns null for a path with no matching index', () => {
    expect(resolveQueryIndexEntry('/blog/some-post')).to.equal(null);
  });
});

describe('resolveScopeRoot', () => {
  it('returns the immediate parent directory of a page path', () => {
    expect(resolveScopeRoot('/northern-california/health-wellness/healtharticle.foo'))
      .to.equal('/northern-california/health-wellness');
  });

  it('returns "/" for a top-level page', () => {
    expect(resolveScopeRoot('/foo')).to.equal('/');
  });
});

describe('buildListUrl', () => {
  it('builds the DA admin list URL for a path', () => {
    expect(buildListUrl('adobedrago', 'kp-hw', '/blog')).to.equal('https://admin.da.live/list/adobedrago/kp-hw/blog');
  });
});

describe('toSiteRelativePath', () => {
  it('strips the org/repo prefix from a DA-absolute path', () => {
    expect(toSiteRelativePath('/adobedrago/kp-hw/blog/post', 'adobedrago', 'kp-hw')).to.equal('/blog/post');
  });

  it('returns the path unchanged when the prefix does not match', () => {
    expect(toSiteRelativePath('/other/path', 'adobedrago', 'kp-hw')).to.equal('/other/path');
  });
});

describe('stripHtmlExt', () => {
  it('removes a trailing .html extension', () => {
    expect(stripHtmlExt('/blog/post.html')).to.equal('/blog/post');
  });

  it('leaves paths without .html unchanged', () => {
    expect(stripHtmlExt('/blog/post')).to.equal('/blog/post');
  });
});

describe('classifyListEntries', () => {
  const daItems = [
    { path: '/adobedrago/kp-hw/blog/2024', name: '2024' },
    {
      path: '/adobedrago/kp-hw/blog/post-one.html', name: 'post-one', ext: 'html', lastModified: 1,
    },
    {
      path: '/adobedrago/kp-hw/blog/config.json', name: 'config', ext: 'json', lastModified: 2,
    },
  ];

  it('splits entries into folders and pages, dropping non-html files', () => {
    const { folders, pages } = classifyListEntries(daItems, 'adobedrago', 'kp-hw');
    expect(folders).to.deep.equal(['/blog/2024']);
    expect(pages).to.deep.equal(['/blog/post-one']);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — the new imports don't exist yet.

- [ ] **Step 3: Write the implementation**

Append to `tools/template-governance/template-governance-utils.js` (after the Task 1 code):

```js
const ADMIN_ORIGIN = 'https://admin.da.live';

const QUERY_INDEX_ENTRIES = [
  {
    prefix: '/northern-california/health-wellness/',
    target: '/northern-california/health-wellness/query-index.json',
    // helix-query.yaml's `healtharticles` index labels this property "featured",
    // but it actually selects meta[name="template"] — a pre-existing quirk in
    // that index config. We rely on the value, not the misleading key name.
    templateField: 'featured',
  },
];

export function resolveQueryIndexEntry(pathname) {
  const entry = QUERY_INDEX_ENTRIES.find((candidate) => pathname.startsWith(candidate.prefix));
  return entry ? { target: entry.target, templateField: entry.templateField } : null;
}

export function resolveScopeRoot(pathname) {
  const segments = pathname.split('/');
  segments.pop();
  const scopeRoot = segments.join('/');
  return scopeRoot || '/';
}

export function buildListUrl(org, repo, path) {
  return `${ADMIN_ORIGIN}/list/${org}/${repo}${path}`;
}

export function toSiteRelativePath(daPath, org, repo) {
  const prefix = `/${org}/${repo}`;
  return daPath.startsWith(prefix) ? daPath.slice(prefix.length) : daPath;
}

export function stripHtmlExt(path) {
  return path.endsWith(HTML_EXT) ? path.slice(0, -HTML_EXT.length) : path;
}

export function classifyListEntries(daItems, org, repo) {
  const folders = daItems
    .filter((item) => item.ext === undefined)
    .map((item) => toSiteRelativePath(item.path, org, repo));
  const pages = daItems
    .filter((item) => item.ext === 'html')
    .map((item) => stripHtmlExt(toSiteRelativePath(item.path, org, repo)));
  return { folders, pages };
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
git commit -m "feat: add peer-discovery helpers for template governance"
```

---

### Task 3: Raw-HTML block and metadata extraction

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js`
- Modify: `test/tools/template-governance/template-governance-utils.test.js`

**Interfaces:**
- Produces (consumed by `template-governance.js` in Task 5):
  - `extractBlockNames(html: string): string[]` — unique block names (first class token of each section-level block `<div>`), in document order.
  - `extractMetadataFields(html: string): string[]` — unique `meta[name]`/`meta[property]` key values, in document order.

- [ ] **Step 1: Write the failing tests**

Append to `test/tools/template-governance/template-governance-utils.test.js` (add `extractBlockNames, extractMetadataFields` to the existing import):

```js
describe('extractBlockNames', () => {
  it('extracts the block name (first class) from each section-level block div', () => {
    const html = `
      <html><body><main>
        <div>
          <div class="hero"><div>content</div></div>
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
        <meta name="template" content="article">
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — `extractBlockNames`/`extractMetadataFields` don't exist yet.

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
git commit -m "feat: add raw-HTML block and metadata extraction for template governance"
```

---

### Task 4: Sampling, frequency aggregation, and diff

**Files:**
- Modify: `tools/template-governance/template-governance-utils.js`
- Modify: `test/tools/template-governance/template-governance-utils.test.js`

**Interfaces:**
- Produces (consumed by `template-governance.js` in Task 5):
  - `sampleArray(items: string[], size?: number): string[]` — first `size` items, default `size = 15`.
  - `aggregateFrequencies(sets: string[][]): Record<string, number>` — fraction of `sets` containing each name.
  - `EXPECTED_THRESHOLD: number` (`0.6`), `RARE_THRESHOLD: number` (`0.15`) — exported constants.
  - `computeExpectedSet(frequencies: Record<string, number>, threshold?: number): string[]` — names at or above threshold (default `EXPECTED_THRESHOLD`).
  - `computeRareSet(frequencies: Record<string, number>, threshold?: number): string[]` — names at or below threshold (default `RARE_THRESHOLD`).
  - `diffPage(currentSet: string[], expectedSet: string[], rareSet: string[]): { missing: string[], unusual: string[] }`

- [ ] **Step 1: Write the failing tests**

Append to `test/tools/template-governance/template-governance-utils.test.js` (add `sampleArray, aggregateFrequencies, computeExpectedSet, computeRareSet, diffPage` to the existing import):

```js
describe('sampleArray', () => {
  it('returns at most `size` items, preserving order', () => {
    expect(sampleArray(['a', 'b', 'c', 'd'], 2)).to.deep.equal(['a', 'b']);
  });

  it('returns all items when there are fewer than `size`', () => {
    expect(sampleArray(['a'], 15)).to.deep.equal(['a']);
  });

  it('defaults size to 15', () => {
    const items = Array.from({ length: 20 }, (_, i) => `item-${i}`);
    expect(sampleArray(items)).to.have.lengthOf(15);
  });
});

describe('aggregateFrequencies', () => {
  it('computes the fraction of sets containing each name', () => {
    const sets = [['hero', 'columns'], ['hero'], ['hero', 'columns'], ['footer']];
    const frequencies = aggregateFrequencies(sets);
    expect(frequencies.hero).to.equal(0.75);
    expect(frequencies.columns).to.equal(0.5);
    expect(frequencies.footer).to.equal(0.25);
  });

  it('returns an empty object for an empty input', () => {
    expect(aggregateFrequencies([])).to.deep.equal({});
  });
});

describe('computeExpectedSet', () => {
  it('returns names at or above the threshold', () => {
    const frequencies = { hero: 0.75, columns: 0.5, footer: 0.25 };
    expect(computeExpectedSet(frequencies, 0.6)).to.deep.equal(['hero']);
  });

  it('defaults the threshold to EXPECTED_THRESHOLD', () => {
    const frequencies = { hero: 0.75, columns: 0.5 };
    expect(computeExpectedSet(frequencies)).to.deep.equal(['hero']);
  });
});

describe('computeRareSet', () => {
  it('returns names at or below the threshold', () => {
    const frequencies = { hero: 0.75, columns: 0.5, footer: 0.1 };
    expect(computeRareSet(frequencies, 0.15)).to.deep.equal(['footer']);
  });

  it('defaults the threshold to RARE_THRESHOLD', () => {
    const frequencies = { hero: 0.75, footer: 0.1 };
    expect(computeRareSet(frequencies)).to.deep.equal(['footer']);
  });
});

describe('diffPage', () => {
  it('reports expected names missing from the current set', () => {
    const { missing } = diffPage(['hero'], ['hero', 'columns'], []);
    expect(missing).to.deep.equal(['columns']);
  });

  it('reports current names that fall in the rare set', () => {
    const { unusual } = diffPage(['hero', 'oddball'], ['hero'], ['oddball']);
    expect(unusual).to.deep.equal(['oddball']);
  });

  it('reports no findings when the current set matches expectations', () => {
    expect(diffPage(['hero'], ['hero'], [])).to.deep.equal({ missing: [], unusual: [] });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/template-governance/template-governance-utils.test.js" --node-resolve`
Expected: FAIL — the new exports don't exist yet.

- [ ] **Step 3: Write the implementation**

Append to `tools/template-governance/template-governance-utils.js`:

```js
export function sampleArray(items, size = 15) {
  return items.slice(0, size);
}

export function aggregateFrequencies(sets) {
  const counts = {};
  sets.forEach((set) => {
    set.forEach((name) => {
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  const total = sets.length;
  const frequencies = {};
  Object.keys(counts).forEach((name) => {
    frequencies[name] = total ? counts[name] / total : 0;
  });
  return frequencies;
}

export const EXPECTED_THRESHOLD = 0.6;
export const RARE_THRESHOLD = 0.15;

export function computeExpectedSet(frequencies, threshold = EXPECTED_THRESHOLD) {
  return Object.keys(frequencies).filter((name) => frequencies[name] >= threshold);
}

export function computeRareSet(frequencies, threshold = RARE_THRESHOLD) {
  return Object.keys(frequencies).filter((name) => frequencies[name] <= threshold);
}

export function diffPage(currentSet, expectedSet, rareSet) {
  const missing = expectedSet.filter((name) => !currentSet.includes(name));
  const unusual = currentSet.filter((name) => rareSet.includes(name));
  return { missing, unusual };
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
git commit -m "feat: add sampling, frequency aggregation, and diff helpers for template governance"
```

---

### Task 5: Report component, styles, and DA SDK glue

**Files:**
- Create: `tools/template-governance/template-governance.html`
- Create: `tools/template-governance/template-governance.css`
- Create: `tools/template-governance/template-governance.js`

**Interfaces:**
- Consumes (from Tasks 1–4): `buildPreviewUrl`, `resolveTemplateFromHtml`, `resolveQueryIndexEntry`, `resolveScopeRoot`, `buildListUrl`, `classifyListEntries`, `extractBlockNames`, `extractMetadataFields`, `sampleArray`, `aggregateFrequencies`, `computeExpectedSet`, `computeRareSet`, `diffPage` — all from `./template-governance-utils.js`.
- Consumes (existing repo utilities): `loadStyle` (default export) from `../../scripts/utils/styles.js`; `LitElement`, `html` from `../../deps/lit/dist/index.js`; default export `DA_SDK` from `https://da.live/nx/utils/sdk.js`.
- Produces: custom element `<template-governance-report>` (tag name `template-governance-report`). No events are dispatched — this component never mutates the document, so there's nothing for a parent to react to.

There is no automated test for this task — it wires together the DOM, `fetch`, `sessionStorage`, and the DA App SDK's `postMessage` handshake, none of which this repo's test setup mocks (consistent with `tools/fragments/fragments.js`, `tools/scheduler/scheduler.js`, and `tools/quick-edit/quick-edit.js`, none of which have unit tests). Verification is manual, in Task 6.

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

.report-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
}

.btn-rescan {
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
  resolveQueryIndexEntry,
  resolveScopeRoot,
  buildListUrl,
  classifyListEntries,
  extractBlockNames,
  extractMetadataFields,
  sampleArray,
  aggregateFrequencies,
  computeExpectedSet,
  computeRareSet,
  diffPage,
} from './template-governance-utils.js';

const styles = await loadStyle(import.meta.url);

const EL_NAME = 'template-governance-report';
const MAX_CRAWL_ENTRIES = 500;
const SAMPLE_SIZE = 15;
const CACHE_PREFIX = 'template-governance';

function cacheKey(org, repo, ref, scopeRoot, template) {
  return `${CACHE_PREFIX}:${org}/${repo}/${ref}${scopeRoot}:${template}`;
}

async function fetchText(url, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
  return resp.text();
}

async function discoverViaQueryIndex(org, repo, ref, pathname, targetTemplate) {
  const entry = resolveQueryIndexEntry(pathname);
  if (!entry) return null;
  const resp = await fetch(buildPreviewUrl(entry.target, org, repo, ref));
  if (!resp.ok) return null;
  const json = await resp.json();
  return (json.data || [])
    .filter((row) => row[entry.templateField] === targetTemplate)
    .map((row) => row.path)
    .filter((path) => typeof path === 'string');
}

async function discoverViaCrawl(org, repo, ref, scopeRoot, targetTemplate, token) {
  const queue = [scopeRoot];
  const matches = [];
  let visited = 0;

  while (queue.length && visited < MAX_CRAWL_ENTRIES) {
    const path = queue.shift();
    let entries;
    try {
      entries = JSON.parse(await fetchText(buildListUrl(org, repo, path), token));
    } catch {
      // eslint-disable-next-line no-continue
      continue;
    }
    const { folders, pages } = classifyListEntries(entries, org, repo);
    queue.push(...folders);

    // eslint-disable-next-line no-restricted-syntax
    for (const pagePath of pages) {
      if (visited >= MAX_CRAWL_ENTRIES) break;
      visited += 1;
      try {
        // eslint-disable-next-line no-await-in-loop
        const pageHtml = await fetchText(buildPreviewUrl(pagePath, org, repo, ref));
        if (resolveTemplateFromHtml(pageHtml, pagePath) === targetTemplate) matches.push(pagePath);
      } catch {
        /* unreachable peer page — skip */
      }
    }
  }

  return matches;
}

async function discoverPeers(org, repo, ref, scopeRoot, targetTemplate, pathname, token) {
  const key = cacheKey(org, repo, ref, scopeRoot, targetTemplate);
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  // Query-index results, when available, are treated as authoritative (including
  // when they resolve to zero matches) — only a `null` (no matching index for this
  // path) falls back to the slower admin-tree crawl.
  const viaIndex = await discoverViaQueryIndex(org, repo, ref, pathname, targetTemplate);
  const matches = viaIndex ?? await discoverViaCrawl(org, repo, ref, scopeRoot, targetTemplate, token);

  sessionStorage.setItem(key, JSON.stringify(matches));
  return matches;
}

async function buildReport(org, repo, ref, pathname, currentHtml, token) {
  const targetTemplate = resolveTemplateFromHtml(currentHtml, pathname);
  if (!targetTemplate) return { status: 'no-template' };

  const scopeRoot = resolveScopeRoot(pathname);
  const allPeers = await discoverPeers(org, repo, ref, scopeRoot, targetTemplate, pathname, token);
  const peers = sampleArray(allPeers.filter((peerPath) => peerPath !== pathname), SAMPLE_SIZE);
  if (!peers.length) return { status: 'no-peers', template: targetTemplate };

  const blockSets = [];
  const metaSets = [];
  await Promise.all(peers.map(async (peerPath) => {
    try {
      const peerHtml = await fetchText(buildPreviewUrl(peerPath, org, repo, ref));
      blockSets.push(extractBlockNames(peerHtml));
      metaSets.push(extractMetadataFields(peerHtml));
    } catch {
      /* unreachable peer page — excluded from the sample */
    }
  }));

  const expectedBlocks = computeExpectedSet(aggregateFrequencies(blockSets));
  const rareBlocks = computeRareSet(aggregateFrequencies(blockSets));
  const expectedMeta = computeExpectedSet(aggregateFrequencies(metaSets));
  const rareMeta = computeRareSet(aggregateFrequencies(metaSets));

  const blockDiff = diffPage(extractBlockNames(currentHtml), expectedBlocks, rareBlocks);
  const metaDiff = diffPage(extractMetadataFields(currentHtml), expectedMeta, rareMeta);

  return {
    status: 'ready',
    template: targetTemplate,
    sampleSize: blockSets.length,
    missing: [
      ...blockDiff.missing.map((name) => ({ type: 'block', name })),
      ...metaDiff.missing.map((name) => ({ type: 'metadata', name })),
    ],
    unusual: [
      ...blockDiff.unusual.map((name) => ({ type: 'block', name })),
      ...metaDiff.unusual.map((name) => ({ type: 'metadata', name })),
    ],
  };
}

class TemplateGovernanceReport extends LitElement {
  static properties = {
    org: { attribute: false },
    repo: { attribute: false },
    ref: { attribute: false },
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
      const currentHtml = await fetchText(buildPreviewUrl(this.path, this.org, this.repo, this.ref));
      const report = await buildReport(this.org, this.repo, this.ref, this.path, currentHtml, this.token);
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

  handleRescan() {
    const targetTemplate = this._report?.template;
    if (targetTemplate) {
      const scopeRoot = resolveScopeRoot(this.path);
      sessionStorage.removeItem(cacheKey(this.org, this.repo, this.ref, scopeRoot, targetTemplate));
    }
    this.load();
  }

  renderFindingList(title, findings) {
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
        ` : html`<p class="finding-empty">None — looks consistent with its template.</p>`}
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
    if (this._status === 'no-peers') {
      return html`<div class="status-container"><p class="status">No other pages found for template "${this._report.template}" — can't derive an expected shape yet.</p></div>`;
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
          <div>
            <p class="report-title">${this._report.template}</p>
            <p class="report-subtitle">checked against ${this._report.sampleSize} peer page${this._report.sampleSize === 1 ? '' : 's'}</p>
          </div>
          <button class="btn-rescan" @click=${() => this.handleRescan()}>Rescan</button>
        </div>
        ${this.renderFindingList('Missing', this._report.missing)}
        ${this.renderFindingList('Unusual', this._report.unusual)}
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
  report.ref = context.ref;
  report.path = context.path;
  report.token = token;

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

### Task 6: Manual verification and registration hand-off

This task has no code changes beyond a temporary debug line (removed again in Step 1). It confirms a load-bearing assumption from the design spec, then confirms the plugin works against real content, and hands off the one remaining step (site config registration) that requires the user's own action.

**Files:** none committed.

- [ ] **Step 1: Confirm `context.path` is actually available from the DA SDK**

The design spec flags this as unconfirmed: Fragments never reads the current document's path from `DA_SDK`'s `context`, so this plugin's core assumption — that it can know which page it was opened from — has not been checked against a real payload.

Temporarily add a log line at the top of the `init()` function in `tools/template-governance/template-governance.js`:

```js
(async function init() {
  const { context, token } = await DA_SDK;
  // eslint-disable-next-line no-console
  console.log('template-governance context:', context);
  ...
```

This must be exercised inside the real DA editor (requires being logged into `https://da.live` as a user with access to `adobedrago/kp-hw`), so it must be done by the user (Lamont), not automated. Steps 2–3 below get the local server running first; come back to check devtools console output once the plugin is loaded inside DA per Step 5.

- **If a path field is present** (expected name `path`, matching the property name already used for `report.path = context.path` in the component): remove the temporary `console.log` line and proceed.
- **If it's absent or named differently:** update `report.path = context.path` in `template-governance.js` to use the correct field name before proceeding to Step 5, then remove the temporary `console.log` line. If there's no usable field at all, stop and report back — the discovery/diff pipeline has no other way to identify the current document, and the design would need to be revisited.

- [ ] **Step 2: Start the local dev server**

Run: `aem up`
Expected: serves the site at `http://localhost:3000`.

- [ ] **Step 3: Sanity-check the file loads without syntax/import errors**

Open `http://localhost:3000/tools/template-governance/template-governance.html` directly in a browser and check the devtools console.
Expected: no red console errors about failed module resolution. The page will otherwise appear blank/stuck — expected outside DA's iframe, since `await DA_SDK` never resolves without DA's `postMessage` handshake.

- [ ] **Step 4: Add a temporary local DA library config row**

Go to `https://da.live/config#/adobedrago/kp-hw/` and add a temporary row to the **library** tab: `title: Template Governance (local)`, `path: http://localhost:3000/tools/template-governance/template-governance.html`, `icon: <any placeholder .png URL>`, `format: dialog`.

- [ ] **Step 5: Test inside the real DA editor**

1. Open a document known to declare a template for editing in `https://da.live/edit#/adobedrago/kp-hw/...` — either one under `templates/article` or `templates/health-encyclopedia-article` coverage, or a `/healtharticle.*` page for the URL-fallback case.
2. Open the Library panel and select the "Template Governance (local)" tab.
3. Do Step 1's `context.path` check here (see above) before evaluating anything else.
4. Confirm the report renders: resolved template name, sample size, and Missing/Unusual lists.
5. Spot-check two or three flagged items by hand: open 2–3 real peer pages of the same template and confirm they do (for a "Missing" finding) or don't (for an "Unusual" finding) commonly have that block/metadata field.
6. Click "Rescan" and confirm it re-runs discovery (e.g. visible via a brief loading state) rather than silently reusing the cache.
7. Open a page that has no `template` meta tag and doesn't match the `healtharticle` URL fallback; confirm the "doesn't declare a template" state renders.
8. Force the error state (e.g. via devtools, block the current page's own preview fetch) and confirm the error message with a working Retry button renders.
9. Remove the temporary "Template Governance (local)" row from the config sheet once verified.

- [ ] **Step 6: Propose permanent registration**

Once Step 5 passes, propose this row for the **library** tab of `https://da.live/config#/adobedrago/kp-hw/` (do not add it without the user's explicit go-ahead):

| title | path | icon | format |
|---|---|---|---|
| Template Governance | `https://main--kp-hw--adobedrago.aem.live/tools/template-governance/template-governance.html` | *(needs a hosted `.png` icon — none exists in the repo yet; ask the user to supply one or approve a placeholder)* | dialog |

- [ ] **Step 7: Run the full test and lint suite one more time**

Run: `npm test`
Run: `npm run lint`
Expected: both pass, confirming nothing else in the repo broke.
