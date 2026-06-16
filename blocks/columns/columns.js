function decorateCover(col) {
  const children = [...col.children];
  if (children.length === 1 && children[0].nodeName === 'PICTURE') {
    col.classList.add('cover-image');
    col.parentElement.classList.add('cover-row');
  } else {
    col.classList.add('cover-content');
  }
}

function decorateCols(el, cols) {
  const hasCover = el.classList.contains('image-cover');
  for (const [idx, col] of cols.entries()) {
    col.classList.add('col', `col-${idx + 1}`);
    if (hasCover) decorateCover(col);
  }
}

function decorateRows(el, rows) {
  for (const [idx, row] of rows.entries()) {
    row.classList.add('row', `row-${idx + 1}`);
    const cols = [...row.children];
    row.style = `--child-count: ${cols.length}`;
    decorateCols(el, cols);
  }
}

// "topics" variant: the column of links renders as pill buttons with a
// collapsible "Show more (N)" toggle (matches the live KP browse-topics block).
const TOPICS_VISIBLE = 10;

function decorateTopics(el) {
  // The links live in a paragraph; pick the one with the most anchors.
  const paras = [...el.querySelectorAll('p')];
  const linkPara = paras
    .map((p) => ({ p, n: p.querySelectorAll('a').length }))
    .sort((a, b) => b.n - a.n)[0];
  if (!linkPara || linkPara.n === 0) return;

  const para = linkPara.p;
  para.classList.add('topic-pills');
  const links = [...para.querySelectorAll('a')];
  const hidden = links.slice(TOPICS_VISIBLE);
  if (hidden.length === 0) return;

  hidden.forEach((a) => a.classList.add('topic-pill--hidden'));

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'topic-pills-toggle';
  const setLabel = (expanded) => {
    toggle.textContent = expanded ? 'Show less' : `Show more (${hidden.length})`;
    toggle.setAttribute('aria-expanded', String(expanded));
  };
  setLabel(false);
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    hidden.forEach((a) => a.classList.toggle('topic-pill--hidden', expanded));
    setLabel(!expanded);
  });
  para.after(toggle);
}

export default function init(el) {
  const rows = [...el.children];
  decorateRows(el, rows);
  if (el.classList.contains('topics')) decorateTopics(el);
}
