import { renderNotification } from './notification-dom.js';

// Status variant comes from the block class (default informational).
const VARIANTS = ['alert', 'error', 'success'];

// Icons ship with the block. `new URL(..., import.meta.url)` resolves correctly in
// both Vite (Storybook emits the asset) and EDS (runtime → /blocks/notification/icons/).
const ICON = {
  informational: new URL('./icons/info-circle-solid.svg', import.meta.url).href,
  alert: new URL('./icons/alertsolid.svg', import.meta.url).href,
  error: new URL('./icons/errorcirclesolid.svg', import.meta.url).href,
  success: new URL('./icons/checkmarkcirclesolid.svg', import.meta.url).href,
  close: new URL('./icons/close.svg', import.meta.url).href,
};

// Authored shape: status + dismissible from the block class; a rich content row
// whose heading (or <strong>) is the heading and whose paragraphs are the body.
export default function init(el) {
  const variant = VARIANTS.find((v) => el.classList.contains(v)) || 'informational';
  const dismissible = el.classList.contains('dismissible');

  const row = [...el.querySelectorAll(':scope > div')].find((r) => r.textContent.trim());
  let heading = '';
  let body = '';
  if (row) {
    const con = row.querySelector(':scope > div') || row;
    const headingEl = con.querySelector('h1, h2, h3, h4, h5, h6') || con.querySelector('strong');
    if (headingEl) {
      heading = headingEl.textContent.trim();
      (headingEl.tagName === 'STRONG' ? (headingEl.closest('p') || headingEl) : headingEl).remove();
    }
    body = con.innerHTML.trim();
  }

  el.replaceChildren(renderNotification({
    variant,
    heading,
    body,
    dismissible,
    iconSrc: ICON[variant],
    closeIconSrc: ICON.close,
  }));
}
