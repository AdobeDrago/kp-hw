import { loadArea, setConfig } from './ak.js';

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

export async function loadPage() {
  setConfig({ hostnames, locales, linkBlocks, components, decorateArea });
  await loadArea();
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
