// Renders the vessel `.ds-breadcrumbs` DOM (foundation-v4) from a list of crumbs.
// Shared by the EDS block (blocks/breadcrumbs) and mirrored by the vessel reference
// story (tools/storybook/stories/breadcrumbs). The final crumb is the current page
// (not a link). Chevrons ship with the block and resolve in both Vite and EDS runtime.

const chevron = (dir) => new URL(`./icons/chevron-${dir}-small.svg`, import.meta.url).href;

const fwd = () => `<img aria-hidden="true" class="ds-breadcrumbs__chevron-forward" src="${chevron('right')}" alt="" height="16" width="16">`;
const back = () => `<img aria-hidden="true" class="mobile-only ds-breadcrumbs__chevron-back" src="${chevron('left')}" alt="" height="16" width="16">`;

/** @param {Array<{label:string, href?:string}>} items */
export function renderBreadcrumbs(items = []) {
  const lis = items
    .map((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast) {
        return `<li><div>${back()}${item.label}</div></li>`;
      }
      return `<li>
        <a href="${item.href || '#'}">
          ${i > 0 ? back() : ''}
          <span class="ds-breadcrumbs__text">${item.label}</span>${fwd()}
        </a>
      </li>`;
    })
    .join('');

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.className = 'ds-breadcrumbs';
  nav.setAttribute('data-ds-theme', 'vessel');
  nav.setAttribute('data-ds-variant', 'basic');
  nav.setAttribute('data-ds-version', '4');
  nav.innerHTML = `<ul class="ds-breadcrumbs__list">${lis}</ul>`;
  return nav;
}
