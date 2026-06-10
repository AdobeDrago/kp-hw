// Card — current lineage: foundation-v3 (basic/large/thumbnail) + video-v1, vessel theme.
// Source: design-files/.extracted/kp-vessel-2/card-pattern/demo-*-foundation-v*.html
//
// Variants share the .ds-card structure and differ by data-ds-variant + presence of media:
//   basic     — content only
//   large     — full-width image on top, then content
//   thumbnail — small (44x44) image, horizontal layout
//   video     — image with a play-button overlay (vertical option)
// The CTA <button> uses utility classes (-action / -primary, -light, -small).

import { ensurePatternStyles, assetUrl } from '../pattern-utils.js';
// Single source of truth: the same renderer the EDS block uses (blocks/card).
import { renderCard as renderDsCard } from '../../blocks/card/card-dom.js';

const PATTERN = 'card';
const img = (file) => assetUrl(PATTERN, `assets/images/${file}`);

const DEFAULT_IMAGE = {
  large: 'cardimage.png',
  thumbnail: 'Clinician.png',
  video: 'quarantine-fatigue.png',
};

// Wrap the shared renderer: load the vessel pattern CSS (the design reference)
// and supply a vendored image per variant. DOM is produced by the block's renderer.
function renderCard(args = {}) {
  ensurePatternStyles(PATTERN);
  const variant = args.variant || 'basic';
  const file = DEFAULT_IMAGE[variant];
  const media = file ? `<img src="${img(file)}" alt="">` : null;
  return renderDsCard({ ...args, media });
}

export default {
  title: 'Components/Card',
  render: (args) => renderCard(args),
  // Cards are constrained by the grid in production; give stories a sensible max width.
  decorators: [
    (story) => {
      const box = document.createElement('div');
      box.style.maxWidth = '320px';
      box.appendChild(story());
      return box;
    },
  ],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['basic', 'large', 'thumbnail', 'video'],
    },
    ctaVariant: { control: { type: 'inline-radio' }, options: ['action', 'primary'] },
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    summary: { control: 'text' },
    ctaLabel: { control: 'text' },
  },
  args: {
    variant: 'basic',
    eyebrow: '',
    title: 'Card Title',
    subtitle: '',
    summary: 'Cards are used to summarize content on a single topic and should be easy to scan for actionable information.',
    ctaLabel: 'Action',
    ctaVariant: 'action',
  },
};

export const Basic = { args: { variant: 'basic' } };

export const BasicWithEyebrow = {
  args: { variant: 'basic', eyebrow: 'Eyebrow', subtitle: 'subtitle', ctaLabel: 'Primary CTA', ctaVariant: 'primary' },
};

export const Large = { args: { variant: 'large', title: 'Title', ctaLabel: 'Primary CTA', ctaVariant: 'primary' } };

export const Thumbnail = {
  args: { variant: 'thumbnail', title: 'Title' },
  decorators: [
    (story) => {
      const box = document.createElement('div');
      box.style.maxWidth = '420px';
      box.appendChild(story());
      return box;
    },
  ],
};

export const Video = {
  args: { variant: 'video', eyebrow: 'Video', title: 'Watch: managing your care', summary: 'A short overview video.' },
};
