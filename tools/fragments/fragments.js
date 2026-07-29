import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { LitElement, html } from '../../deps/lit/dist/index.js';
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
    } catch (error) {
      if (requestId !== this._requestId) return;
      // eslint-disable-next-line no-console
      console.error('Failed to load fragments', error);
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
