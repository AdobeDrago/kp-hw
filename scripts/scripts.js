import { loadArea, setConfig, getConfig } from './ak.js';

const hostnames = ['authorkit.dev'];

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
  setConfig({ hostnames, locales, linkBlocks, components, decorateArea });
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
