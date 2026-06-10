// Phase 0 smoke test. This story has no component — it exists only to prove the
// Storybook setup works: the foundation CSS loads, Gotham + kp-icons fonts
// resolve, the ds2 theme is applied, and the dev server boots. Once the pilot
// (notifications + card) lands, this stays as a quick "is the foundation wired
// up?" reference.

export default {
  title: 'Foundations/Overview',
  parameters: {
    layout: 'fullscreen',
    // No interactive controls on this static page.
    controls: { disable: true },
  },
};

export const Overview = () => `
  <div style="padding: 2rem; max-width: 60rem;">
    <h1>KP Design System — Storybook (Phase 0)</h1>
    <p>
      If this setup is working you should see the items below rendered with the
      Kaiser Permanente foundation styles. Use the checklist to validate.
    </p>

    <h2 style="margin-top: 2rem;">1. Typography (Gotham font family)</h2>
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <p>
      Body paragraph text. This should render in the Gotham typeface, not a
      generic system sans-serif. Here is an <a href="#" class="link">inline link</a>.
    </p>

    <h2 style="margin-top: 2rem;">2. Icon font (kp-icons)</h2>
    <p style="font-size: 2rem;">
      <i class="icon-close" aria-hidden="true"></i>
      <i class="icon-alert" aria-hidden="true"></i>
      <i class="icon-alarm" aria-hidden="true"></i>
      <i class="icon-appointment" aria-hidden="true"></i>
    </p>
    <p style="font-size: 0.85rem; color: #666;">
      These should be glyphs (a close X, an alert, an alarm, a calendar) — not empty boxes.
    </p>

    <h2 style="margin-top: 2rem;">3. What the foundation layer does &amp; doesn't cover</h2>
    <p>
      <code>foundation.css</code> is an <strong>icon-font + font-face + primitives</strong>
      layer, scoped under
      <code>.ds-foundation[data-ds-theme=vessel][data-ds-variant=basic][data-ds-version="1"]</code>
      (applied by the global decorator). It does <em>not</em> ship a global color
      palette — brand colors and component styling live in each pattern's own
      <code>main.css</code>, which the pilot (notifications + card) layers in per story.
    </p>

    <hr style="margin: 2.5rem 0;" />
    <h2>Validation checklist</h2>
    <ul>
      <li>Headings &amp; body text use <strong>Gotham</strong> (rounded, geometric), not Arial/Helvetica.</li>
      <li>The four icons in section 2 are real glyphs, not empty squares.</li>
      <li>The left sidebar shows <strong>Foundations &rsaquo; Overview</strong>.</li>
      <li>The bottom panel has an <strong>Accessibility</strong> tab (the a11y addon).</li>
    </ul>
  </div>
`;
