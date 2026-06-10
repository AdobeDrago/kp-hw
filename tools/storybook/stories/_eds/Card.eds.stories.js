// EDS-block harness stories for blocks/card, authored to MIRROR the vessel
// Components/Card reference stories (same content + wrapping width) so the
// visual-parity diff (scripts/visual-parity.mjs) compares like-for-like:
// the sliced block CSS vs the full vessel foundation, same DOM (shared renderer).

import { edsBlock, picture } from './eds-harness.js';

// Same vendored images the reference story uses (served at /sb/card/...).
const IMG = (file) => `/sb/card/assets/images/${file}`;
const SUMMARY = 'Cards are used to summarize content on a single topic and should be easy to scan for actionable information.';

// Build the authored content cell: heading = title, paragraph = summary,
// trailing link = CTA (wrap in <strong> for the primary button).
const content = ({ title, summary = SUMMARY, ctaLabel, primary = false } = {}) => {
  const cta = ctaLabel
    ? `<p>${primary ? `<strong><a href="#">${ctaLabel}</a></strong>` : `<a href="#">${ctaLabel}</a>`}</p>`
    : '';
  return `<h3>${title}</h3>\n<p>${summary}</p>\n${cta}`;
};

const widthBox = (px) => (story) => {
  const box = document.createElement('div');
  box.style.maxWidth = `${px}px`;
  box.append(story());
  return box;
};

export default {
  title: 'EDS Blocks/Card',
};

// Mirrors Components/Card → Basic (no image, action CTA).
export const Basic = {
  decorators: [widthBox(320)],
  render: () => edsBlock({
    name: 'card',
    rows: [[content({ title: 'Card Title', ctaLabel: 'Action' })]],
  }),
};

// Mirrors Components/Card → Large (image, primary CTA).
export const Large = {
  decorators: [widthBox(320)],
  render: () => edsBlock({
    name: 'card',
    variants: ['large'],
    rows: [
      [picture(IMG('cardimage.png'), { alt: '' })],
      [content({ title: 'Title', ctaLabel: 'Primary CTA', primary: true })],
    ],
  }),
};

// Mirrors Components/Card → Thumbnail (small image, summary omitted by renderer).
// Width 320 matches the reference's effective constraint (its component-level box).
export const Thumbnail = {
  decorators: [widthBox(320)],
  render: () => edsBlock({
    name: 'card',
    variants: ['thumbnail'],
    rows: [
      [picture(IMG('Clinician.png'), { alt: '' })],
      [content({ title: 'Title', ctaLabel: 'Action' })],
    ],
  }),
};
