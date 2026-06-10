// Modal — current lineage: foundation-windowed / foundation-fullscreen (v2, vessel theme).
// Source: design-files/.extracted/kp-vessel-4/modal-pattern/foundation-*.html
//
// A trigger button opens an overlay dialog. In the source, the modal is hidden
// (display:none) and revealed by adding `.ds-modal--showing`; a [data-modal-trigger]
// button references the modal by id; [data-dismiss="x-close"] / the cancel button close
// it. We re-implement open/close + Esc + backdrop-click + focus handling in vanilla JS
// (no vendor bundle).

import { ensurePatternStyles, assetUrl, el, uid } from '../pattern-utils.js';

const PATTERN = 'modal';
const img = (name) => assetUrl(PATTERN, `assets/images/${name}`);

function renderModal({
  variant = 'windowed',
  title = 'Modal Windowed Example',
  body = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed tempor and vitality, so that the labor and sorrow.',
  withIcon = true,
  primaryLabel = 'No',
  secondaryLabel = 'Yes',
} = {}) {
  ensurePatternStyles(PATTERN);

  const modalId = uid('ds-modal');
  const headerId = uid('ds-modal-header');

  const root = el(`
    <div>
      <button class="button -primary -light" data-modal-trigger="${modalId}" title="Opens a dialog" type="button">
        Open ${variant} modal
      </button>

      <div aria-hidden="true" data-ds-theme="vessel" data-ds-variant="${variant}" data-ds-version="2"
           class="ds-modal ds-grid__container ds-modal--columns-4" id="${modalId}">
        <div class="ds-modal__fade-screen"></div>
        <div class="ds-modal__container rows">
          <div class="ds-modal__inner ds-modal__icons-enabled" role="dialog" aria-modal="true" aria-labelledby="${headerId}">
            <div class="ds-modal__header">
              <h2 class="ds-modal__title" tabindex="-1" id="${headerId}">${title}</h2>
              <button class="-close--small" aria-label="Close" data-dismiss="x-close" type="button">
                <img alt="" src="${img('icon-close.svg')}" width="20" height="20">
              </button>
            </div>
            <div class="ds-modal__content">
              <div class="ds-modal__content-body">
                ${withIcon ? `<div class="ds-modal__icon"><img alt="alert" src="${img('alert-p1.svg')}" aria-hidden="true" width="48" height="48"></div>` : ''}
                <div class="ds-modal__content-inner"><p>${body}</p></div>
              </div>
              <div class="ds-modal__actions">
                <div class="ds-modal__buttons -right">
                  <button class="button -inverted" type="button" data-dismiss="x-close">${secondaryLabel}</button>
                  <button class="button -primary -light modal__cancel-btn" type="button" data-dismiss="x-close">${primaryLabel}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  const trigger = root.querySelector('[data-modal-trigger]');
  const modal = root.querySelector(`#${modalId}`);
  const titleEl = modal.querySelector('.ds-modal__title');

  const open = () => {
    modal.classList.add('ds-modal--showing');
    modal.setAttribute('aria-hidden', 'false');
    titleEl.focus();
  };
  const close = () => {
    modal.classList.remove('ds-modal--showing');
    modal.setAttribute('aria-hidden', 'true');
    trigger.focus();
  };

  trigger.addEventListener('click', open);
  modal.querySelectorAll('[data-dismiss="x-close"]').forEach((b) => b.addEventListener('click', close));
  modal.querySelector('.ds-modal__fade-screen').addEventListener('click', close);
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return root;
}

export default {
  title: 'Components/Modal',
  render: (args) => renderModal(args),
  argTypes: {
    variant: { control: { type: 'inline-radio' }, options: ['windowed', 'fullscreen'] },
    title: { control: 'text' },
    body: { control: 'text' },
    withIcon: { control: 'boolean' },
    primaryLabel: { control: 'text' },
    secondaryLabel: { control: 'text' },
  },
  args: {
    variant: 'windowed',
    title: 'Modal Windowed Example',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed tempor and vitality, so that the labor and sorrow.',
    withIcon: true,
    primaryLabel: 'No',
    secondaryLabel: 'Yes',
  },
};

export const Windowed = { args: { variant: 'windowed' } };
export const Fullscreen = { args: { variant: 'fullscreen', title: 'Modal Fullscreen Example' } };
export const WithoutIcon = { args: { variant: 'windowed', withIcon: false } };
