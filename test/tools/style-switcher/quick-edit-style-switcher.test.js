import { expect } from '@esm-bundle/chai';
import { blockVariants } from '../../../tools/style-switcher/quick-edit-style-switcher.js';

describe('quick-edit-style-switcher.js', () => {
  describe('blockVariants', () => {
    it('returns variant classes, excluding the block name', () => {
      expect(blockVariants(['columns', 'align-vertically'], 'columns')).to.deep.equal(['align-vertically']);
    });

    it('returns [] when the block has no variant', () => {
      expect(blockVariants(['tabs'], 'tabs')).to.deep.equal([]);
    });

    it('excludes the structural block / block-content classes', () => {
      expect(blockVariants(['columns', 'block', 'block-content', 'topics'], 'columns'))
        .to.deep.equal(['topics']);
    });
  });
});
