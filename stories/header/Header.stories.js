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

import { ensurePatternStyles, assetUrl, el } from '../pattern-utils.js';

const PATTERN = 'header';
const img = (path) => assetUrl(PATTERN, path);

function renderHeader({
  menuLabel = 'Menu',
  languageLabel = 'Language',
  language = 'English',
  links = ['Standard Link', 'Large Link', 'Large Link'],
} = {}) {
  ensurePatternStyles(PATTERN);

  const [standardLink, ...largeLinks] = links;
  const navItems = [
    standardLink
      ? `<li class="ds-header__primary-nav-list-item">
           <a href="#" class="ds-header__primary-nav-list-link">${standardLink}</a>
         </li>`
      : '',
    `<li class="ds-header__primary-nav-list-item">
       <div class="ds-dropdown" data-menu-type="language" data-select-label="selected"
            data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2">
         <div class="ds-dropdown__drop-menu">
           <label class="ds-dropdown__label"><span class="ds-dropdown__label-text">${languageLabel}</span></label>
           <button class="ds-dropdown__trigger-button" type="button">
             <span class="ds-dropdown__trigger-text">${language}</span>
             <img class="ds-dropdown__chevron" src="${img('assets/icons/ds2/chevrondown.svg')}" alt="" width="24" height="24">
           </button>
           <ul class="ds-dropdown__menu-list"></ul>
         </div>
       </div>
     </li>`,
    ...largeLinks.map((label) => `<li class="ds-header__primary-nav-list-item ds-header__primary-nav-list-item--large">
         <a href="#" class="ds-header__primary-nav-list-link">${label}</a>
       </li>`),
  ].join('');

  return el(`
    <header class="ds-header" data-ds-theme="vessel" data-ds-variant="compact" data-ds-version="2">
      <div class="ds-header__layout">
        <div class="ds-header__top-bar">
          <div class="ds-header__branding">
            <a class="ds-header__logo" href="/" aria-label="Kaiser Permanente Home">
              <img class="ds-header__logo-img ds-header__logo-img--mobile"
                   src="${img('assets/images/kp-logo-signature-stacked.svg')}" width="150" height="40" alt="Kaiser Permanente Home">
              <img class="ds-header__logo-img ds-header__logo-img--desktop"
                   src="${img('assets/images/kp-logo-374x42.svg')}" width="374" height="42" alt="Kaiser Permanente Home">
            </a>
          </div>
          <button class="ds-header__menu-button" type="button" aria-labelledby="menu-btn-text-id">
            <img class="ds-header__menu-button-icon ds-header__menu-button-icon--open"
                 src="${img('assets/icons/ds2/menu.svg')}" alt="" width="24" height="24">
            <img class="ds-header__menu-button-icon ds-header__menu-button-icon--close"
                 src="${img('assets/icons/ds2/close-small.svg')}" alt="" width="24" height="24">
            <span class="ds-header__menu-button-text" id="menu-btn-text-id">${menuLabel}</span>
          </button>
        </div>
        <nav class="ds-header__primary-nav" aria-label="Primary">
          <span class="screenreader-only device-only">Beginning of navigation menu</span>
          <ul class="ds-header__primary-nav-list">${navItems}</ul>
          <span class="screenreader-only device-only">End of navigation menu</span>
          <span class="ds-header__primary-nav-end"></span>
        </nav>
      </div>
    </header>
  `);
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
