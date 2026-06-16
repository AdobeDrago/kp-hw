// EDS-block harness stories for blocks/notification, authored to MIRROR the vessel
// Components/Notifications reference stories so the visual-parity diff compares
// like-for-like. section:false renders the bare component (notifications are
// full-width, with no fixed wrapper) to match the reference framing.

import { edsBlock } from './eds-harness.js';

const BODY = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const note = ({ variants = [], heading, body = BODY }) => edsBlock({
  name: 'notification',
  variants,
  section: false,
  rows: [[`<h3>${heading}</h3>\n<p>${body}</p>`]],
});

export default {
  title: 'EDS Blocks/Notification',
};

export const Informational = {
  render: () => note({ heading: 'Notification example with a link' }),
};

export const Alert = {
  render: () => note({ variants: ['alert'], heading: 'Something needs your attention' }),
};

export const Error = {
  render: () => note({ variants: ['error'], heading: 'Something went wrong' }),
};

export const Success = {
  render: () => note({ variants: ['success'], heading: 'You’re all set' }),
};

export const Dismissible = {
  render: () => note({ variants: ['dismissible'], heading: 'Dismissible notification' }),
};
