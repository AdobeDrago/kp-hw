export function buildPreviewUrl(path, org, repo, ref = 'main') {
  return `https://${ref}--${repo}--${org}.aem.page${path}`;
}

export function resolveTemplateFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const meta = doc.head.querySelector('meta[name="template"]');
  const value = meta?.content?.trim();
  return value || null;
}

const CONTENT_DA_ORIGIN = 'https://content.da.live';

export function parseContentDaUrl(url) {
  if (!url.startsWith(`${CONTENT_DA_ORIGIN}/`)) return null;
  const [org, repo, ...pathParts] = url.slice(CONTENT_DA_ORIGIN.length + 1).split('/');
  if (!org || !repo || !pathParts.length) return null;
  return { org, repo, path: `/${pathParts.join('/')}` };
}

export function findTemplateEntry(entries, templateName) {
  const target = templateName.trim().toLowerCase();
  return entries.find((entry) => entry.key?.trim().toLowerCase() === target) || null;
}
