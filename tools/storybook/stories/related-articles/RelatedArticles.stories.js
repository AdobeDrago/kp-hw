// Related Articles — reference story driven by the SAME renderer the EDS block
// ships (blocks/related-articles/related-articles-dom.js), so the story and the
// authored block cannot drift. Tile visuals come from the vessel card foundation
// (loaded via ensurePatternStyles('card-group'), which includes .ds-card); the
// block's own wrapper/tab/grid CSS is inlined below.

import { ensurePatternStyles, assetUrl } from '../pattern-utils.js';

// Reach the shipped block via import.meta.glob (string literal — not a static
// cross-package import), the same mechanism stories/_eds uses. Eager so the
// renderer + its inlined CSS are ready at module load.
const DOM = '../../../../blocks/related-articles/related-articles-dom.js';
const CSS = '../../../../blocks/related-articles/related-articles.css';
const { renderRelatedArticles } = import.meta.glob('../../../../blocks/related-articles/related-articles-dom.js', { eager: true })[DOM];
const blockCss = import.meta.glob('../../../../blocks/related-articles/related-articles.css', { query: '?inline', import: 'default', eager: true })[CSS];

// Inject the block's own CSS once (tabs, grid, header, clickable link).
function ensureBlockStyles() {
  if (document.querySelector('style[data-kp-block="related-articles"]')) return;
  const style = document.createElement('style');
  style.dataset.kpBlock = 'related-articles';
  style.textContent = blockCss;
  document.head.appendChild(style);
}

const IMG = assetUrl('card', 'assets/images/cardimage.png');

// Sample article records shaped like the query-index mapping in init().
const article = (title, tags = []) => ({
  path: '#',
  title,
  alt: '',
  image: IMG,
  tags,
});

const TAGGED = [
  article('9 sweat-worthy outdoor activities', ['Fitness and exercise']),
  article('6 mental health tips for athletes', ['Mental health', 'Fitness and exercise']),
  article("Doomscrolling isn't just stressful — it's risky for your heart", ['Heart health', 'Mental health']),
  article('Health and safety tips for staying well while traveling', ['Healthy living']),
  article('27 stress-relieving hobbies to boost your health', ['Mental health']),
  article('Plan a low-cholesterol grocery list with heart-healthy foods', ['Heart health', 'Healthy eating']),
  article('10 healthy meals you can easily make at home', ['Healthy eating']),
  article('10-minute HIIT workouts, no equipment needed', ['Fitness and exercise']),
];

// Same articles with no tags — the state today (issue #34), exercising the
// single-grid fallback (no tab bar).
const UNTAGGED = TAGGED.map((a) => ({ ...a, tags: [] }));

const EXPLORE = { label: 'Explore library', href: '#' };

function render(args) {
  ensurePatternStyles('card-group');
  ensureBlockStyles();
  return renderRelatedArticles(args);
}

export default {
  title: 'Components/Related Articles',
  render,
  argTypes: {
    heading: { control: 'text' },
    numCols: { control: { type: 'inline-radio' }, options: [2, 3, 4] },
    limit: { control: { type: 'number', min: 1, max: 24 } },
    eyebrowFallback: { control: 'text' },
  },
  args: {
    heading: 'Related articles',
    explore: EXPLORE,
    articles: TAGGED,
    numCols: 4,
    limit: 12,
    eyebrowFallback: '',
  },
};

// Data-driven View-by-topic tabs (once articles carry tags).
export const WithTopics = {};

// Today's state: tags empty across the index → flat grid, no tabs.
export const FallbackNoTags = {
  args: { articles: UNTAGGED },
};

// A constant category eyebrow used while the index has no per-article tags.
export const FallbackWithEyebrow = {
  args: { articles: UNTAGGED, eyebrowFallback: 'Health and wellness' },
};
