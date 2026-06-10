// Autocomplete Search — current lineage: demo-foundation-contextual-v2 (v2, vessel theme).
// Source: kp-vessel-1/autocomplete-search-pattern/demo-foundation-contextual-v2.html
//
// A combobox input with a suggestion listbox. In the source the suggestions come from a
// JSON URL (data-search-suggestions-url) loaded by the vendor JS; here we pass the
// suggestion list as an arg and re-implement the filter/show/hide/select behavior in
// vanilla JS. The listbox is toggled via the `-hidden` class (CSS: display:none).

import { ensurePatternStyles, assetUrl, el } from '../pattern-utils.js';

const PATTERN = 'autocomplete-search';

const DEFAULT_SUGGESTIONS = [
  'Acne', 'ADD-ADHD', 'Adult Vaccines', 'Allergies', 'Alzheimers', 'Anxiety Panic',
  'Arthritis', 'Asthma', 'Back Pain', 'Birth Control', 'Breast Cancer', 'Cancer',
  'Diabetes', 'Flu', 'Heart Disease', 'High Blood Pressure', 'Migraine', 'Pregnancy',
];

function renderAutocomplete({
  label = 'Contextual search label',
  placeholder = 'Type keyword to search',
  suggestions = DEFAULT_SUGGESTIONS,
  maxResults = 8,
} = {}) {
  ensurePatternStyles(PATTERN);

  const root = el(`
    <div class="ds-autocompletesearch" data-ds-theme="vessel" data-ds-variant="contextual" data-ds-version="2">
      <form class="autocomplete-search__form" autocomplete="off" method="get" onsubmit="return false" action="">
        <label class="autocomplete-search__label">${label}</label>
        <div class="autocomplete-search__combobox ds-form__clear-input-field" role="application">
          <input class="autocomplete-search__input clear-input-textbox contextual-input" type="text"
                 placeholder="${placeholder}" role="combobox" aria-expanded="false" aria-autocomplete="list">
          <fieldset class="autocomplete-search__listbox -hidden">
            <ul class="autocomplete-search__result" role="listbox"></ul>
          </fieldset>
          <button class="clear-input-button" type="button" aria-label="Clear">
            <img src="${assetUrl(PATTERN, 'assets/images/clear_x.svg')}" alt="">
          </button>
        </div>
        <button class="autocomplete-search__submit button" type="submit">Search</button>
      </form>
    </div>
  `);

  const input = root.querySelector('.autocomplete-search__input');
  const listbox = root.querySelector('.autocomplete-search__listbox');
  const list = root.querySelector('.autocomplete-search__result');
  const clearBtn = root.querySelector('.clear-input-button');

  const hide = () => {
    listbox.classList.add('-hidden');
    listbox.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');
  };
  const show = () => {
    listbox.classList.remove('-hidden');
    listbox.style.display = '';
    input.setAttribute('aria-expanded', 'true');
  };

  const update = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return hide();
    const matches = suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, maxResults);
    if (!matches.length) return hide();
    list.innerHTML = matches
      .map((s) => `<li role="option"><button class="autocomplete-search__link" type="button">${s}</button></li>`)
      .join('');
    list.querySelectorAll('.autocomplete-search__link').forEach((btn) => {
      btn.addEventListener('click', () => {
        input.value = btn.textContent;
        hide();
        input.focus();
      });
    });
    return show();
  };

  input.addEventListener('input', update);
  input.addEventListener('focus', update);
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  clearBtn.addEventListener('click', () => {
    input.value = '';
    hide();
    input.focus();
  });
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) hide(); });

  hide();
  return root;
}

export default {
  title: 'Components/Autocomplete Search',
  render: (args) => renderAutocomplete(args),
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    suggestions: { control: 'object' },
    maxResults: { control: { type: 'number', min: 1, max: 15 } },
  },
  args: {
    label: 'Contextual search label',
    placeholder: 'Type keyword to search',
    suggestions: DEFAULT_SUGGESTIONS,
    maxResults: 8,
  },
};

export const Contextual = {};
