import { createPicture } from '../../scripts/utils/picture.js';

export default function init(el) {
  const iconsRow = document.createElement('ul');
  iconsRow.className = 'cards-icon-icons-row';

  [...el.children].forEach((row) => {
    const li = document.createElement('li');
    [...row.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-icon-card-image';
      } else {
        div.className = 'cards-icon-card-body';
      }
      li.append(div);
    });
    iconsRow.append(li);
  });

  iconsRow.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createPicture({ src: img.src, alt: img.alt, eager: false, breakpoints: [{ width: '750' }] });
    img.closest('picture').replaceWith(optimizedPic);
  });

  el.textContent = '';
  if (iconsRow.hasChildNodes()) el.append(iconsRow);

  el.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('cards-icon-external-icon');
    icon.innerHTML = '<path d="M13 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1H3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9h-2zm-3-8v2h2.586L6.293 9.293l1.414 1.414L14 4.414V7h2V1h-6z"/>';
    a.append(icon);
  });
}
