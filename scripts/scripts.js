import { loadArea, setConfig, getConfig } from './ak.js';

// The site-config loader lives in a standalone module (no page-bootstrap side
// effects) so blocks/utils can import it freely; re-exported here for convenience.
export { getSiteConfig } from '../utils/site-config.js';

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

const linkBlocks = [
  { fragment: '/fragments/' },
  { schedule: '/schedules/' },
  { youtube: 'https://www.youtube' },
];

// Blocks with self-managed styles
const components = ['fragment', 'schedule'];

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

// The block-library preview (DA / Experience Workspace "Search blocks" modal)
// renders each block's demo page under /docs/library/ in an iframe. Those pages
// show the block in isolation, so the site nav/footer is unwanted chrome —
// suppress it, same as fragments. Path-based, so it only affects library demo
// pages and never the editable full-page canvas (which loads at its real path,
// e.g. /index).
export function suppressLibraryChrome() {
  if (!window.location.pathname.startsWith('/docs/library/')) return;
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

/**
 * ak.js loads a template's CSS but not its JS. This loads the matching JS
 * module (templates/<template>/<template>.js) if the page declares a template
 * and the module exists. Runs after loadArea() so the DOM is fully decorated.
 */
async function loadTemplateJS() {
  let template = document.head.querySelector('meta[name="template"]')?.content;

  // Fallback: health-article pages are identified by the `healtharticle` URL
  // convention; the imported pages don't declare a template meta. (Production-clean
  // alternative: set `template: article` via metadata.json for the article path —
  // then this fallback is unnecessary.) When we assign the template here, ak.js has
  // already run without loading its CSS, so we load it below.
  const assignedByUrl = !template && /\/healtharticle[.-]/.test(window.location.pathname);
  if (assignedByUrl) template = 'article';
  if (!template) return;

  const name = template.replaceAll(' ', '-').toLowerCase();
  const { codeBase } = getConfig();

  if (assignedByUrl) {
    const cssHref = `${codeBase}/templates/${name}/${name}.css`;
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.append(link);
    }
  }

  try {
    const mod = await import(`${codeBase}/templates/${name}/${name}.js`);
    if (typeof mod.default === 'function') await mod.default();
  } catch {
    /* template has no JS module — nothing to do */
  }
}

export async function loadPage() {
  setConfig({
    hostnames, locales, linkBlocks, components, decorateArea, env: getEnv(),
  });
  suppressFragmentChrome();
  suppressLibraryChrome();
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
  if (hasPreview) import('../tools/da/da.js').then((mod) => mod.default(loadPage));
  const hasQE = searchParams.has('quick-edit');
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
}());
