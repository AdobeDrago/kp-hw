const CONTENT_DA_ORIGIN = 'https://content.da.live';
const STRUCTURAL_BLOCK_NAMES = new Set(['section-metadata', 'metadata']);

export function buildSourceUrl(path, org, repo) {
  return `${CONTENT_DA_ORIGIN}/${org}/${repo}${path}`;
}

function getRowsFromElement(el) {
  return [...el.children]
    .map((row) => {
      const cells = [...row.children];
      return { key: cells[0]?.textContent?.trim(), value: cells[1]?.textContent?.trim() };
    })
    .filter((row) => row.key);
}

function getMetadataRows(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const metadataBlock = doc.querySelector('.metadata');
  if (!metadataBlock) return [];
  return getRowsFromElement(metadataBlock);
}

const REQUIRED_METADATA_FIELDS = ['template', 'title', 'image'];

export function checkPageMetadata(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main');
  if (!main) return { present: false, isLast: false, missingFields: [...REQUIRED_METADATA_FIELDS] };

  const sections = [...main.children];
  const metadataIndex = sections.findIndex((section) => section.querySelector(':scope > .metadata'));
  const present = metadataIndex !== -1;
  const isLast = present && metadataIndex === sections.length - 1;
  const rows = present ? getRowsFromElement(sections[metadataIndex].querySelector(':scope > .metadata')) : [];
  const keys = rows.map((row) => row.key.toLowerCase());
  const missingFields = REQUIRED_METADATA_FIELDS.filter((field) => !keys.includes(field));

  return { present, isLast, missingFields };
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

// Longest-common-subsequence match: which reference-side items line up, in order,
// with an item on the current side. Unlike simple per-name counting, this correctly
// tells apart "the page is missing the Nth occurrence of block X" from "occurrence
// N+1 is missing" when a block name repeats — matching by position, not just count.
function lcsMatchMask(reference, current) {
  const n = reference.length;
  const m = current.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = reference[i] === current[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const matched = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (reference[i] === current[j]) {
      matched[i] = true;
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return matched;
}

export function computeSectionStatuses(referenceSections, currentSections) {
  const referenceNames = referenceSections.flatMap((section) => section.blocks);
  const currentNames = currentSections.flatMap((section) => section.blocks);
  const matched = lcsMatchMask(referenceNames, currentNames);

  let cursor = 0;
  return referenceSections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.blocks.length > 0)
    .map(({ section, index }) => {
      const blocks = section.blocks.map((name) => {
        const status = matched[cursor] ? 'present' : 'missing';
        cursor += 1;
        return { name, status };
      });
      return { style: section.style, referenceIndex: index, blocks };
    });
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
