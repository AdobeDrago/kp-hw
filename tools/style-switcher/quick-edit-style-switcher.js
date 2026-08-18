// Quick-edit block detector → broadcasts the selected block + its styles to the right-rail plugin.
//
// Loaded by scripts.js when `?quick-edit` is present, so it only runs inside the quick-edit
// editor. On each click it detects the block at the cursor and its enclosing section,
// discovers the styles each supports by fetching + parsing the relevant CSS (compound
// selectors like `.columns.topics`, `.section.center`), and broadcasts it all on a
// same-origin BroadcastChannel. The DA library plugin (tools/style-switcher/style-switcher.js)
// in the editor's right rail renders it — the canvas iframe can't draw into DA's rail itself.
//
// A block is a `[data-block-name]` element under `main > .section > .block-content` (no
// `.ProseMirror` wrapper). We listen on click / focusin / keyup in the capture phase, not
// `selectionchange`, which doesn't fire when the caret moves between blocks.

const CHANNEL = 'kp-style-switcher';

/**
 * Authored variant tokens for `base` parsed from CSS text. Only true compound selectors
 * count: `.columns.topics` -> ['topics']. Prefixed/computed classes (`.columns-media-2-cols`)
 * and `:not(...)` do not match. Pure — exported for testing.
 */
export function variantTokens(base, cssText) {
  if (!base || !cssText) return [];
  const esc = base.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp(`\\.${esc}\\.([\\w-]+)`, 'g');
  const out = [];
  let m = re.exec(cssText);
  while (m !== null) {
    out.push(m[1]);
    m = re.exec(cssText);
  }
  return out;
}

/** The options currently applied on an element. Pure — exported for testing. */
export function activeVariants(classList, available) {
  const set = new Set(available);
  return [...classList].filter((c) => set.has(c));
}

const channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel(CHANNEL) : null;
const cache = new Map();
let started = false;
let requestId = 0;

function cssUrlsFor(base) {
  return base === 'section'
    ? ['/styles/styles.css', '/styles/ds-tokens.css']
    : [`/blocks/${base}/${base}.css`];
}

// Discover a base's styles by fetching + parsing its CSS (cached by base; the cached value is
// the promise so concurrent lookups share one fetch).
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

function findBlock(node) {
  let el = elementFrom(node);
  while (el && el !== document.documentElement) {
    if (el.dataset && el.dataset.blockName) return el;
    el = el.parentElement;
  }
  return null;
}

function findSection(node) {
  let el = elementFrom(node);
  while (el && el !== document.documentElement) {
    if (el.classList && el.classList.contains('section')) return el;
    el = el.parentElement;
  }
  return null;
}

async function describe(el, base) {
  if (!el || !base) return null;
  const available = await fetchVariants(base);
  return { name: base, available, active: activeVariants(el.classList, available) };
}

function nodeFromEvent(e) {
  if (e && e.type === 'keyup') {
    const sel = document.getSelection();
    return sel && sel.anchorNode;
  }
  return e && e.target;
}

async function update(e) {
  const node = nodeFromEvent(e);
  if (!node) return;
  const blockEl = findBlock(node);
  const sectionEl = findSection(node);
  requestId += 1;
  const id = requestId;
  const [block, section] = await Promise.all([
    describe(blockEl, blockEl && blockEl.dataset.blockName),
    describe(sectionEl, 'section'),
  ]);
  if (id !== requestId) return; // a newer click superseded this one
  if (channel) channel.postMessage({ block, section });
}

export default function init() {
  if (started) return;
  started = true;
  // Capture phase so the editor can't stop these reaching us. keyup covers caret movement
  // via the keyboard, where there's no click.
  document.addEventListener('click', update, true);
  document.addEventListener('focusin', update, true);
  document.addEventListener('keyup', update, true);
}
