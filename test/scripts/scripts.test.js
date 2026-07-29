import { expect } from '@esm-bundle/chai';
import { loadPage, suppressFragmentChrome } from '../../scripts/scripts.js';

describe('scripts.js', () => {
  before(async () => {
    document.body.innerHTML = '<img src="test.jpg" loading="lazy">';
    await loadPage();
  });

  describe('decorateArea', () => {
    it('should remove loading attribute from first image', () => {
      const img = document.querySelector('img');
      expect(img.hasAttribute('loading')).to.be.false;
    });

    it('should set fetchPriority to high', () => {
      const img = document.querySelector('img');
      expect(img.fetchPriority).to.equal('high');
    });
  });

  describe('suppressFragmentChrome', () => {
    afterEach(() => {
      document.head.querySelectorAll('meta[name="header"], meta[name="footer"]').forEach((m) => m.remove());
      window.history.pushState({}, '', '/');
    });

    it('sets header and footer metadata to off for /fragments paths', () => {
      window.history.pushState({}, '', '/fragments/nav/main-nav');
      suppressFragmentChrome();
      expect(document.head.querySelector('meta[name="header"]').content).to.equal('off');
      expect(document.head.querySelector('meta[name="footer"]').content).to.equal('off');
    });

    it('does nothing for paths outside /fragments', () => {
      window.history.pushState({}, '', '/some-page');
      suppressFragmentChrome();
      expect(document.head.querySelector('meta[name="header"]')).to.equal(null);
      expect(document.head.querySelector('meta[name="footer"]')).to.equal(null);
    });

    it('overrides an existing header/footer meta tag rather than duplicating it', () => {
      const existing = document.createElement('meta');
      existing.name = 'header';
      existing.content = 'custom';
      document.head.append(existing);

      window.history.pushState({}, '', '/fragments/404');
      suppressFragmentChrome();

      expect(document.head.querySelectorAll('meta[name="header"]').length).to.equal(1);
      expect(document.head.querySelector('meta[name="header"]').content).to.equal('off');
    });
  });
});
