// EDS-block harness for blocks/header (the KP production header with the
// localStorage auth toggle). Each story sets localStorage.auth, then runs the real
// block init() on a `.header.block` element. The kp-header CSS is loaded from the
// served /sb/kp-header copy (same stylesheet the Components/KP Header reference uses),
// so the block can be pixel-compared against the reference.

import init from '../../blocks/header/header.js';

function ensureKpStyles() {
  if (document.querySelector('link[data-kp-header]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/sb/kp-header/foundation.css';
  link.dataset.kpHeader = 'true';
  document.head.appendChild(link);
}

function mount(auth) {
  ensureKpStyles();
  try {
    localStorage.setItem('auth', auth ? '1' : '0');
  } catch { /* localStorage unavailable */ }
  const el = document.createElement('div');
  el.className = 'header block';
  init(el);
  return el;
}

export default {
  title: 'EDS Blocks/Header',
  parameters: { layout: 'fullscreen' },
};

export const NonAuthenticated = {
  name: 'auth=0 (non-authenticated)',
  render: () => mount(false),
};

export const Authenticated = {
  name: 'auth=1 (authenticated)',
  render: () => mount(true),
};
