import { expect } from '@esm-bundle/chai';
import {
  wrapperToBase,
  variantTokens,
  activeVariants,
} from '../../../tools/style-switcher/quick-edit-utils.js';

describe('quick-edit-utils.js', () => {
  describe('wrapperToBase', () => {
    it('strips the -wrapper suffix', () => {
      expect(wrapperToBase('columns-media-wrapper')).to.equal('columns-media');
    });

    it('returns null when the class is not a wrapper', () => {
      expect(wrapperToBase('columns-media')).to.equal(null);
    });

    it('handles non-string input', () => {
      expect(wrapperToBase(null)).to.equal(null);
      expect(wrapperToBase(undefined)).to.equal(null);
    });
  });

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
      expect(variantTokens('columns-media', '.columns-media-embed-inner')).to.deep.equal([]);
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
    it('returns the options that are applied on the element', () => {
      expect(activeVariants(['columns', 'topics', 'block'], ['topics', 'dark']))
        .to.deep.equal(['topics']);
    });

    it('returns [] when none of the options are applied', () => {
      expect(activeVariants(['columns', 'block'], ['topics', 'dark'])).to.deep.equal([]);
    });
  });
});
