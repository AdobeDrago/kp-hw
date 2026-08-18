import { expect } from '@esm-bundle/chai';
import {
  parseBlockLabel,
  identifyBlock,
} from '../../../tools/style-switcher/style-switcher-utils.js';

describe('style-switcher-utils.js', () => {
  describe('parseBlockLabel', () => {
    it('splits a name with multiple variants', () => {
      expect(parseBlockLabel('Columns (dark, wide)')).to.deep.equal({
        name: 'Columns',
        variants: ['dark', 'wide'],
      });
    });

    it('returns no variants when there are no parentheses', () => {
      expect(parseBlockLabel('Cards')).to.deep.equal({ name: 'Cards', variants: [] });
    });

    it('handles a single variant', () => {
      expect(parseBlockLabel('Hero (dark)')).to.deep.equal({ name: 'Hero', variants: ['dark'] });
    });

    it('trims stray whitespace around the name and each variant', () => {
      expect(parseBlockLabel('  Spaced   (  a ,  b )')).to.deep.equal({
        name: 'Spaced',
        variants: ['a', 'b'],
      });
    });

    it('treats empty parentheses as no variants', () => {
      expect(parseBlockLabel('Columns ()')).to.deep.equal({ name: 'Columns', variants: [] });
    });
  });

  describe('identifyBlock — table form (DA editor)', () => {
    it('identifies a block table with variants from its first cell', () => {
      const payload = `
        <table>
          <tr><td>Columns (dark, wide)</td></tr>
          <tr><td>one</td><td>two</td></tr>
        </table>`;
      expect(identifyBlock(payload)).to.deep.equal({
        name: 'Columns',
        variants: ['dark', 'wide'],
        raw: 'Columns (dark, wide)',
        count: 1,
      });
    });

    it('identifies a block table with no variant', () => {
      const payload = '<table><tr><td>Cards</td></tr><tr><td>x</td></tr></table>';
      expect(identifyBlock(payload)).to.deep.equal({
        name: 'Cards',
        variants: [],
        raw: 'Cards',
        count: 1,
      });
    });

    it('returns null for a metadata table (structural, not a block)', () => {
      const payload = '<table><tr><td>Metadata</td></tr><tr><td>title</td><td>Home</td></tr></table>';
      expect(identifyBlock(payload)).to.equal(null);
    });

    it('returns null for a section-metadata table (structural)', () => {
      const payload = '<table><tr><td>Section Metadata</td></tr><tr><td>style</td><td>dark</td></tr></table>';
      expect(identifyBlock(payload)).to.equal(null);
    });

    it('reports the first block and a count when several are selected', () => {
      const payload = `
        <table><tr><td>Hero</td></tr></table>
        <table><tr><td>Cards (list)</td></tr></table>`;
      expect(identifyBlock(payload)).to.deep.equal({
        name: 'Hero',
        variants: [],
        raw: 'Hero',
        count: 2,
      });
    });
  });

  describe('identifyBlock — div form (decorated fallback)', () => {
    it('derives name and variants from a block div class list', () => {
      const payload = '<div class="columns dark wide"><div><div>one</div></div></div>';
      expect(identifyBlock(payload)).to.deep.equal({
        name: 'columns',
        variants: ['dark', 'wide'],
        raw: 'columns dark wide',
        count: 1,
      });
    });

    it('returns null for a structural metadata div', () => {
      const payload = '<div class="metadata"><div><div>title</div><div>Home</div></div></div>';
      expect(identifyBlock(payload)).to.equal(null);
    });
  });

  describe('identifyBlock — non-blocks and bad input', () => {
    it('returns null for default content with no block', () => {
      expect(identifyBlock('<p>Just a paragraph.</p>')).to.equal(null);
    });

    it('returns null for an empty string', () => {
      expect(identifyBlock('')).to.equal(null);
    });

    it('returns null for null, undefined, and non-string input', () => {
      expect(identifyBlock(null)).to.equal(null);
      expect(identifyBlock(undefined)).to.equal(null);
      expect(identifyBlock(123)).to.equal(null);
    });
  });
});
