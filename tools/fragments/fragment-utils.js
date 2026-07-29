const ADMIN_ORIGIN = 'https://admin.da.live';
const FRAGMENTS_ROOT = '/fragments';
const HTML_EXT = '.html';

export function buildListUrl(org, repo, path) {
  return `${ADMIN_ORIGIN}/list/${org}/${repo}${path}`;
}

export function toSiteRelativePath(daPath, org, repo) {
  const prefix = `/${org}/${repo}`;
  return daPath.startsWith(prefix) ? daPath.slice(prefix.length) : daPath;
}

export function stripHtmlExt(path) {
  return path.endsWith(HTML_EXT) ? path.slice(0, -HTML_EXT.length) : path;
}

export function buildFragmentPath(daPath, org, repo) {
  return stripHtmlExt(toSiteRelativePath(daPath, org, repo));
}

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

export function toItems(daItems, org, repo) {
  const folders = daItems
    .filter((item) => item.ext === undefined)
    .sort(byName)
    .map((item) => ({
      type: 'folder',
      name: item.name,
      path: toSiteRelativePath(item.path, org, repo),
    }));
  const files = daItems
    .filter((item) => item.ext === 'html')
    .sort(byName)
    .map((item) => ({
      type: 'file',
      name: item.name,
      path: buildFragmentPath(item.path, org, repo),
    }));
  return [...folders, ...files];
}

export function buildBreadcrumbs(currentPath) {
  const segments = currentPath.slice(FRAGMENTS_ROOT.length).split('/').filter(Boolean);
  const crumbs = [{ label: 'Fragments', path: FRAGMENTS_ROOT }];
  let acc = FRAGMENTS_ROOT;
  segments.forEach((segment) => {
    acc = `${acc}/${segment}`;
    crumbs.push({ label: segment, path: acc });
  });
  return crumbs;
}

export function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInsertHtml(fragmentPath) {
  const safe = escapeHtml(fragmentPath);
  return `<a href="${safe}">${safe}</a>`;
}

export function buildPreviewUrl(fragmentPath, org, repo, ref = 'main') {
  return `https://${ref}--${repo}--${org}.aem.page${fragmentPath}`;
}
