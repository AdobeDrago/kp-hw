// Shared renderer for the KP vessel header (.ds-header, compact/v2). Lives in the
// block (ships with EDS) and is imported by the Storybook reference story
// (stories/header/Header.stories.js) so the authored header and the design
// reference render the same DOM and cannot drift.
//
// Pure: takes structured nav data + resolved asset URLs and returns a detached
// .ds-header element. Behavior (mobile toggle, dropdown open/close) is wired by
// the caller (the block's init or a story), not here.

function elFromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// One <li> per nav item. kind 'link' → a (optionally "large") link; kind
// 'language' → the .ds-dropdown trigger (menu list populated on open by the caller).
function navItem(item, icons) {
  if (item.kind === 'language') {
    return `<li class="ds-header__primary-nav-list-item">
      <div class="ds-dropdown" data-menu-type="language" data-select-label="selected"
           data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2">
        <div class="ds-dropdown__drop-menu">
          <label class="ds-dropdown__label"><span class="ds-dropdown__label-text">${item.label || 'Language'}</span></label>
          <button class="ds-dropdown__trigger-button" type="button">
            <span class="ds-dropdown__trigger-text">${item.value || ''}</span>
            <img class="ds-dropdown__chevron" src="${icons.chevron}" alt="" width="24" height="24">
          </button>
          <ul class="ds-dropdown__menu-list"></ul>
        </div>
      </div>
    </li>`;
  }
  const large = item.large ? ' ds-header__primary-nav-list-item--large' : '';
  return `<li class="ds-header__primary-nav-list-item${large}">
    <a href="${item.href || '#'}" class="ds-header__primary-nav-list-link">${item.label || ''}</a>
  </li>`;
}

/**
 * @param {object} data
 * @param {string} [data.home]            logo link href
 * @param {{mobile:string,desktop:string}} data.logos  resolved logo URLs
 * @param {{menu:string,close:string,chevron:string}} data.icons  resolved icon URLs
 * @param {string} [data.menuLabel]
 * @param {Array<{kind:'link',label:string,href:string,large?:boolean}
 *               |{kind:'language',label?:string,value?:string}>} [data.items]
 * @returns {HTMLElement} the .ds-header element
 */
export function renderHeader({
  home = '/',
  logos = {},
  icons = {},
  menuLabel = 'Menu',
  items = [],
} = {}) {
  const list = items.map((item) => navItem(item, icons)).join('');
  return elFromHTML(`
    <header class="ds-header" data-ds-theme="vessel" data-ds-variant="compact" data-ds-version="2">
      <div class="ds-header__layout">
        <div class="ds-header__top-bar">
          <div class="ds-header__branding">
            <a class="ds-header__logo" href="${home}" aria-label="Kaiser Permanente Home">
              <img class="ds-header__logo-img ds-header__logo-img--mobile" src="${logos.mobile || ''}"
                   width="150" height="40" alt="Kaiser Permanente Home">
              <img class="ds-header__logo-img ds-header__logo-img--desktop" src="${logos.desktop || ''}"
                   width="374" height="42" alt="Kaiser Permanente Home">
            </a>
          </div>
          <button class="ds-header__menu-button" type="button" aria-labelledby="menu-btn-text-id" aria-expanded="false">
            <img class="ds-header__menu-button-icon ds-header__menu-button-icon--open" src="${icons.menu || ''}" alt="" width="24" height="24">
            <img class="ds-header__menu-button-icon ds-header__menu-button-icon--close" src="${icons.close || ''}" alt="" width="24" height="24">
            <span class="ds-header__menu-button-text" id="menu-btn-text-id">${menuLabel}</span>
          </button>
        </div>
        <nav class="ds-header__primary-nav" aria-label="Primary">
          <span class="screenreader-only device-only">Beginning of navigation menu</span>
          <ul class="ds-header__primary-nav-list">${list}</ul>
          <span class="screenreader-only device-only">End of navigation menu</span>
          <span class="ds-header__primary-nav-end"></span>
        </nav>
      </div>
    </header>
  `);
}
