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

// Normalize a label or a URL path segment to a comparable slug, so separators and
// casing don't matter: both "California - Northern" and a "california-northern" path
// segment collapse to "california-northern".
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Mark one option as selected: activate it, clear the others, and mirror its text
// into the dropdown button label.
function selectOption(pattern, option) {
  pattern.querySelectorAll('.drop-menu-list-op').forEach((li) => li.classList.remove('active'));
  option.classList.add('active');
  const label = pattern.querySelector('.drop-menu-button-text');
  const text = option.querySelector('.drop-menu-list-text')?.textContent.trim();
  if (label && text) label.textContent = text;
}

// Auto-select the region whose name matches a segment of the URL path — e.g.
// /en/colorado/ and /es/colorado/ → "Colorado"; /california-northern/ →
// "California - Northern". We loop the dropdown's own options and slug-match each
// label against the path segments, so this is separator- and language-prefix-
// agnostic (works for any locale without hard-coding slugs). Only region dropdowns
// are considered.
function selectRegionFromUrl(pattern) {
  if (!/^region/.test(pattern.dataset.menuType || '')) return;
  const segments = window.location.pathname.split('/').map(slugify).filter(Boolean);
  const match = [...pattern.querySelectorAll('.drop-menu-list-op')].find((li) => {
    const text = li.querySelector('.drop-menu-list-text')?.textContent.trim();
    return text && segments.includes(slugify(text));
  });
  if (match) selectOption(pattern, match);
}

// Dropdown label per resolved locale code. English is the root/no-prefix default;
// codes mirror the locales in scripts.js (es and zh are the ones with an option).
const LANG_LABEL_BY_CODE = { en: 'English', es: 'Español', zh: '中文' };

// Auto-select the language for the current locale. getLocale() (scripts/ak.js) resolves
// the URL prefix (/es, /zh, …) — or a `locale` meta override — and sets <html lang>, so
// we read that (unlike region, the option labels don't match the URL codes). Falls back
// to the URL's first path segment if <html lang> isn't set yet (e.g. Storybook). A
// locale with no dropdown option (e.g. /fr) leaves the default untouched.
function selectLanguageFromUrl(pattern) {
  if (pattern.dataset.menuType !== 'language') return;
  const raw = document.documentElement.lang
    || window.location.pathname.split('/').filter(Boolean)[0]
    || 'en';
  const label = LANG_LABEL_BY_CODE[raw.toLowerCase().split('-')[0]];
  if (!label) return;
  const match = [...pattern.querySelectorAll('.drop-menu-list-op')].find(
    (li) => li.querySelector('.drop-menu-list-text')?.textContent.trim() === label,
  );
  if (match) selectOption(pattern, match);
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
    selectRegionFromUrl(p);
    selectLanguageFromUrl(p);
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

export default function init(el) {
  const authed = isAuthenticated();
  const header = elFromHTML(authed ? AUTH : NON_AUTH);
  el.replaceChildren(header);
  applyFragmentNav(authed, header);
  wireDropdowns(header);
}
