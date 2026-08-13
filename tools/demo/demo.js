import { LitElement, html } from '../../deps/lit/dist/index.js';
import loadStyle from '../../scripts/utils/styles.js';

const styles = await loadStyle(import.meta.url);

const EL_NAME = 'demo-app';

class DemoApp extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [styles];
  }

  render() {
    return html`<h1>Hello World</h1>`;
  }
}

customElements.define(EL_NAME, DemoApp);

(async function init() {
  // Render the greeting as soon as the plugin opens.
  document.body.append(document.createElement(EL_NAME));

  // DA context is optional for the greeting — load it lazily so the plugin
  // still renders when opened outside da.live (e.g. local preview).
  try {
    const { default: DA_SDK } = await import('https://da.live/nx/utils/sdk.js');
    const { context, token } = await DA_SDK;
    const { org, repo, path } = context;
    console.log(org, repo, path, token);
  } catch (e) {
    console.warn('DA SDK unavailable:', e);
  }
}());
