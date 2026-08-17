// Shared renderer for the Related articles block. Imported by both init() and
// the Storybook story so both render identical vessel DOM.
//
// Each tile is a clickable ds-card (the whole <a> is the card root, matching
// the live ds-card__option--clickable pattern). Cards are grouped in a
// ds-card-group grid wrapper. Topic tabs are built from each article's tags
// array; falls back to a single flat grid when no articles are tagged.
// Non-active panels are lazy-built on first click.

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

// Build a clickable ds-card anchor tile. renderCard() produces a <div>; we
// promote it to an <a> so the whole card is the link (vessel clickable pattern).
function buildTile(article, opts) {
  const eyebrow = (article.tags && article.tags[0]) || opts.eyebrowFallback || '';
  const cardDiv = renderCard({
    variant: 'large',
    media: opts.mediaFactory ? opts.mediaFactory(article) : (() => {
      if (!article.image) return null;
      const img = document.createElement('img');
      img.src = article.image;
      img.alt = article.alt || '';
      img.loading = 'lazy';
      return img;
    })(),
    eyebrow,
    title: article.title,
  });

  // Promote <div class="ds-card"> → <a class="ds-card ds-card__option--clickable">
  // Skip 'class' in the attribute copy — we set className above and don't want
  // the loop to overwrite it and strip ds-card__option--clickable.
  const link = document.createElement('a');
  link.href = article.path;
  link.className = `${cardDiv.className} ds-card__option--clickable`;
  for (const { name, value } of cardDiv.attributes) {
    if (name !== 'class') link.setAttribute(name, value);
  }
  link.append(...cardDiv.childNodes);
  return link;
}

// ds-card-group wrapper matching the vessel grid pattern used in Storybook.
function buildGrid(articles, opts) {
  const group = document.createElement('div');
  group.className = 'ds-card-group';
  group.dataset.dsTheme = 'vessel';
  group.dataset.dsVariant = 'basic';
  group.dataset.dsVersion = '2';
  group.dataset.dsNumCols = String(opts.numCols);
  const list = opts.limit > 0 ? articles.slice(0, opts.limit) : articles;
  list.forEach((a) => group.append(buildTile(a, opts)));
  return group;
}

// Map of tag → articles sorted by descending article count.
function groupByTag(articles) {
  const groups = new Map();
  articles.forEach((a) => {
    (a.tags || []).forEach((t) => {
      if (!groups.has(t)) groups.set(t, []);
      groups.get(t).push(a);
    });
  });
  return new Map([...groups.entries()].sort((a, b) => b[1].length - a[1].length));
}

// Resolve which tab groups to show: author allowlist → top-N by count.
function resolveGroups(groups, topics, maxTabs) {
  if (topics && topics.length) {
    return topics
      .map((t) => [t, groups.get(t)])
      .filter(([, list]) => list && list.length);
  }
  return [...groups.entries()].slice(0, maxTabs);
}

/**
 * @param {object}   opts
 * @param {string}   [opts.heading]
 * @param {{label:string,href:string}|null} [opts.explore]
 * @param {Array}    [opts.articles]
 * @param {string[]} [opts.topics]         ordered allowlist of tab labels
 * @param {number}   [opts.maxTabs]        cap when no allowlist (default 15)
 * @param {number}   [opts.numCols]        2/3/4 (default 3)
 * @param {number}   [opts.limit]          max tiles per panel (default 12)
 * @param {string}   [opts.eyebrowFallback]
 * @param {string}   [opts.allTabLabel]
 * @param {string}   [opts.sidebarLabel]   "View by topic:" heading above the nav
 * @param {Function} [opts.mediaFactory]
 * @returns {HTMLElement}
 */
export function renderRelatedArticles({
  heading = 'Related articles',
  explore = null,
  articles = [],
  topics = [],
  maxTabs = 15,
  numCols = 3,
  limit = 12,
  eyebrowFallback = '',
  allTabLabel = 'All topics',
  sidebarLabel = 'View by topic:',
  mediaFactory = null,
} = {}) {
  const root = document.createElement('div');
  root.className = 'related-articles';

  // Header: heading + optional "Explore library" pill link.
  const header = elFromHTML('<div class="related-articles-header"></div>');
  header.append(elFromHTML(`<h2 class="related-articles-heading">${heading}</h2>`));
  if (explore?.href) {
    const a = elFromHTML('<a class="related-articles-explore"></a>');
    a.href = explore.href;
    a.textContent = explore.label || 'Explore library';
    header.append(a);
  }
  root.append(header);

  const gridOpts = { numCols, limit, eyebrowFallback, mediaFactory };
  const groups = groupByTag(articles);

  // Fallback: no tags → flat grid, no tabs.
  if (groups.size === 0) {
    root.append(buildGrid(articles, gridOpts));
  } else {
    const visibleGroups = resolveGroups(groups, topics, maxTabs);
    const tabData = [[allTabLabel, articles], ...visibleGroups];
    const instanceId = uid('ra');

    const sidebar = elFromHTML('<div class="related-articles-tabs" role="tablist" aria-label="View by topic"></div>');
    if (sidebarLabel) {
      sidebar.append(elFromHTML(`<div class="related-articles-tabs-label" aria-hidden="true">${sidebarLabel}</div>`));
    }
    const panelsWrap = elFromHTML('<div class="related-articles-panels"></div>');
    const buttons = [];
    const panels = [];
    const articleLists = [];

    tabData.forEach(([label, list], idx) => {
      const tabId = `${instanceId}-tab-${idx}`;
      const panelId = `${instanceId}-panel-${idx}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `related-articles-tab${idx === 0 ? ' is-active' : ''}`;
      btn.role = 'tab';
      btn.id = tabId;
      btn.setAttribute('aria-controls', panelId);
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      btn.textContent = label;
      sidebar.append(btn);
      buttons.push(btn);

      const panel = document.createElement('div');
      panel.className = 'related-articles-panel';
      panel.id = panelId;
      panel.role = 'tabpanel';
      panel.setAttribute('aria-labelledby', tabId);
      if (idx === 0) {
        panel.append(buildGrid(list, gridOpts));
      } else {
        panel.hidden = true;
      }
      panelsWrap.append(panel);
      panels.push(panel);
      articleLists.push(list);
    });

    function activate(idx) {
      buttons.forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.setAttribute('tabindex', on ? '0' : '-1');
      });
      panels.forEach((p, i) => {
        if (i === idx) {
          if (!p.firstElementChild) p.append(buildGrid(articleLists[i], gridOpts));
          p.hidden = false;
        } else {
          p.hidden = true;
        }
      });
    }

    buttons.forEach((b, i) => b.addEventListener('click', () => activate(i)));
    sidebar.addEventListener('keydown', (e) => {
      const cur = buttons.findIndex((b) => b.classList.contains('is-active'));
      let next;
      if (e.key === 'ArrowDown') next = (cur + 1) % buttons.length;
      else if (e.key === 'ArrowUp') next = (cur - 1 + buttons.length) % buttons.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = buttons.length - 1;
      else return;
      e.preventDefault();
      activate(next);
      buttons[next].focus();
    });

    const body = elFromHTML('<div class="related-articles-body"></div>');
    body.append(sidebar, panelsWrap);
    root.append(body);
  }

  // Footer "View all" CTA (same explore link, centered below the grid).
  if (explore?.href) {
    const footer = elFromHTML('<div class="related-articles-footer"></div>');
    const a = elFromHTML('<a class="related-articles-view-all"></a>');
    a.href = explore.href;
    a.textContent = explore.label || 'Explore library';
    footer.append(a);
    root.append(footer);
  }

  return root;
}
