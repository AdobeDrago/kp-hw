// Foundations → Breakpoints.
//
// theme.json (style-guide/assets/data/theme.json) is the ONE place in the offline
// export where tokens are published as clean data rather than baked into compiled
// CSS. These are the DS2 responsive breakpoints, ready to seed EDS `styles/`.
//
// Colors / spacing / typography tokens are NOT recoverable from the export — they're
// compiled from Sass into hardcoded values (see stories/README.md "Phase 2" notes).

const DS2_BREAKPOINTS = [
  { token: 'mobile-max', px: 767, note: 'Mobile (max width)' },
  { token: 'tablet-min', px: 768, note: 'Tablet (min)' },
  { token: 'tablet-max', px: 1151, note: 'Tablet (max)' },
  { token: 'desktop-s-min', px: 1152, note: 'Small desktop (min)' },
  { token: 'desktop-s-max', px: 1180, note: 'Small desktop (max)' },
  { token: 'desktop-m-min', px: 1181, note: 'Medium desktop (min)' },
  { token: 'desktop-m-max', px: 1280, note: 'Medium desktop (max)' },
  { token: 'desktop-l-min', px: 1281, note: 'Large desktop (min)' },
];

export default {
  title: 'Foundations/Breakpoints',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
};

export const DS2 = () => `
  <div style="padding: 2rem; max-width: 52rem;">
    <h1>Breakpoints (DS2)</h1>
    <p>Source: <code>style-guide/assets/data/theme.json</code> — the only clean token
    data in the offline export. Suggested EDS form: <code>--bp-tablet-min: 768px;</code> in
    <code>styles/styles.css</code>, plus matching <code>@media</code> queries.</p>
    <table style="border-collapse: collapse; width: 100%; margin-top: 1rem;">
      <thead>
        <tr style="text-align: left; border-bottom: 2px solid #ccc;">
          <th style="padding: 0.5rem 1rem 0.5rem 0;">Token</th>
          <th style="padding: 0.5rem 1rem;">Value</th>
          <th style="padding: 0.5rem 1rem;">Meaning</th>
        </tr>
      </thead>
      <tbody>
        ${DS2_BREAKPOINTS.map(
    (b) => `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.5rem 1rem 0.5rem 0;"><code>${b.token}</code></td>
            <td style="padding: 0.5rem 1rem;">${b.px}px</td>
            <td style="padding: 0.5rem 1rem; color:#555;">${b.note}</td>
          </tr>`,
  ).join('')}
      </tbody>
    </table>
  </div>
`;
