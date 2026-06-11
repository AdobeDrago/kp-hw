// EDS-block harness stories for blocks/breadcrumbs, authored to MIRROR the vessel
// Components/Breadcrumbs reference stories so the visual-parity diff compares
// like-for-like. Authored as a <ul> of links; the final <li> (plain text) is the
// current page. section:false matches the reference framing (bare nav).

import { edsBlock } from './eds-harness.js';

const trail = (items) => edsBlock({
  name: 'breadcrumbs',
  section: false,
  rows: [[
    `<ul>${items
      .map((it, i) => (i === items.length - 1
        ? `<li>${it.label}</li>`
        : `<li><a href="${it.href || '#'}">${it.label}</a></li>`))
      .join('')}</ul>`,
  ]],
});

export default {
  title: 'EDS Blocks/Breadcrumbs',
};

export const Default = {
  render: () => trail([
    { label: 'Why KP', href: '#' },
    { label: 'Experience', href: '#' },
    { label: 'My Health Manager' },
  ]),
};

export const DeepTrail = {
  render: () => trail([
    { label: 'Why KP', href: '#' },
    { label: 'Experience', href: '#' },
    { label: 'Care', href: '#' },
    { label: 'My Health Manager' },
  ]),
};
