import { expect } from '@esm-bundle/chai';
import {
  buildPreviewUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
  extractBlockNames,
  extractMetadataFields,
  diffSets,
} from '../../../tools/template-governance/template-governance-utils.js';

describe('template-governance-utils.js', () => {
  describe('buildPreviewUrl', () => {
    it('builds a preview URL for a path', () => {
      const url = buildPreviewUrl('/docs/library/templates/homepage', 'adobedrago', 'ak-kaiserpermanente', 'main');
      expect(url).to.equal('https://main--ak-kaiserpermanente--adobedrago.aem.page/docs/library/templates/homepage');
    });

    it('defaults ref to main', () => {
      expect(buildPreviewUrl('/foo', 'adobedrago', 'kp-hw')).to.equal('https://main--kp-hw--adobedrago.aem.page/foo');
    });
  });

  describe('resolveTemplateFromHtml', () => {
    it('reads the template name from the meta tag', () => {
      const html = '<html><head><meta name="template" content="Homepage"></head><body></body></html>';
      expect(resolveTemplateFromHtml(html)).to.equal('Homepage');
    });

    it('returns null when the meta tag is absent', () => {
      expect(resolveTemplateFromHtml('<html><head></head><body></body></html>')).to.equal(null);
    });

    it('returns null when the meta tag is present but empty', () => {
      const html = '<html><head><meta name="template" content=""></head><body></body></html>';
      expect(resolveTemplateFromHtml(html)).to.equal(null);
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

  describe('extractBlockNames', () => {
    it('extracts the block name (first class) from each section-level block div', () => {
      const html = `
        <html><body><main>
          <div>
            <div class="hero landing"><div>content</div></div>
          </div>
          <div>
            <div class="columns two-up"><div>a</div><div>b</div></div>
            <p>default content, not a block</p>
          </div>
        </main></body></html>
      `;
      expect(extractBlockNames(html)).to.deep.equal(['hero', 'columns']);
    });

    it('returns an empty array when there is no main element', () => {
      expect(extractBlockNames('<html><body></body></html>')).to.deep.equal([]);
    });

    it('deduplicates repeated block names', () => {
      const html = `
        <html><body><main>
          <div><div class="hero"><div>a</div></div></div>
          <div><div class="hero"><div>b</div></div></div>
        </main></body></html>
      `;
      expect(extractBlockNames(html)).to.deep.equal(['hero']);
    });
  });

  describe('extractMetadataFields', () => {
    it('extracts meta name and property keys', () => {
      const html = `
        <html><head>
          <meta name="template" content="Homepage">
          <meta property="og:title" content="Hello">
          <meta charset="utf-8">
        </head><body></body></html>
      `;
      expect(extractMetadataFields(html)).to.deep.equal(['template', 'og:title']);
    });

    it('returns an empty array when there are no matching meta tags', () => {
      expect(extractMetadataFields('<html><head></head><body></body></html>')).to.deep.equal([]);
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
