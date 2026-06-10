// KP Footer — current lineage: index-ds2-unversioned (ds2 theme, kp-theme-ds2 + main.css).
// Source: design-files/.extracted/kp-vessel-4/kp-footer/index-ds2-unversioned.html
//
// Unlike the foundation-v patterns, the footer uses the older `kp-theme-ds2` + main.css
// architecture (no ds-foundation line). Our global decorator already includes the
// `kp-theme-ds2` class, so the styles resolve. The footer is essentially static global
// content, so rather than re-author ~360 lines we import one cleaned ds2-footer instance
// verbatim (asset paths pre-rewritten to /sb/kp-footer/...) and inject it.
//
// On mobile the link-list groups collapse into an accordion (the plus/minus-white icons).
// We re-implement that toggle in vanilla JS; on desktop the lists are shown expanded.

import { ensurePatternStyles, el } from '../pattern-utils.js';
// Vite raw-string import (the `?raw` suffix isn't understood by the import resolver).
// eslint-disable-next-line import/no-unresolved
import footerHtml from './footer.html?raw';

const PATTERN = 'kp-footer';

function renderFooter() {
  ensurePatternStyles(PATTERN);
  const node = el(footerHtml);

  // Mobile accordion: each link-list group's heading toggles its list open/closed.
  node.querySelectorAll('.footer-group.link-list-container').forEach((group) => {
    const heading = group.querySelector('button, .footer-group-heading, [data-aria-label]');
    if (!heading || heading === group) return;
    heading.addEventListener?.('click', () => {
      group.classList.toggle('-open');
    });
  });

  return node;
}

export default {
  title: 'Components/Footer',
  render: () => renderFooter(),
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
};

export const DS2 = {};
