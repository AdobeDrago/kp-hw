// Card — current lineage: foundation-v3 (basic/large/thumbnail) + video-v1, vessel theme.
// Source: design-files/.extracted/kp-vessel-2/card-pattern/demo-*-foundation-v*.html
//
// Variants share the .ds-card structure and differ by data-ds-variant + presence of media:
//   basic     — content only
//   large     — full-width image on top, then content
//   thumbnail — small (44x44) image, horizontal layout
//   video     — image with a play-button overlay (vertical option)
// The CTA <button> uses utility classes (-action / -primary, -light, -small).

import { ensurePatternStyles, assetUrl, el, uid } from '../pattern-utils.js';

const PATTERN = 'card';
const img = (file) => assetUrl(PATTERN, `assets/images/${file}`);

const DEFAULT_IMAGE = {
  large: 'cardimage.png',
  thumbnail: 'Clinician.png',
  video: 'quarantine-fatigue.png',
};

function renderCard({
  variant = 'basic',
  eyebrow = '',
  title = 'Card Title',
  subtitle = '',
  summary = 'Cards are used to summarize content on a single topic and should be easy to scan for actionable information.',
  ctaLabel = 'Action',
  ctaVariant = 'action', // 'action' | 'primary'
} = {}) {
  ensurePatternStyles(PATTERN);

  const titleId = uid('card-title');
  const version = variant === 'video' ? '1' : '3';

  // Media block (none for basic).
  let media = '';
  if (variant === 'large' || variant === 'thumbnail') {
    const dims = variant === 'thumbnail' ? 'width="44" height="44"' : 'width="277" height="156"';
    media = `<div class="ds-card__image"><img src="${img(DEFAULT_IMAGE[variant])}" alt="" ${dims}></div>`;
  } else if (variant === 'video') {
    media = `<div class="ds-card__image">
        <img src="${img(DEFAULT_IMAGE.video)}" alt="" height="156" width="277">
        <img class="ds-card__video-play-button" src="${img('play-button.svg')}" alt="" width="75" height="75">
        <div class="ds-card__time-lozenge"></div>
      </div>`;
  }

  const cta = ctaLabel
    ? `<div class="ds-card__button-container">
         <div class="ds-card__cta">
           <button class="button -${ctaVariant} -light -small" type="button">${ctaLabel}</button>
         </div>
       </div>`
    : '';

  const content = `
    <div class="ds-card__content" role="group" aria-labelledby="${titleId}">
      ${eyebrow ? `<div class="ds-card__eyebrow p4 -medium">${eyebrow}</div>` : ''}
      <div class="ds-card__title" id="${titleId}">${title}</div>
      ${subtitle ? `<div class="ds-card__subtitle">${subtitle}</div>` : ''}
      ${variant === 'thumbnail' ? '' : `<div class="ds-card__summary"><p>${summary}</p></div>`}
      ${cta}
    </div>`;

  const extraClass = variant === 'video' ? ' ds-card__option--vertical' : '';

  return el(`
    <div class="ds-card${extraClass}" data-ds-theme="vessel" data-ds-variant="${variant}" data-ds-version="${version}">
      ${media}
      ${content}
    </div>
  `);
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
