/** @type {import('@storybook/html-vite').StorybookConfig} */
const config = {
  // Story files live under /stories during the pilot. Phase 2 may co-locate
  // them next to EDS blocks (blocks/<name>/<name>.stories.js).
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials', // controls, docs, viewport, backgrounds, etc.
    '@storybook/addon-a11y', // accessibility checks (the "Accessibility" tab)
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  // Serve the vendored KP design-system foundation (CSS + fonts) as static files.
  // `from` is relative to this .storybook config directory; it is exposed at /foundation.
  // foundation.css references its fonts via url(assets/fonts/...), which then
  // resolve to /foundation/assets/fonts/... at runtime — exactly like the
  // original vessel demos load it via a plain <link>.
  staticDirs: [
    { from: './foundation', to: '/foundation' },
    // Per-pattern CSS + assets, served as-is (no Vite processing) at /sb/<pattern>/...
    // so each pattern's foundation.css resolves its own url(assets/...) references
    // and missing background images just 404 gracefully. Stories inject their own
    // <link> to /sb/<pattern>/foundation.css (see ensurePatternStyles in the stories).
    { from: '../stories', to: '/sb' },
    // EDS global styles + fonts, served at /styles so styles.css @font-face
    // url(/styles/fonts/...) resolves inside the EDS-block harness stories.
    { from: '../styles', to: '/styles' },
  ],
  // The EDS-block harness globs blocks/*/*.js; some blocks import scripts.js,
  // which uses top-level await. Bump the build/transpile target so TLA is
  // allowed (it's valid ESM — the default es2020 target just rejects it).
  async viteFinal(cfg) {
    cfg.build = cfg.build || {};
    cfg.build.target = 'esnext';
    cfg.esbuild = { ...(cfg.esbuild || {}), target: 'esnext' };
    cfg.optimizeDeps = cfg.optimizeDeps || {};
    cfg.optimizeDeps.esbuildOptions = {
      ...(cfg.optimizeDeps.esbuildOptions || {}),
      target: 'esnext',
    };
    return cfg;
  },
};

export default config;
