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
const POLL_INTERVAL_MS = 3000;
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
    this._pendingAdd = new Set();
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
      const sourceUrl = buildSourceUrl(this.path, this.org, this.repo);
      const currentHtml = await fetchText(sourceUrl, this.token);
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
