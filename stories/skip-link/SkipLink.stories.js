// Skip Link — current lineage: vessel-basic-v1 (kp-theme-ds2 + main.css architecture).
// Source: design-files/.extracted/kp-vessel-6/skip-link-pattern/vessel-basic-v1.html
//
// An accessibility "skip to main content" link: positioned off-screen by default and
// revealed on :focus (so keyboard users can jump past the header). There's no JS behavior
// to port — the :focus reveal is pure CSS. This pattern uses the older kp-theme-ds2 /
// main.css line (no foundation-v variant), so it loads its own ~400KB main.css.

import { ensurePatternStyles, el } from '../pattern-utils.js';

const PATTERN = 'skip-link';

function renderSkipLink({ label = 'Skip to main content', autoFocus = true } = {}) {
  ensurePatternStyles(PATTERN);

  const node = el(`
    <div>
      <a class="ds-skip-link" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="1" href="#main-content">${label}</a>
      <main id="main-content" style="padding: 2rem 0;">
        <h2>Main content area</h2>
        <p style="max-width: 48rem;">
          The skip link is visually hidden until it receives keyboard focus. Press
          <kbd>Tab</kbd> (with focus in this canvas) to reveal it in the top-left, or use the
          <strong>Focused</strong> story which focuses it automatically.
        </p>
      </main>
    </div>
  `);

  if (autoFocus) {
    // Demonstrate the focused/visible state without requiring the user to Tab.
    requestAnimationFrame(() => node.querySelector('.ds-skip-link')?.focus());
  }
  return node;
}

export default {
  title: 'Components/Skip Link',
  render: (args) => renderSkipLink(args),
  argTypes: {
    label: { control: 'text' },
    autoFocus: { control: 'boolean', description: 'Focus the link on render to show its visible state.' },
  },
  args: { label: 'Skip to main content', autoFocus: true },
};

// Focused on render so the (normally hidden) link is visible.
export const Focused = {};

// Hidden until you Tab to it — the real-world resting state.
export const HiddenUntilFocus = { args: { autoFocus: false } };
