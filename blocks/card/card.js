export default function init(el) {
  const inner = el.querySelector(':scope > div');
  inner.classList.add('card-inner');
  const pic = el.querySelector('picture');
  if (pic) {
    const picPara = pic.closest('p');
    if (picPara) {
      const picDiv = document.createElement('div');
      picDiv.className = 'card-picture-container';
      picDiv.append(pic);
      inner.insertAdjacentElement('afterbegin', picDiv);
      picPara.remove();
    }
  }
  // Decorate content
  const con = inner.querySelector(':scope > div:not([class])');
  if (!con) return;
  con.classList.add('card-content-container');

  // Decorate CTA
  const ctaPara = inner.querySelector(':scope > div:last-of-type > p:last-of-type');
  if (!ctaPara) return;
  const cta = ctaPara.querySelector('a');
  if (!cta) return;
  const hashAware = el.classList.contains('hash-aware');
  if (hashAware) {
    cta.href = `${cta.getAttribute('href')}${window.location.hash}`;
  }
  ctaPara.classList.add('card-cta-container');
  inner.append(ctaPara);

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 16 16');
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('card-external-icon');
  icon.innerHTML = '<path d="M13 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1H3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9h-2zm-3-8v2h2.586L6.293 9.293l1.414 1.414L14 4.414V7h2V1h-6z"/>';
  cta.append(icon);
}
