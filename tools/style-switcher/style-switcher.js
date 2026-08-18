import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { LitElement, html } from '../../deps/lit/dist/index.js';
import loadStyle from '../../scripts/utils/styles.js';
import { identifyBlock } from './style-switcher-utils.js';

const styles = await loadStyle(import.meta.url);

const EL_NAME = 'style-switcher-panel';
const POLL_INTERVAL_MS = 1500;

// getSelection()'s payload shape is unconfirmed (see the design's spike). Coerce whatever
// comes back into an HTML string for parsing, and a readable string for the raw reveal.
function toHtmlString(selection) {
  if (typeof selection === 'string') return selection;
  if (!selection || typeof selection !== 'object') return '';
  return selection.html || selection.outerHTML || selection.content || '';
}

function toRawDisplay(selection) {
  if (typeof selection === 'string') return selection;
  try {
    return JSON.stringify(selection, null, 2);
  } catch (error) {
    return String(selection);
  }
}

function variantChips(variants) {
  if (!variants.length) return html`<span class="no-variant">No variant</span>`;
  return html`
    <div class="variant-chips">
      ${variants.map((variant) => html`<span class="variant-chip">${variant}</span>`)}
    </div>`;
}

class StyleSwitcherPanel extends LitElement {
  static properties = {
    actions: { attribute: false },
    _status: { state: true },
    _block: { state: true },
    _raw: { state: true },
    _showRaw: { state: true },
  };

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [styles];
    this._status = 'loading';
    this._block = null;
    this._raw = '';
    this._showRaw = false;
    this._requestId = 0;
    this._pollHandle = null;

    this.poll();

    this._visibilityHandler = () => {
      if (document.hidden) {
        this.stopPolling();
      } else {
        this.startPolling();
        this.poll();
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
    this._pollHandle = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  stopPolling() {
    if (this._pollHandle) {
      clearInterval(this._pollHandle);
      this._pollHandle = null;
    }
  }

  async poll() {
    this._requestId += 1;
    const requestId = this._requestId;
    try {
      const selection = await this.actions.getSelection();
      if (requestId !== this._requestId) return;
      this.applySelection(selection);
    } catch {
      if (requestId === this._requestId) this._status = 'error';
    }
  }

  applySelection(selection) {
    const raw = toRawDisplay(selection);
    const block = identifyBlock(toHtmlString(selection));
    const nextStatus = block ? 'block' : 'no-block';
    // Only mutate state when something actually changed, to avoid re-render churn on
    // every poll while the author's selection stays put.
    const blockChanged = JSON.stringify(block) !== JSON.stringify(this._block);
    if (blockChanged || this._status !== nextStatus || this._raw !== raw) {
      this._block = block;
      this._raw = raw;
      this._status = nextStatus;
    }
  }

  renderRawReveal() {
    if (!this._raw) return '';
    return html`
      <div class="raw-reveal">
        <button class="raw-toggle" @click=${() => { this._showRaw = !this._showRaw; }}>
          ${this._showRaw ? 'Hide' : 'Show'} selection payload
        </button>
        ${this._showRaw ? html`<pre class="raw-dump">${this._raw}</pre>` : ''}
      </div>`;
  }

  renderBlock() {
    const { name, variants, count } = this._block;
    return html`
      <div class="panel">
        <p class="eyebrow">Selected block</p>
        <div class="block-card">
          <p class="block-name">${name}</p>
          ${variantChips(variants)}
        </div>
        ${count > 1
          ? html`<p class="multi-note">${count} blocks selected — showing the first.</p>`
          : ''}
      </div>`;
  }

  renderNoBlock() {
    return html`
      <div class="panel">
        <div class="hint"><p>Click inside a block to see its style.</p></div>
        ${this.renderRawReveal()}
      </div>`;
  }

  renderError() {
    return html`
      <div class="status-container status-static">
        <p class="status">Couldn't read the selection.</p>
        <button class="btn-retry" @click=${() => this.poll()}>Retry</button>
      </div>`;
  }

  render() {
    if (this._status === 'loading') {
      return html`<div class="status-container"><p class="status">Reading your selection…</p></div>`;
    }
    if (this._status === 'error') return this.renderError();
    if (this._status === 'no-block') return this.renderNoBlock();
    return this.renderBlock();
  }
}

customElements.define(EL_NAME, StyleSwitcherPanel);

(async function init() {
  const { actions } = await DA_SDK;

  const panel = document.createElement(EL_NAME);
  panel.actions = actions;

  document.body.append(panel);
}());
