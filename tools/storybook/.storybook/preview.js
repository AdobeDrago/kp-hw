/** @type {import('@storybook/html').Preview} */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      // Foundations first, then components, in the sidebar.
      storySort: { order: ['Foundations', 'Components'] },
    },
  },
  // Wrap every story in the KP theme container.
  //
  // foundation.css scopes ALL of its rules under the selector
  //   :where(.ds-foundation[data-ds-theme=vessel][data-ds-variant=basic][data-ds-version="1"])
  // so that exact combination must be present for tokens/icons/type to apply.
  //
  // We also keep the `sg-spacing kp-theme-ds2` classes the pattern demos put on
  // <body>, so that when Phase 1 layers a pattern's own main.css the same
  // wrapper still satisfies it. (foundation.css uses :where() — zero specificity
  // — so this superset wrapper never fights pattern styles.)
  decorators: [
    (story) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'ds-foundation sg-spacing kp-theme-ds2';
      wrapper.setAttribute('data-ds-theme', 'vessel');
      wrapper.setAttribute('data-ds-variant', 'basic');
      wrapper.setAttribute('data-ds-version', '1');

      const content = story();
      if (typeof content === 'string') {
        wrapper.innerHTML = content;
      } else {
        wrapper.appendChild(content);
      }
      return wrapper;
    },
  ],
};

export default preview;
