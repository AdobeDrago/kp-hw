/*
 * Article template
 * Builds the tag "pills" and social-share row that appear at the end of the
 * article body, matching the KP production health-article layout.
 *
 * Reference:
 *   https://healthy.kaiserpermanente.org/northern-california/health-wellness/healtharticle.9-fun-filled-ways-get-outside-work-sweat
 *
 * Data sources (page metadata):
 *   tags  → emitted as <meta property="article:tag"> (one per tag) or a single
 *           comma-separated <meta name="tags">.
 *
 * The host section is authored with section metadata `style: tags, share`,
 * which becomes <div class="section tags share">. Tags render first, then the
 * share row, both appended to the end of that section's .default-content.
 */

import { renderBreadcrumbs } from '../../blocks/breadcrumbs/breadcrumbs-dom.js';

const SEARCH_BASE = '/pages/search?query='; // mirrors production tag target

/* -------------------------------------------------------------------------- */
/* Breadcrumb (auto-generated from the URL path)                              */
/* -------------------------------------------------------------------------- */

// Path segments that are site scaffolding rather than navigable crumbs.
const SKIP_SEGMENTS = new Set(['northern-california', 'southern-california']);

/** Title-case a URL slug: "health-wellness" → "Health & Wellness". */
function humanize(slug) {
  const text = slug
    .replace(/^healtharticle[.-]?/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  return text.replace(/\bAnd\b/g, '&');
}

/**
 * Build crumbs from the current path: Home › …intermediate sections… › current page.
 * The current page label comes from the <h1> (falls back to the humanized slug).
 */
function buildBreadcrumb() {
  const main = document.querySelector('main');
  if (!main || main.querySelector('.breadcrumbs')) return;

  const segs = window.location.pathname.split('/').filter(Boolean);
  if (!segs.length) return;

  const items = [{ label: 'Home', href: '/' }];
  let href = '';
  segs.forEach((seg, i) => {
    href += `/${seg}`;
    if (SKIP_SEGMENTS.has(seg)) return;
    const isLast = i === segs.length - 1;
    const label = isLast
      ? (document.querySelector('main h1')?.textContent.trim() || humanize(seg))
      : humanize(seg);
    items.push(isLast ? { label } : { label, href });
  });

  // Load the breadcrumbs block CSS (scoped to .breadcrumbs) once.
  const cssHref = new URL('../../blocks/breadcrumbs/breadcrumbs.css', import.meta.url).href;
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    document.head.append(link);
  }

  const wrap = document.createElement('div');
  wrap.className = 'breadcrumbs';
  wrap.append(renderBreadcrumbs(items));

  // Insert at the top of the article's content column so it aligns with the body
  // (and isn't hidden — EDS hides bare `main > div` with display:none).
  const target = main.querySelector('.section .default-content')
    || main.querySelector(':scope > div')
    || main;
  target.prepend(wrap);
}

/* -------------------------------------------------------------------------- */
/* Tags                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Reads tag values from page metadata.
 * Prefers repeated <meta property="article:tag">; falls back to a single
 * comma-separated <meta name="tags">.
 * @returns {string[]}
 */
function getTags() {
  const tagMetas = [
    ...document.head.querySelectorAll('meta[property="article:tag"], meta[name="article:tag"]'),
  ]
    .map((m) => m.content.trim())
    .filter(Boolean);

  if (tagMetas.length) return tagMetas;

  const single = document.head.querySelector('meta[name="tags"]')?.content;
  return single
    ? single.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
}

/**
 * Builds a reusable "pills" element: a labelled row of pill links.
 * @param {string[]} tags
 * @returns {HTMLElement|null}
 */
function buildPills(tags) {
  if (!tags.length) return null;

  const nav = document.createElement('nav');
  nav.className = 'pills';
  nav.setAttribute('aria-label', 'Tags');

  const label = document.createElement('span');
  label.className = 'pills-label';
  label.textContent = 'Tags:';
  nav.append(label);

  tags.forEach((tag) => {
    const pill = document.createElement('a');
    pill.className = 'pill';
    pill.href = `${SEARCH_BASE}${encodeURIComponent(tag)}`;
    pill.textContent = tag;
    nav.append(pill);
  });

  return nav;
}

/* -------------------------------------------------------------------------- */
/* Social share                                                               */
/* -------------------------------------------------------------------------- */

const SHARE_ICONS = {
  email:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>',
  facebook:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>',
  twitter:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z"/></svg>',
  pinterest:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.65 19.31c-.05-.82-.1-2.08.02-2.98.11-.78.72-4.96.72-4.96s-.18-.37-.18-.92c0-.86.5-1.5 1.12-1.5.53 0 .79.4.79.88 0 .53-.34 1.33-.51 2.07-.15.62.31 1.13.92 1.13 1.1 0 1.95-1.16 1.95-2.84 0-1.49-1.07-2.53-2.6-2.53-1.77 0-2.81 1.33-2.81 2.7 0 .53.21 1.11.46 1.42.05.06.06.12.04.18l-.17.71c-.03.11-.09.14-.21.08-.79-.37-1.28-1.51-1.28-2.43 0-1.98 1.44-3.8 4.15-3.8 2.18 0 3.87 1.55 3.87 3.63 0 2.17-1.36 3.91-3.26 3.91-.64 0-1.23-.33-1.44-.72l-.39 1.5c-.14.54-.52 1.22-.78 1.64A10 10 0 1 0 12 2Z"/></svg>',
};

/**
 * Builds the social-share row (Email, Facebook, Twitter, Pinterest).
 * Share URLs are derived from the current page URL and title.
 * @returns {HTMLElement}
 */
function buildShare() {
  const url = window.location.href;
  const { title } = document;
  const eUrl = encodeURIComponent(url);
  const eTitle = encodeURIComponent(title);

  const networks = [
    {
      key: 'email',
      label: 'Share with Email',
      href: `mailto:?subject=${eTitle}&body=${eUrl}`,
      target: '_top',
    },
    {
      key: 'facebook',
      label: 'Share with Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${eUrl}`,
      target: '_blank',
    },
    {
      key: 'twitter',
      label: 'Share with Twitter',
      href: `https://twitter.com/intent/tweet?text=${eTitle}&url=${eUrl}`,
      target: '_blank',
    },
    {
      key: 'pinterest',
      label: 'Share with Pinterest',
      href: `https://www.pinterest.com/pin/create/button?url=${eUrl}`,
      target: '_blank',
    },
  ];

  const wrapper = document.createElement('div');
  wrapper.className = 'social-share';

  const header = document.createElement('div');
  header.className = 'social-share-header';
  header.textContent = 'Share';
  wrapper.append(header);

  const list = document.createElement('ul');
  list.className = 'social-share-list';
  list.setAttribute('aria-label', 'Share');

  networks.forEach((n) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'social-share-link';
    a.href = n.href;
    a.setAttribute('aria-label', n.label);
    a.target = n.target;
    if (n.target === '_blank') a.rel = 'noopener noreferrer';
    a.innerHTML = SHARE_ICONS[n.key];
    li.append(a);
    list.append(li);
  });

  wrapper.append(list);
  return wrapper;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

export default function decorateArticle() {
  // article.css is scoped under body.article-template. ak.js adds that class for
  // metadata-declared templates; when we assign the template by URL (see scripts.js),
  // it isn't set — so ensure it here. Idempotent.
  document.body.classList.add('article-template');

  // Breadcrumb is always added (auto-generated from the URL path).
  buildBreadcrumb();

  // The host section is authored with `style: tags, share`.
  const section = document.querySelector('main .section.tags.share, main .section.tags');
  if (!section) return;

  const content = section.querySelector('.default-content') || section;

  const pills = buildPills(getTags());
  if (pills) content.append(pills);

  if (section.classList.contains('share')) {
    content.append(buildShare());
  }
}
