// Shared renderer for the Related articles block. Lives in the block (ships with
// EDS) and is imported by BOTH this block's init() and the Storybook reference
// story so the authored block and the design reference render the exact same DOM
// and cannot drift — the same contract card-dom.js follows.
//
// Pure: given config + an array of article records, returns a detached
// `.related-articles` element. No network, no Storybook helpers. Each tile reuses
// the shared card renderer (renderCard) so tiles match Components/Card exactly.
//
// Tabs: authors control visible topics via the `topics` allowlist (comma-separated
// in the block config). If omitted, defaults to the top-N tags by article count.
// Non-active panels are built lazily on first click to keep initial DOM small.

import { renderCard } from '../card/card-dom.js';

let uidCounter = 0;
const uid = (prefix = 'ra') => {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
};

function elFromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// A media node for a tile: a caller-supplied factory (init() uses createPicture),
// then a pre-built node on the record, then a plain lazy <img>, else nothing.
function buildMedia(article, mediaFactory) {
  if (mediaFactory) return mediaFactory(article);
  if (article.media) return article.media;
  if (!article.image) return null;
  const img = document.createElement('img');
  img.src = article.image;
  img.alt = article.alt || '';
  img.loading = 'lazy';
  return img;
}

// One clickable article tile: a `large` ds-card (image + eyebrow + title) wrapped
// in an anchor, mirroring the live ds-card__option--clickable pattern.
function buildTile(article, opts) {
  const eyebrow = (article.tags && article.tags[0]) || opts.eyebrowFallback || '';
  const card = renderCard({
    variant: 'large',
    media: buildMedia(article, opts.mediaFactory),
    eyebrow,
    title: article.title,
  });
  card.classList.add('ds-card__option--clickable');

  const link = elFromHTML('<a class="related-articles-card-link"></a>');
  link.setAttribute('href', article.path);
  link.append(card);
  return link;
}

function buildGrid(articles, opts) {
  const grid = document.createElement('div');
  grid.className = `related-articles-grid related-articles-grid-cols-${opts.numCols}`;
  const list = opts.limit > 0 ? articles.slice(0, opts.limit) : articles;
  list.forEach((a) => grid.append(buildTile(a, opts)));
  return grid;
}

// Map of tag -> articles, sorted by descending article count.
function groupByTag(articles) {
  const groups = new Map();
  articles.forEach((a) => {
    (a.tags || []).forEach((t) => {
      if (!groups.has(t)) groups.set(t, []);
      groups.get(t).push(a);
    });
  });
  // Sort by count descending so default top-N picks the most-covered topics.
  return new Map([...groups.entries()].sort((a, b) => b[1].length - a[1].length));
}

// Resolve which tab groups to show:
//   - topics allowlist → exact ordered list the author specified
//   - no allowlist     → top maxTabs groups by article count
function resolveGroups(groups, topics, maxTabs) {
  if (topics && topics.length) {
    return topics
      .map((t) => [t, groups.get(t)])
      .filter(([, list]) => list && list.length);
  }
  return [...groups.entries()].slice(0, maxTabs);
}

/**
 * @param {object}   data
 * @param {string}   [data.heading]
 * @param {{label:string, href:string}|null} [data.explore]  "Explore library" link
 * @param {Array<{path,title,image,alt,tags,media}>} [data.articles]
 * @param {string[]} [data.topics]      ordered allowlist of tab labels; omit for top-N auto
 * @param {number}   [data.maxTabs]     cap when no topics allowlist (default 15)
 * @param {number}   [data.numCols]     desktop column count (2/3/4)
 * @param {number}   [data.limit]       max tiles per panel (0 = no cap)
 * @param {string}   [data.eyebrowFallback]  category shown when an article has no tag
 * @param {string}   [data.allTabLabel]
 * @param {(a:object)=>HTMLElement} [data.mediaFactory]  builds optimized media per tile
 * @returns {HTMLElement} the `.related-articles` element
 */
export function renderRelatedArticles({
  heading = 'Related articles',
  explore = null,
  articles = [],
  topics = [],
  maxTabs = 15,
  numCols = 4,
  limit = 12,
  eyebrowFallback = '',
  allTabLabel = 'All topics',
  mediaFactory = null,
} = {}) {
  const root = document.createElement('div');
  root.className = 'related-articles';

  const header = elFromHTML('<div class="related-articles-header"></div>');
  header.append(elFromHTML(`<h2 class="related-articles-heading">${heading}</h2>`));
  if (explore && explore.href) {
    const link = elFromHTML('<a class="related-articles-explore"></a>');
    link.setAttribute('href', explore.href);
    link.textContent = explore.label || 'Explore library';
    header.append(link);
  }
  root.append(header);

  const opts = { numCols, limit, eyebrowFallback, mediaFactory };
  const groups = groupByTag(articles);

  // Fallback: nothing is tagged → a single flat grid, no tab bar.
  if (groups.size === 0) {
    root.append(buildGrid(articles, opts));
    return root;
  }

  // Resolve visible tabs (allowlist → top-N by count).
  const visibleGroups = resolveGroups(groups, topics, maxTabs);
  const tabs = [[allTabLabel, articles], ...visibleGroups];
  const instanceId = uid('ra');

  const tablist = elFromHTML('<div class="related-articles-tabs" role="tablist" aria-label="View by topic"></div>');
  const panelsWrap = elFromHTML('<div class="related-articles-panels"></div>');
  const buttons = [];
  const panels = [];
  // articleLists holds each tab's data so non-active panels can be built lazily.
  const articleLists = [];

  tabs.forEach(([label, list], idx) => {
    const tabId = `${instanceId}-tab-${idx}`;
    const panelId = `${instanceId}-panel-${idx}`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'related-articles-tab';
    btn.role = 'tab';
    btn.id = tabId;
    btn.setAttribute('aria-controls', panelId);
    btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
    btn.textContent = label;
    if (idx === 0) btn.classList.add('is-active');
    tablist.append(btn);
    buttons.push(btn);

    const panel = document.createElement('div');
    panel.className = 'related-articles-panel';
    panel.id = panelId;
    panel.role = 'tabpanel';
    panel.setAttribute('aria-labelledby', tabId);
    if (idx === 0) {
      panel.append(buildGrid(list, opts));
    } else {
      panel.hidden = true;
    }
    panelsWrap.append(panel);
    panels.push(panel);
    articleLists.push(list);
  });

  function activate(idx) {
    buttons.forEach((b, i) => {
      const selected = i === idx;
      b.classList.toggle('is-active', selected);
      b.setAttribute('aria-selected', selected ? 'true' : 'false');
      b.setAttribute('tabindex', selected ? '0' : '-1');
    });
    panels.forEach((p, i) => {
      if (i === idx) {
        // Lazy-build panel content on first activation.
        if (!p.firstElementChild) p.append(buildGrid(articleLists[i], opts));
        p.hidden = false;
      } else {
        p.hidden = true;
      }
    });
  }

  buttons.forEach((b, idx) => b.addEventListener('click', () => activate(idx)));
  tablist.addEventListener('keydown', (e) => {
    const current = buttons.findIndex((b) => b.classList.contains('is-active'));
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else return;
    e.preventDefault();
    activate(next);
    buttons[next].focus();
  });

  root.append(tablist, panelsWrap);
  return root;
}
