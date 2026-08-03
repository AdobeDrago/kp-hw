import { expect } from '@esm-bundle/chai';
import {
  buildSourceUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
  extractSections,
  countBlockOccurrences,
  computeSectionStatuses,
  computeAddedBlocks,
  findReferenceBlockHtml,
  extractMetadataFields,
  diffSets,
} from '../../../tools/template-governance/template-governance-utils.js';

describe('template-governance-utils.js', () => {
  describe('buildSourceUrl', () => {
    it('builds a DA source URL for a path', () => {
      expect(buildSourceUrl('/index-copy', 'adobedrago', 'kp-hw')).to.equal('https://content.da.live/adobedrago/kp-hw/index-copy');
    });
  });

  describe('resolveTemplateFromHtml', () => {
    it('reads the template name from the .metadata block', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>title</p></div><div><p>Home</p></div></div>
            <div><div><p>template</p></div><div><p>Homepage</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(resolveTemplateFromHtml(html)).to.equal('Homepage');
    });

    it('returns null when there is no .metadata block', () => {
      expect(resolveTemplateFromHtml('<html><body><main></main></body></html>')).to.equal(null);
    });
  });

  describe('parseContentDaUrl', () => {
    it('parses org, repo, and path from a content.da.live URL', () => {
      const result = parseContentDaUrl('https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage');
      expect(result).to.deep.equal({
        org: 'adobedrago',
        repo: 'ak-kaiserpermanente',
        path: '/docs/library/templates/homepage',
      });
    });

    it('returns null for a URL that is not a content.da.live URL', () => {
      expect(parseContentDaUrl('https://example.com/adobedrago/kp-hw/foo')).to.equal(null);
    });
  });

  describe('findTemplateEntry', () => {
    const entries = [
      { key: 'Homepage', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/homepage' },
      { key: 'Support', value: 'https://content.da.live/adobedrago/ak-kaiserpermanente/docs/library/templates/support' },
    ];

    it('finds an entry by key, case-insensitively', () => {
      expect(findTemplateEntry(entries, 'homepage')).to.deep.equal(entries[0]);
    });

    it('returns null when no entry matches', () => {
      expect(findTemplateEntry(entries, 'article')).to.equal(null);
    });
  });

  describe('extractSections', () => {
    it('returns one entry per section with its blocks in order and the section style', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
            <div class="section-metadata"><div><div><p>style</p></div><div><p>full-width</p></div></div></div>
          </div>
          <div>
            <div class="columns"><div>a</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([
        { style: 'full-width', blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
      ]);
    });

    it('excludes the page metadata block from a section\'s blocks', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="columns"><div>a</div></div>
            <div class="metadata"><div><div><p>title</p></div><div><p>Home</p></div></div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['columns'] }]);
    });

    it('records multiple block instances within one section in order, not deduplicated', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="card"><div>a</div></div>
            <div class="card"><div>b</div></div>
            <div class="card"><div>c</div></div>
          </div>
        </main></body></html>
      `;
      expect(extractSections(html)).to.deep.equal([{ style: null, blocks: ['card', 'card', 'card'] }]);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractSections('<html><body></body></html>')).to.deep.equal([]);
    });
  });

  describe('countBlockOccurrences', () => {
    it('sums block occurrences across all sections', () => {
      const sections = [
        { style: null, blocks: ['hero'] },
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      expect(countBlockOccurrences(sections)).to.deep.equal({ hero: 1, columns: 2 });
    });

    it('returns an empty object for no sections', () => {
      expect(countBlockOccurrences([])).to.deep.equal({});
    });
  });

  describe('computeSectionStatuses', () => {
    it('marks a single-occurrence block present when the page has it', () => {
      const reference = [{ style: null, blocks: ['columns-media'] }];
      const statuses = computeSectionStatuses(reference, { 'columns-media': 1 });
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'columns-media', status: 'present', have: 1, total: 1 }] },
      ]);
    });

    it('marks a single-occurrence block missing when the page lacks it', () => {
      const reference = [{ style: null, blocks: ['tabs'] }];
      const statuses = computeSectionStatuses(reference, {});
      expect(statuses).to.deep.equal([
        { style: null, blocks: [{ name: 'tabs', status: 'missing', have: 0, total: 1 }] },
      ]);
    });

    it('marks a repeated block partial at every slot when some but not all instances are present', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 1 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['partial', 'partial']);
      expect(statuses.map((s) => s.blocks[0].total)).to.deep.equal([2, 2]);
      expect(statuses.map((s) => s.blocks[0].have)).to.deep.equal([1, 1]);
    });

    it('marks a repeated block present at every slot once fully satisfied', () => {
      const reference = [
        { style: null, blocks: ['columns'] },
        { style: null, blocks: ['columns'] },
      ];
      const statuses = computeSectionStatuses(reference, { columns: 2 });
      expect(statuses.map((s) => s.blocks[0].status)).to.deep.equal(['present', 'present']);
    });

    it('omits sections with no real content block', () => {
      const reference = [
        { style: null, blocks: ['hero'] },
        { style: 'footnotes', blocks: [] },
      ];
      const statuses = computeSectionStatuses(reference, { hero: 1 });
      expect(statuses).to.have.lengthOf(1);
    });
  });

  describe('computeAddedBlocks', () => {
    it('returns block names present on the page but absent from the reference', () => {
      expect(computeAddedBlocks({ hero: 1, 'promo-banner': 1 }, { hero: 1 })).to.deep.equal(['promo-banner']);
    });

    it('returns an empty array when nothing is added', () => {
      expect(computeAddedBlocks({ hero: 1 }, { hero: 2 })).to.deep.equal([]);
    });
  });

  describe('findReferenceBlockHtml', () => {
    it('returns the outer HTML of the first matching block', () => {
      const html = `
        <html><body><main>
          <div><div class="hero"><div>content</div></div></div>
        </main></body></html>
      `;
      expect(findReferenceBlockHtml(html, 'hero')).to.equal('<div class="hero"><div>content</div></div>');
    });

    it('returns null when no block matches', () => {
      const html = '<html><body><main><div><div class="hero"></div></div></main></body></html>';
      expect(findReferenceBlockHtml(html, 'tabs')).to.equal(null);
    });

    it('returns null when there is no main element', () => {
      expect(findReferenceBlockHtml('<html><body></body></html>', 'hero')).to.equal(null);
    });
  });

  describe('extractMetadataFields', () => {
    it('extracts the key from each row of the .metadata block', () => {
      const html = `
        <html><body><main><div>
          <div class="metadata">
            <div><div><p>title</p></div><div><p>Home</p></div></div>
            <div><div><p>template</p></div><div><p>Homepage</p></div></div>
          </div>
        </div></main></body></html>
      `;
      expect(extractMetadataFields(html)).to.deep.equal(['title', 'template']);
    });

    it('returns an empty array when there is no .metadata block', () => {
      expect(extractMetadataFields('<html><body><main></main></body></html>')).to.deep.equal([]);
    });
  });

  describe('diffSets', () => {
    it('reports reference names missing from the current set', () => {
      const { missing } = diffSets(['hero'], ['hero', 'columns']);
      expect(missing).to.deep.equal(['columns']);
    });

    it('reports current names not present in the reference set', () => {
      const { added } = diffSets(['hero', 'extra-block'], ['hero']);
      expect(added).to.deep.equal(['extra-block']);
    });

    it('reports no findings when the sets match exactly', () => {
      expect(diffSets(['hero'], ['hero'])).to.deep.equal({ missing: [], added: [] });
    });
  });
});
