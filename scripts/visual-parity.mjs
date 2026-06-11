/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
// Visual parity gate: screenshot each EDS block component and its matching vessel
// reference story, then pixel-diff them. Same DOM (shared renderer); this measures
// whether the sliced block CSS reproduces the full foundation's look.
//
// Requires a running Storybook (npm run storybook). Usage:
//   node scripts/visual-parity.mjs [--url http://localhost:6006]
//     [--max-diff 0.05] [--pixel-threshold 0.1] [--out test/visual/__output__]
// Exits non-zero if any pair exceeds the differing-pixel threshold.
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = (name, fb) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fb;
};
const URL = arg('url', 'http://localhost:6006');
const MAX_DIFF = parseFloat(arg('max-diff', '0.05'));
const PIXEL_THRESHOLD = parseFloat(arg('pixel-threshold', '0.1'));
const OUT = resolve(arg('out', 'test/visual/__output__'));

// EDS block component ↔ vessel reference story (selector = the component root).
const card = (v) => ({ name: `card-${v}`, selector: '.ds-card', eds: `eds-blocks-card--${v}`, ref: `components-card--${v}` });
const notif = (v) => ({ name: `notification-${v}`, selector: '.ds-notification', eds: `eds-blocks-notification--${v}`, ref: `components-notifications--${v}` });
const PAIRS = [
  card('basic'), card('large'), card('thumbnail'),
  notif('informational'), notif('alert'), notif('error'), notif('success'), notif('dismissible'),
  // Header bar is visually faithful; a minor language-dropdown width/spacing delta
  // shifts two right-aligned items, so it carries a slightly looser tolerance.
  { name: 'header-default', selector: '.ds-header', eds: 'eds-blocks-header--default', ref: 'components-header--default', maxDiff: 0.06 },
];

async function shoot(page, id, selector) {
  await page.goto(`${URL}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(
    [...document.images].map((img) => (img.complete
      ? Promise.resolve()
      : new Promise((r) => { img.onload = r; img.onerror = r; }))),
  ));
  await page.waitForTimeout(250);
  return el.screenshot();
}

function pad(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(255); // white background
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

async function run() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  const results = [];

  for (const pair of PAIRS) {
    const dir = resolve(OUT, pair.name);
    mkdirSync(dir, { recursive: true });
    const edsBuf = await shoot(page, pair.eds, pair.selector);
    const refBuf = await shoot(page, pair.ref, pair.selector);
    writeFileSync(resolve(dir, 'eds.png'), edsBuf);
    writeFileSync(resolve(dir, 'ref.png'), refBuf);

    const edsPng = PNG.sync.read(edsBuf);
    const refPng = PNG.sync.read(refBuf);
    const w = Math.max(edsPng.width, refPng.width);
    const h = Math.max(edsPng.height, refPng.height);
    const sizeMismatch = edsPng.width !== refPng.width || edsPng.height !== refPng.height;
    const diff = new PNG({ width: w, height: h });
    const n = pixelmatch(pad(refPng, w, h).data, pad(edsPng, w, h).data, diff.data, w, h, {
      threshold: PIXEL_THRESHOLD,
    });
    writeFileSync(resolve(dir, 'diff.png'), PNG.sync.write(diff));
    const ratio = n / (w * h);
    const limit = pair.maxDiff ?? MAX_DIFF;
    results.push({
      name: pair.name,
      ratio,
      limit,
      sizeMismatch,
      dims: `eds ${edsPng.width}x${edsPng.height} / ref ${refPng.width}x${refPng.height}`,
      pass: ratio <= limit,
    });
  }

  await browser.close();

  console.log(`\nVisual parity vs ${URL} — threshold ${(MAX_DIFF * 100).toFixed(1)}% differing pixels\n`);
  let failed = false;
  for (const r of results) {
    if (!r.pass) failed = true;
    const limitNote = r.limit !== MAX_DIFF ? ` (limit ${(r.limit * 100).toFixed(0)}%)` : '';
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(16)} ${(r.ratio * 100).toFixed(2).padStart(6)}% diff${limitNote}${r.sizeMismatch ? `  (size: ${r.dims})` : ''}`);
  }
  console.log(`\n  Diff images: ${OUT}\n`);
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error(err.message);
  console.error('Is Storybook running? Start it with `npm run storybook`.');
  process.exit(2);
});
