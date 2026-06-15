// Header (nav) — current lineage: foundation-compact-v2 (.ds-header, data-ds-variant
// "compact", data-ds-version "2"; vessel theme).
// Source: design-files/.extracted/kp-vessel-3/header-pattern/foundation-compact-v2.html
//
// Reference story only: renders the vessel header markup as the design source of
// truth for a future blocks/header refactor. The vendor interactivity (mobile menu,
// language dropdown) is NOT wired here — those are stateful behaviors to reimplement
// in vanilla when the block is built. The static states (desktop nav, closed
// dropdown) are what we review and style against. Switch the Storybook viewport to
// a narrow width to see the mobile menu button.

import { ensurePatternStyles, assetUrl } from '../pattern-utils.js';
// Single source of truth: the same renderer the EDS block uses (blocks/header).
import { renderHeader as renderDsHeader } from '../../blocks/header/header-dom.js';

const PATTERN = 'header';
const img = (path) => assetUrl(PATTERN, path);

// Wrap the shared renderer: load the vessel pattern CSS (the design reference) and
// resolve assets from the vendored files. DOM is produced by the block's renderer.
function renderHeader({
  menuLabel = 'Menu',
  languageLabel = 'Language',
  language = 'English',
  links = ['Standard Link', 'Large Link', 'Large Link'],
} = {}) {
  ensurePatternStyles(PATTERN);

  const [standardLink, ...largeLinks] = links;
  const items = [
    ...(standardLink ? [{ kind: 'link', label: standardLink, href: '#' }] : []),
    { kind: 'language', label: languageLabel, value: language },
    ...largeLinks.map((label) => ({ kind: 'link', label, href: '#', large: true })),
  ];

  return renderDsHeader({
    menuLabel,
    items,
    logos: {
      mobile: img('assets/images/kp-logo-signature-stacked.svg'),
      desktop: img('assets/images/kp-logo-374x42.svg'),
    },
    icons: {
      menu: img('assets/icons/ds2/menu.svg'),
      close: img('assets/icons/ds2/close-small.svg'),
      chevron: img('assets/icons/ds2/chevrondown.svg'),
    },
  });
}

export default {
  title: 'Components/Header',
  render: (args) => renderHeader(args),
  parameters: { layout: 'fullscreen' },
  argTypes: {
    menuLabel: { control: 'text' },
    languageLabel: { control: 'text' },
    language: { control: 'text' },
  },
  args: {
    menuLabel: 'Menu',
    languageLabel: 'Language',
    language: 'English',
  },
};

export const Default = {};

export const NoStandardLink = {
  name: 'Large links only',
  args: { links: ['', 'Large Link', 'Large Link'] },
};
