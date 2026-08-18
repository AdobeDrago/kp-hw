import { expect } from '@esm-bundle/chai';
import { variantTokens, activeVariants } from '../../../tools/style-switcher/quick-edit-style-switcher.js';

describe('quick-edit-style-switcher.js', () => {
  describe('variantTokens', () => {
    it('extracts a single compound variant', () => {
      expect(variantTokens('columns', '.columns.topics .topic-pills')).to.deep.equal(['topics']);
    });

    it('extracts several across a selector list', () => {
      expect(variantTokens('section', '.section.center, .section.pale-blue .default-content'))
        .to.deep.equal(['center', 'pale-blue']);
    });

    it('ignores :not() and prefixed (computed/internal) classes', () => {
      expect(variantTokens('hero', '.hero:not(.landing) .hero-foreground')).to.deep.equal([]);
      expect(variantTokens('columns-media', '.columns-media-2-cols')).to.deep.equal([]);
    });

    it('handles a hyphenated base and variant', () => {
      expect(variantTokens('plan-compare', '.plan-compare.wide')).to.deep.equal(['wide']);
    });

    it('returns [] for empty input', () => {
      expect(variantTokens('', '.a.b')).to.deep.equal([]);
      expect(variantTokens('x', '')).to.deep.equal([]);
    });
  });

  describe('activeVariants', () => {
    it('returns the options applied on the element', () => {
      expect(activeVariants(['columns', 'topics'], ['topics', 'dark'])).to.deep.equal(['topics']);
    });

    it('returns [] when none of the options are applied', () => {
      expect(activeVariants(['section'], ['center', 'pale-blue'])).to.deep.equal([]);
    });
  });
});
