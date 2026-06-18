/// <reference types="@fastly/js-compute" />

// Server-side renders a Healthwise health-encyclopedia article into the
// published EDS page. See ../README or the kp-hw project notes for the flow.

import { env } from 'fastly:env';
import { SecretStoreManager } from './lib/config.js';

const TEMPLATE_PATH = '/northern-california/health-wellness/health-encyclopedia/article';

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

export async function articleHandler(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('articleID');
  if (!id) return new Response('Missing articleID', { status: 400 });

  const key = (await SecretStoreManager.getSecret('HW_KEY')).trim();

  // Parallel fetches. The shell is fetched WITHOUT articleID, so in production
  // the CDN origin-selector rule won't re-route it into this function (loop guard).
  const { origin, backend } = getShellTarget(req);
  const [shellRes, articleRes] = await Promise.all([
    fetch(`${origin}${TEMPLATE_PATH}`, { backend }),
    fetch(buildHealthwiseUrl(id, key), { backend: 'healthwise' }),
  ]);

  if (!articleRes.ok) {
    return new Response(`Article not available: ${id}`, { status: articleRes.status });
  }

  const [shell, rhtml] = await Promise.all([shellRes.text(), articleRes.text()]);
  const section = `<div class="section"><article class="hea-content">${sanitize(extractBody(rhtml))}</article></div>`;

  // Inject the article as the first section inside <main> (template approach, no block).
  const html = shell.replace(/<main\b[^>]*>/i, (m) => `${m}${section}`);

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
