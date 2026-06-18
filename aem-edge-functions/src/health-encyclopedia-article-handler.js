/// <reference types="@fastly/js-compute" />

// Server-side renders a Healthwise health-encyclopedia article into the
// published EDS page. See ../README or the kp-hw project notes for the flow.

import { SecretStoreManager } from './lib/config.js';

const ORIGIN_HOST = 'main--kp-hw--adobedrago.aem.live';
const TEMPLATE_PATH = '/northern-california/health-wellness/health-encyclopedia/article';

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

  const key = await SecretStoreManager.getSecret('HW_KEY');

  // Parallel fetches. The shell is fetched WITHOUT articleID, so in production
  // the CDN origin-selector rule won't re-route it into this function (loop guard).
  const [shellRes, articleRes] = await Promise.all([
    fetch(`https://${ORIGIN_HOST}${TEMPLATE_PATH}`, { backend: 'eds-origin' }),
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
