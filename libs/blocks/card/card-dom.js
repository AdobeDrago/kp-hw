// Shared renderer for the KP vessel card. Lives in the block (ships with EDS)
// and is imported by BOTH this block's init() and the Storybook reference story
// (stories/card/Card.stories.js) so the authored block and the design reference
// render the exact same .ds-card DOM and cannot drift.
//
// Pure: given content slots, returns a detached .ds-card element. No Storybook
// helpers, no CSS injection, no network.

let uidCounter = 0;
const uid = (prefix = 'card') => {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
};

function elFromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/**
 * @param {object} data
 * @param {'basic'|'large'|'thumbnail'|'video'} [data.variant]
 * @param {HTMLElement|string|null} [data.media]  picture/img node or HTML (omit for basic)
 * @param {string} [data.eyebrow]
 * @param {string} [data.title]
 * @param {string} [data.subtitle]
 * @param {string} [data.summary]  plain text or paragraph HTML
 * @param {string} [data.ctaLabel]
 * @param {string} [data.ctaHref]
 * @param {'action'|'primary'} [data.ctaVariant]
 * @returns {HTMLElement} the .ds-card element
 */
export function renderCard({
  variant = 'basic',
  media = null,
  eyebrow = '',
  title = '',
  subtitle = '',
  summary = '',
  ctaLabel = '',
  ctaHref = '#',
  ctaVariant = 'action',
} = {}) {
  const version = variant === 'video' ? '1' : '3';
  const card = elFromHTML(
    `<div class="ds-card${variant === 'video' ? ' ds-card__option--vertical' : ''}"`
    + ` data-ds-theme="vessel" data-ds-variant="${variant}" data-ds-version="${version}"></div>`,
  );

  if (media) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'ds-card__image';
    const node = typeof media === 'string' ? elFromHTML(media) : media;
    if (node) imageWrap.append(node);
    if (variant === 'video') {
      imageWrap.insertAdjacentHTML('beforeend', '<span class="ds-card__video-play-button" aria-hidden="true"></span>');
    }
    card.append(imageWrap);
  }

  const titleId = uid('card-title');
  const parts = [];
  if (eyebrow) parts.push(`<div class="ds-card__eyebrow p4 -medium">${eyebrow}</div>`);
  parts.push(`<div class="ds-card__title" id="${titleId}">${title}</div>`);
  if (subtitle) parts.push(`<div class="ds-card__subtitle">${subtitle}</div>`);
  if (variant !== 'thumbnail' && summary) {
    const body = /<p[\s>]/i.test(summary) ? summary : `<p>${summary}</p>`;
    parts.push(`<div class="ds-card__summary">${body}</div>`);
  }
  if (ctaLabel) {
    parts.push(
      '<div class="ds-card__button-container"><div class="ds-card__cta">'
      + `<a class="button -${ctaVariant} -light -small" href="${ctaHref}">${ctaLabel}</a>`
      + '</div></div>',
    );
  }

  const content = elFromHTML(`<div class="ds-card__content" role="group" aria-labelledby="${titleId}"></div>`);
  content.innerHTML = parts.join('');
  card.append(content);
  return card;
}
