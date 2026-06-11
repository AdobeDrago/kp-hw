import { NON_AUTH, AUTH } from './kp-markup.js';

// KP production header (.kp-header) with a localStorage-driven auth toggle:
//   localStorage.auth === '1'  → authenticated header + /fragments/nav/header-authenticated
//   otherwise                  → non-authenticated header + /fragments/nav/header
//
// The kp-header SHELL (utility bar, search, logo, mega-menu chrome) comes from the
// vendored markup (kp-markup.js); the PRIMARY NAV is author-editable — it's poured in
// from the nav fragment at runtime, so editing the fragment in DA changes the menu.
// (Utility/account links + search are still from the shell — a follow-up to also map
// those from the fragment.)
//
// Self-contained: the block ships its own CSS (header.css) and assets
// (blocks/header/assets, referenced block-relative), so the live site needs nothing
// from outside the block.
//
// Toggle from the console:  localStorage.setItem('auth', '1'); location.reload();

const NAV_PATH = {
  auth: '/fragments/nav/header-authenticated',
  nonAuth: '/fragments/nav/header',
};
const PRIMARY_NAV = '.kp-header-global-menu__primary-links-list';
const MENU_ITEM = 'kp-header-global-menu__menu-item';
const MENU_LINK = 'kp-header-global-menu__menu-item__link';

export function isAuthenticated() {
  try {
    return localStorage.getItem('auth') === '1';
  } catch {
    return false;
  }
}

function elFromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// The fragment's primary nav is its last <ul> (first <ul> is the utility row).
function primaryNavItems(fragment) {
  const lists = [...fragment.querySelectorAll('ul')];
  const primary = lists[lists.length - 1];
  if (!primary) return '';
  return [...primary.querySelectorAll(':scope > li > a')]
    .map((a) => `<li class="${MENU_ITEM}"><a href="${a.getAttribute('href') || '#'}" class="${MENU_LINK}">${a.textContent.trim()}</a></li>`)
    .join('');
}

// Replace the shell's primary nav with the fragment's links (author-editable).
async function applyFragmentNav(authed, root) {
  try {
    const [{ loadFragment }, { getConfig }] = await Promise.all([
      import('../fragment/fragment.js'),
      import('../../scripts/ak.js'),
    ]);
    const prefix = getConfig()?.locale?.prefix || '';
    const fragment = await loadFragment(`${prefix}${authed ? NAV_PATH.auth : NAV_PATH.nonAuth}`);
    const list = fragment && root.querySelector(PRIMARY_NAV);
    const items = fragment && primaryNavItems(fragment);
    if (list && items) list.innerHTML = items;
  } catch {
    /* fragment unavailable (e.g. Storybook isolation) — keep the shell's default nav */
  }
}

export default function init(el) {
  const authed = isAuthenticated();
  const header = elFromHTML(authed ? AUTH : NON_AUTH);
  el.replaceChildren(header);
  applyFragmentNav(authed, header);
}
