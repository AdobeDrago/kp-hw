// Card Group — current lineage: basic-foundation-v2 (vessel theme).
// Source: design-files/.extracted/kp-vessel-1/card-group-pattern/basic-foundation-v2.html
//
// A responsive grid wrapper around N .ds-card children. The column count is set with
// data-ds-num-cols (2/3/4) for desktop; the pattern's CSS steps it down on tablet/mobile.

import { ensurePatternStyles, el, uid } from '../pattern-utils.js';

const PATTERN = 'card-group';

function card() {
  const titleId = uid('cg-card');
  return `
    <div class="ds-card" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="3" role="group" aria-labelledby="${titleId}">
      <div class="ds-card__content">
        <div class="ds-card__title" id="${titleId}">Card Title</div>
        <div class="ds-card__summary">
          <p>Cards are used to summarize content on a single topic and should be easy to scan.</p>
        </div>
        <div class="ds-card__button-container">
          <div class="ds-card__cta"><button class="button -action -light -small" type="button">Action</button></div>
        </div>
      </div>
    </div>`;
}

function renderCardGroup({ numCols = 3, count = 3 } = {}) {
  ensurePatternStyles(PATTERN);
  const cards = Array.from({ length: count }, () => card()).join('');
  return el(`
    <div class="ds-card-group" data-ds-theme="vessel" data-ds-variant="basic" data-ds-version="2" data-ds-num-cols="${numCols}">
      ${cards}
    </div>
  `);
}

export default {
  title: 'Components/Card Group',
  render: (args) => renderCardGroup(args),
  argTypes: {
    numCols: { control: { type: 'inline-radio' }, options: [2, 3, 4], description: 'Desktop column count.' },
    count: { control: { type: 'number', min: 1, max: 8 } },
  },
  args: { numCols: 3, count: 3 },
};

export const ThreeColumns = { args: { numCols: 3, count: 3 } };
export const TwoColumns = { args: { numCols: 2, count: 4 } };
export const FourColumns = { args: { numCols: 4, count: 4 } };
