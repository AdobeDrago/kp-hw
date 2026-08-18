// Right-rail companion for the quick-edit style switcher.
//
// This is a DA library plugin, shown in the editor's right rail. It does NOT try to read the
// selection itself (the DA SDK can't see the block at a plain cursor). Instead the in-canvas
// detector (tools/style-switcher/quick-edit-style-switcher.js) broadcasts the selected block
// on a same-origin BroadcastChannel, and this plugin just renders it.
//
// For the channel to reach us, this plugin must be registered on the SAME host as the editing
// canvas (e.g. main--kp-hw--adobedrago.preview.da.live) — the browser blocks it across origins.

const CHANNEL = 'kp-style-switcher';

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[c]));
}

function render(data) {
  const app = document.getElementById('app');
  if (!app) return;
  if (!data || !data.name) {
    app.innerHTML = '<p class="ss-empty">Click inside a block in the page.</p>';
    return;
  }
  const variants = Array.isArray(data.variants) ? data.variants : [];
  app.innerHTML = `
    <p class="ss-lbl">Selected block</p>
    <p class="ss-name">${escapeHtml(data.name)}</p>
    ${variants.length ? `<p class="ss-variants">${escapeHtml(variants.join(' · '))}</p>` : ''}`;
}

if (typeof BroadcastChannel !== 'undefined') {
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e) => render(e.data);
}

render(null);
