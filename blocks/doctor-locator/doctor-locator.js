/*
 * Doctor Locator
 * --------------
 * Reads a JSON sheet path authored in the block (a single cell, e.g.
 * `/forms/ncal/doctor/doctors-index.json`), fetches it same-origin, and renders
 * one card per doctor. Unlike the classes-* blocks this needs no CORS proxy —
 * the sheet is served from our own EDS origin. See CLAUDE.md for the wider
 * KP-block conventions (HTML-escape third-party values, guard async fetches).
 *
 * Expected sheet shape (EDS query-index / spreadsheet):
 *   { data: [ { path, name, primarySpeciality, location, address, city,
 *               state, zip, accepting, phone, plans }, ... ] }
 */

// Neutral placeholder avatar (the feed carries no photo). currentColor is set
// by CSS so the silhouette tints against the graphite tile.
const AVATAR_SVG = '<svg class="dl-avatar" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle cx="60" cy="46" r="26" fill="currentColor"/><path d="M16 120c0-24.3 19.7-40 44-40s44 15.7 44 40z" fill="currentColor"/></svg>';

// Map-style teardrop pin; the number is overlaid via .dl-pin-num.
const PIN_SVG = '<svg viewBox="0 0 24 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0Z"/></svg>';

// --- pure helpers --------------------------------------------------------

// Escape third-party strings before they touch innerHTML.
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

// The source path is authored as plain text (or an anchor). Prefer an <a href>,
// otherwise use the first non-empty token of the block's text.
function readSource(block) {
  const link = block.querySelector('a[href]');
  if (link) return link.getAttribute('href').trim();
  return (block.textContent || '').trim().split(/\s+/).find(Boolean) || '';
}

// "700 Lilly Rd NE," / "Olympia, WA, 98506"
function addressLines(d) {
  const line1 = d.address ? `${d.address},` : '';
  const line2 = [d.city, d.state, d.zip]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ');
  return { line1, line2 };
}

// A Google Maps directions link built from the printed address.
function directionsUrl(d) {
  const dest = [d.address, d.city, d.state, d.zip]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ');
  return dest ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}` : '';
}

// "HMO\nSenior Advantage\n..." -> ["HMO", "Senior Advantage", ...]
function splitPlans(plans) {
  return String(plans || '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

// Render `text` as a link to `href`, or as plain escaped text when there's no
// href; empty when there's no text.
function linkOrText(text, href) {
  if (!text) return '';
  return href ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text);
}

// --- card ----------------------------------------------------------------

function buildCard(d, index) {
  const profile = (d.path || '').trim();
  const { line1, line2 } = addressLines(d);
  const plans = splitPlans(d.plans);
  const directions = directionsUrl(d);
  const tel = telHref(d.phone);

  const name = linkOrText(d.name, profile);
  const location = linkOrText(d.location, profile);
  const actions = [
    directions ? `<a class="dl-directions" href="${esc(directions)}" target="_blank" rel="noopener">Directions</a>` : '',
    tel ? `<a class="dl-phone" href="${esc(tel)}">${esc(d.phone)}</a>` : '',
  ].filter(Boolean).join('');

  const card = document.createElement('article');
  card.className = 'dl-card';
  card.innerHTML = `
    <span class="dl-pin" aria-hidden="true">${PIN_SVG}<span class="dl-pin-num">${esc(index)}</span></span>
    <div class="dl-photo">${AVATAR_SVG}</div>
    <div class="dl-body">
      <h3 class="dl-name">${name}</h3>
      ${d.primarySpeciality ? `<p class="dl-specialty">${esc(d.primarySpeciality)}</p>` : ''}
      ${location ? `<p class="dl-location">${location}</p>` : ''}
      ${(line1 || line2) ? `<address class="dl-address">${esc(line1)}${line1 && line2 ? '<br>' : ''}${esc(line2)}</address>` : ''}
      ${actions ? `<p class="dl-actions">${actions}</p>` : ''}
      ${plans.length ? `<p class="dl-plans"><strong>Plans accepted:</strong> ${esc(plans.join(', '))}</p>` : ''}
    </div>`;
  return card;
}

function setMessage(block, className, text) {
  block.textContent = '';
  const p = document.createElement('p');
  p.className = className;
  if (className === 'dl-status') p.setAttribute('role', 'status');
  p.textContent = text;
  block.append(p);
}

// --- entry ---------------------------------------------------------------

export default async function decorate(block) {
  const src = readSource(block);
  if (!src) {
    setMessage(block, 'dl-error', 'No data source configured for the doctor locator.');
    return;
  }

  setMessage(block, 'dl-status', 'Loading doctors…');

  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`request failed: ${res.status}`);
    const json = await res.json();
    const rows = (json.data || []).filter((d) => d && (d.name || '').trim());

    if (!rows.length) {
      setMessage(block, 'dl-empty', 'No doctors found.');
      return;
    }

    const list = document.createElement('div');
    list.className = 'dl-list';
    rows.forEach((d, i) => list.append(buildCard(d, i + 1)));
    block.textContent = '';
    block.append(list);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[doctor-locator] failed to load doctors:', err);
    setMessage(block, 'dl-error', 'Something went wrong loading doctors.');
  }
}
