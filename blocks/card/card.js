export default function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const inner = document.createElement('div');
  inner.classList.add('card-inner');

  // First row is the image
  const imgRow = rows[0];
  if (imgRow) {
    const pic = imgRow.querySelector('picture');
    if (pic) {
      const picDiv = document.createElement('div');
      picDiv.className = 'card-picture-container';
      picDiv.append(pic);
      inner.append(picDiv);
    }
    imgRow.remove();
  }

  // Second row is the content
  const contentRow = rows[1];
  if (contentRow) {
    const con = contentRow.querySelector(':scope > div') || contentRow;
    con.classList.add('card-content-container');
    inner.append(con);
    contentRow.remove();
  }

  // Decorate CTA
  const ctaPara = inner.querySelector('.card-content-container > p:last-of-type');
  if (ctaPara) {
    const cta = ctaPara.querySelector('a');
    if (cta) {
      const hashAware = el.classList.contains('hash-aware');
      if (hashAware) {
        cta.href = `${cta.getAttribute('href')}${window.location.hash}`;
      }
      ctaPara.classList.add('card-cta-container');
      inner.append(ctaPara);
    }
  }

  el.append(inner);
}
