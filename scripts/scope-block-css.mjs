#!/usr/bin/env node
/**
 * Scope a vendored stylesheet under a block root so it stops colliding with — and
 * bleeding into — the EDS global styles. Every rule's selectors are prefixed with
 * the root (e.g. `.button` → `.header .button`), which both isolates the CSS to the
 * block and raises its specificity above EDS's global `a` / `.button` / `a:any-link`
 * rules. Reuses the brace-aware parser approach from slice-block-css.mjs.
 *
 * Kept un-prefixed: `:root` / `html` / `body` (preserve resets + custom properties),
 * `@font-face` / `@keyframes` (global by nature), `@charset` / `@import`.
 * `@media` / `@supports` bodies recurse.
 *
 * Usage: node scripts/scope-block-css.mjs --src <in.css> --root .header --out <out.css>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const arg = (name, fb) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fb;
};
const SRC = arg('src');
const ROOT = arg('root');
const OUT = arg('out');
if (!SRC || !ROOT || !OUT) {
  process.stderr.write('Usage: --src <in.css> --root .selector --out <out.css>\n');
  process.exit(1);
}

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

// Selectors left global so resets / custom properties keep working.
const KEEP = /^(:root|html|body)\b/;
function scopeSelector(sel) {
  return splitSelectorList(sel)
    .map((part) => (KEEP.test(part) ? part : `${ROOT} ${part}`))
    .join(',\n');
}

function transform(nodes, indent) {
  const lines = [];
  for (const node of nodes) {
    if (node.type === 'rule') {
      const decls = node.body
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => `${indent}  ${d};`)
        .join('\n');
      lines.push(`${indent}${scopeSelector(node.selector)} {\n${decls}\n${indent}}`);
    } else if (node.type === 'group') {
      lines.push(`${indent}${node.prelude} {\n${transform(node.children, `${indent}  `)}\n${indent}}`);
    } else if (node.type === 'verbatim') {
      lines.push(`${indent}${node.prelude} {${node.body}}`);
    } else if (node.type === 'at') {
      lines.push(`${indent}${node.text}`);
    }
  }
  return lines.join('\n');
}

const css = readFileSync(resolve(SRC), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const header = `/* stylelint-disable */\n/* Scoped under ${ROOT} by scripts/scope-block-css.mjs from ${relative(process.cwd(), resolve(SRC))} */\n`;
writeFileSync(resolve(OUT), `${header}${transform(parse(css), '')}\n`);
// eslint-disable-next-line no-console -- CLI build script
console.log(`Wrote ${relative(process.cwd(), resolve(OUT))} (scoped under ${ROOT}).`);
