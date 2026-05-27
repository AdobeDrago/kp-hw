import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const { locale } = getConfig();

const isLocalContent = window.location.pathname.startsWith('/content/');
const HEADER_PATH = isLocalContent ? '/content/fragments/nav/header' : '/fragments/nav/header';
const isDesktop = window.matchMedia('(min-width: 900px)');

// ── Dropdown toggle system (language picker) ──

function closeAllMenus() {
  const openMenus = document.body.querySelectorAll('header .is-open');
  for (const openMenu of openMenus) {
    openMenu.classList.remove('is-open');
  }
}

function docClose(e) {
  if (e.target.closest('header')) return;
  closeAllMenus();
}

function toggleDropdown(menu) {
  const isOpen = menu.classList.contains('is-open');
  closeAllMenus();
  if (isOpen) {
    document.removeEventListener('click', docClose);
    return;
  }
  document.addEventListener('click', docClose);
  menu.classList.add('is-open');
}

function decorateLanguage(btn) {
  const section = btn.closest('.section');
  let blockContent = null;

  btn.addEventListener('click', async () => {
    if (!blockContent) {
      // Build and show the dropdown immediately, then load content into it
      blockContent = document.createElement('div');
      blockContent.classList.add('block-content');
      const menu = document.createElement('div');
      menu.className = 'language menu';
      blockContent.append(menu);
      section.append(blockContent);
      toggleDropdown(section);
      try {
        const fragment = await loadFragment(`${locale.prefix}${HEADER_PATH}/languages`);
        if (fragment) menu.append(fragment);
      } catch (e) {
        blockContent.remove();
        blockContent = null;
      }
    } else {
      toggleDropdown(section);
    }
  });
}

function decorateNavToggle(btn) {
  btn.addEventListener('click', () => {
    const header = document.body.querySelector('header');
    if (header) header.classList.toggle('is-mobile-open');
  });
}

// ── Mobile nav system (KP) ──

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMobileNav(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMobileNav(nav, navSections, false);
    }
  }
}

function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll(':scope .default-content > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleMobileNav(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const hamburgerLabel = nav.querySelector('.nav-hamburger-label');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  const menuOpen = nav.getAttribute('aria-expanded') === 'true';
  if (hamburgerLabel) hamburgerLabel.textContent = menuOpen ? 'Close' : 'Menu';

  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
      }
    });
  } else {
    navDrops.forEach((drop) => drop.removeAttribute('tabindex'));
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

// ── Action decoration ──

async function decorateAction(container, pattern) {
  const link = container.querySelector(`[href*="${pattern}"]`);
  if (!link) return;

  const icon = link.querySelector('.icon');
  const text = link.textContent.trim();
  const btn = document.createElement('button');
  if (icon) btn.append(icon);
  if (text) {
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = text;
    btn.append(textSpan);
  }

  const wrapper = document.createElement('div');
  const iconClass = icon ? icon.classList[1]?.replace('icon-', '') : 'action';
  wrapper.className = `action-wrapper ${iconClass}`;
  wrapper.append(btn);
  link.parentElement.parentElement.replaceChild(wrapper, link.parentElement);

  if (pattern === '/tools/widgets/language') decorateLanguage(btn);
  if (pattern === '/tools/widgets/toggle') decorateNavToggle(btn);
}

// ── Breadcrumbs (KP) ──

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > a');
  if (menuLink) return menuLink.textContent.trim();
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

async function buildBreadcrumbsFromNavTree(navEl, currentUrl) {
  const crumbs = [];
  const homeUrl = document.querySelector('.nav-brand a[href]')?.href;

  let menuItem = Array.from(navEl.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
    } while (menuItem);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  crumbs.unshift({ title: 'Home', url: homeUrl });

  if (crumbs.length > 1) crumbs[crumbs.length - 1].url = null;
  crumbs[crumbs.length - 1]['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(
    document.querySelector('.nav-sections'),
    document.location.href,
  );

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));

  breadcrumbs.append(ol);
  return breadcrumbs;
}

// ── Init ──

export default async function init(el) {
  const headerMeta = getMetadata('header');
  const navPath = headerMeta || HEADER_PATH;

  const fragment = await loadFragment(`${locale.prefix}${navPath}`);

  el.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Apply KP section classes (brand = utility bar, sections = logo bar, tools = nav links)
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // nav-brand (section 1): external links + language toggle + nav toggle
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    navBrand.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
    await decorateAction(navBrand, '/tools/widgets/language');
    await decorateAction(navBrand, '/tools/widgets/toggle');
  }

  // nav-sections (section 2): add hamburger for mobile
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });

    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>
      <span class="nav-hamburger-label" aria-hidden="true">Menu</span>`;
    hamburger.addEventListener('click', () => toggleMobileNav(nav, navSections));
    const sectionsInner = navSections.querySelector('.default-content');
    if (sectionsInner) sectionsInner.append(hamburger);
  }

  nav.setAttribute('aria-expanded', 'false');
  toggleMobileNav(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMobileNav(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  el.append(navWrapper);

  if (getMetadata('breadcrumbs')?.toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
