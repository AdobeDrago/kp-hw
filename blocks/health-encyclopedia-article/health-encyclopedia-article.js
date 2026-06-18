// Healthwise KnowledgeContent — dynamic health-encyclopedia article.
//
// The article ID comes from the page URL (e.g. ?articleID=acn8821). The block
// fetches that article's RHTML from Healthwise and renders it into the page.
//
// NOTE ON ARCHITECTURE: In production the AEM Edge Function fetches Healthwise
// server-side and injects the rendered HTML into this block, with the API key
// held in the Edge Function SecretStore. The client-side fetch below is a
// local-dev / fallback path so the article can be built and styled before the
// edge function is live. Do NOT ship HW_KEY in a public production bundle —
// the edge function is what hides it.
const HW_BASE = 'https://ixbapi.healthwise.net/KnowledgeContent';
const HW_KEY = 'AAJSBH52YMVIFNKOOGETRFPP6WQU4JLSAO47ORGQCYDWUJUMYYQHNDDXPJF72OXEJ2B6FVTHLXZ3ADBMPB4YOYWVBM4GNDCGGFUOXKMA';

// Article ID: URL query param first, then an optional authored fallback in the
// block's first cell (handy for previewing a specific article in DA).
function getArticleId(block) {
  const fromUrl = new URLSearchParams(window.location.search).get('articleID');
  if (fromUrl) return fromUrl.trim();
  const cell = block.querySelector(':scope > div > div');
  return cell ? cell.textContent.trim() : '';
}

function buildHwUrl(id) {
  const params = new URLSearchParams({ 'hw.key': HW_KEY, 'hw.format': 'rhtml' });
  return `${HW_BASE}/${encodeURIComponent(id)}?${params.toString()}`;
}

// Third-party HTML — strip scripts/embeds and inline handlers before injecting.
function sanitize(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const isJsUrl = ['href', 'src'].includes(name) && /^\s*javascript:/i.test(attr.value);
      if (name.startsWith('on') || isJsUrl) node.removeAttribute(attr.name);
    });
  });
  return doc.body ? doc.body.innerHTML : '';
}

export default async function init(block) {
  const id = getArticleId(block);
  block.textContent = '';

  if (!id) {
    block.innerHTML = '<p class="hea-error">No article ID provided. Add <code>?articleID=…</code> to the page URL.</p>';
    return;
  }

  block.innerHTML = '<div class="hea-loading" role="status" aria-label="Loading article"></div>';

  try {
    const res = await fetch(buildHwUrl(id));
    if (!res.ok) throw new Error(`Healthwise request failed: ${res.status}`);
    const rhtml = await res.text();
    block.innerHTML = `<article class="hea-content">${sanitize(rhtml)}</article>`;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health-encyclopedia-article] failed to load:', err);
    block.innerHTML = '<p class="hea-error">Sorry, this article could not be loaded.</p>';
  }
}
