// Breadcrumbs — current lineage: foundation-v4 (data-ds-version="4", vessel theme).
// Source: design-files/.extracted/kp-vessel-1/breadcrumbs-pattern/demo-foundation-v4.html
//
// A trail of links separated by forward chevrons; the final item is the current page
// (no link). The original markup also carries mobile-only "back" chevrons for the
// collapsed mobile view — kept here so the responsive behavior matches the source.

import { ensurePatternStyles, assetUrl, el } from '../pattern-utils.js';

const PATTERN = 'breadcrumbs';
const chevron = (dir) => assetUrl(PATTERN, `assets/images/chevron-${dir}-small.svg`);

function fwd() {
  return `<img aria-hidden="true" class="ds-breadcrumbs__chevron-forward" src="${chevron('right')}" alt="" height="16" width="16">`;
}
function back() {
  return `<img aria-hidden="true" class="mobile-only ds-breadcrumbs__chevron-back" src="${chevron('left')}" alt="" height="16" width="16">`;
}

function renderBreadcrumbs({ items = [] } = {}) {
  ensurePatternStyles(PATTERN);

  const lis = items
    .map((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast) {
        // Current page — not a link.
        return `<li><div>${back()}${item.label}</div></li>`;
      }
      return `<li>
        <a href="${item.href || '#'}">
          ${i > 0 ? back() : ''}
          <span class="ds-breadcrumbs__text">${item.label}</span>${fwd()}
        </a>
      </li>`;
    })
    .join('');

  return el(`
    <nav aria-label="Breadcrumb" class="ds-breadcrumbs" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="4">
      <ul class="ds-breadcrumbs__list">${lis}</ul>
    </nav>
  `);
}

export default {
  title: 'Components/Breadcrumbs',
  render: (args) => renderBreadcrumbs(args),
  argTypes: {
    items: { control: 'object', description: 'Trail items; the last one is the current page.' },
  },
  args: {
    items: [
      { label: 'Why KP', href: '#' },
      { label: 'Experience', href: '#' },
      { label: 'My Health Manager' },
    ],
  },
};

export const Default = {};

export const TwoLevels = {
  args: { items: [{ label: 'Home', href: '#' }, { label: 'Current page' }] },
};

export const DeepTrail = {
  args: {
    items: [
      { label: 'Why KP', href: '#' },
      { label: 'Experience', href: '#' },
      { label: 'Care', href: '#' },
      { label: 'My Health Manager' },
    ],
  },
};
