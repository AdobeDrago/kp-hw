import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { LitElement, html } from '../../deps/lit/dist/index.js';
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
  if (!entry || typeof entry.value !== 'string') return null;
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
      const previewUrl = buildPreviewUrl(this.path, this.org, this.repo, this.ref);
      const currentHtml = await fetchText(previewUrl);
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
  const { context } = await DA_SDK;

  const report = document.createElement(EL_NAME);
  report.org = context.org;
  report.repo = context.repo;
  report.ref = context.ref;
  report.path = context.path;

  document.body.append(report);
}());
