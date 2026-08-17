import { getConfig } from '../../scripts/ak.js';

const { log } = getConfig();

let tabsInstanceId = 0;

function switchTab(tabList, tabPanels, idx) {
  const buttons = tabList.querySelectorAll('button');
  buttons.forEach((button, i) => {
    button.classList.remove('is-active');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('tabindex', i === idx ? '0' : '-1');
  });
  tabPanels.forEach((sec) => { sec.classList.remove('is-visible'); });
  tabPanels[idx]?.classList.add('is-visible');
  buttons[idx]?.classList.add('is-active');
  buttons[idx]?.setAttribute('aria-selected', 'true');
  buttons[idx]?.setAttribute('tabindex', '0');
  buttons[idx]?.focus();
}

function getTabList(tabs, tabPanels, instanceId) {
  const tabItems = tabs.querySelectorAll('li');
  const tabList = document.createElement('div');
  tabList.className = 'tab-list';
  tabList.role = 'tablist';

  const tabNames = [];

  for (const [idx, tab] of tabItems.entries()) {
    const btn = document.createElement('button');
    btn.role = 'tab';
    btn.id = `tab-${instanceId}-${idx + 1}`;
    btn.setAttribute('aria-controls', `tabpanel-${instanceId}-${idx + 1}`);
    btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
    btn.textContent = tab.textContent;
    tabNames.push(tab.textContent.trim().replace(/\s+/g, '-'));
    if (idx === 0) {
      btn.classList.add('is-active');
      tabPanels[0]?.classList.add('is-visible');
    }
    tabList.append(btn);

    btn.addEventListener('click', () => {
      switchTab(tabList, tabPanels, idx);
    });
  }

  tabList.addEventListener('keydown', (e) => {
    const buttons = [...tabList.querySelectorAll('button')];
    const current = buttons.findIndex((btn) => btn.classList.contains('is-active'));
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else return;
    e.preventDefault();
    switchTab(tabList, tabPanels, next);
  });

  function handleHash() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const matchIdx = tabNames.findIndex(
      (name) => name.toLowerCase() === hash.toLowerCase(),
    );
    if (matchIdx >= 0) switchTab(tabList, tabPanels, matchIdx);
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();

  const parentEl = tabs.closest('.fragment-content, main');
  if (parentEl) {
    parentEl.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="#"]');
      if (!link) return;
      const hash = link.getAttribute('href').split('#')[1];
      if (!hash) return;
      const matchIdx = tabNames.findIndex(
        (name) => name.toLowerCase() === hash.toLowerCase(),
      );
      if (matchIdx >= 0) {
        e.preventDefault();
        switchTab(tabList, tabPanels, matchIdx);
        window.history.replaceState(null, '', `#${hash}`);
      }
    });
  }

  return tabList;
}

export default function init(el) {
  const instanceId = tabsInstanceId;
  tabsInstanceId += 1;

  const parent = el.closest('.fragment-content, main');
  parent.style = 'display: none;';

  try {
    const tabs = el.querySelector('.advanced-tabs ul');
    if (!tabs) {
      log('Please add an unordered list to the advanced tabs block.');
      return;
    }

    const currSection = el.closest('.section');
    currSection.classList.add('tab-section');

    const tabCount = tabs.querySelectorAll('li').length;

    const tabPanels = [];
    let sibling = currSection.nextElementSibling;
    while (sibling && tabPanels.length < tabCount) {
      if (sibling.querySelector('.advanced-carousel, .advanced-tabs')) break;

      sibling.classList.add('tab-section');
      sibling.id = `tabpanel-${instanceId}-${tabPanels.length + 1}`;
      sibling.role = 'tabpanel';
      sibling.setAttribute('aria-labelledby', `tab-${instanceId}-${tabPanels.length + 1}`);
      tabPanels.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    const tabList = getTabList(tabs, tabPanels, instanceId);

    tabs.remove();
    el.append(tabList, ...tabPanels);
  } finally {
    parent.removeAttribute('style');
  }
}
