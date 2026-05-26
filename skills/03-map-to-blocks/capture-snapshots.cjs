/**
 * Captures block snapshots from the ak-kaiserpermanente template site.
 * Run with: node skills/03-map-to-blocks/capture-snapshots.js
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE = 'https://main--ak-kaiserpermanente--adobedrago.aem.page';
const OUT = path.join(__dirname, 'snapshots');

const snapshots = [
  // Hero - landing (homepage, section 1)
  {
    file: 'hero-landing.png',
    url: `${BASE}/`,
    selector: '.hero.landing',
    label: 'hero (landing variant) — homepage',
  },
  // Columns pale-blue (homepage contact section)
  {
    file: 'columns.png',
    url: `${BASE}/`,
    selector: '.pale-blue .columns',
    label: 'columns (default) — pale-blue section',
  },
  // Columns-media (homepage video section)
  {
    file: 'columns-media.png',
    url: `${BASE}/`,
    selector: '.columns-media',
    label: 'columns-media — video + text',
  },
  // Tabs (homepage Why KP section)
  {
    file: 'tabs.png',
    url: `${BASE}/`,
    selector: '.tabs',
    label: 'tabs — Why Kaiser Permanente',
  },
  // Columns align-vertically (homepage boost well-being section)
  {
    file: 'columns-align-vertically.png',
    url: `${BASE}/`,
    selector: '.columns.align-vertically',
    label: 'columns (align-vertically variant)',
  },
  // Hero default (homepage mid-page "Care for growing families")
  {
    file: 'hero-default.png',
    url: `${BASE}/`,
    selector: '.hero:not(.landing)',
    label: 'hero (default variant) — inner section',
  },
  // Cards-icon (homepage Location/Support/Doctors)
  {
    file: 'cards-icon.png',
    url: `${BASE}/`,
    selector: '.cards-icon',
    label: 'cards-icon — Location / Support / Doctors',
  },
  // Card x3 (homepage specialty care)
  {
    file: 'card.png',
    url: `${BASE}/getting-care`,
    selector: '.card',
    label: 'card (default) — feature card',
  },
  // Accordion (support page FAQs)
  {
    file: 'accordion.png',
    url: `${BASE}/support`,
    selector: '.accordion',
    label: 'accordion — FAQ expandable items',
  },
  // Icons grid (retiree-plans Medicare benefits)
  {
    file: 'icons-grid.png',
    url: `${BASE}/retiree-plans`,
    selector: '.icons.grid',
    label: 'icons (grid variant) — benefit items',
  },
  // Icons list (getting-care page — virtual care items)
  {
    file: 'icons-list.png',
    url: `${BASE}/getting-care`,
    selector: '.icons.list',
    label: 'icons (list variant) — virtual care items',
  },
  // Plan compare (plans page)
  {
    file: 'plan-compare.png',
    url: `${BASE}/plans`,
    selector: '.plan-compare',
    label: 'plan-compare — side-by-side plan options',
  },
  // Table striped (plans page rates)
  {
    file: 'table-striped.png',
    url: `${BASE}/plans`,
    selector: '.table.striped',
    label: 'table (striped variant) — rates table',
  },
  // Table caption striped (plans page benefits)
  {
    file: 'table-caption-striped.png',
    url: `${BASE}/plans`,
    selector: '.table.caption.striped',
    label: 'table (caption striped) — summary of benefits',
  },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  let lastUrl = null;

  for (const snap of snapshots) {
    try {
      // Only navigate if URL changed
      if (snap.url !== lastUrl) {
        console.log(`\nNavigating to ${snap.url}`);
        await page.goto(snap.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000); // allow lazy images to load
        lastUrl = snap.url;
      }

      const el = page.locator(snap.selector).first();
      await el.waitFor({ timeout: 8000 });
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const outPath = path.join(OUT, snap.file);
      await el.screenshot({ path: outPath });
      console.log(`  ✓ ${snap.file} — ${snap.label}`);
    } catch (err) {
      console.log(`  ✗ ${snap.file} — FAILED: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone. Review snapshots in skills/03-map-to-blocks/snapshots/');
})();
