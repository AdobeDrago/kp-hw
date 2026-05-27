import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const FOOTER_PATH = 'https://main--ak-kaiserpermanente--adobedrago.aem.page/fragments/nav/footer'; // All forked secondary sites load the shared footer from the template site

function buildExternalIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 16 16');
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('footer-external-icon');
  icon.innerHTML = '<path d="M13 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1H3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9h-2zm-3-8v2h2.586L6.293 9.293l1.414 1.414L14 4.414V7h2V1h-6z"/>';
  return icon;
}

function restructureNavSection(wrapper) {
  const children = [...wrapper.children];
  const columns = [];
  let currentCol = null;

  children.forEach((el) => {
    if (el.tagName === 'H4') {
      currentCol = document.createElement('div');
      currentCol.className = 'footer-nav-col';
      currentCol.append(el);
      columns.push(currentCol);
    } else if (currentCol) {
      currentCol.append(el);
    }
  });

  wrapper.textContent = '';
  columns.forEach((col) => wrapper.append(col));

  wrapper.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.append(buildExternalIcon());
  });
}

export default async function init(el) {
  const { locale } = getConfig();
  const footerMeta = getMetadata('footer');
  const path = footerMeta || FOOTER_PATH;

  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);

    const navWrapper = fragment.querySelector('.section:first-child .default-content');
    if (navWrapper) restructureNavSection(navWrapper);

    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
