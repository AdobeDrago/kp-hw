function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

export default async function init(el) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const allRows = [...el.children];
  const firstRowCols = [...allRows[0].children];
  const hasSingleContentRow = allRows.length > 1
    && firstRowCols[0].textContent.trim() !== ''
    && firstRowCols.slice(1).every((col) => col.textContent.trim() === '');

  const isCaption = el.classList.contains('caption');
  const hasCaption = isCaption && hasSingleContentRow;
  const hasTitle = !isCaption && hasSingleContentRow;
  const rows = (hasCaption || hasTitle) ? allRows.slice(1) : allRows;

  const header = !el.classList.contains('no-header');
  if (header) table.append(thead);
  table.append(tbody);

  if (hasCaption) {
    const numCols = [...allRows[1].children].length;
    const captionRow = document.createElement('tr');
    const captionCell = document.createElement('th');
    captionCell.setAttribute('colspan', numCols);
    captionCell.innerHTML = firstRowCols[0].innerHTML;
    captionRow.append(captionCell);
    thead.append(captionRow);
  }

  rows.forEach((child, i) => {
    const row = document.createElement('tr');
    if (header && i === 0) thead.append(row);
    else tbody.append(row);
    [...child.children].forEach((col) => {
      const cell = buildCell(header ? i : i + 1);
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });

  el.innerHTML = '';

  if (hasTitle) {
    const titleEl = document.createElement('div');
    titleEl.className = 'table-title';
    titleEl.innerHTML = allRows[0].children[0].innerHTML;
    el.append(titleEl);
  }

  el.append(table);
}
