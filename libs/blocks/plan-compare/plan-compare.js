export default function init(el) {
  const rows = [...el.children];
  if (rows.length < 2) return;

  const headerRow = rows[0];
  const cardRows = rows.slice(1);
  const colCount = headerRow.children.length;

  const columns = Array.from({ length: colCount }, (_, i) => {
    const col = document.createElement('div');
    col.className = 'plan-compare-col';

    const heading = document.createElement('h3');
    heading.className = 'plan-compare-col-heading';
    heading.textContent = headerRow.children[i]?.textContent.trim() ?? '';
    col.append(heading);

    return col;
  });

  cardRows.forEach((row) => {
    [...row.children].forEach((cell, i) => {
      if (!columns[i]) return;
      const card = document.createElement('div');
      card.className = 'plan-compare-card';
      card.append(...cell.childNodes);
      columns[i].append(card);
    });
  });

  el.replaceChildren(...columns);
}
