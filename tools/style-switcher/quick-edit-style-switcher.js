// Quick-edit style switcher.
//
// Runs INSIDE the quick-edit canvas (our own EDS site, same origin), loaded from
// scripts.js when `?quick-edit` is present. Unlike a DA library plugin — which lives in a
// cross-origin iframe and is walled off from the editor — this script reads the block at
// the cursor straight from the DOM, and discovers a block's / section's available styles by
// fetching and parsing the relevant CSS for compound selectors (`.columns.topics`,
// `.section.center`). Parsing the CSS text (rather than reading document.styleSheets) keeps
// discovery deterministic — cssRules can be transiently empty during load.
//
// Milestone 2 scope: SHOW the block + section and all their styles, with an experimental
// live class toggle. Persisting a switch back to DA is the next increment.

import { wrapperToBase, variantTokens, activeVariants } from './quick-edit-utils.js';

const PANEL_CSS = `
  .ss-panel{font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1d1d1d;border:1px solid #ddd;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);padding:12px 14px;min-width:230px;max-width:320px}
  .ss-hd{font-weight:700;font-size:14px;margin-bottom:6px}
  .ss-lbl{color:#6e6e6e;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin:8px 0 4px}
  .ss-chips{display:flex;flex-wrap:wrap;gap:6px}
  .ss-chip{padding:3px 10px;border:none;border-radius:999px;background:#f0f0f0;color:#555;font-size:12px;font-weight:600;cursor:pointer}
  .ss-chip.ss-on{background:#1473e6;color:#fff}
  .ss-empty{color:#999;font-style:italic;font-size:12px}
  .ss-note{margin-top:10px;color:#a15c00;font-size:11px}
`;

const cache = new Map();
const state = { block: null, section: null };
let host;
let root;
let started = false;
let requestId = 0;

// Which CSS file(s) define a base's styles: a block's own CSS, or the global styles for
// sections (ds-tokens carries a few section layout styles too).
function cssUrlsFor(base) {
  return base === 'section'
    ? ['/styles/styles.css', '/styles/ds-tokens.css']
    : [`/blocks/${base}/${base}.css`];
}

// Discover a base's authored styles by fetching + parsing its CSS. Cached by base (the
// cached value is the promise, so concurrent lookups share one fetch).
function fetchVariants(base) {
  if (cache.has(base)) return cache.get(base);
  const promise = Promise.all(cssUrlsFor(base).map(async (url) => {
    try {
      const resp = await fetch(url);
      return resp.ok ? resp.text() : '';
    } catch {
      return '';
    }
  })).then((texts) => {
    const set = new Set();
    texts.forEach((text) => variantTokens(base, text).forEach((v) => set.add(v)));
    return [...set].sort();
  });
  cache.set(base, promise);
  return promise;
}

function elementFrom(node) {
  return node && node.nodeType === 3 ? node.parentElement : node;
}

function inEditor(node) {
  let el = elementFrom(node);
  while (el) {
    if (el.classList && el.classList.contains('ProseMirror')) return true;
    el = el.parentElement;
  }
  return false;
}

function findBlock(node) {
  let el = elementFrom(node);
  while (el && !(el.classList && el.classList.contains('ProseMirror'))) {
    if (el.dataset && el.dataset.blockName) return { el, base: el.dataset.blockName };
    const parent = el.parentElement;
    const base = parent && [...parent.classList].map(wrapperToBase).find(Boolean);
    if (base) return { el, base };
    el = parent;
  }
  return null;
}

function findSection(node) {
  let el = elementFrom(node);
  while (el && !(el.classList && el.classList.contains('ProseMirror'))) {
    if (el.classList && el.classList.contains('section')) return { el, base: 'section' };
    el = el.parentElement;
  }
  return null;
}

function groupHtml(title, target) {
  if (!target) return `<div class="ss-lbl">${title}</div><div class="ss-empty">— none —</div>`;
  const active = new Set(activeVariants(target.el.classList, target.opts));
  const chips = target.opts.length
    ? target.opts.map((v) => `<button class="ss-chip${active.has(v) ? ' ss-on' : ''}" data-scope="${title}" data-variant="${v}">${v}</button>`).join('')
    : '<div class="ss-empty">no defined styles</div>';
  return `<div class="ss-lbl">${title}: ${target.base}</div><div class="ss-chips">${chips}</div>`;
}

function render() {
  if (!root) return;
  root.innerHTML = `<style>${PANEL_CSS}</style>
    <div class="ss-panel">
      <div class="ss-hd">Style Switcher</div>
      ${groupHtml('Block', state.block)}
      ${groupHtml('Section', state.section)}
      <div class="ss-note">Live preview only — not yet saved to DA.</div>
    </div>`;
  root.querySelectorAll('.ss-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const target = chip.dataset.scope === 'Block' ? state.block : state.section;
      if (target) {
        target.el.classList.toggle(chip.dataset.variant);
        render();
      }
    });
  });
}

function mount() {
  if (host) return;
  host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647';
  // Keep the editor's selection when clicking chips instead of stealing focus.
  host.addEventListener('mousedown', (e) => e.preventDefault());
  root = host.attachShadow({ mode: 'open' });
  document.body.append(host);
}

async function update() {
  const sel = document.getSelection();
  if (!sel || !sel.anchorNode) return;
  if (host && host.contains(sel.anchorNode)) return; // ignore selections inside our panel
  if (!inEditor(sel.anchorNode)) return; // only react to the editing canvas
  mount();

  const block = findBlock(sel.anchorNode);
  const section = findSection(sel.anchorNode);
  requestId += 1;
  const id = requestId;
  const [blockOpts, sectionOpts] = await Promise.all([
    block ? fetchVariants(block.base) : [],
    section ? fetchVariants(section.base) : [],
  ]);
  if (id !== requestId) return; // a newer selection superseded this one

  state.block = block ? { ...block, opts: blockOpts } : null;
  state.section = section ? { ...section, opts: sectionOpts } : null;
  render();
}

export default function init() {
  if (started) return;
  started = true;
  document.addEventListener('selectionchange', update);
}
