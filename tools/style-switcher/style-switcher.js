// Right-rail companion for the quick-edit style switcher.
//
// A DA library plugin, shown in the editor's right rail. It doesn't read the selection itself
// (the DA SDK can't see the block at a plain cursor). The in-canvas detector
// (tools/style-switcher/quick-edit-style-switcher.js) broadcasts the selected block + section
// and the styles each supports on a same-origin BroadcastChannel; this plugin renders them,
// with the active styles highlighted.
//
// For the channel to reach us, this plugin must be registered on the SAME host as the editing
// canvas (e.g. main--kp-hw--adobedrago.preview.da.live) — the browser blocks it across origins.

const CHANNEL = 'kp-style-switcher';

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[c]));
}

function group(title, data) {
  if (!data) return '';
  const active = new Set(data.active);
  const available = Array.isArray(data.available) ? data.available : [];
  const chips = available.length
    ? available.map((v) => `<span class="ss-chip${active.has(v) ? ' ss-on' : ''}">${escapeHtml(v)}</span>`).join('')
    : '<span class="ss-empty">no styles defined</span>';
  return `
    <div class="ss-group">
      <p class="ss-lbl">${escapeHtml(title)}: ${escapeHtml(data.name)}</p>
      <div class="ss-chips">${chips}</div>
    </div>`;
}

function render(data) {
  const app = document.getElementById('app');
  if (!app) return;
  if (!data || (!data.block && !data.section)) {
    app.innerHTML = '<p class="ss-empty">Click inside a block in the page.</p>';
    return;
  }
  app.innerHTML = group('Block', data.block) + group('Section', data.section);
}

if (typeof BroadcastChannel !== 'undefined') {
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e) => render(e.data);
}

render(null);
