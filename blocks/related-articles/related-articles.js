import { getConfig, loadStyle } from '../../scripts/ak.js';
import { createPicture } from '../../scripts/utils/picture.js';
import { renderRelatedArticles } from './related-articles-dom.js';

// Default index for the Northern California health-wellness section. Authors can
// point at a different query-index via an "Index" config row.
const DEFAULT_INDEX = '/northern-california/health-wellness/query-index.json';

// Index titles carry a " | Kaiser Permanente" suffix; show just the headline.
function cleanTitle(raw) {
  const s = String(raw || '').trim();
  const head = s.split('|')[0].trim();
  return head || s;
}

// `tags` may be a JSON array string or a comma/semicolon list. Empty today.
function parseTags(raw) {
  const s = String(raw || '').trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((t) => String(t).trim()).filter(Boolean);
    } catch (e) { /* fall through to delimiter split */ }
  }
  return s.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
}

// Authored config: each row is `key | value`. Returns key -> value cells.
function readConfig(el) {
  const cfg = {};
  [...el.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    cfg[key] = cells.slice(1);
  });
  return cfg;
}

function cellText(cells) {
  return cells ? cells.map((c) => c.textContent.trim()).filter(Boolean).join(' ') : '';
}

export default async function init(el) {
  const { codeBase, log } = getConfig();
  const cfg = readConfig(el);

  const heading = cellText(cfg.heading) || 'Related articles';
  const limit = parseInt(cellText(cfg.limit), 10) || 12;
  const numCols = parseInt(cellText(cfg.columns || cfg.cols), 10) || 4;
  const eyebrowFallback = cellText(cfg['category fallback'] || cfg.category) || '';
  const indexUrl = cellText(cfg.index) || DEFAULT_INDEX;
  const pathPrefix = cellText(cfg.filter || cfg.prefix) || '';

  // "Explore library" link: prefer an authored anchor, else plain text.
  let explore = null;
  const exploreCells = cfg.explore || cfg['explore link'];
  if (exploreCells) {
    const anchor = exploreCells.map((c) => c.querySelector('a')).find(Boolean);
    if (anchor) explore = { label: anchor.textContent.trim(), href: anchor.getAttribute('href') };
    else {
      const txt = cellText(exploreCells);
      if (txt) explore = { label: txt, href: '#' };
    }
  }

  // Tiles render the shared .ds-card; ensure the card block's styles are present
  // even on pages without an authored card block.
  loadStyle(`${codeBase}/blocks/card/card.css`);

  let articles = [];
  try {
    const resp = await fetch(indexUrl);
    if (resp.ok) {
      const json = await resp.json();
      const rows = json.data || [];
      const here = window.location.pathname;
      articles = rows
        .filter((r) => r.path && r.path !== here && (!pathPrefix || r.path.startsWith(pathPrefix)))
        .map((r) => ({
          path: r.path,
          title: cleanTitle(r.title),
          alt: cleanTitle(r.title),
          image: r.image,
          tags: parseTags(r.tags),
        }));
    } else {
      log(`related-articles: index fetch failed (${resp.status}) for ${indexUrl}`, el);
    }
  } catch (ex) {
    log(ex, el);
  }

  el.replaceChildren(renderRelatedArticles({
    heading,
    explore,
    articles,
    numCols,
    limit,
    eyebrowFallback,
    // Build optimized <picture> only for the tiles actually rendered.
    mediaFactory: (a) => (a.image ? createPicture({ src: a.image, alt: a.alt }) : null),
  }));
}
