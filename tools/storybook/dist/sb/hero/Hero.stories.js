// Hero — current lineage: card-overlay-v3 / text-overlay-v3 (vessel theme).
// Source: design-files/.extracted/kp-vessel-3/hero-pattern/{card,text}-overlay-v3.html
//
// A full-width background image with an overlaid cmp-teaser (title, description, CTAs).
// data-ds-variant switches card-overlay (content sits on a card) vs text-overlay (text
// directly on the image). Position + column-span are utility classes on .ds-hero.

import { ensurePatternStyles, assetUrl, el } from '../pattern-utils.js';

const PATTERN = 'hero';
const HERO_IMAGE = assetUrl(PATTERN, 'assets/images/hero-right-side-image.jpg');

function renderHero({
  variant = 'card-overlay',
  position = 'left',
  cols = 6,
  title = 'Spacious gracious',
  description = 'Lorum ipsum dolor sit amet, consecte sed adipiscing elit, sed do eiusmod tempor incididunt.',
  primaryCta = 'Primary',
  secondaryCta = 'Secondary',
} = {}) {
  ensurePatternStyles(PATTERN);

  const buttons = [
    secondaryCta
      ? `<span class="ds-buttoncontainer__button-swap">
           <button class="button -inverted -light" type="button">${secondaryCta}</button>
         </span>`
      : '',
    primaryCta
      ? `<span class="ds-buttoncontainer__button-swap">
           <button class="button -primary -light" type="button">${primaryCta}</button>
         </span>`
      : '',
  ].join('');

  return el(`
    <div class="ds-hero ds-hero__cols--${cols} ds-hero__size--l1 ds-hero__position--${position}"
         data-ds-variant="${variant}" data-ds-version="3" data-ds-theme="vessel">
      <img class="ds-hero__background-image" src="${HERO_IMAGE}" alt="Sunny mountainside lake" width="1920" height="480">
      <div class="ds-hero__outer-content-container">
        <div class="ds-hero__inner-content-container">
          <div class="cmp-teaser">
            <div class="cmp-teaser__content">
              <h2 class="cmp-teaser__title">${title}</h2>
              <div class="cmp-teaser__description"><p class="p1 -book">${description}</p></div>
              <div class="cmp-teaser__action-container">
                <div class="ds-buttoncontainer ds-buttoncontainer__left ds-buttoncontainer__reversed-mobile"
                     data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="3">
                  <div class="ds-buttoncontainer__list">${buttons}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
}

export default {
  title: 'Components/Hero',
  render: (args) => renderHero(args),
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: { control: { type: 'inline-radio' }, options: ['card-overlay', 'text-overlay'] },
    position: { control: { type: 'inline-radio' }, options: ['left', 'center', 'right'] },
    cols: { control: { type: 'inline-radio' }, options: [6, 12] },
    title: { control: 'text' },
    description: { control: 'text' },
    primaryCta: { control: 'text' },
    secondaryCta: { control: 'text' },
  },
  args: {
    variant: 'card-overlay',
    position: 'left',
    cols: 6,
    title: 'Spacious gracious',
    description: 'Lorum ipsum dolor sit amet, consecte sed adipiscing elit, sed do eiusmod tempor incididunt.',
    primaryCta: 'Primary',
    secondaryCta: 'Secondary',
  },
};

export const CardOverlay = { args: { variant: 'card-overlay' } };
export const TextOverlay = { args: { variant: 'text-overlay', position: 'center' } };
