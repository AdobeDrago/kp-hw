const CONTENT_DA_ORIGIN = 'https://content.da.live';
const STRUCTURAL_BLOCK_NAMES = new Set(['section-metadata', 'metadata']);

export function buildSourceUrl(path, org, repo) {
  return `${CONTENT_DA_ORIGIN}/${org}/${repo}${path}`;
}

function getMetadataRows(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const metadataBlock = doc.querySelector('.metadata');
  if (!metadataBlock) return [];
  return [...metadataBlock.children]
    .map((row) => {
      const cells = [...row.children];
      return { key: cells[0]?.textContent?.trim(), value: cells[1]?.textContent?.trim() };
    })
    .filter((row) => row.key);
}

export function resolveTemplateFromHtml(html) {
  const templateRow = getMetadataRows(html).find((row) => row.key.toLowerCase() === 'template');
  return templateRow?.value || null;
}

export function extractMetadataFields(html) {
  const names = [];
  getMetadataRows(html).forEach((row) => {
    if (!names.includes(row.key)) names.push(row.key);
  });
  return names;
}

export function parseContentDaUrl(url) {
  if (!url.startsWith(`${CONTENT_DA_ORIGIN}/`)) return null;
  const [org, repo, ...pathParts] = url.slice(CONTENT_DA_ORIGIN.length + 1).split('/');
  if (!org || !repo || !pathParts.length) return null;
  return { org, repo, path: `/${pathParts.join('/')}` };
}

export function findTemplateEntry(entries, templateName) {
  const target = templateName.trim().toLowerCase();
  return entries.find((entry) => entry.key?.trim().toLowerCase() === target) || null;
}

export function extractSections(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return [];
  return [...main.children].map((section) => {
    let style = null;
    const blocks = [];
    const defaultContent = [];
    [...section.children].forEach((child) => {
      const [name] = child.classList;
      if (!name) {
        const tag = child.tagName.toLowerCase();
        if (!defaultContent.includes(tag)) defaultContent.push(tag);
        return;
      }
      if (name === 'section-metadata') {
        const rows = [...child.querySelectorAll(':scope > div')];
        const styleRow = rows.find(
          (row) => row.children[0]?.textContent?.trim().toLowerCase() === 'style',
        );
        if (styleRow) style = styleRow.children[1]?.textContent?.trim() || style;
        return;
      }
      if (STRUCTURAL_BLOCK_NAMES.has(name)) return;
      blocks.push(name);
    });
    return { style, blocks, defaultContent };
  });
}

export function countBlockOccurrences(sections) {
  const counts = {};
  sections.forEach((section) => {
    section.blocks.forEach((name) => {
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return counts;
}

export function computeSectionStatuses(referenceSections, currentCounts, currentSections = []) {
  const remaining = { ...currentCounts };
  return referenceSections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.blocks.length > 0)
    .map(({ section, index }) => ({
      style: section.style,
      defaultContent: currentSections[index]?.defaultContent || [],
      blocks: section.blocks.map((name) => {
        const available = remaining[name] || 0;
        if (available > 0) {
          remaining[name] = available - 1;
          return { name, status: 'present' };
        }
        return { name, status: 'missing' };
      }),
    }));
}

export function computeAddedBlocks(currentCounts, referenceCounts) {
  return Object.keys(currentCounts).filter((name) => !(name in referenceCounts));
}

export function findReferenceBlockHtml(referenceHtml, blockName) {
  const doc = new DOMParser().parseFromString(referenceHtml, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return null;
  const allBlocks = [...main.children].flatMap((section) => [...section.children]);
  const match = allBlocks.find((child) => child.classList[0] === blockName);
  return match ? match.outerHTML : null;
}

export function diffSets(currentSet, referenceSet) {
  const missing = referenceSet.filter((name) => !currentSet.includes(name));
  const added = currentSet.filter((name) => !referenceSet.includes(name));
  return { missing, added };
}

export function buildBlockTableHtml(blockOuterHtml) {
  const doc = new DOMParser().parseFromString(blockOuterHtml, 'text/html');
  const blockDiv = doc.body.firstElementChild;
  if (!blockDiv) return null;

  const [name, ...variants] = [...blockDiv.classList];
  const nameText = variants.length ? `${name} (${variants.join(', ')})` : name;

  const rows = [...blockDiv.children].filter((el) => el.tagName === 'DIV');
  const rowCells = rows.map(
    (row) => [...row.children].filter((el) => el.tagName === 'DIV'),
  );
  const maxCols = Math.max(1, ...rowCells.map((cells) => cells.length || 1));

  const bodyRowsHtml = rows.map((row, i) => {
    const cells = rowCells[i];
    if (!cells.length) return `<tr><td>${row.innerHTML}</td></tr>`;
    return `<tr>${cells.map((cell) => `<td>${cell.innerHTML}</td>`).join('')}</tr>`;
  }).join('');

  return `<table><tr><td colspan="${maxCols}">${nameText}</td></tr>${bodyRowsHtml}</table>`;
}
