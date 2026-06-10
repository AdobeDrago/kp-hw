// Notifications — current lineage: foundation-*-v2 (data-ds-version="2", vessel theme).
// Source: design-files/.extracted/kp-vessel-5/notifications-pattern/foundation-*-v2.html
//
// The vessel demos are full HTML pages with header/nav/skeleton-view chrome. Here we
// keep only the `.ds-notification` component and drive its variants through Storybook
// args/controls. The pattern's foundation.css (component styles) is injected per the
// shared util; the dismiss interaction is re-implemented in vanilla JS (we deliberately
// do NOT load the ~400KB vendor main.js — the EDS-seed goal wants minimal behavior).

import { ensurePatternStyles, assetUrl, el, uid } from '../pattern-utils.js';

const PATTERN = 'notifications';

// Each variant maps to its leading status icon (from assets/icons/ds2/).
const VARIANT_ICON = {
  informational: { src: 'info-circle-solid.svg', alt: 'Informational' },
  alert: { src: 'alertsolid.svg', alt: 'Alert' },
  error: { src: 'errorcirclesolid.svg', alt: 'Error' },
  success: { src: 'checkmarkcirclesolid.svg', alt: 'Success' },
};

function icon(name) {
  return assetUrl(PATTERN, `assets/icons/ds2/${name}`);
}

/** Build one .ds-notification element from args, with the dismiss handler wired. */
function renderNotification({
  variant = 'informational',
  heading = 'Notification heading',
  body = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
  dismissible = false,
  withActions = false,
} = {}) {
  ensurePatternStyles(PATTERN);

  const { src, alt } = VARIANT_ICON[variant] ?? VARIANT_ICON.informational;
  const headingId = uid('ds-notification__heading');
  // The vessel markup uses __main-icon when a dismiss button is present, __main otherwise.
  const mainClass = dismissible ? 'ds-notification__main-icon' : 'ds-notification__main';

  const actions = withActions
    ? `<div class="ds-notification__action-buttons">
         <button class="link" type="button">Cancel</button>
         <span class="divider-vertical-wrap"><i class="divider-vertical"></i></span>
         <button class="link" type="button">Retry</button>
       </div>`
    : '';

  const dismissBtn = dismissible
    ? `<button class="dismiss" data-dismiss="x-close" aria-label="Dismiss" type="button">
         <img src="${icon('close.svg')}" alt="">
         <span>Close</span>
       </button>`
    : '';

  const node = el(`
    <section aria-live="assertive"
             class="ds-notification${dismissible ? ' ds-notification--dismiss' : ''}"
             data-ds-version="2" data-ds-theme="vessel" data-ds-variant="${variant}"
             aria-labelledby="${headingId}">
      <div class="ds-notification__icon">
        <img src="${icon(src)}" alt="${alt}" width="40" height="40">
      </div>
      ${dismissBtn}
      <div class="${mainClass}">
        <div class="ds-notification__header">
          <div class="ds-notification__heading" id="${headingId}">${heading}</div>
        </div>
        <div class="ds-notification__body">
          <p>${body}</p>
          ${actions}
        </div>
      </div>
    </section>
  `);

  // Re-implemented dismiss behavior (vanilla, no vendor JS).
  if (dismissible) {
    node.querySelector('.dismiss')?.addEventListener('click', () => node.remove());
  }
  return node;
}

export default {
  title: 'Components/Notifications',
  render: (args) => renderNotification(args),
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['informational', 'alert', 'error', 'success'],
      description: 'Status/severity of the notification (sets icon + accent).',
    },
    heading: { control: 'text' },
    body: { control: 'text' },
    dismissible: { control: 'boolean', description: 'Show the close (X) button.' },
    withActions: { control: 'boolean', description: 'Show Cancel / Retry action buttons.' },
  },
  args: {
    variant: 'informational',
    heading: 'Notification example with a link',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    dismissible: false,
    withActions: false,
  },
};

export const Informational = { args: { variant: 'informational' } };
export const Alert = { args: { variant: 'alert', heading: 'Something needs your attention' } };
export const Error = { args: { variant: 'error', heading: 'Something went wrong' } };
export const Success = { args: { variant: 'success', heading: 'You’re all set' } };

export const Dismissible = {
  args: { variant: 'informational', dismissible: true, heading: 'Dismissible notification' },
};

export const WithActions = {
  args: { variant: 'alert', withActions: true, heading: 'Confirm this action' },
};

// All four severities stacked, to eyeball the set against the original demo pages.
export const AllVariants = {
  argTypes: { variant: { table: { disable: true } } },
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gap = '1.5rem';
    ['informational', 'alert', 'error', 'success'].forEach((variant) => {
      wrap.appendChild(
        renderNotification({
          variant,
          heading: `${variant[0].toUpperCase()}${variant.slice(1)} notification`,
          dismissible: true,
        }),
      );
    });
    return wrap;
  },
};
