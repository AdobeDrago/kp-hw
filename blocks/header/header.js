import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';
import { renderHeader } from './header-dom.js';

// Vessel header (.ds-header). Built from the nav fragment via the shared renderer
// (blocks/header/header-dom.js), styled by the sliced vessel CSS.
//
// NOTE — this adopts the simpler vessel design. Compared with the previous KP
// header it intentionally does NOT carry: the utility/brand bar of external links,
// multi-level nav dropdowns, breadcrumbs, or the mobile accordion. Those are vessel
// design gaps to extend the renderer for if/when needed. The nav-fragment mapping
// below (top-level links + language widget) is best-effort and should be validated
// against the real /fragments/nav/header content.

const { locale } = getConfig();
const isLocalContent = window.location.pathname.startsWith('/content/');
const HEADER_PATH = isLocalContent ? '/content/fragments/nav/header' : '/fragments/nav/header';
const isDesktop = window.matchMedia('(min-width: 900px)');
const LANGUAGE_WIDGET = '/tools/widgets/language';

// Assets ship with the block; new URL(import.meta.url) resolves in Vite and EDS.
const ASSET = {
  logoMobile: new URL('./assets/images/kp-logo-signature-stacked.svg', import.meta.url).href,
  logoDesktop: new URL('./assets/images/kp-logo-374x42.svg', import.meta.url).href,
  menu: new URL('./assets/icons/ds2/menu.svg', import.meta.url).href,
  close: new URL('./assets/icons/ds2/close-small.svg', import.meta.url).href,
  chevron: new URL('./assets/icons/ds2/chevrondown.svg', import.meta.url).href,
};

// Map the nav fragment to vessel header items: top-level links become nav links;
// a language widget becomes the language dropdown (inserted after the first link).
function itemsFromFragment(fragment) {
  const items = [];
  let hasLanguage = false;
  const list = fragment.querySelector('ul');
  if (list) {
    list.querySelectorAll(':scope > li').forEach((li) => {
      const a = li.querySelector(':scope > a');
      if (!a) return;
      const href = a.getAttribute('href') || '#';
      if (href.includes(LANGUAGE_WIDGET)) {
        hasLanguage = true;
        return;
      }
      items.push({ kind: 'link', label: a.textContent.trim(), href });
    });
  }
  if (hasLanguage || fragment.querySelector(`a[href*="${LANGUAGE_WIDGET}"]`)) {
    items.splice(Math.min(1, items.length), 0, { kind: 'language', label: 'Language', value: '' });
  }
  return items;
}

function wireMenuButton(header) {
  const btn = header.querySelector('.ds-header__menu-button');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const open = header.classList.toggle('is-mobile-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
  });
}

function wireLanguageDropdown(header) {
  const dropdown = header.querySelector('.ds-dropdown[data-menu-type="language"]');
  if (!dropdown) return;
  const trigger = dropdown.querySelector('.ds-dropdown__trigger-button');
  const menuList = dropdown.querySelector('.ds-dropdown__menu-list');
  let loaded = false;

  const closeOnOutside = (e) => {
    if (!e.target.closest('.ds-dropdown')) {
      dropdown.classList.remove('is-open');
      document.removeEventListener('click', closeOnOutside);
    }
  };

  trigger.addEventListener('click', async (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('is-open');
    if (!open) {
      document.removeEventListener('click', closeOnOutside);
      return;
    }
    document.addEventListener('click', closeOnOutside);
    if (!loaded) {
      loaded = true;
      try {
        const frag = await loadFragment(`${locale.prefix}${HEADER_PATH}/languages`);
        if (frag) menuList.append(frag);
      } catch {
        loaded = false;
      }
    }
  });
}

export default async function init(el) {
  const navPath = getMetadata('header') || HEADER_PATH;
  const fragment = await loadFragment(`${locale.prefix}${navPath}`);

  const items = fragment ? itemsFromFragment(fragment) : [];
  const home = fragment?.querySelector('a[href]')?.getAttribute('href') || '/';

  const header = renderHeader({
    home,
    menuLabel: 'Menu',
    items,
    logos: { mobile: ASSET.logoMobile, desktop: ASSET.logoDesktop },
    icons: { menu: ASSET.menu, close: ASSET.close, chevron: ASSET.chevron },
  });

  wireMenuButton(header);
  wireLanguageDropdown(header);

  el.textContent = '';
  el.append(header);
}
