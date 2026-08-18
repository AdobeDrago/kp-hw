// Structural tables/divs that carry configuration, not authorable blocks. Matches the
// convention used by template-governance-utils.js.
const STRUCTURAL_BLOCK_NAMES = new Set(['metadata', 'section-metadata']);

// EDS canonicalises a block's display name to a class the same way: lowercase, and
// collapse runs of whitespace to single hyphens. "Section Metadata" -> "section-metadata".
function canonicalKey(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function isStructural(name) {
  return STRUCTURAL_BLOCK_NAMES.has(canonicalKey(name));
}

/**
 * Split a block label into its name and variant list.
 * "Columns (dark, wide)" -> { name: 'Columns', variants: ['dark', 'wide'] }
 * "Cards"                 -> { name: 'Cards', variants: [] }
 */
export function parseBlockLabel(label) {
  const text = (label || '').trim();
  const open = text.indexOf('(');
  if (open === -1) return { name: text, variants: [] };

  const name = text.slice(0, open).trim();
  const close = text.indexOf(')', open);
  const inner = text.slice(open + 1, close === -1 ? text.length : close);
  const variants = inner.split(',').map((v) => v.trim()).filter(Boolean);
  return { name, variants };
}

// DA editor form: a block is a <table> whose first cell holds "Name (variant, ...)".
function blockFromTable(table) {
  const raw = table.querySelector('td, th')?.textContent?.trim();
  if (!raw) return null;
  const { name, variants } = parseBlockLabel(raw);
  if (!name || isStructural(name)) return null;
  return { name, variants, raw };
}

// Decorated/source fallback form: a block is a <div class="name variant ...">.
function blockFromDiv(div) {
  const raw = div.getAttribute('class')?.trim();
  if (!raw) return null;
  const [name, ...variants] = raw.split(/\s+/);
  if (!name || isStructural(name)) return null;
  return { name, variants, raw };
}

/**
 * Identify the block a DA selection payload falls in.
 *
 * Accepts whatever actions.getSelection() resolves to, treated as an HTML string.
 * Returns { name, variants, raw, count } for the first block found (count = how many
 * blocks were in the payload), or null when the selection isn't inside a block.
 *
 * Prefers the DA editor's table form; falls back to the decorated div form. The exact
 * getSelection() shape is unconfirmed, so callers should surface the raw payload when
 * this returns null (see the panel's no-block state).
 */
export function identifyBlock(payload) {
  if (typeof payload !== 'string' || !payload.trim()) return null;

  const doc = new DOMParser().parseFromString(payload, 'text/html');

  const tableBlocks = [...doc.querySelectorAll('table')].map(blockFromTable).filter(Boolean);
  if (tableBlocks.length) return { ...tableBlocks[0], count: tableBlocks.length };

  const divBlocks = [...doc.querySelectorAll('div[class]')].map(blockFromDiv).filter(Boolean);
  if (divBlocks.length) return { ...divBlocks[0], count: divBlocks.length };

  return null;
}
