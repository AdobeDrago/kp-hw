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

export function extractBlockNames(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  const names = [];
  main.querySelectorAll(':scope > div > div[class]').forEach((block) => {
    const [name] = block.classList;
    if (name && !names.includes(name)) names.push(name);
  });
  return names;
}

export function extractMetadataFields(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const names = [];
  doc.head.querySelectorAll('meta[name], meta[property]').forEach((meta) => {
    const key = meta.getAttribute('name') || meta.getAttribute('property');
    if (key && !names.includes(key)) names.push(key);
  });
  return names;
}

export function diffSets(currentSet, referenceSet) {
  const missing = referenceSet.filter((name) => !currentSet.includes(name));
  const added = currentSet.filter((name) => !referenceSet.includes(name));
  return { missing, added };
}
