/// <reference types="@fastly/js-compute" />

// Server-side renders a Healthwise health-encyclopedia article into the
// published EDS page. See ../README or the kp-hw project notes for the flow.

import { env } from 'fastly:env';
import { parse } from 'node-html-parser';
import { SecretStoreManager } from './lib/config.js';
// Build-time-injected Healthwise key, used ONLY as a fallback when the secret
// store is absent (Sandbox programs don't provision it). Generated — and
// gitignored — from hw_key.local by scripts/gen-hw-key.mjs; never committed,
// and empty on real (non-sandbox) environments where the store is used instead.
import { HW_KEY_FALLBACK } from './hw-key.generated.js';

// Folder-mapped article path: the page is authored at <ARTICLE_BASE>/default and
// every <ARTICLE_BASE>/<articleID> URL renders it (commerce drop-in pattern).
// The last path segment IS the Healthwise article ID — SEO-friendly path instead
// of a ?articleID= query.
const ARTICLE_BASE = '/northern-california/health-wellness/health-encyclopedia/article';
const SHELL_PATH = `${ARTICLE_BASE}/default`;

// Article ID from a request path, or null if this isn't an article-detail
// request (the /default doc itself, the base, or an asset path).
export function getArticleId(pathname) {
  const prefix = `${ARTICLE_BASE}/`;
  if (!pathname.startsWith(prefix)) return null;
  const seg = pathname.slice(prefix.length).split('/')[0].trim();
  if (!seg || seg === 'default') return null;
  return seg;
}

// Page-shell origin per environment, resolved at runtime so there's nothing to
// flip or revert before a PR:
//   - local `serve` (Viceroy)        → DEV_ORIGIN     (your local `aem up`)
//   - preview host (*.aem.page)      → PREVIEW_ORIGIN
//   - production (anything else)     → PROD_ORIGIN
// FASTLY_HOSTNAME is "localhost" only in the local runtime; in prod/preview it
// is a real cache-node name, so we fall back to the request host to choose.
const PROD_ORIGIN = 'https://main--kp-hw--adobedrago.aem.live';
const PREVIEW_ORIGIN = 'https://main--kp-hw--adobedrago.aem.page';
const DEV_ORIGIN = 'http://localhost:3000';

export function isLocalDev() {
  return env('FASTLY_HOSTNAME') === 'localhost';
}

// Resolve the shell origin AND the matching declared backend for this env.
// The backend (not the URL host) decides where the connection goes, so each
// origin needs its own backend: eds-local (fastly.toml), eds-preview / eds-prod
// (edgeFunctions.yaml).
export function getShellTarget(req) {
  if (isLocalDev()) return { origin: DEV_ORIGIN, backend: 'eds-local' };
  const host = new URL(req.url).hostname;
  if (host.includes('aem.page')) return { origin: PREVIEW_ORIGIN, backend: 'eds-preview' };
  return { origin: PROD_ORIGIN, backend: 'eds-prod' };
}

// DEV ONLY: proxy any non-article request (scripts, styles, templates,
// fragments, images) to the shell origin so :7676 is a complete local preview.
// In production the CDN only routes the article path to this function, so this
// branch is never hit there.
export function proxyToShell(req) {
  const url = new URL(req.url);
  const { origin, backend } = getShellTarget(req);
  return fetch(`${origin}${url.pathname}${url.search}`, { backend });
}

function buildHealthwiseUrl(id, key) {
  const p = new URLSearchParams({ 'hw.key': key, 'hw.format': 'rhtml' });
  return `https://ixbapi.healthwise.net/KnowledgeContent/${encodeURIComponent(id)}?${p.toString()}`;
}

// --- RHTML → EDS semantic HTML --------------------------------------------
// Healthwise RHTML is a full document of presentational Hw* div/span wrappers.
// We re-emit clean EDS "default content" (da-content §6): each Healthwise
// section (.HwContent > .HwNavigationSection) becomes one EDS <div> section of
// headings/paragraphs/lists/links/images — no class/id/style (EDS decoration
// adds those client-side).

// Default-content tags kept as-is.
const KEEP = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'strong', 'em', 'u', 's', 'sub', 'sup', 'code', 'br',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'img',
]);
const REMAP = { b: 'strong', i: 'em' }; // presentational → semantic
const DROP_TAG = new Set([
  'script', 'style', 'link', 'meta', 'noscript', 'iframe', 'object', 'embed',
  'svg', 'button', 'input', 'form', 'select', 'textarea', 'nav', 'head', 'area', 'map', 'source',
]);
// Healthwise chrome containers (by class) dropped with their contents.
const DROP_CLASS = /(^|\s)(HwContentNavigation|HwContentTopNavigation|HwSearch|HwLogo|HwOptionalLogo|HwLegal|HwCopyright|HwDisclaimer|HwClear|HwGoToWeb)/;
const PRUNE_EMPTY = new Set([
  'p', 'li', 'ul', 'ol', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 's', 'sub', 'sup', 'a',
]);

const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const classOf = (n) => (n.getAttribute ? n.getAttribute('class') || '' : '');

// Curated Hw* classes kept as styling hooks on the semantic output (section
// types, subsection titles, media-link grids, credits). Everything else is
// dropped, so this stays close to clean default content.
const CLASS_ALLOW = /^(HwSectionTitle|HwSubSectionTitle|HwContentTitle|HwNavigationSection|HwSection[A-Za-z]+|HwContentInformation|HwCredits[A-Za-z]*|HwLastUpdated|HwMediaItemList|HwMediaItem|HwMediaTitle|HwMediaImage|hwSecLinks|hwMediaLinks|HwHealthTool[A-Za-z]*|HwLinkExternal)$/;
const keptClasses = (n) => classOf(n).split(/\s+/).filter((c) => CLASS_ALLOW.test(c)).join(' ');
const classAttr = (n) => { const c = keptClasses(n); return c ? ` class="${c}"` : ''; };

function cellAttrs(tag, node) {
  if (tag !== 'td' && tag !== 'th') return '';
  const out = [];
  ['colspan', 'rowspan'].forEach((a) => { const v = node.getAttribute(a); if (v) out.push(`${a}="${escAttr(v)}"`); });
  return out.length ? ` ${out.join(' ')}` : '';
}

// Recursively emit one node as EDS default content.
function emit(node) {
  if (node.nodeType === 3) return node.rawText || '';
  if (node.nodeType !== 1) return '';
  let tag = (node.rawTagName || '').toLowerCase();
  if (DROP_TAG.has(tag) || DROP_CLASS.test(classOf(node))) return '';
  tag = REMAP[tag] || tag;
  const inner = () => node.childNodes.map(emit).join('');

  if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    const body = inner();
    if (!body.trim()) return '';
    if (!href || href.startsWith('#')) return body; // drop in-page nav, keep text
    return `<a${classAttr(node)} href="${escAttr(href)}">${body}</a>`;
  }
  if (tag === 'img') {
    const src = node.getAttribute('src');
    return src ? `<img${classAttr(node)} src="${escAttr(src)}" alt="${escAttr(node.getAttribute('alt') || '')}" loading="lazy">` : '';
  }
  if (tag === 'br') return '<br>';
  if (KEEP.has(tag)) {
    const body = inner();
    if (!body.trim() && PRUNE_EMPTY.has(tag)) return '';
    return `<${tag}${classAttr(node)}${cellAttrs(tag, node)}>${body}</${tag}>`;
  }
  // div/span/font/etc → ALWAYS unwrap (no class re-emitted). ak.js treats any
  // classed <div> inside a section as an EDS block and tries to load
  // /blocks/<class>/<class>.{js,css} (404s). So class hooks live only on
  // non-div elements (headings/lists/links/images, handled above) and on the
  // section wrapper (main > div = a section, not a block; see toSemanticSections).
  return inner();
}

const tidy = (html) => html
  .replace(/>\s+</g, '> <')
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/(\s*<br>\s*){2,}/g, '<br>')
  .trim();

// Build EDS sections: an h1 title section + one <div> per Healthwise section.
function toSemanticSections(rhtml) {
  const root = parse(rhtml, { comment: false });
  const out = [];
  const hasContent = (html) => Boolean(html.replace(/<[^>]+>/g, '').trim() || /<img/.test(html));

  const h1 = root.querySelector('h1');
  if (h1) out.push(`<div><h1>${escAttr(h1.text.trim())}</h1></div>`);

  const content = root.querySelector('.HwContent');
  const sections = (content?.childNodes || []).filter(
    (n) => n.tagName && /(^|\s)HwNavigationSection(\s|$)/.test(classOf(n)),
  );
  for (const sec of sections) {
    const body = tidy(sec.childNodes.map(emit).join(''));
    // Preserve the section id (minus Healthwise's "sec-" prefix) so the URL hash
    // (#acn8774, #acn8821-HealthTools) targets it, matching the production page.
    const secId = (sec.getAttribute('id') || '').replace(/^sec-/, '');
    const idAttr = secId ? ` id="${escAttr(secId)}"` : '';
    if (hasContent(body)) out.push(`<div${idAttr}${classAttr(sec)}>${body}</div>`);
  }
  // Fallback: no recognizable sections — emit the whole content area as one section.
  if (out.length <= (h1 ? 1 : 0) && content) {
    const body = tidy(content.childNodes.map(emit).join(''));
    if (hasContent(body)) out.push(`<div>${body}</div>`);
  }
  return out.join('\n');
}

// Pull the per-article title + description from the RHTML <head> so each
// folder-mapped URL gets its own SEO metadata (otherwise every article shares
// the /default doc's title).
function extractMeta(rhtml) {
  const metaContent = (name) => rhtml
    .match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'))?.[1];
  const title = metaContent('consumertitle')
    || rhtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
    || '';
  const description = metaContent('description') || '';
  return { title, description };
}

// Replace (or insert before </head>) a head tag matched by `re`.
function setHeadTag(html, re, tag) {
  if (!tag) return html;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `${tag}\n</head>`);
}

export async function articleHandler(req) {
  const id = getArticleId(new URL(req.url).pathname);
  if (!id) return new Response('Missing article ID', { status: 400 });

  // Prefer the managed secret store (real environments). Sandbox programs don't
  // provision the store, so getSecret() throws — fall back to the build-time key.
  let key;
  try {
    key = (await SecretStoreManager.getSecret('HW_KEY')).trim();
  } catch (err) {
    key = (HW_KEY_FALLBACK || '').trim();
    if (!key) throw err;
  }

  // Parallel fetches. The shell is the /default doc — a different path than the
  // request — so fetching it from the origin won't re-enter this function (loop guard).
  const { origin, backend } = getShellTarget(req);
  const [shellRes, articleRes] = await Promise.all([
    fetch(`${origin}${SHELL_PATH}`, { backend }),
    fetch(buildHealthwiseUrl(id, key), { backend: 'healthwise' }),
  ]);

  if (!articleRes.ok) {
    return new Response(`Article not available: ${id}`, { status: articleRes.status });
  }

  const [shell, rhtml] = await Promise.all([shellRes.text(), articleRes.text()]);
  const sections = toSemanticSections(rhtml);

  // Inject the EDS sections inside <main>; the page's scripts.js decorates them.
  let html = shell.replace(/<main\b[^>]*>/i, (m) => `${m}${sections}`);

  // Per-article SEO metadata from the RHTML head.
  const { title, description } = extractMeta(rhtml);
  if (title) html = setHeadTag(html, /<title[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  if (description) {
    html = setHeadTag(html, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${description}">`);
  }

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
