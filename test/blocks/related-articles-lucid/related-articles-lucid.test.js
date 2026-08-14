import { expect } from '@esm-bundle/chai';
import { readConfig, resolveCount } from '../../../blocks/related-articles-lucid/related-articles-lucid.js';

function buildBlock(rows) {
  const block = document.createElement('div');
  rows.forEach(([key, ...values]) => {
    const row = document.createElement('div');
    const keyCell = document.createElement('div');
    keyCell.textContent = key;
    row.append(keyCell);
    values.forEach((v) => {
      const cell = document.createElement('div');
      cell.textContent = v;
      row.append(cell);
    });
    block.append(row);
  });
  return block;
}

describe('related-articles-lucid.js', () => {
  describe('readConfig', () => {
    it('reads a count row into config.count', () => {
      const block = buildBlock([['count', '9']]);
      expect(readConfig(block).count).to.equal('9');
    });

    it('still parses topic rows alongside a count row', () => {
      const block = buildBlock([
        ['count', '9'],
        ['topic', 'Diabetes', 'diabetes'],
      ]);
      const config = readConfig(block);
      expect(config.count).to.equal('9');
      expect(config.topics).to.deep.equal([{ label: 'Diabetes', topic: 'diabetes' }]);
    });
  });

  describe('resolveCount', () => {
    it('uses the authored count when present', () => {
      expect(resolveCount({ count: '9' }, 6)).to.equal(9);
    });

    it('falls back when count is absent', () => {
      expect(resolveCount({}, 6)).to.equal(6);
    });

    it('falls back when count is not a positive number', () => {
      expect(resolveCount({ count: '0' }, 6)).to.equal(6);
      expect(resolveCount({ count: 'abc' }, 6)).to.equal(6);
      expect(resolveCount({ count: '-3' }, 6)).to.equal(6);
    });
  });
});
