// Header — current lineage: foundation-compact-v2 (v2, vessel theme).
// Source: design-files/.extracted/kp-vessel-3/header-pattern/foundation-compact-v2.html
//
// The "compact" header: branding/logo + primary nav + a mobile menu button. Like the
// footer it's largely static markup, so we import one variant verbatim via Vite `?raw`
// (asset paths pre-rewritten) rather than re-authoring it. The mobile menu toggles the
// `ds-header--menu-open` class on the root (the nav is display:none on mobile) and flips
// the button's aria-expanded — re-implemented in vanilla JS. The header has many other
// variants (auth / non-auth / task-flow / maui); this covers the compact foundation line.

import { ensurePatternStyles, el } from '../pattern-utils.js';
// eslint-disable-next-line import/no-unresolved
import headerHtml from './header.html?raw';

const PATTERN = 'header';

function renderHeader() {
  ensurePatternStyles(PATTERN);
  const node = el(headerHtml);

  const root = node.classList.contains('ds-header') ? node : node.querySelector('.ds-header');
  const menuBtn = node.querySelector('.ds-header__menu-button');

  menuBtn?.addEventListener('click', () => {
    const open = root.classList.toggle('ds-header--menu-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  return node;
}

export default {
  title: 'Components/Header',
  render: () => renderHeader(),
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
};

export const Compact = {};
