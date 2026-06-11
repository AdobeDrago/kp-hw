// Adobe AppBuilder (kp-search) proxy that adds CORS headers and calls KP
// server-side. Deployed from the "Proxy NoCors" App Builder project (Stage).
const PROXY_ENDPOINT = 'https://1394629-808magentadolphin-stage.adobeio-static.net/api/v1/web/example/kp-search';

const KP_SEARCH_BASE = 'https://apims.kaiserpermanente.org/kp/care/api/sda/kp-search-api/v1/api/kporg/search/v1';

// KP "region of practice". KP has several regions; this is a best-effort map of
// California ZIPs to Northern (NCA) vs Southern (SCA) California. Extend with
// the official KP region mapping if other regions are needed.
const DEFAULT_ROP = 'SCA';

function zipToRop(zip) {
  const n = parseInt(zip, 10);
  if (Number.isNaN(n)) return DEFAULT_ROP;
  // NorCal ZIPs are roughly 94000–96199; SoCal 90000–93599.
  return n >= 94000 ? 'NCA' : 'SCA';
}

function latToRop(lat) {
  // Rough CA split near 35.8°N.
  return lat >= 35.8 ? 'NCA' : 'SCA';
}

// Builds the KP search URL. `listShow: 0` returns the topic facets only (no
// result documents) — that's all we need to populate the dropdown.
function buildKpSearchUrl({ rop, zip = '', lat = '', lon = '', listShow = 0 }) {
  const params = [
    'v:sources=kp-health-classes-proximity',
    'v:project=kp-classes-project',
    'query=',
    `rop=${rop}`,
    `user_zip=${zip}`,
    'binning-state=distance=0:50',
    `user_lat=${lat}`,
    `user_lon=${lon}`,
    'locale=en-us',
    'render.function=json-feed-display-document',
    'content-type=application-json',
    `render.list-show=${listShow}`,
  ].join('&');
  return `${KP_SEARCH_BASE}?${params}`;
}

// Calls KP through the proxy and returns the list of health topics:
// [{ label, token, count }]. Topics live in the `health_topic` binning set.
async function fetchTopics(opts) {
  const kpUrl = buildKpSearchUrl({ ...opts, listShow: 0 });
  const proxyUrl = `${PROXY_ENDPOINT}?url=${encodeURIComponent(kpUrl)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`proxy request failed: ${res.status}`);
  const data = await res.json();
  // TEMP: inspect the raw KP API response in the console. Remove when done.
  // eslint-disable-next-line no-console
  console.log('[classes-search] raw KP response:', data);
  const set = (data.binning?.['binning-set'] || []).find((s) => s['bs-id'] === 'health_topic');
  return (set?.bins || []).map((b) => ({
    label: b.label,
    token: b.token,
    count: Number(b.ndocs) || 0,
  }));
}

// Inline SVG icons (kept tiny; colored via currentColor where possible).
const ICON_PIN = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';
const ICON_CLEAR = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"/></svg>';

export default function init(el) {
  el.textContent = '';

  // --- Build the markup ---------------------------------------------------
  const form = document.createElement('form');
  form.className = 'cs-form';
  form.noValidate = true;

  // Location field
  const locField = document.createElement('div');
  locField.className = 'cs-field cs-location';
  locField.innerHTML = `
    <div class="cs-label-row">
      <label class="cs-label" for="cs-zip">Location</label>
      <button type="button" class="cs-use-location">${ICON_PIN}<span>Use my location</span></button>
    </div>
    <div class="cs-input-wrap">
      <input id="cs-zip" class="cs-input" type="text" inputmode="numeric" autocomplete="postal-code"
        maxlength="5" placeholder="Enter your city or ZIP code" />
      <button type="button" class="cs-clear" aria-label="Clear location" hidden>${ICON_CLEAR}</button>
    </div>`;

  // Topic field
  const topicField = document.createElement('div');
  topicField.className = 'cs-field cs-topic';
  topicField.innerHTML = `
    <div class="cs-label-row">
      <label class="cs-label" for="cs-topic">Topic</label>
    </div>
    <div class="cs-topic-control">
      <select id="cs-topic" class="cs-select" disabled aria-busy="false">
        <option value="">Select topic</option>
      </select>
      <div class="cs-spinner" role="status" aria-label="Loading topics" hidden></div>
    </div>`;

  // Submit
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'cs-submit';
  submit.textContent = 'Find programs';

  form.append(locField, topicField, submit);
  el.append(form);

  const input = locField.querySelector('.cs-input');
  const clearBtn = locField.querySelector('.cs-clear');
  const geoBtn = locField.querySelector('.cs-use-location');
  const select = topicField.querySelector('.cs-select');
  const spinner = topicField.querySelector('.cs-spinner');

  // --- State --------------------------------------------------------------
  let state = { zip: '', lat: '', lon: '', rop: DEFAULT_ROP };
  let reqToken = 0; // guards against out-of-order responses

  const hasLocation = () => Boolean(state.zip || (state.lat && state.lon));

  // --- Topic dropdown rendering ------------------------------------------
  function resetTopics() {
    spinner.hidden = true;
    select.hidden = false;
    select.setAttribute('aria-busy', 'false');
    select.disabled = true;
    select.innerHTML = '<option value="">Select topic</option>';
  }

  function showTopicsLoading() {
    select.hidden = true;
    spinner.hidden = false;
    select.setAttribute('aria-busy', 'true');
  }

  function renderTopics(topics) {
    spinner.hidden = true;
    select.hidden = false;
    select.setAttribute('aria-busy', 'false');
    select.innerHTML = '<option value="">Select topic</option>';
    if (!topics.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No topics found';
      opt.disabled = true;
      select.append(opt);
      select.disabled = true;
      return;
    }
    topics.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.token;
      opt.textContent = t.label;
      select.append(opt);
    });
    select.disabled = false;
  }

  async function loadTopics(opts) {
    const token = ++reqToken;
    state.rop = opts.rop;
    showTopicsLoading();
    try {
      const topics = await fetchTopics(opts);
      if (token !== reqToken) return; // a newer request superseded this one
      renderTopics(topics);
    } catch (err) {
      if (token !== reqToken) return;
      // eslint-disable-next-line no-console
      console.error('[classes-search] failed to load topics:', err);
      resetTopics();
    }
  }

  // --- Location input -----------------------------------------------------
  let debounce;
  input.addEventListener('input', () => {
    // keep digits only, max 5
    const zip = input.value.replace(/\D/g, '').slice(0, 5);
    if (zip !== input.value) input.value = zip;
    clearBtn.hidden = zip.length === 0;

    clearTimeout(debounce);
    if (zip.length === 5) {
      state = { zip, lat: '', lon: '', rop: zipToRop(zip) };
      debounce = setTimeout(() => loadTopics({ rop: state.rop, zip }), 400);
    } else {
      state = { zip: '', lat: '', lon: '', rop: DEFAULT_ROP };
      resetTopics();
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.hidden = true;
    state = { zip: '', lat: '', lon: '', rop: DEFAULT_ROP };
    resetTopics();
    input.focus();
  });

  // --- Use my location ----------------------------------------------------
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line no-console
      console.warn('[classes-search] geolocation not supported');
      return;
    }
    showTopicsLoading();
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      // Try to resolve a ZIP so the field mirrors manual entry. Free, key-less,
      // CORS-enabled reverse geocoder; falls back to lat/lon on any failure.
      let zip = '';
      try {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        if (r.ok) {
          const g = await r.json();
          zip = String(g.postcode || '').replace(/\D/g, '').slice(0, 5);
        }
      } catch (e) { /* ignore — fall back to coordinates */ }

      if (/^\d{5}$/.test(zip)) {
        input.value = zip;
        clearBtn.hidden = false;
        state = { zip, lat: '', lon: '', rop: zipToRop(zip) };
        loadTopics({ rop: state.rop, zip });
      } else {
        state = { zip: '', lat: latitude, lon: longitude, rop: latToRop(latitude) };
        loadTopics({ rop: state.rop, lat: latitude, lon: longitude });
      }
    }, (err) => {
      // eslint-disable-next-line no-console
      console.error('[classes-search] geolocation failed:', err);
      resetTopics();
    });
  });

  // --- Submit -------------------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!hasLocation()) { input.focus(); return; }
    if (!select.value) { select.focus(); return; }
    const detail = {
      ...state,
      topic: select.value,
      topicLabel: select.selectedOptions[0]?.textContent || '',
    };
    // No results page yet — emit an event other code can hook into.
    el.dispatchEvent(new CustomEvent('classes-search:submit', { bubbles: true, detail }));
    // eslint-disable-next-line no-console
    console.log('[classes-search] submit:', detail);
  });
}
