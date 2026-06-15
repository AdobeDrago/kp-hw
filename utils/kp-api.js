export const PROXY_ENDPOINT = 'https://1394629-808magentadolphin-stage.adobeio-static.net/api/v1/web/example/kp-api';
export const KP_SEARCH_BASE = 'https://apims.kaiserpermanente.org/kp/care/api/sda/kp-search-api/v1/api/kporg/search/v1';

export const DEFAULT_ROP = 'SCA';
export const DEFAULT_DISTANCE = 50;

export function zipToRop(zip) {
  const n = parseInt(zip, 10);
  if (Number.isNaN(n)) return DEFAULT_ROP;
  // NorCal ZIPs are roughly 94000–96199; SoCal 90000–93599.
  return n >= 94000 ? 'NCA' : 'SCA';
}

export function latToRop(lat) {
  // Rough CA split near 35.8°N.
  return lat >= 35.8 ? 'NCA' : 'SCA';
}

// Builds the KP search URL.
// - The base binning-state carries distance + topic, newline-joined as "%0A"
//   (a literal "\n" gets stripped by the proxy's URL parser; "%0A" survives).
// - Each active sidebar filter is its OWN extra `binning-state` query param.
export function buildKpSearchUrl({
  rop, zip = '', lat = '', lon = '', miles = DEFAULT_DISTANCE,
  topicLabel = '', listShow = 0, vstate = '', filterTokens = [],
}) {
  const base = [`distance=0:${miles}`];
  if (topicLabel) base.push(`health_topic==${topicLabel}`);
  const params = [
    'v:sources=kp-health-classes-proximity',
    'v:project=kp-classes-project',
    'query=',
    `rop=${rop}`,
    `user_zip=${zip}`,
    `binning-state=${base.join('%0A')}`,
    `user_lat=${lat}`,
    `user_lon=${lon}`,
    'locale=en-us',
    'render.function=json-feed-display-document',
    'content-type=application-json',
    `render.list-show=${listShow}`,
  ];
  if (vstate) params.push(`v:state=${vstate}`);
  filterTokens.forEach((t) => params.push(`binning-state=${t}`));
  return `${KP_SEARCH_BASE}?${params.join('&')}`;
}

// On main-- domains the App Builder proxy handles CORS. On branch previews
// and localhost the AEM dev server proxies requests, so call KP directly.
const useProxy = () => window.location.hostname.startsWith('main--');

export async function callProxy(kpUrl, body) {
  if (useProxy()) {
    const payload = body ? { url: kpUrl, body } : { url: kpUrl };
    const res = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`proxy request failed: ${res.status}`);
    return res.json();
  }
  // Dev / branch preview: call KP directly (dev server handles CORS).
  const res = await fetch(kpUrl, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  } : undefined);
  if (!res.ok) throw new Error(`KP request failed: ${res.status}`);
  return res.json();
}

const CONTENT_HUB_SQL = 'https://apims.kaiserpermanente.org/kp/care/api/kpd/csconsumptionapi/v1/sql';

// Fetches KP health articles from the Content Hub SQL API.
// tags: string[] — cq:tag values OR'd in the WHERE clause
// language: string — e.g. 'english', 'spanish'
// taxonomicID: string — content taxonomy ID
export async function fetchArticles({ tags = [], language = 'english', taxonomicID }) {
  const tagParams = tags.map((value, i) => ({ name: `@cqTagsOr0${i}`, value }));
  const whereTag = tagParams.map((p) => `CONTAINS(c.metadata["cq:tags"], ${p.name})`).join(' OR ');
  const query = `SELECT c.title, c.name, c.elements["headline"], c.elements["teaser"], c.elements["primaryImageOfPage"] FROM c WHERE (${whereTag}) AND IS_DEFINED(c.elements.language.variations[@language]) AND c.metadata["taxonomicID"] = @taxonomicID ORDER BY c.elements.displayDate["value"] DESC`;
  const parameters = [
    ...tagParams,
    { name: '@language', value: language },
    { name: '@taxonomicID', value: taxonomicID },
  ];
  return callProxy(CONTENT_HUB_SQL, { query, parameters });
}

// Topic facets only — no topic in binning-state, list-show=0.
export async function fetchTopics(opts) {
  const data = await callProxy(buildKpSearchUrl({ ...opts, listShow: 0 }));
  const set = (data.binning?.['binning-set'] || []).find((s) => s['bs-id'] === 'health_topic');
  return (set?.bins || []).map((b) => ({ label: b.label, token: b.token, count: Number(b.ndocs) || 0 }));
}

// Paginated results + facets + navigation, 10 per page.
export async function fetchResults(opts) {
  return callProxy(buildKpSearchUrl({
    ...opts, listShow: 10, vstate: `root|root-${opts.offset || 0}-10`,
  }));
}
