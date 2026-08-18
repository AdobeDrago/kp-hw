// Quick-edit block indicator.
//
// Loaded by scripts.js when `?quick-edit` is present, so it only runs inside the quick-edit
// editor (our own same-origin EDS page). It shows, in a small floating panel, the name of
// the block the cursor is currently in.
//
// In the quick-edit DOM a block is a `[data-block-name]` element sitting under
// `main > .section > .block-content` — there is no `.ProseMirror` wrapper around it, so we
// simply walk up from the caret to the nearest `[data-block-name]`.

const PANEL_CSS = `
  .ss-panel{font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1d1d1d;border:1px solid #ddd;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);padding:12px 14px;min-width:180px;max-width:280px}
  .ss-lbl{color:#6e6e6e;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
  .ss-name{font-weight:700;font-size:18px;line-height:1.2;word-break:break-word}
  .ss-variants{margin-top:4px;color:#1473e6;font-size:12px;font-weight:600}
  .ss-empty{color:#999;font-style:italic;font-size:13px}
`;

/**
 * The block's variant classes: every class except the block name itself and the structural
 * `block` / `block-content` classes. Pure — exported for testing.
 * e.g. (['columns','align-vertically'], 'columns') -> ['align-vertically'].
 */
export function blockVariants(classList, name) {
  const structural = new Set([name, 'block', 'block-content']);
  return [...classList].filter((c) => !structural.has(c));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[c]));
}

let host;
let root;
let started = false;

function findBlock(node) {
  let el = node && node.nodeType === 3 ? node.parentElement : node;
  while (el && el !== document.documentElement) {
    if (el.dataset && el.dataset.blockName) return el;
    el = el.parentElement;
  }
  return null;
}

function mount() {
  if (host) return;
  host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647';
  root = host.attachShadow({ mode: 'open' });
  document.body.append(host);
}

function render(blockEl) {
  if (!root) return;
  if (!blockEl) {
    root.innerHTML = `<style>${PANEL_CSS}</style><div class="ss-panel"><div class="ss-empty">Click inside a block</div></div>`;
    return;
  }
  const name = blockEl.dataset.blockName;
  const variants = blockVariants(blockEl.classList, name);
  root.innerHTML = `<style>${PANEL_CSS}</style>
    <div class="ss-panel">
      <div class="ss-lbl">Selected block</div>
      <div class="ss-name">${escapeHtml(name)}</div>
      ${variants.length ? `<div class="ss-variants">${escapeHtml(variants.join(' · '))}</div>` : ''}
    </div>`;
}

function onSelectionChange() {
  const sel = document.getSelection();
  if (!sel || !sel.anchorNode) return;
  if (host && host.contains(sel.anchorNode)) return; // ignore selections inside our panel
  mount();
  render(findBlock(sel.anchorNode));
}

export default function init() {
  if (started) return;
  started = true;
  document.addEventListener('selectionchange', onSelectionChange);
}
