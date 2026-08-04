/*
 * Federated ("libs") configuration — the single source of truth for WHICH blocks
 * are federated and WHERE the libs project is served from.
 *
 * This is the heart of the Libs Architecture (https://docs.da.live/media/libs-arch.pdf):
 * the federated runtime (libs.js / ak.js) asks this module, per block, whether to
 * load from the shared `/libs` tree or from the consuming site's own `/blocks`.
 */

/**
 * Blocks owned by the federated "libs" project. Their code lives under
 * `/libs/blocks/<name>/` and is fetched from `libsBase` at runtime; every other
 * block loads from the consuming site's `siteBase`.
 *
 * Keep this list to genuinely common, stable blocks. Site teams override a
 * federated block by shipping their own `/blocks/<name>/` AND removing the name
 * here (or, per-use, by authoring a site-local variant — see docs).
 */
export const FEDERATED_BLOCKS = new Set([
  'accordion',
  'advanced-tabs',
  'card',
  'cards-icon',
  'columns',
  'columns-media',
  'footer',
  'fragment',
  'header',
  'hero',
  'icons',
  'plan-compare',
  'schedule',
  'section-metadata',
  'table',
  'tabs',
  'youtube',
]);

/**
 * Resolve where the federated libs project is served from.
 *
 * Priority (this maps to lifecycle step 2 in the spec — "scripts.js determines
 * where to load the federated project from: prod, stage, local"):
 *   1. `<meta name="libs" content="…">` — an absolute origin/URL or an
 *      absolute path. Lets a page/env pin a specific libs deployment.
 *   2. Same-origin `${siteBase}/libs` (the default; what this POC uses).
 *
 * @param {string} siteBase origin root of the consuming site (no trailing slash)
 * @returns {string} libs base URL, no trailing slash
 */
export function resolveLibsBase(siteBase) {
  const override = document.head
    .querySelector('meta[name="libs"]')?.content?.trim();
  if (override) {
    try {
      return new URL(override, window.location.origin).href.replace(/\/$/, '');
    } catch {
      /* malformed override → fall through to the same-origin default */
    }
  }
  return `${siteBase}/libs`;
}
