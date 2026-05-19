/*
 * UE Prepare — runs BEFORE ak.js loadPage()
 * Pre-process UE DOM before ak.js runs.
 */

// Remove class from metadata divs
document.querySelectorAll('div.metadata').forEach((el) => {
  el.removeAttribute('class');
});

// Remove header and footer before ak.js tries to load them as blocks
document.querySelectorAll('header, footer').forEach((el) => el.remove());

// Strip richtext class from all elements so ak.js doesn't treat them as blocks
document.querySelectorAll('.richtext').forEach((el) => {
  el.classList.remove('richtext');
  if (!el.classList.length) el.removeAttribute('class');
});

// Prevent auto-linked blocks from replacing themselves in UE
// Move href to data-ue-href so ak.js doesn't match the pattern
const autoLinkPatterns = ['/fragments/', '/schedules/', 'youtube.com', 'youtu.be'];
document.querySelectorAll('a[href]').forEach((a) => {
  const href = a.getAttribute('href');
  if (autoLinkPatterns.some((p) => href.includes(p))) {
    a.setAttribute('data-ue-href', href);
    a.setAttribute('href', '#');
  }
});

// Ensure every picture has a source element — ak.js decoratePictures crashes without one
document.querySelectorAll('picture').forEach((pic) => {
  if (!pic.querySelector('source')) {
    const img = pic.querySelector('img');
    if (img) {
      const source = document.createElement('source');
      source.setAttribute('srcset', img.src);
      pic.prepend(source);
    }
  }
});
