// kp-hw CONSUMER bootstrap. kp-hw is both the federated libs provider (/libs) and
// its own consuming site; this file is the consumer half. It resolves where /libs
// lives, loads the federated runtime + styles from there, and passes kp-hw's own
// codeBase so KP-specific blocks (/blocks) still resolve locally.
// Mirrors author-kit/ak-consumer-1's scripts/scripts.js.

// The site-config loader lives in a standalone module (no page-bootstrap side
// effects) so blocks/utils can import it freely; re-exported here for convenience.
export { getSiteConfig } from '../utils/site-config.js';

// Where the federated libs project is served from:
//  - production (real domain): same-origin `/libs` (CDN-mapped → no DNS/SSL/CORS cost)
//  - preview/local (.aem/.hlx/localhost): `?libs=<branch>` deploy, or `local`
const libsBase = (() => {
  // kp-hw hosts its own /libs, so the default is ALWAYS same-origin `/libs`
  // (production CDN-mapped, and served directly under preview / `aem up` / tests).
  // Only an explicit `?libs=` override points elsewhere — for testing a libs
  // branch against this content (the spec's blast-radius workflow).
  const branch = new URLSearchParams(window.location.search).get('libs');
  if (!branch) return '/libs';
  if (!/^[a-zA-Z0-9_-]+$/.test(branch)) throw new Error('Invalid libs branch name.');
  if (branch === 'local') return 'http://localhost:3000/libs';
  return `https://${branch}--kp-hw--adobedrago.aem.live/libs`;
})();

// kp-hw's own code root (its /blocks, /templates, /img live here).
const codeBase = import.meta.url.replace('/scripts/scripts.js', '');

const hostnames = ['authorkit.dev'];

// Production hostnames — the ONLY hosts that resolve to the `prod` site-config
// tab. Add real production domain(s) here; anything not listed can never be
// `prod`, so a stray branch preview can't accidentally read production config.
const PROD_HOSTS = ['kp.pbyb.live'];

/**
 * Decide which environment the current page is running in, mapping the hostname
 * to a `site-config` sheet tab. The resolved value is stored on the app config
 * (see loadPage) so utils/blocks pick the right `site-config.json?sheet=<env>`.
 * @returns {'dev'|'qa'|'stage'|'prod'}
 */
export function getEnv() {
  const { hostname } = window.location;

  // Explicit production domains.
  if (PROD_HOSTS.includes(hostname)) return 'prod';

  // EDS URLs look like <branch>--<repo>--<owner>.aem.(page|live). A branch
  // literally named for an environment wins, e.g. qa--… or stage--….
  const branch = hostname.split('--')[0];
  if (branch === 'qa' || branch === 'stage') return branch;

  // Live edge (.aem.live / .hlx.live) with no env branch → stage.
  if (hostname.endsWith('.aem.live') || hostname.endsWith('.hlx.live')) return 'stage';

  // localhost + preview (.aem.page / .hlx.page) → dev.
  return 'dev';
}

const locales = {
  '': { lang: 'en' },
  '/de': { lang: 'de' },
  '/es': { lang: 'es' },
  '/fr': { lang: 'fr' },
  '/hi': { lang: 'hi' },
  '/ja': { lang: 'ja' },
  '/zh': { lang: 'zh' },
};

// Auto-blocks from links. Names are federated via the FEDERATED_BLOCKS manifest,
// so they resolve from /libs (no `lib-` prefix needed in kp-hw content).
const linkBlocks = [
  { fragment: '/fragments/' },
  { schedule: '/schedules/' },
  { youtube: 'https://www.youtube' },
];

// Blocks with self-managed styles
const components = ['fragment', 'schedule'];

// Load the federated global styles from libs. kp-hw's own styles.css (linked in
// head.html) is a heavy sub-brand override that must WIN, so — unlike a light
// ak-consumer — we insert libs styles BEFORE the site sheet in the DOM (libs is
// the base; kp-hw's styles.css, later in the cascade, overrides it).
function ensureLibsStyles() {
  const href = `${libsBase}/styles/styles.css`;
  const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')];
  if (sheets.some((l) => l.href.replace(/\/$/, '').endsWith('/libs/styles/styles.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  if (sheets[0]) sheets[0].before(link);
  else document.head.append(link);
}

function setMetaOverride(name, content) {
  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.append(meta);
  }
  meta.content = content;
}

// Fragments are meant to be embedded (fragment.js pulls out `main > div`
// sections only), so header/footer chrome is never wanted when one is
// loaded standalone, e.g. the fragments library plugin's live preview.
export function suppressFragmentChrome() {
  if (!window.location.pathname.startsWith('/fragments')) return;
  setMetaOverride('header', 'off');
  setMetaOverride('footer', 'off');
}

// How to decorate an area before loading it
const decorateArea = ({ area = document }) => {
  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    if (!img) return;
    img.removeAttribute('loading');
    img.fetchPriority = 'high';
  };

  eagerLoad(area, 'img');

  // Remove empty/broken image paragraphs (EDS artifact from empty doc lines)
  area.querySelectorAll('p > img:only-child').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (!src || src === 'about:error') img.closest('p').remove();
  });
};

// Load the federated runtime FROM the libs project.
const { setConfig, loadArea, getConfig } = await import(`${libsBase}/scripts/ak.js`);

/**
 * ak.js loads a template's CSS but not its JS. This loads the matching JS
 * module (templates/<template>/<template>.js) if the page declares a template
 * and the module exists. Templates are site-owned, so they resolve from codeBase.
 */
async function loadTemplateJS() {
  let template = document.head.querySelector('meta[name="template"]')?.content;

  // Fallback: health-article pages are identified by the `healtharticle` URL
  // convention; the imported pages don't declare a template meta.
  const assignedByUrl = !template && /\/healtharticle[.-]/.test(window.location.pathname);
  if (assignedByUrl) template = 'article';
  if (!template) return;

  const name = template.replaceAll(' ', '-').toLowerCase();
  const { codeBase: base } = getConfig();

  if (assignedByUrl) {
    const cssHref = `${base}/templates/${name}/${name}.css`;
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.append(link);
    }
  }

  try {
    const mod = await import(`${base}/templates/${name}/${name}.js`);
    if (typeof mod.default === 'function') await mod.default();
  } catch {
    /* template has no JS module — nothing to do */
  }
}

export async function loadPage() {
  ensureLibsStyles();
  setConfig({
    codeBase, hostnames, locales, linkBlocks, components, decorateArea, env: getEnv(),
  });
  suppressFragmentChrome();
  await loadArea();
  await loadTemplateJS();
}
// UE: pre-process DOM before ak.js
if (window.location.hostname.includes('ue.da.live')) {
  await import('../ue/scripts/ue-prepare.js');
}

await loadPage();

// UE Editor support
if (window.location.hostname.includes('ue.da.live')) {
  await import('../ue/scripts/ue.js').then(({ default: ue }) => ue());
}

(function da() {
  const { searchParams } = new URL(window.location.href);
  const hasPreview = searchParams.has('dapreview');
  if (hasPreview) import(`${libsBase}/tools/da/da.js`).then((mod) => mod.default(loadPage));
  const hasQE = searchParams.has('quick-edit');
  if (hasQE) import(`${libsBase}/tools/quick-edit/quick-edit.js`).then((mod) => mod.default());
}());
