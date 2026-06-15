# CLAUDE.md

Guidance for building EDS blocks that fetch from the **KP Lucid Search API** and
render content dynamically. Distilled from the `classes-search` and
`classes-results` blocks — reuse this pattern for any future block backed by that
endpoint (e.g. the Drug Encyclopedia / Diabetes scenarios).

---

## 1. Why a proxy (the CORS problem)

The KP Lucid Search API (`apims.kaiserpermanente.org`) does **not** return
`Access-Control-Allow-Origin` headers, so a browser `fetch()` from our site is
blocked by CORS. You **cannot** fix this from our side — only the API owner can.

The workaround is a **same-origin-ish proxy**: an Adobe App Builder action calls
KP **server-side** (servers don't enforce CORS) and returns the JSON **with** CORS
headers. The browser only ever talks to the proxy.

```
Browser (block)  ──►  App Builder action (kp-search)  ──►  KP Lucid Search API
   gets CORS ✓        adds CORS, calls KP server-side       no CORS at the server
```

- **Proxy action source:** `AdobeDrago/fetch-nocors` repo, action `kp-search`
  (package `example`). It's public (`require-adobe-auth: false`) and allowlisted to
  the KP host/path (SSRF guard). Build/derivation notes live in that repo's `proxy.md`.
- **Stage endpoint:**
  `https://1394629-808magentadolphin-stage.adobeio-static.net/api/v1/web/example/kp-search`
- **Adding a new proxy** for a *different* API = a new action in `fetch-nocors`
  (see its `proxy.md`), not a change here.

### Calling the proxy

Pass the full KP URL as a URL-encoded `url` query param:

```js
const PROXY = 'https://1394629-808magentadolphin-stage.adobeio-static.net/api/v1/web/example/kp-search';

async function callProxy(kpUrl) {
  const res = await fetch(`${PROXY}?url=${encodeURIComponent(kpUrl)}`);
  if (!res.ok) throw new Error(`proxy request failed: ${res.status}`);
  return res.json();
}
```

---

## 2. The KP search URL

```
https://apims.kaiserpermanente.org/kp/care/api/sda/kp-search-api/v1/api/kporg/search/v1?<params>
```

| Param | Notes |
|---|---|
| `v:sources` | `kp-health-classes-proximity` (the source/index) |
| `v:project` | `kp-classes-project` |
| `query` | free-text query (usually empty for facet/listing browse) |
| `rop` | **region of practice** — `SCA` (S. California), `NCA` (N. California), etc. |
| `user_zip` | 5-digit ZIP — **or** use `user_lat` + `user_lon` for geolocation |
| `binning-state` | the active filters (see §3) |
| `locale` | `en-us` |
| `render.function` | `json-feed-display-document` |
| `content-type` | `application-json` |
| `render.list-show` | `0` = facets only; `10` = a page of results + facets + navigation |
| `v:state` | pagination window, `root\|root-<offset>-10` (see §4) |

`rop` is best-effort mapped from location (no official table yet): ZIP ≥ 94000 → `NCA`
else `SCA`; for coordinates, lat ≥ 35.8 → `NCA` else `SCA`. Region label for display:
`SCA` → "S. California", `NCA` → "N. California".

---

## 3. binning-state — filters (read this twice)

`binning-state` carries the active filter tokens. There are **two** ways it's used,
and getting them wrong silently returns 0 results:

**a) The base filter** packs `distance` + `health_topic` into ONE `binning-state`,
newline-separated. ⚠️ **Use the literal `%0A`, not a real `\n`.** The proxy fetches
the URL server-side and the WHATWG URL parser **strips literal newline characters** —
`%0A` survives and KP decodes it back to a newline.

```
binning-state=distance=0:25%0Ahealth_topic==High Blood Pressure
```

**b) Each additional sidebar filter is its OWN `binning-state` query param** (not
appended to the base):

```
&binning-state=facility==Baldwin Park Medical Center
&binning-state=format_label==Classes
&binning-state=languages==English
&binning-state=fee_required==No
```

Each token comes verbatim from a facet bin's `token` field (see §5).

---

## 4. Pagination

KP returns 10 results per page. Drive it with `v:state`:

- Page 1: `v:state=root|root-0-10`
- "Load more": `v:state=root|root-<offset>-10` where `offset` = number already loaded
  (10, 20, …).
- Show a "View/Load more" affordance while `loadedCount < list.num`. (`navigation.links`
  also contains a `type:"next"` entry when more exist.)

---

## 5. Response shape

One `list-show=10` response contains everything — listing, facets, and pagination:

```jsonc
{
  "binning": {
    "binning-set": [
      { "bs-id": "health_topic", "bins": [ { "label": "Diabetes", "token": "health_topic==Diabetes", "ndocs": "51" }, ... ] },
      { "bs-id": "facility",     "bins": [ ... ] },   // and: format_label, languages, fee_required, city, delivery_type, distance
    ]
  },
  "list": {
    "num": "14",            // total results (also added-sources[0]["total-results"])
    "document": [
      { "contents": {
          "title": "Taking Care Of Your Heart",   // group sections by this
          "format_label": "Classes",
          "facility": "...", "fac_distance": "3.8",
          "address_line_1": "...", "city": "...", "state": "CA", "zipcode": "...",
          "alternate_phone_number": "...",
          "p_url": "https://healthy.kaiserpermanente.org/.../details/...",  // detail link
          "fee": "No fee required", "languages": "English", "attendee": ["...","..."],
          "health_topic": "Heart health"
      } }, ...
    ]
  },
  "navigation": { "links": [ { "type": "next", "value": "10-10|0" }, ... ] }
}
```

- **Dropdowns / facet filters** ← `binning.binning-set[]`. Find the set by `bs-id`;
  each bin gives a `label`, a `token` (for filtering), and `ndocs` (the count).
- **Listing** ← `list.document[]`. Group documents by `contents.title` to form
  program sections; each document is one location/offering.
- **Count / "view more"** ← `list.num`.

---

## 6. Reusable code pattern

Mirror what the two blocks do (keep the proxy/fetch helpers per-block or factor into
a shared module under `scripts/` if it grows):

```js
const KP_BASE = 'https://apims.kaiserpermanente.org/kp/care/api/sda/kp-search-api/v1/api/kporg/search/v1';

function buildKpSearchUrl({ rop, zip = '', lat = '', lon = '', miles = 50,
  topicLabel = '', listShow = 0, vstate = '', filterTokens = [] }) {
  const base = [`distance=0:${miles}`];
  if (topicLabel) base.push(`health_topic==${topicLabel}`);
  const params = [
    'v:sources=kp-health-classes-proximity', 'v:project=kp-classes-project', 'query=',
    `rop=${rop}`, `user_zip=${zip}`,
    `binning-state=${base.join('%0A')}`,            // §3a — %0A, never \n
    `user_lat=${lat}`, `user_lon=${lon}`, 'locale=en-us',
    'render.function=json-feed-display-document', 'content-type=application-json',
    `render.list-show=${listShow}`,
  ];
  if (vstate) params.push(`v:state=${vstate}`);
  filterTokens.forEach((t) => params.push(`binning-state=${t}`));   // §3b — one per filter
  return `${KP_BASE}?${params.join('&')}`;
}

// facets only (e.g. to populate a dropdown):
const data = await callProxy(buildKpSearchUrl({ rop, zip, listShow: 0 }));
// a page of results + facets + navigation:
const page = await callProxy(buildKpSearchUrl({
  rop, zip, miles, topicLabel, filterTokens, listShow: 10, vstate: `root|root-${offset}-10`,
}));
```

### Gotchas checklist
- `%0A` (not `\n`) inside `binning-state` — literal newlines get stripped by the proxy.
- One `binning-state` param **per** active sidebar filter.
- HTML-escape any rendered API values (titles, descriptions) — third-party data.
- Guard async fetches with a request token so out-of-order responses don't clobber the UI.
- The proxy is **public** and currently allows any origin (`*`) — fine for now; restrict before production.

---

## 7. Reference implementations
- `blocks/classes-search/` — search entry: ZIP/geolocation + dynamic topic dropdown (`list-show=0`), validation, redirect to the results page with `user_zip`/`distance_label`/`health_topic` params.
- `blocks/classes-results/` — results consumer: reads those URL params, runs the search (`list-show=10`), renders the grouped listing, faceted sidebar filters, and "View more" pagination.
- Styling: both blocks are derived from the Storybook design system (see `STORYBOOK.md` / `scripts/slice-block-css.mjs` and the `--ds-*` tokens in `styles/ds-tokens.css`).
