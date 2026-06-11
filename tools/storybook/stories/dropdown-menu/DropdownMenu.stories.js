// Dropdown Menu — current lineage: demo-standard-v2 (v2, vessel theme).
// Source: design-files/.extracted/kp-vessel-2/dropdown-menu-pattern/demo-standard-v2.html
//
// In the source the trigger button + an EMPTY <ul.ds-dropdown__menu-list> sibling are
// static, and the vendor JS populates the options from data and handles open/close
// (toggling aria-expanded on the trigger + `-expanded` on the root). We supply the options
// ourselves and re-implement open/close/select in vanilla JS. The menu's open/closed
// visibility is forced via an explicit display toggle (the vendor's reveal rule isn't
// cleanly recoverable from the compiled CSS), with vendor CSS styling the open menu.

import { ensurePatternStyles, assetUrl, el, uid } from '../pattern-utils.js';

const PATTERN = 'dropdown-menu';
const img = (name) => assetUrl(PATTERN, `assets/images/${name}`);

const THEME_CLASS = {
  default: '',
  dark: 'ds-dropdown--dark',
  'high-contrast': 'ds-dropdown--high-contrast',
  'dark-high-contrast': 'ds-dropdown--dark-high-contrast',
};

function renderDropdown({
  options = ['Viewing pages', 'My account', 'Settings', 'Sign out'],
  selectedIndex = 0,
  theme = 'default',
  small = false,
  label = 'Viewing pages',
  showLabel = true,
  showTriggerIcon = true,
} = {}) {
  ensurePatternStyles(PATTERN);

  const classes = ['ds-dropdown', THEME_CLASS[theme], small ? 'ds-dropdown--small' : '']
    .filter(Boolean).join(' ');
  const triggerId = uid('dd-trigger');

  const optionEls = options
    .map((opt, i) => `
      <li class="drop-menu-list-op${i === selectedIndex ? ' active' : ''}" role="option" tabindex="-1" data-index="${i}">
        <span class="drop-menu-list-text">${opt}</span>
        <img class="checkmark-img" src="${img('checkmark-black.svg')}" alt="" width="24" height="24">
      </li>`)
    .join('');

  const root = el(`
    <div class="${classes}" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2" data-menu-type="standard">
      <div class="ds-dropdown__drop-menu">
        ${showLabel ? `<label class="ds-dropdown__label"><span class="ds-dropdown__label-text">${label}</span></label>` : ''}
        <button class="ds-dropdown__trigger-button" id="${triggerId}" aria-haspopup="listbox" aria-expanded="false">
          ${showTriggerIcon ? `<img class="ds-dropdown__img" src="${img('people.svg')}" alt="" width="24" height="24">` : ''}
          <span class="ds-dropdown__trigger-text">${options[selectedIndex] ?? 'Select'}</span>
          <img class="ds-dropdown__chevron" src="${img('chevrondown.svg')}" alt="" width="24" height="24">
        </button>
        <ul class="ds-dropdown__menu-list" role="listbox" aria-labelledby="${triggerId}">${optionEls}</ul>
      </div>
    </div>
  `);

  const trigger = root.querySelector('.ds-dropdown__trigger-button');
  const triggerText = root.querySelector('.ds-dropdown__trigger-text');
  const menu = root.querySelector('.ds-dropdown__menu-list');

  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    root.classList.toggle('-expanded', open);
    menu.style.display = open ? '' : 'none'; // force closed state regardless of vendor rule
  };
  setOpen(false);

  trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));

  menu.querySelectorAll('.drop-menu-list-op').forEach((li) => {
    li.addEventListener('click', () => {
      menu.querySelectorAll('.drop-menu-list-op').forEach((o) => o.classList.remove('active'));
      li.classList.add('active');
      triggerText.textContent = li.querySelector('.drop-menu-list-text').textContent;
      setOpen(false);
      trigger.focus();
    });
  });

  // Close on outside click / Escape.
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) setOpen(false);
  });

  return root;
}

export default {
  title: 'Components/Dropdown Menu',
  render: (args) => renderDropdown(args),
  argTypes: {
    options: { control: 'object' },
    selectedIndex: { control: { type: 'number', min: 0 } },
    theme: { control: { type: 'select' }, options: ['default', 'dark', 'high-contrast', 'dark-high-contrast'] },
    small: { control: 'boolean' },
    label: { control: 'text' },
    showLabel: { control: 'boolean' },
    showTriggerIcon: { control: 'boolean' },
  },
  args: {
    options: ['Viewing pages', 'My account', 'Settings', 'Sign out'],
    selectedIndex: 0,
    theme: 'default',
    small: false,
    label: 'Viewing pages',
    showLabel: true,
    showTriggerIcon: true,
  },
};

export const Standard = {};
export const Small = { args: { small: true } };
export const Dark = { args: { theme: 'dark' } };
export const HighContrast = { args: { theme: 'high-contrast' } };
