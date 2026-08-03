import { expect } from '@esm-bundle/chai';
import {
  buildPreviewUrl,
  resolveTemplateFromHtml,
  parseContentDaUrl,
  findTemplateEntry,
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
});
