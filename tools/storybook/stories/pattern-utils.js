// Shared helpers for KP pattern stories.
//
// Each vessel pattern ships a large self-contained `foundation.css` (design-system
// primitives + that component's styles, all scoped under
// `.ds-foundation[data-ds-theme=vessel][data-ds-variant=basic][data-ds-version="1"]`).
// We serve those files statically (see staticDirs in .storybook/main.js, mounted at
// /sb/<pattern>/) rather than importing them through Vite, so the CSS's own
// url(assets/...) references resolve at runtime and any missing background images
// just 404 gracefully instead of breaking the build.

let idCounter = 0;

/** Inject a pattern's stylesheet into the preview <head> exactly once. */
export function ensurePatternStyles(pattern) {
  const href = `/sb/${pattern}/foundation.css`;
  if (document.querySelector(`link[data-kp-pattern="${pattern}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.kpPattern = pattern;
  document.head.appendChild(link);
}

/** Absolute URL to a vendored pattern asset (served at /sb/<pattern>/...). */
export function assetUrl(pattern, path) {
  return `/sb/${pattern}/${path.replace(/^\/+/, '')}`;
}

/** Build a single DOM element from an HTML string. */
export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/** Process-unique id for aria wiring. */
export function uid(prefix = 'kp') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
