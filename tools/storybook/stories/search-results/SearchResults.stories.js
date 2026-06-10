// Search Results — current lineage: foundation-base-v3 (vessel theme).
// Source: design-files/.extracted/kp-vessel-5/search-results-pattern/foundation-base-v3.html
//
// A list of .search-result items inside .ds-search-results[data-ds-variant="base"].
// Each item has a header (category / linked title / affiliate) and a body of data points.

import { ensurePatternStyles, el } from '../pattern-utils.js';

const PATTERN = 'search-results';

function result({ category, title, affiliate, points = [] }) {
  const dataPoints = points
    .map((p) => `<li class="data-point"><span class="data-bold">${p.label}:</span><span class="data-text"> ${p.value}</span></li>`)
    .join('');
  return `
    <div class="search-result">
      <div class="search-result--header">
        <span class="content-block category-pre-heading">${category}</span>
        <span class="content-block result-title-heading -first-letter-uppercase"><a href="#">${title}</a></span>
        ${affiliate ? `<span class="content-block affiliate-sub-heading">${affiliate}</span>` : ''}
      </div>
      <div class="search-result--body">
        ${dataPoints ? `<ul class="data-points">${dataPoints}</ul>` : ''}
      </div>
    </div>`;
}

function renderSearchResults({ results = [] } = {}) {
  ensurePatternStyles(PATTERN);
  return el(`
    <div class="ds-search-results" data-ds-variant="base" data-ds-theme="vessel" data-ds-version="3">
      ${results.map(result).join('')}
    </div>
  `);
}

const DEFAULT_RESULTS = [
  {
    category: 'Category',
    title: 'advanced Yoga',
    affiliate: 'Kaiser Permanente Affiliate',
    points: [
      { label: 'Data Point 1', value: 'Lorum ipsum dolor sit amet' },
      { label: 'Data Point 2', value: 'consectetur adipiscing elit' },
    ],
  },
  {
    category: 'Category',
    title: 'beginner Pilates',
    affiliate: 'Kaiser Permanente Affiliate',
    points: [{ label: 'Data Point 1', value: 'Lorum ipsum dolor sit amet' }],
  },
];

export default {
  title: 'Components/Search Results',
  render: (args) => renderSearchResults(args),
  argTypes: { results: { control: 'object' } },
  args: { results: DEFAULT_RESULTS },
};

export const Base = {};
export const SingleResult = { args: { results: [DEFAULT_RESULTS[0]] } };
