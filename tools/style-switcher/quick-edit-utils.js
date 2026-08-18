// Pure helpers for the quick-edit style switcher. No DOM globals beyond what's passed in,
// so these are unit-testable in isolation (see test/tools/style-switcher/quick-edit-utils.test.js).

const WRAPPER_SUFFIX = '-wrapper';

/**
 * Derive a block's base name from an EDS wrapper class.
 * "columns-media-wrapper" -> "columns-media"; anything else -> null.
 */
export function wrapperToBase(className) {
  return typeof className === 'string' && className.endsWith(WRAPPER_SUFFIX)
    ? className.slice(0, -WRAPPER_SUFFIX.length)
    : null;
}

/**
 * Extract authored variant tokens for `base` from a single CSS selector string.
 * Only true compound selectors count: `.columns.topics` -> ['topics'].
 * Prefixed/computed classes (`.columns-media-2-cols`) and `:not(...)` do NOT match,
 * which is exactly how we avoid surfacing computed/internal classes as "styles".
 */
export function variantTokens(base, selectorText) {
  if (!base || !selectorText) return [];
  const esc = base.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp(`\\.${esc}\\.([\\w-]+)`, 'g');
  const out = [];
  let m = re.exec(selectorText);
  while (m !== null) {
    out.push(m[1]);
    m = re.exec(selectorText);
  }
  return out;
}

/**
 * Given an element's class list and the discovered option list, return the options
 * that are currently applied (i.e. the active styles).
 */
export function activeVariants(classList, options) {
  const set = new Set(options);
  return [...classList].filter((c) => set.has(c));
}
