#!/usr/bin/env node
/**
 * Slice a single component's rules out of a vessel pattern `foundation.css`,
 * strip the design-system scoping wrapper, optionally rescope onto an EDS block
 * root, and swap baked color literals for `--ds-*` tokens.
 *
 * The vessel foundation scopes component rules two ways depending on the file:
 *   - pattern foundation: attribute selectors ON the component element, e.g.
 *       .ds-card[data-ds-theme=vessel i][data-ds-variant=basic i]
 *               [data-ds-version="3" i]:not(.ds-card--unstyled) .ds-card__title
 *   - style-guide foundation: an ancestor wrapper, e.g.
 *       :where(.ds-foundation[data-ds-theme=vessel i]...) .ds-card__title
 *
 * Stripping removes the theme wrapper (data-ds-theme / data-ds-version, the
 * :not(--unstyled) guard, the .ds-foundation ancestor) but KEEPS data-ds-variant
 * by default, because that attribute is what distinguishes variant rules (basic
 * vs large vs video) and the block renderer emits it. Selectors collapse to
 * EDS-ready form (`.ds-card[data-ds-variant=large i] .ds-card__title`),
 * optionally prefixed with a block root (`.card ...`).
 *
 * Usage:
 *   node scripts/slice-block-css.mjs --src stories/card/foundation.css \
 *     --match .ds-card --root .card --out blocks/card/card.vessel.css
 *
 * Flags:
 *   --src <file>       pattern foundation.css to slice (required)
 *   --match <sel>      component class root(s), comma-separated (e.g. .ds-card) (required)
 *   --root <sel>       block root to prefix onto each selector (optional; e.g. .card)
 *   --keep-attr <a,b>  data-ds-* attributes to preserve (default: data-ds-variant)
 *   --out <file>       output file (default: stdout)
 *   --tokens <file>    ds-tokens.css for literal->var swap (default: styles/ds-tokens.css)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';

// ---- args ---------------------------------------------------------------
function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}
const SRC = arg('src');
const MATCH = (arg('match') || '').split(',').map((s) => s.trim()).filter(Boolean);
const ROOT = arg('root', '');
const OUT = arg('out', '');
const TOKENS = arg('tokens', 'styles/ds-tokens.css');
const KEEP_ATTRS = arg('keep-attr', 'data-ds-variant').split(',').map((s) => s.trim()).filter(Boolean);
if (!SRC || !MATCH.length) {
  process.stderr.write('Usage: --src <foundation.css> --match <.selector> [--root .block] [--out file]\n');
  process.exit(1);
}

// ---- tiny CSS parser (brace-aware, string-safe) -------------------------
function skipString(css, start) {
  const quote = css[start];
  let pos = start + 1;
  while (pos < css.length && css[pos] !== quote) {
    if (css[pos] === '\\') pos += 1;
    pos += 1;
  }
  return pos + 1;
}

function readBlock(css, open) {
  // css[open] === '{' — return { body (inner), end (index after matching '}') }
  let depth = 0;
  let pos = open;
  while (pos < css.length) {
    const c = css[pos];
    if (c === '"' || c === "'") {
      pos = skipString(css, pos);
    } else if (c === '{') {
      depth += 1;
      pos += 1;
    } else if (c === '}') {
      depth -= 1;
      if (depth === 0) return { body: css.slice(open + 1, pos), end: pos + 1 };
      pos += 1;
    } else {
      pos += 1;
    }
  }
  return { body: css.slice(open + 1), end: css.length };
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readSelectorEnd(css, start) {
  let pos = start;
  while (pos < css.length && css[pos] !== '{') {
    if (css[pos] === '"' || css[pos] === "'") pos = skipString(css, pos);
    else pos += 1;
  }
  return pos;
}

function parse(css) {
  const nodes = [];
  let pos = 0;
  while (pos < css.length) {
    while (pos < css.length && /\s/.test(css[pos])) pos += 1;
    if (pos >= css.length) break;
    if (css[pos] === '@') {
      let end = pos;
      while (end < css.length && css[end] !== '{' && css[end] !== ';') end += 1;
      if (css[end] === ';') {
        nodes.push({ type: 'at', text: css.slice(pos, end + 1) });
        pos = end + 1;
      } else {
        const prelude = css.slice(pos, end).trim();
        const block = readBlock(css, end);
        const name = prelude.split(/\s+/)[0].toLowerCase();
        if (/^@(media|supports|layer|container|scope)$/.test(name)) {
          nodes.push({ type: 'group', prelude, children: parse(block.body) });
        } else {
          nodes.push({ type: 'verbatim', prelude, body: block.body });
        }
        pos = block.end;
      }
    } else {
      const selEnd = readSelectorEnd(css, pos);
      const selector = css.slice(pos, selEnd).trim();
      const block = readBlock(css, selEnd);
      nodes.push({ type: 'rule', selector, body: block.body.trim() });
      pos = block.end;
    }
  }
  return nodes;
}

// Split a selector list on top-level commas (ignoring () and []).
function splitSelectorList(sel) {
  const parts = [];
  let paren = 0;
  let bracket = 0;
  let buf = '';
  for (const c of sel) {
    if (c === '(') paren += 1;
    else if (c === ')') paren -= 1;
    else if (c === '[') bracket += 1;
    else if (c === ']') bracket -= 1;
    if (c === ',' && paren === 0 && bracket === 0) {
      parts.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

// ---- token map (color literal -> var) -----------------------------------
function loadTokenMap(file) {
  const map = new Map();
  if (!existsSync(file)) return map;
  const css = readFileSync(file, 'utf8');
  for (const [, name, value] of css.matchAll(/--(ds-color-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const v = value.trim().toLowerCase();
    if (/^#[0-9a-f]{3,8}$/.test(v) && !map.has(v)) map.set(v, name); // first (alphabetical) wins
  }
  return map;
}
const tokenMap = loadTokenMap(resolve(TOKENS));
function swapTokens(decls) {
  return decls.replace(/#[0-9a-fA-F]{3,8}\b/g, (hex) => {
    const name = tokenMap.get(hex.toLowerCase());
    return name ? `var(--${name})` : hex;
  });
}

// ---- selector matching + rewriting --------------------------------------
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// Match the block class and its BEM children (__el, --mod), not sibling blocks
// like `.ds-card-group`.
const matchRes = MATCH.map((m) => new RegExp(`${esc(m)}(?:__|--|[\\s:.,[>+~)]|$)`));
const matchesComponent = (part) => matchRes.some((re) => re.test(part));

const keepAttr = (attr) => KEEP_ATTRS.includes(`data-ds-${attr}`);

function rewrite(part) {
  let p = part;
  p = p.replace(/:where\(\.ds-foundation[^)]*\)\s*/g, ''); // style-guide ancestor wrapper
  p = p.replace(/\[data-ds-([a-z-]+)[^\]]*\]/g, (m, attr) => (keepAttr(attr) ? m : '')); // theme attrs
  p = p.replace(/:not\([^)]*--unstyled[^)]*\)/g, ''); // :not(.x--unstyled)
  p = p.replace(/\s+/g, ' ').trim();
  return ROOT ? `${ROOT} ${p}` : p;
}

// ---- slice ---------------------------------------------------------------
function sliceNodes(nodes) {
  const out = [];
  for (const node of nodes) {
    if (node.type === 'rule') {
      const parts = splitSelectorList(node.selector)
        .filter(matchesComponent)
        .map(rewrite)
        .filter(Boolean);
      if (parts.length) out.push({ type: 'rule', selector: parts, body: swapTokens(node.body) });
    } else if (node.type === 'group') {
      const children = sliceNodes(node.children);
      if (children.length) out.push({ type: 'group', prelude: node.prelude, children });
    }
    // 'verbatim' (@font-face/@keyframes) and 'at' (@charset/@import) are shared
    // primitives / globals — intentionally dropped from a component slice.
  }
  return out;
}

function stringify(nodes, indent) {
  const lines = [];
  for (const node of nodes) {
    if (node.type === 'rule') {
      const sel = node.selector.join(`,\n${indent}`);
      const decls = node.body
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => `${indent}  ${d};`)
        .join('\n');
      lines.push(`${indent}${sel} {\n${decls}\n${indent}}`);
    } else if (node.type === 'group') {
      lines.push(`${indent}${node.prelude} {\n${stringify(node.children, `${indent}  `)}\n${indent}}`);
    }
  }
  return lines.join('\n\n');
}

function countRules(nodes) {
  return nodes.reduce((n, x) => n + (x.type === 'rule' ? 1 : countRules(x.children || [])), 0);
}

// Extract the foundation's base typography from `body {}` and emit it scoped to
// the block root, so the component inherits the same base color/font it assumes
// in the design system — without adopting a site-wide wrapper. (--no-base to skip.)
const BASE_PROPS = ['color', 'font-family', 'font-size', 'line-height'];
function baseRule(nodes) {
  if (process.argv.includes('--no-base')) return null;
  const decls = {};
  for (const node of nodes) {
    if (node.type === 'rule' && splitSelectorList(node.selector).includes('body')) {
      for (const prop of BASE_PROPS) {
        const m = node.body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i'));
        if (m) decls[prop] = m[1].trim();
      }
    }
  }
  const scope = ROOT || MATCH[0];
  const body = BASE_PROPS.filter((p) => decls[p]).map((p) => `  ${p}: ${swapTokens(decls[p])};`).join('\n');
  return body ? `${scope} {\n${body}\n}` : null;
}

// ---- run -----------------------------------------------------------------
const css = stripComments(readFileSync(resolve(SRC), 'utf8'));
const parsed = parse(css);
const base = baseRule(parsed);
const sliced = sliceNodes(parsed);

const keepNote = KEEP_ATTRS.length ? ` (kept: ${KEEP_ATTRS.join(', ')})` : '';
const header = [
  '/* stylelint-disable */', // generated from vendored DS CSS (BEM names, DS attrs) — not hand-authored
  '/*',
  ` * Sliced from ${relative(process.cwd(), resolve(SRC))} by scripts/slice-block-css.mjs`,
  ` * match: ${MATCH.join(', ')}${ROOT ? `  root: ${ROOT}` : ''}`,
  ` * Theme wrapper stripped (data-ds-theme/version, :not(--unstyled), .ds-foundation)${keepNote}.`,
  ' * Color literals mapped to --ds-* tokens where available.',
  ' * Not included: @font-face/@keyframes and shared primitives.',
  ' */',
  '',
].join('\n');

const baseBlock = base ? `${base}\n\n` : '';
const output = `${header}${baseBlock}${stringify(sliced, '')}\n`;

if (OUT) {
  writeFileSync(resolve(OUT), output);
  // eslint-disable-next-line no-console -- CLI build script; report what it wrote.
  console.log(`Wrote ${relative(process.cwd(), resolve(OUT))} — ${countRules(sliced)} rules.`);
} else {
  process.stdout.write(output);
}
