/*
 * Health Encyclopedia article — section navigation ("Topic Contents").
 *
 * The edge function server-renders EVERY Healthwise section into the page. The
 * production KP page shows one section at a time with a "Topic Contents" nav
 * (right column), driven by the URL hash (e.g. #acn8821-HealthTools). This
 * module recreates that: nav (right) + content (left), showing only the section
 * matching the hash (defaulting to the first). The H1 article title stays put;
 * only the H2 section title changes.
 *
 * A prev/next pager is shown at the bottom of each section (first section: next
 * only; last: prev only). The Credits block is pinned as a persistent footer
 * beneath everything, so it shows on every section (matching production).
 *
 * Each section <div> carries the Healthwise section id (e.g. id="acn8774" — the
 * "sec-" prefix is stripped server-side), so the hash maps 1:1 to a section.
 * Runs after decoration. Degrades gracefully: with no JS, every section shows.
 */

export default function init() {
  const main = document.querySelector('.health-encyclopedia-article-template main');
  if (!main) return;

  const allSections = [...main.querySelectorAll('.HwNavigationSection[id]')]
    .filter((s) => s.querySelector('h2'));
  if (allSections.length < 2) return;

  const sectionTitle = (s) => s.querySelector('h2').textContent.trim();

  // Credits is shown persistently on every section (not part of the rotation).
  const credits = allSections.find(
    (s) => /HwCreditsSection|HwSectionCredits/.test(s.className) || /-Credits$/i.test(s.id),
  );
  const sections = allSections.filter((s) => s !== credits); // rotating sections

  // --- Two-column layout: content (left) + Topic Contents (right) ---------
  const layout = document.createElement('div');
  layout.className = 'he-layout';

  const nav = document.createElement('nav');
  nav.className = 'he-toc';
  nav.setAttribute('aria-label', 'Topic Contents');
  nav.innerHTML = `<p class="he-toc-title">Topic Contents</p><ul>${
    allSections.map((s) => `<li><a href="#${s.id}">${sectionTitle(s)}</a></li>`).join('')
  }</ul>`;

  const content = document.createElement('div');
  content.className = 'he-content';

  // Prev/next pager, shown at the bottom of the active section.
  const pager = document.createElement('nav');
  pager.className = 'he-pager';
  pager.setAttribute('aria-label', 'Section navigation');
  const prevSlot = document.createElement('span');
  prevSlot.className = 'he-pager-prev';
  const nextSlot = document.createElement('span');
  nextSlot.className = 'he-pager-next';
  pager.append(prevSlot, nextSlot);

  // The H1 title shares the left column with the section content.
  const titleSection = [...main.children].find(
    (c) => c.querySelector?.('h1') && !c.classList.contains('HwNavigationSection'),
  );
  (titleSection || allSections[0]).before(layout);
  layout.append(content, nav); // content first = left; nav second = right
  if (titleSection) content.append(titleSection);
  sections.forEach((s) => content.append(s));
  content.append(pager);
  if (credits) {
    credits.classList.add('he-persistent'); // always visible; excluded from hide rule
    content.append(credits);
  }

  main.classList.add('he-sectioned');

  // --- Prev/next pager ----------------------------------------------------
  function renderPager(idx) {
    const prev = sections[idx - 1];
    const next = sections[idx + 1];
    prevSlot.innerHTML = prev ? `<a href="#${prev.id}">« ${sectionTitle(prev)}</a>` : '';
    nextSlot.innerHTML = next ? `<a href="#${next.id}">${sectionTitle(next)} »</a>` : '';
  }

  // --- Show one rotating section; Credits stays visible -------------------
  function activate(rawHash) {
    const id = decodeURIComponent(rawHash || '');
    if (credits && id === credits.id) return; // persistent footer — don't switch
    const target = sections.find((s) => s.id === id) || sections[0];
    sections.forEach((s) => s.classList.toggle('is-active', s === target));
    nav.querySelectorAll('a').forEach((a) => {
      a.classList.toggle('is-current', a.getAttribute('href') === `#${target.id}`);
    });
    renderPager(sections.indexOf(target));
  }

  activate(window.location.hash.slice(1));

  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    activate(window.location.hash.slice(1));
    (document.getElementById(id) || main).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
