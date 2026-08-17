import { getConfig } from '../../scripts/ak.js';
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
    const { loadFragment } = await import('../fragment/fragment.js');
    const prefix = getConfig()?.locale?.prefix || '';
    const fragment = await loadFragment(`${prefix}${authed ? NAV_PATH.auth : NAV_PATH.nonAuth}`);
    const list = fragment && root.querySelector(PRIMARY_NAV);
    const items = fragment && primaryNavItems(fragment);
    if (list && items) list.innerHTML = items;
  } catch {
    /* fragment unavailable (e.g. Storybook isolation) — keep the shell's default nav */
  }
}

// Region / Language selector dropdowns. The open/close interaction is wired (the
// vendor JS normally does this). Options + selected label are PLACEHOLDER data —
// TODO(#33): replace with content fragments (language → /fragments/nav/header/languages,
// already authored; region → /fragments/nav/header/regions, needs authoring).
const DROPDOWN_PLACEHOLDER = {
  'region-dark': { selected: 'California - Northern', options: ['California - Northern', 'California - Southern', 'Colorado', 'Georgia', 'Hawaii', 'Washington'] },
  region: { selected: 'California - Northern', options: ['California - Northern', 'California - Southern', 'Colorado', 'Georgia', 'Hawaii', 'Washington'] },
  language: { selected: 'English', options: ['English', 'Español', '中文'] },
};

function populatePlaceholder(pattern) {
  const data = DROPDOWN_PLACEHOLDER[pattern.dataset.menuType];
  if (!data) return;
  const label = pattern.querySelector('.drop-menu-button-text');
  if (label && !label.textContent.trim()) label.textContent = data.selected;
  const list = pattern.querySelector('.drop-menu-list');
  if (list && !list.children.length) {
    list.innerHTML = data.options
      .map((opt) => `<li class="drop-menu-list-op${opt === data.selected ? ' active' : ''}"><span class="drop-menu-list-text">${opt}</span></li>`)
      .join('');
  }
}

function wireDropdowns(root) {
  const triggers = [...root.querySelectorAll('.drop-menu-dropdown')];
  if (!triggers.length) return;
  root.querySelectorAll('.drop-menu-pattern').forEach((p) => {
    // The vendor JS adds the modifier matching data-menu-type (e.g. --region-dark,
    // --language). It carries the field label styling, dark theme, white chevron,
    // and the show/hide rules — without it the dropdown is unstyled.
    if (p.dataset.menuType) p.classList.add(`--${p.dataset.menuType}`);
    populatePlaceholder(p);
  });

  const closeAll = () => triggers.forEach((b) => b.setAttribute('aria-expanded', 'false'));
  closeAll();

  triggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      closeAll();
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.drop-menu')) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

const getUseHref = (u) => u.getAttribute('href') || u.getAttribute('xlink:href') || '';

// The vendored shell markup references assets with root-relative paths
// (`/libs/blocks/header/assets/…`). On a CONSUMING site those resolve to the
// consumer's own origin (no /libs) → 404. Fix both kinds:
//  - `<img>`/`src`: cross-origin loads fine → repoint at the libs origin.
//  - SVG `<use>` sprites: cross-origin is BLOCKED by the browser ("Unsafe attempt
//    to load URL … from frame"). Point `<use>` at a LOCAL fragment now (so nothing
//    cross-origin is attempted) and return the sprite files to inline afterward.
function rewriteLibsAssets(root) {
  const { libsBase } = getConfig();
  if (!libsBase) return [];
  root.querySelectorAll('[src^="/libs/"]').forEach((node) => {
    node.setAttribute('src', node.getAttribute('src').replace(/^\/libs/, libsBase));
  });
  const sprites = new Set();
  root.querySelectorAll('use').forEach((use) => {
    const href = getUseHref(use);
    if (!href.startsWith('/libs/')) return;
    const [file, frag] = href.split('#');
    sprites.add(file);
    if (frag) {
      use.setAttribute('href', `#${frag}`);
      use.removeAttribute('xlink:href');
    }
  });
  return [...sprites];
}

// Fetch each libs SVG sprite once and inline it (same-origin) so the local `<use>`
// fragments resolve. Failures are silent — worst case the icon is absent, no error.
async function inlineLibsSprites(files) {
  const { libsBase } = getConfig();
  if (!libsBase) return;
  await Promise.all(files.map(async (file) => {
    const id = `libs-sprite-${file.split('/').pop().replace(/\W/g, '-')}`;
    if (document.getElementById(id)) return;
    try {
      const res = await fetch(`${libsBase}${file.replace(/^\/libs/, '')}`);
      if (!res.ok) return;
      const holder = document.createElement('div');
      holder.id = id;
      holder.setAttribute('aria-hidden', 'true');
      holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      holder.innerHTML = await res.text();
      document.body.prepend(holder);
    } catch { /* icon just won't render — no console error */ }
  }));
}

export default function init(el) {
  const authed = isAuthenticated();
  const header = elFromHTML(authed ? AUTH : NON_AUTH);
  const sprites = rewriteLibsAssets(header);
  el.replaceChildren(header);
  inlineLibsSprites(sprites);
  applyFragmentNav(authed, header);
  wireDropdowns(header);
}
