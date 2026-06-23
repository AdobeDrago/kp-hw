/// <reference types="@fastly/js-compute" />

// Server-side renders a Healthwise health-encyclopedia article into the
// published EDS page. See ../README or the kp-hw project notes for the flow.

import { env } from 'fastly:env';
import { SecretStoreManager } from './lib/config.js';

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

// Healthwise returns a FULL HTML document; we only want the body's contents so
// we don't nest <html>/<head> inside the page. No DOM at the edge, so regex.
function extractBody(html) {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

// Minimal regex sanitize of third-party HTML.
function sanitize(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
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

  const key = (await SecretStoreManager.getSecret('HW_KEY')).trim();

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
  const section = `<div class="section"><article class="hea-content">${sanitize(extractBody(rhtml))}</article></div>`;

  // Inject the article as the first section inside <main> (template approach, no block).
  let html = shell.replace(/<main\b[^>]*>/i, (m) => `${m}${section}`);

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
