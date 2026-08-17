import { renderBreadcrumbs } from './breadcrumbs-dom.js';

// Authored shape: a list of links (a <ul> of <li><a>…</a></li>, or just anchors).
// The final item — typically plain text (the current page) or simply the last link —
// renders as the non-linked current crumb. init() parses that into the shared renderer,
// which emits the vessel .ds-breadcrumbs DOM.
export default function init(el) {
  const lis = [...el.querySelectorAll('li')];
  const anchors = [...el.querySelectorAll('a')];

  let items = [];
  if (lis.length) {
    items = lis.map((li) => {
      const a = li.querySelector('a');
      return a
        ? { label: a.textContent.trim(), href: a.getAttribute('href') }
        : { label: li.textContent.trim() };
    });
  } else if (anchors.length) {
    items = anchors.map((a) => ({ label: a.textContent.trim(), href: a.getAttribute('href') }));
  }

  items = items.filter((it) => it.label);
  if (!items.length) return;
  el.replaceChildren(renderBreadcrumbs(items));
}
