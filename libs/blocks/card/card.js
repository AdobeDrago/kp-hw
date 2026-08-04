import { renderCard } from './card-dom.js';

// Variant comes from the block class (e.g. "Card (large)" → .card.large).
const VARIANTS = ['large', 'thumbnail', 'video'];

// Authored shape (backward-compatible with the existing card model):
//   - an image row (a <picture>/<img>) — optional (basic cards have none)
//   - a rich content row: a heading (or <strong>) = title, paragraphs = summary,
//     trailing link = CTA. A CTA wrapped in <strong> renders as the primary button
//     (EDS convention); a plain link renders as the secondary "action" link.
// init() parses that into the shared renderer, which emits the vessel .ds-card DOM.
export default function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const variant = VARIANTS.find((v) => el.classList.contains(v)) || 'basic';

  const media = el.querySelector(':scope > div picture, :scope > div img');
  const mediaRow = media ? rows.find((r) => r.contains(media)) : null;
  const contentRow = rows.find((r) => r !== mediaRow && r.textContent.trim());

  let title = '';
  let summary = '';
  let ctaLabel = '';
  let ctaHref = '';
  let ctaVariant = 'action';

  if (contentRow) {
    const con = contentRow.querySelector(':scope > div') || contentRow;

    // CTA = last link, pulled out of the body. <strong>-wrapped → primary.
    const links = [...con.querySelectorAll('a')];
    const ctaEl = links[links.length - 1];
    if (ctaEl) {
      ctaLabel = ctaEl.textContent.trim();
      ctaHref = ctaEl.getAttribute('href') || '#';
      if (ctaEl.closest('strong')) ctaVariant = 'primary';
      (ctaEl.closest('p') || ctaEl).remove();
    }

    // Title = first heading, else the first remaining <strong>.
    const headingEl = con.querySelector('h1, h2, h3, h4, h5, h6') || con.querySelector('strong');
    if (headingEl) {
      title = headingEl.textContent.trim();
      (headingEl.tagName === 'STRONG' ? (headingEl.closest('p') || headingEl) : headingEl).remove();
    }

    summary = con.innerHTML.trim();
  }

  if (el.classList.contains('hash-aware') && ctaHref) {
    ctaHref = `${ctaHref}${window.location.hash}`;
  }

  el.replaceChildren(renderCard({
    variant, media, title, summary, ctaLabel, ctaHref, ctaVariant,
  }));
}
