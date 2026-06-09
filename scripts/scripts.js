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
  const template = document.head.querySelector('meta[name="template"]')?.content;
  if (!template) return;
  const name = template.replaceAll(' ', '-').toLowerCase();
  const { codeBase } = getConfig();
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
