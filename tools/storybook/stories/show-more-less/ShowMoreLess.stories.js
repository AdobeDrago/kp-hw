// Show More / Less — current lineage: foundation-block-v3 (vessel theme).
// Source: design-files/.extracted/kp-vessel-5/show-more-less-pattern/index-foundation-block-v3.html
//
// A list that initially reveals `showFirst` items and injects a toggle to reveal/hide
// the rest. In the source, the .ds-showmoreless config lives on data-* attributes and
// the vendor JS injects the toggle. We re-implement the reveal/hide + label/icon swap in
// vanilla JS (the toggle uses the .show-more-less-toggle / __icon classes from the CSS).

import { ensurePatternStyles, el } from '../pattern-utils.js';

const PATTERN = 'show-more-less';

function renderShowMoreLess({
  showFirst = 3,
  itemCount = 6,
  moreLabel = 'Show more',
  lessLabel = 'Show less',
  showDivider = true,
} = {}) {
  ensurePatternStyles(PATTERN);

  const items = Array.from({ length: itemCount }, (_, i) => `
    <div class="show-more-less-item">
      <div>Article Title ${i + 1}</div>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque id sodales mi.</p>
    </div>`).join('');

  const node = el(`
    <div class="ds-showmoreless" data-ds-theme="vessel" data-ds-variant="block" data-ds-version="3"
         data-show-first="${showFirst}" data-more-label="${moreLabel}" data-less-label="${lessLabel}"
         data-show-icon="true" data-show-divider="${showDivider}">
      ${items}
      <div class="show-more-less-group">
        ${showDivider ? '<hr class="show-more-less-divider">' : ''}
        <button class="show-more-less-toggle" aria-expanded="false" type="button">
          <span class="show-more-less-icon" aria-hidden="true"></span>
          <span class="show-more-less-toggle-label">${moreLabel}</span>
        </button>
      </div>
    </div>
  `);

  const allItems = [...node.querySelectorAll('.show-more-less-item')];
  const btn = node.querySelector('.show-more-less-toggle');
  const iconEl = node.querySelector('.show-more-less-icon');
  const label = node.querySelector('.show-more-less-toggle-label');

  const apply = (expanded) => {
    allItems.forEach((item, i) => {
      item.hidden = !expanded && i >= showFirst;
    });
    btn.setAttribute('aria-expanded', String(expanded));
    iconEl.classList.toggle('--minus', expanded);
    label.textContent = expanded ? lessLabel : moreLabel;
  };

  apply(false);
  btn.addEventListener('click', () => apply(btn.getAttribute('aria-expanded') !== 'true'));

  return node;
}

export default {
  title: 'Components/Show More Less',
  render: (args) => renderShowMoreLess(args),
  argTypes: {
    showFirst: { control: { type: 'number', min: 1, max: 10 } },
    itemCount: { control: { type: 'number', min: 1, max: 12 } },
    moreLabel: { control: 'text' },
    lessLabel: { control: 'text' },
    showDivider: { control: 'boolean' },
  },
  args: { showFirst: 3, itemCount: 6, moreLabel: 'Show more', lessLabel: 'Show less', showDivider: true },
};

export const Block = {};
export const ShowTwo = { args: { showFirst: 2, itemCount: 5 } };
