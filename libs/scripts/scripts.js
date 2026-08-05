// Libs bootstrap — the entry for pages served from the libs project ITSELF
// (e.g. previewing /libs as its own site). Consuming sites do NOT use this; they
// have their own /scripts/scripts.js that imports this project's ak.js.
// Mirrors author-kit/ak-libs's libs/scripts/scripts.js. Here `codeBase` is omitted,
// so it defaults to libsBase — every block resolves from /libs.
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

// Auto-blocks use the `lib-` prefix here (these are federated blocks).
const linkBlocks = [
  { 'lib-fragment': '/fragments/' },
  { 'lib-schedule': '/schedules/' },
  { 'lib-youtube': 'https://www.youtube' },
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
};

export async function loadPage() {
  setConfig({
    hostnames, locales, linkBlocks, components, decorateArea,
  });
  await loadArea();
}
await loadPage();

(function da() {
  const { searchParams } = new URL(window.location.href);
  const hasPreview = searchParams.has('dapreview');
  if (hasPreview) import('../tools/da/da.js').then((mod) => mod.default(loadPage));
  const hasQE = searchParams.has('quick-edit');
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
}());
