/*
 * Federated ("libs") configuration — the single source of truth for WHICH blocks
 * are federated. `ak.js` reads this and, per block, loads from the shared `/libs`
 * tree (`libsBase`) or the consuming site's own `/blocks` (`codeBase`).
 *
 * (WHERE the libs project is served from is decided by the consuming site's
 * `scripts.js` bootstrap, which computes `libsBase` before it can import from
 * `/libs` — see `scripts/scripts.js`.)
 */

/**
 * Blocks owned by the federated "libs" project. Their code lives under
 * `/libs/blocks/<name>/` and is fetched from `libsBase` at runtime; every other
 * block loads from the consuming site (`codeBase`).
 *
 * A block is also treated as federated when authored with the official `lib-`
 * prefix (`lib-columns`); this manifest is the author-transparent alternative that
 * keeps the live KP site's existing content unchanged. Per the spec's "no lib
 * overrides" rule, a federated name always resolves to libs — a consumer that
 * needs different behavior creates a NEW block rather than shadowing one.
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
