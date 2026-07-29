# Fragments Library Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the stubbed `tools/fragments/` app into a DA library plugin that lets an author browse `/fragments` (folders and documents) inside DA's editor and insert a link to a chosen fragment into the page they're editing.

**Architecture:** A Lit custom element (`<fragment-picker>`) fetches `GET https://admin.da.live/list/{org}/{repo}{path}` starting at `/fragments`, renders a breadcrumb + drill-down list, and on selecting a file dispatches a `fragment-select` event. `fragments.js` wires the DA App SDK (`context`, `token`, `actions`) to that element: it supplies org/repo/token as properties and, on `fragment-select`, calls `actions.sendHTML()` then `actions.closeLibrary()`. Pure logic (URL building, path conversion, sorting/filtering, breadcrumb building, HTML escaping) lives in a separate `fragment-utils.js` module so it can be unit-tested without mocking the DOM, fetch, or the DA SDK.

**Tech Stack:** Vanilla ES modules, Lit (vendored at `deps/lit/dist/index.js`, imported by relative path — this repo does **not** rely on the `da-lit` importmap bare specifier for tools; see `tools/scheduler/scheduler.js`), `scripts/utils/styles.js#loadStyle` for shadow-DOM CSS, `@web/test-runner` + `@esm-bundle/chai` for unit tests (existing repo test stack, see `test/scripts/scripts.test.js`).

## Global Constraints

- Fragment links are inserted as `<a href="{path}">{path}</a>` — the site-relative path (no `.html`) as both href and link text. (Design decision from the approved spec.)
- No search/filter UI in this version — drill-down navigation only.
- The DA config "library" sheet registration (`https://da.live/config#/adobedrago/kp-hw/`) is an external, shared-config change. It is **not** performed by any task below — Task 3 ends with the exact row to propose to the user, who must confirm it themselves.
- Follow the existing repo convention exactly: import Lit via `../../deps/lit/dist/index.js` (relative path), not a bare `da-lit` specifier — see `tools/scheduler/scheduler.js:1`.
- Style the shadow root via `loadStyle(import.meta.url)` from `scripts/utils/styles.js` (fetches the sibling `.css` file and returns a `CSSStyleSheet`) — see `tools/scheduler/scheduler.js:6,19`.
- `npm run lint` must pass (ESLint via `@adobe/eslint-config-helix`, Airbnb-based).
- `npm test` must pass (`@web/test-runner`, tests live under `test/`, mirroring the source tree).

---

### Task 1: Pure fragment-utils module

**Files:**
- Create: `tools/fragments/fragment-utils.js`
- Test: `test/tools/fragments/fragment-utils.test.js`

**Interfaces:**
- Produces (consumed by Task 2):
  - `buildListUrl(org: string, repo: string, path: string): string`
  - `toSiteRelativePath(daPath: string, org: string, repo: string): string`
  - `stripHtmlExt(path: string): string`
  - `buildFragmentPath(daPath: string, org: string, repo: string): string`
  - `toItems(daItems: Array<{path, name, ext?}>, org: string, repo: string): Array<{type: 'folder'|'file', name: string, path: string}>`
  - `buildBreadcrumbs(currentPath: string): Array<{label: string, path: string}>`
  - `escapeHtml(value: string): string`
  - `buildInsertHtml(fragmentPath: string): string`

- [ ] **Step 1: Write the failing tests**

Create `test/tools/fragments/fragment-utils.test.js`:

```js
import { expect } from '@esm-bundle/chai';
import {
  buildListUrl,
  toSiteRelativePath,
  stripHtmlExt,
  buildFragmentPath,
  toItems,
  buildBreadcrumbs,
  escapeHtml,
  buildInsertHtml,
} from '../../../tools/fragments/fragment-utils.js';

describe('fragment-utils.js', () => {
  describe('buildListUrl', () => {
    it('builds the DA admin list URL for a path', () => {
      const url = buildListUrl('adobedrago', 'kp-hw', '/fragments/nav');
      expect(url).to.equal('https://admin.da.live/list/adobedrago/kp-hw/fragments/nav');
    });
  });

  describe('toSiteRelativePath', () => {
    it('strips the org/repo prefix from a DA-absolute path', () => {
      const result = toSiteRelativePath('/adobedrago/kp-hw/fragments/nav', 'adobedrago', 'kp-hw');
      expect(result).to.equal('/fragments/nav');
    });

    it('returns the path unchanged when the prefix does not match', () => {
      const result = toSiteRelativePath('/other/path', 'adobedrago', 'kp-hw');
      expect(result).to.equal('/other/path');
    });
  });

  describe('stripHtmlExt', () => {
    it('removes a trailing .html extension', () => {
      expect(stripHtmlExt('/fragments/404.html')).to.equal('/fragments/404');
    });

    it('leaves paths without .html unchanged', () => {
      expect(stripHtmlExt('/fragments/nav')).to.equal('/fragments/nav');
    });
  });

  describe('buildFragmentPath', () => {
    it('strips both the org/repo prefix and the .html extension', () => {
      const result = buildFragmentPath('/adobedrago/kp-hw/fragments/nav/main-nav.html', 'adobedrago', 'kp-hw');
      expect(result).to.equal('/fragments/nav/main-nav');
    });
  });

  describe('toItems', () => {
    const daItems = [
      {
        path: '/adobedrago/kp-hw/fragments/404.html', name: '404', ext: 'html', lastModified: 1,
      },
      { path: '/adobedrago/kp-hw/fragments/promos', name: 'promos' },
      { path: '/adobedrago/kp-hw/fragments/nav', name: 'nav' },
      {
        path: '/adobedrago/kp-hw/fragments/tabs-example.html', name: 'tabs-example', ext: 'html', lastModified: 2,
      },
      {
        path: '/adobedrago/kp-hw/fragments/config.json', name: 'config', ext: 'json', lastModified: 3,
      },
    ];

    it('sorts folders first (alphabetically), then files (alphabetically)', () => {
      const items = toItems(daItems, 'adobedrago', 'kp-hw');
      expect(items.map((item) => item.name)).to.deep.equal(['nav', 'promos', '404', 'tabs-example']);
    });

    it('marks folders and files with the correct type', () => {
      const items = toItems(daItems, 'adobedrago', 'kp-hw');
      expect(items.find((item) => item.name === 'nav').type).to.equal('folder');
      expect(items.find((item) => item.name === '404').type).to.equal('file');
    });

    it('filters out items with a non-html extension', () => {
      const items = toItems(daItems, 'adobedrago', 'kp-hw');
      expect(items.some((item) => item.name === 'config')).to.equal(false);
    });

    it('converts folder paths to site-relative form', () => {
      const items = toItems(daItems, 'adobedrago', 'kp-hw');
      expect(items.find((item) => item.name === 'nav').path).to.equal('/fragments/nav');
    });

    it('converts file paths to site-relative form without the .html extension', () => {
      const items = toItems(daItems, 'adobedrago', 'kp-hw');
      expect(items.find((item) => item.name === '404').path).to.equal('/fragments/404');
    });
  });

  describe('buildBreadcrumbs', () => {
    it('returns a single root crumb for the fragments root', () => {
      expect(buildBreadcrumbs('/fragments')).to.deep.equal([
        { label: 'Fragments', path: '/fragments' },
      ]);
    });

    it('returns one crumb per path segment below the root', () => {
      const crumbs = buildBreadcrumbs('/fragments/nav/deep');
      expect(crumbs).to.deep.equal([
        { label: 'Fragments', path: '/fragments' },
        { label: 'nav', path: '/fragments/nav' },
        { label: 'deep', path: '/fragments/nav/deep' },
      ]);
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML-significant characters', () => {
      expect(escapeHtml('<a>&"</a>')).to.equal('&lt;a&gt;&amp;&quot;&lt;/a&gt;');
    });
  });

  describe('buildInsertHtml', () => {
    it('builds a fragment link with the path as both href and text', () => {
      const html = buildInsertHtml('/fragments/nav/main-nav');
      expect(html).to.equal('<a href="/fragments/nav/main-nav">/fragments/nav/main-nav</a>');
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx wtr "test/tools/fragments/fragment-utils.test.js" --node-resolve`
Expected: FAIL — `tools/fragments/fragment-utils.js` does not exist yet (module resolution error).

- [ ] **Step 3: Write the implementation**

Create `tools/fragments/fragment-utils.js`:

```js
const ADMIN_ORIGIN = 'https://admin.da.live';
const FRAGMENTS_ROOT = '/fragments';
const HTML_EXT = '.html';

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

export function buildFragmentPath(daPath, org, repo) {
  return stripHtmlExt(toSiteRelativePath(daPath, org, repo));
}

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

export function toItems(daItems, org, repo) {
  const folders = daItems
    .filter((item) => item.ext === undefined)
    .sort(byName)
    .map((item) => ({
      type: 'folder',
      name: item.name,
      path: toSiteRelativePath(item.path, org, repo),
    }));
  const files = daItems
    .filter((item) => item.ext === 'html')
    .sort(byName)
    .map((item) => ({
      type: 'file',
      name: item.name,
      path: buildFragmentPath(item.path, org, repo),
    }));
  return [...folders, ...files];
}

export function buildBreadcrumbs(currentPath) {
  const segments = currentPath.slice(FRAGMENTS_ROOT.length).split('/').filter(Boolean);
  const crumbs = [{ label: 'Fragments', path: FRAGMENTS_ROOT }];
  let acc = FRAGMENTS_ROOT;
  segments.forEach((segment) => {
    acc = `${acc}/${segment}`;
    crumbs.push({ label: segment, path: acc });
  });
  return crumbs;
}

export function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInsertHtml(fragmentPath) {
  const safe = escapeHtml(fragmentPath);
  return `<a href="${safe}">${safe}</a>`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx wtr "test/tools/fragments/fragment-utils.test.js" --node-resolve`
Expected: PASS — all `describe` blocks green.

- [ ] **Step 5: Lint**

Run: `npx eslint tools/fragments/fragment-utils.js test/tools/fragments/fragment-utils.test.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add tools/fragments/fragment-utils.js test/tools/fragments/fragment-utils.test.js
git commit -m "feat: add fragment-utils pure helpers for the fragments library plugin"
```

---

### Task 2: Fragment picker component, styles, and DA SDK glue

**Files:**
- Modify: `tools/fragments/fragments.js` (replace stub body entirely)
- Modify: `tools/fragments/fragments.css` (extend existing stub styles)
- Modify: `tools/fragments/fragments.html` (remove the now-unused `da-lit` importmap block)

**Interfaces:**
- Consumes (from Task 1): `buildListUrl`, `toItems`, `buildBreadcrumbs`, `buildInsertHtml` from `./fragment-utils.js`
- Consumes (existing repo utilities): `loadStyle` (default export) from `../../scripts/utils/styles.js`; `LitElement`, `html` from `../../deps/lit/dist/index.js`; default export `DA_SDK` from `https://da.live/nx/utils/sdk.js`
- Produces: custom element `<fragment-picker>` (tag name `fragment-picker`), which dispatches a bubbling, composed `fragment-select` CustomEvent with `detail: { insertHtml: string }` when a file is clicked. No other file depends on this component yet, but it is written to be self-contained and reusable.

There is no automated test for this task — it wires together the DOM, `fetch`, and the DA App SDK's `postMessage` handshake, none of which this repo's test setup mocks (consistent with `tools/scheduler/scheduler.js`, `tools/quick-edit/quick-edit.js`, and `tools/sidekick/sidekick.js`, none of which have unit tests). Verification is manual, in Task 3.

- [ ] **Step 1: Extend `fragments.css` with list/breadcrumb/item styles**

Append to the existing `tools/fragments/fragments.css` (keep everything already in the file):

```css
.fragments-app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 12px 20px;
  border-bottom: 1px solid rgb(222 222 222);
  font-size: 14px;
}

.crumb {
  background: none;
  border: none;
  padding: 2px 4px;
  font: inherit;
  color: #3b63fb;
  cursor: pointer;
}

.crumb:last-of-type {
  color: inherit;
  font-weight: 700;
  cursor: default;
}

.crumb-sep {
  color: #999;
}

.item-list {
  flex: 1;
  margin: 0;
  padding: 8px 12px 64px;
  list-style: none;
  overflow-y: auto;
}

.item-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item-btn:hover,
.item-btn:focus-visible {
  background: #efefef;
}

.item-icon {
  font-size: 16px;
}

.item-name {
  font-size: 14px;
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

- [ ] **Step 2: Replace `fragments.js` with the component and SDK glue**

Replace the full contents of `tools/fragments/fragments.js`:

```js
import { LitElement, html } from '../../deps/lit/dist/index.js';
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import loadStyle from '../../scripts/utils/styles.js';
import {
  buildListUrl, toItems, buildBreadcrumbs, buildInsertHtml,
} from './fragment-utils.js';

const styles = await loadStyle(import.meta.url);

const EL_NAME = 'fragment-picker';
const ROOT_PATH = '/fragments';

class FragmentPicker extends LitElement {
  static properties = {
    org: { attribute: false },
    repo: { attribute: false },
    token: { attribute: false },
    _currentPath: { state: true },
    _items: { state: true },
    _status: { state: true },
  };

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [styles];
    this._currentPath = ROOT_PATH;
    this._items = [];
    this._requestId = 0;
    this._status = 'loading';
    this.loadItems();
  }

  async loadItems() {
    this._requestId += 1;
    const requestId = this._requestId;
    this._status = 'loading';
    try {
      const url = buildListUrl(this.org, this.repo, this._currentPath);
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
      if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
      const json = await resp.json();
      if (requestId !== this._requestId) return;
      this._items = toItems(json, this.org, this.repo);
      this._status = this._items.length ? 'ready' : 'empty';
    } catch {
      if (requestId !== this._requestId) return;
      this._items = [];
      this._status = 'error';
    }
  }

  handleCrumbClick(path) {
    this._currentPath = path;
    this.loadItems();
  }

  handleItemClick(item) {
    if (item.type === 'folder') {
      this._currentPath = item.path;
      this.loadItems();
      return;
    }
    this.dispatchEvent(new CustomEvent('fragment-select', {
      detail: { insertHtml: buildInsertHtml(item.path) },
      bubbles: true,
      composed: true,
    }));
  }

  renderCrumbs() {
    const crumbs = buildBreadcrumbs(this._currentPath);
    return html`
      <nav class="breadcrumbs">
        ${crumbs.map((crumb, idx) => html`
          ${idx > 0 ? html`<span class="crumb-sep">/</span>` : ''}
          <button class="crumb" @click=${() => this.handleCrumbClick(crumb.path)}>${crumb.label}</button>
        `)}
      </nav>
    `;
  }

  renderStatus() {
    if (this._status === 'loading') {
      return html`<div class="status-container"><p class="status">Loading…</p></div>`;
    }
    if (this._status === 'empty') {
      return html`<div class="status-container"><p class="status">No fragments here.</p></div>`;
    }
    return html`
      <div class="status-container">
        <p class="status">Couldn't load fragments.</p>
        <button class="btn-retry" @click=${() => this.loadItems()}>Retry</button>
      </div>
    `;
  }

  renderItems() {
    return html`
      <ul class="item-list">
        ${this._items.map((item) => html`
          <li class="item item-${item.type}">
            <button class="item-btn" @click=${() => this.handleItemClick(item)}>
              <span class="item-icon" aria-hidden="true">${item.type === 'folder' ? '📁' : '📄'}</span>
              <span class="item-name">${item.name}</span>
            </button>
          </li>
        `)}
      </ul>
    `;
  }

  render() {
    return html`
      <div class="fragments-app">
        ${this.renderCrumbs()}
        ${this._status === 'ready' ? this.renderItems() : this.renderStatus()}
      </div>
    `;
  }
}

customElements.define(EL_NAME, FragmentPicker);

(async function init() {
  const { context, token, actions } = await DA_SDK;

  const picker = document.createElement(EL_NAME);
  picker.org = context.org;
  picker.repo = context.repo;
  picker.token = token;

  picker.addEventListener('fragment-select', (e) => {
    actions.sendHTML(e.detail.insertHtml);
    actions.closeLibrary();
  });

  document.body.append(picker);
}());
```

- [ ] **Step 3: Remove the now-unused importmap from `fragments.html`**

In `tools/fragments/fragments.html`, delete this block (Lit is now imported by relative path inside `fragments.js`, matching `tools/scheduler/scheduler.js`, so the importmap is dead weight):

```html
    <script type="importmap">
      { "imports": { "da-lit": "/deps/lit/dist/index.js" } }
    </script>
```

The rest of `fragments.html` (the SDK script tag and the `fragments.js` script tag) stays as-is.

- [ ] **Step 4: Lint**

Run: `npx eslint tools/fragments/fragments.js`
Run: `npx stylelint tools/fragments/fragments.css`
Expected: no errors. (`tools/fragments/fragments.css` is not currently in the `lint:css` glob — `blocks/**/*.css` and `styles/*.css` — so this stylelint run is a manual spot-check; no config change is in scope here.)

- [ ] **Step 5: Commit**

```bash
git add tools/fragments/fragments.js tools/fragments/fragments.css tools/fragments/fragments.html
git commit -m "feat: build fragment-picker library plugin UI and DA SDK glue"
```

---

### Task 3: Manual verification and registration hand-off

This task has no code changes. It confirms the plugin actually works against the real `/fragments` content tree, and hands off the one remaining step (site config registration) that requires the user's own action.

**Files:** none.

- [ ] **Step 1: Start the local dev server**

Run: `aem up`
Expected: serves the site at `http://localhost:3000`.

- [ ] **Step 2: Sanity-check the file loads without syntax/import errors**

Open `http://localhost:3000/tools/fragments/fragments.html` directly in a browser and check the devtools console.
Expected: no red console errors about failed module resolution (e.g. `Failed to resolve module specifier`). The page will otherwise appear blank/stuck — that's expected outside DA's iframe, since `await DA_SDK` never resolves without DA's `postMessage` handshake.

- [ ] **Step 3: Test inside the real DA editor**

This requires being logged into `https://da.live` as a user with access to `adobedrago/kp-hw`, so it must be done by the user (Lamont), not automated:

1. Go to `https://da.live/config#/adobedrago/kp-hw/` and add a temporary row to the **library** tab: `title: Fragments (local)`, `path: http://localhost:3000/tools/fragments/fragments.html`, `icon: <any placeholder .png URL>`, `format: dialog`.
2. Open any document for editing in `https://da.live/edit#/adobedrago/kp-hw/...`.
3. Open the Library panel and select the "Fragments (local)" tab.
4. Confirm `404` and `tabs-example` appear at the root, and `nav`/`promos` appear as folders.
5. Click into `nav`, confirm its contents load and the breadcrumb reads `Fragments / nav`; click the `Fragments` breadcrumb to go back to root.
6. Click a fragment document; confirm a `<a href="/fragments/...">/fragments/...</a>` link is inserted into the doc and the Library panel closes.
7. Temporarily break the token (e.g. via devtools, block the `admin.da.live` request) to confirm the error state renders with a working Retry button.
8. Remove the temporary "Fragments (local)" row from the config sheet once verified (step 1's row was only for local testing).

- [ ] **Step 4: Propose permanent registration**

Once Step 3 passes, propose this row for the **library** tab of `https://da.live/config#/adobedrago/kp-hw/` (this is the permanent, non-local entry — do not add it without the user's explicit go-ahead):

| title | path | icon | format |
|---|---|---|---|
| Fragments | `https://main--kp-hw--adobedrago.aem.live/tools/fragments/fragments.html` | *(needs a hosted `.png` icon — none exists in the repo yet; ask the user to supply one or approve a placeholder)* | dialog |

- [ ] **Step 5: Run the full test and lint suite one more time**

Run: `npm test`
Run: `npm run lint`
Expected: both pass, confirming Task 1 and Task 2's changes didn't break anything else in the repo.
