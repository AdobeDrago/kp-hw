// EDS-block harness for Storybook.
//
// Renders a *real* EDS block the way production does: build the authored block
// table (rows → cells), drop it in a `main > .section` wrapper, load the EDS
// global styles + generated --ds-* tokens + the block's own CSS, then run the
// block's decorate (`init(el)`) against it. This lets an EDS block be reviewed
// side-by-side with its vessel reference story and fed to the visual-parity diff.
//
// Blocks and styles are pulled via import.meta.glob so any block can be mounted
// by name — no per-block wiring. Block JS is loaded lazily and run in place;
// CSS is inlined eagerly so it's ready before first paint.

// Block JS (lazy) + block CSS (inlined). blocks/ is NOT a staticDir, so Vite's
// ?inline transform applies cleanly here. styles/ IS a staticDir (for fonts), so
// global styles are loaded by <link> instead — see ensureGlobalStyles.
const blockJs = import.meta.glob('../../blocks/*/*.js');
const blockCss = import.meta.glob('../../blocks/*/*.css', { query: '?inline', import: 'default', eager: true });

const injected = new Set();

function injectStyle(id, css) {
  if (!css || injected.has(id)) return;
  const style = document.createElement('style');
  style.dataset.edsStyle = id;
  style.textContent = css;
  document.head.appendChild(style);
  injected.add(id);
}

function ensureLink(id, href) {
  if (injected.has(id) || document.querySelector(`link[data-eds-style="${id}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.edsStyle = id;
  document.head.appendChild(link);
  injected.add(id);
}

// EDS global cascade: styles.css (resets/typography/grid) + the generated DS
// token layer. Loaded via the /styles staticDir so @font-face url(/styles/fonts/...)
// resolves and the MIME type is correct (a ?inline import would be shadowed by
// the staticDir and served as text/css).
function ensureGlobalStyles() {
  ensureLink('eds-styles', '/styles/styles.css');
  ensureLink('ds-tokens', '/styles/ds-tokens.css');
}

// rows: Array<Array<string> | string> — each row is a list of cell innerHTML.
function buildBlockTable(name, rows, variants) {
  const block = document.createElement('div');
  block.className = [name, ...variants, 'block'].filter(Boolean).join(' ');
  block.dataset.blockName = name;
  block.dataset.blockStatus = 'loaded';

  rows.forEach((cells) => {
    const row = document.createElement('div');
    (Array.isArray(cells) ? cells : [cells]).forEach((html) => {
      const cell = document.createElement('div');
      cell.innerHTML = (html ?? '').trim();
      row.appendChild(cell);
    });
    block.appendChild(row);
  });
  return block;
}

/**
 * Mount an EDS block for a story.
 * @param {object}   opts
 * @param {string}   opts.name      block folder name (blocks/<name>/)
 * @param {Array}    opts.rows      authored table rows (array of cell HTML, or arrays of cells)
 * @param {string[]} [opts.variants] extra block classes (e.g. ['hash-aware'])
 * @param {boolean}  [opts.section=true] wrap in `main > .section`
 * @returns {HTMLElement} the wrapper (or the block itself when section=false)
 */
export function edsBlock({ name, rows = [], variants = [], section = true }) {
  ensureGlobalStyles();
  injectStyle(`block-${name}`, blockCss[`../../blocks/${name}/${name}.css`]);

  const block = buildBlockTable(name, rows, variants);

  let root = block;
  if (section) {
    const main = document.createElement('main');
    const sec = document.createElement('div');
    sec.className = 'section';
    sec.dataset.sectionStatus = 'loaded';
    sec.appendChild(block);
    main.appendChild(sec);
    root = main;
  }

  // Decorate in place (default export `init(el)`). Most blocks are synchronous;
  // for async/Lit blocks this resolves after first paint, which is fine for review.
  const loader = blockJs[`../../blocks/${name}/${name}.js`];
  if (loader) {
    loader().then((mod) => {
      const init = mod.default;
      if (typeof init === 'function') init(block);
    });
  } else {
    // Surface a missing block clearly rather than rendering a bare table.
    block.insertAdjacentHTML('afterbegin', `<!-- eds-harness: no blocks/${name}/${name}.js found -->`);
  }
  return root;
}

/**
 * Load the EDS global styles + a block's CSS into the preview, without building a
 * block table. For blocks whose init() can't run in the table harness (e.g. the
 * header loads a nav fragment) — a story can call this, then mount the block's
 * shared renderer directly to compare against the reference under the sliced CSS.
 */
export function loadBlockStyles(name) {
  ensureGlobalStyles();
  injectStyle(`block-${name}`, blockCss[`../../blocks/${name}/${name}.css`]);
}

/** Convenience: an EDS `<picture>` referencing a statically-served image. */
export function picture(src, { alt = '', width, height } = {}) {
  const dims = [width && `width="${width}"`, height && `height="${height}"`].filter(Boolean).join(' ');
  return `<picture><img src="${src}" alt="${alt}" ${dims} loading="eager"></picture>`;
}
