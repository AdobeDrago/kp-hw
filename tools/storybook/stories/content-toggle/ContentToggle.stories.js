// Content Toggle — current lineage: foundation-{basic,dark}-v2 (vessel theme).
// Source: design-files/.extracted/kp-vessel-2/content-toggle-pattern/foundation-*-v2.html
//
// An expand/collapse disclosure. The pattern CSS hides .ds-contenttoggle__content by
// default and reveals it via a `.show` class; the heading button carries aria-expanded;
// the plus/minus icons swap via the __remove-icon class. We re-implement that toggle in
// vanilla JS (no vendor bundle).

import { ensurePatternStyles, assetUrl, el } from '../pattern-utils.js';

const PATTERN = 'content-toggle';
const icon = (name) => assetUrl(PATTERN, `assets/images/icon-${name}.svg`);

function renderContentToggle({
  variant = 'basic',
  heading = 'Why use a Content Toggle?',
  expanded = false,
  body = `<p>There are several advantages of using <a href="#">a Content Toggle</a> on long, content-rich pages:</p>
    <ul>
      <li>Collapsing the page minimizes scrolling.</li>
      <li>The headings serve as a mini-IA of the page.</li>
      <li>Hiding some of the content can make the page appear less daunting.</li>
    </ul>`,
} = {}) {
  ensurePatternStyles(PATTERN);

  const node = el(`
    <div class="ds-contenttoggle" data-analytics-location="Content Toggle"
         data-ds-theme="vessel" data-ds-variant="${variant}" data-ds-version="2">
      <button class="ds-contenttoggle__expandable-heading" aria-expanded="${expanded}">
        <img class="ds-contenttoggle__expandable-heading-icon ds-contenttoggle__plus-icon${expanded ? ' ds-contenttoggle__remove-icon' : ''}"
             alt="" height="24" width="24" src="${icon('plus')}">
        <img class="ds-contenttoggle__expandable-heading-icon ds-contenttoggle__minus-icon${expanded ? '' : ' ds-contenttoggle__remove-icon'}"
             alt="" height="24" width="24" src="${icon('minus')}">
        <span class="-medium ds-contenttoggle__expandable-heading-text">${heading}</span>
      </button>
      <div class="ds-contenttoggle__content${expanded ? ' show' : ''}">${body}</div>
    </div>
  `);

  const btn = node.querySelector('.ds-contenttoggle__expandable-heading');
  const content = node.querySelector('.ds-contenttoggle__content');
  const plus = node.querySelector('.ds-contenttoggle__plus-icon');
  const minus = node.querySelector('.ds-contenttoggle__minus-icon');

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    content.classList.toggle('show', !open);
    plus.classList.toggle('ds-contenttoggle__remove-icon', !open); // hide plus when open
    minus.classList.toggle('ds-contenttoggle__remove-icon', open); // hide minus when closed
  });

  return node;
}

export default {
  title: 'Components/Content Toggle',
  render: (args) => renderContentToggle(args),
  argTypes: {
    variant: { control: { type: 'inline-radio' }, options: ['basic', 'dark'] },
    heading: { control: 'text' },
    expanded: { control: 'boolean', description: 'Initial state.' },
  },
  args: { variant: 'basic', heading: 'Why use a Content Toggle?', expanded: false },
};

export const Collapsed = { args: { expanded: false } };
export const Expanded = { args: { expanded: true } };
export const Dark = { args: { variant: 'dark', expanded: true } };
