// Quick-edit block detector → broadcasts the selected block to the right-rail plugin.
//
// Loaded by scripts.js when `?quick-edit` is present, so it only runs inside the quick-edit
// editor. It detects the block at the cursor on each click and broadcasts it on a same-origin
// BroadcastChannel; the DA library plugin (tools/style-switcher/style-switcher.js), shown in
// the editor's right rail, renders it. (The canvas can't draw into DA's rail itself.)
//
// A block is a `[data-block-name]` element under `main > .section > .block-content`. We listen
// on click / focusin / keyup in the capture phase — not `selectionchange`, which doesn't fire
// when the caret moves between blocks (each block is its own contenteditable).

const CHANNEL = 'kp-style-switcher';

/**
 * The block's variant classes: every class except the block name itself and the structural
 * `block` / `block-content` classes. Pure — exported for testing.
 * e.g. (['columns','align-vertically'], 'columns') -> ['align-vertically'].
 */
export function blockVariants(classList, name) {
  const structural = new Set([name, 'block', 'block-content']);
  return [...classList].filter((c) => !structural.has(c));
}

const channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel(CHANNEL) : null;
let started = false;

function findBlock(node) {
  let el = node && node.nodeType === 3 ? node.parentElement : node;
  while (el && el !== document.documentElement) {
    if (el.dataset && el.dataset.blockName) return el;
    el = el.parentElement;
  }
  return null;
}

function broadcast(blockEl) {
  if (!channel) return;
  if (!blockEl) {
    channel.postMessage(null);
    return;
  }
  const name = blockEl.dataset.blockName;
  channel.postMessage({ name, variants: blockVariants(blockEl.classList, name) });
}

function nodeFromEvent(e) {
  if (e && e.type === 'keyup') {
    const sel = document.getSelection();
    return sel && sel.anchorNode;
  }
  return e && e.target;
}

function update(e) {
  const node = nodeFromEvent(e);
  if (!node) return;
  broadcast(findBlock(node));
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
