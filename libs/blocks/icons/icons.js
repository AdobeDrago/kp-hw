import { createPicture } from '../../scripts/utils/picture.js';

export default function init(el) {
  const isList = el.classList.contains('list');
  const ul = document.createElement('ul');
  ul.className = 'icons-items';

  [...el.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'icons-item';

    const [imageCol, textCol] = [...row.children];

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icons-icon';

    const picture = imageCol.querySelector('picture');
    if (picture) iconWrapper.append(picture);

    const textWrapper = document.createElement('div');
    textWrapper.className = 'icons-text';

    if (isList) {
      const heading = textCol.querySelector('h1,h2,h3,h4,h5,h6,strong');
      if (heading) {
        const titleEl = document.createElement('p');
        titleEl.className = 'icons-title';
        titleEl.textContent = heading.textContent;
        const headingParent = heading.closest('p') || heading;
        headingParent.remove();
        textWrapper.append(titleEl);
      }
    }

    [...textCol.childNodes].forEach((node) => textWrapper.append(node.cloneNode(true)));

    li.append(iconWrapper, textWrapper);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createPicture({ src: img.src, alt: img.alt, eager: false, breakpoints: [{ width: '150' }] });
    img.closest('picture').replaceWith(optimizedPic);
  });

  el.textContent = '';
  el.append(ul);
}
