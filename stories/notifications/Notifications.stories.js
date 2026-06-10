// Notifications — current lineage: foundation-*-v2 (data-ds-version="2", vessel theme).
// Source: design-files/.extracted/kp-vessel-5/notifications-pattern/foundation-*-v2.html
//
// The vessel demos are full HTML pages with header/nav/skeleton-view chrome. Here we
// keep only the `.ds-notification` component and drive its variants through Storybook
// args/controls. The pattern's foundation.css (component styles) is injected per the
// shared util; the dismiss interaction is re-implemented in vanilla JS (we deliberately
// do NOT load the ~400KB vendor main.js — the EDS-seed goal wants minimal behavior).

import { ensurePatternStyles, assetUrl } from '../pattern-utils.js';
// Single source of truth: the same renderer the EDS block uses (blocks/notification).
import { renderNotification as renderDsNotification } from '../../blocks/notification/notification-dom.js';

const PATTERN = 'notifications';
const ICON_FILE = {
  informational: 'info-circle-solid.svg',
  alert: 'alertsolid.svg',
  error: 'errorcirclesolid.svg',
  success: 'checkmarkcirclesolid.svg',
};
const icon = (name) => assetUrl(PATTERN, `assets/icons/ds2/${name}`);

// Wrap the shared renderer: load the vessel pattern CSS (the design reference) and
// resolve icons from the vendored assets. DOM is produced by the block's renderer.
function renderNotification(args = {}) {
  ensurePatternStyles(PATTERN);
  const variant = args.variant || 'informational';
  return renderDsNotification({
    ...args,
    iconSrc: icon(ICON_FILE[variant] || ICON_FILE.informational),
    closeIconSrc: icon('close.svg'),
  });
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
