const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs/promises');
(async () => {
  const artifactDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'print-riso-'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${process.env.PRINT_URL || 'http://127.0.0.1:8790/'}#pudding-riso`);
    await page.locator('#pudding-cherry').waitFor();
    const checks = await page.evaluate(async () => {
      const original = await import('/artworks/pudding/artwork.js');
      const riso = await import('/artworks/pudding-riso/artwork.js');
      const { composeOutput, rasterizeArtwork } = await import('/artworks/shared/output.js');
      const geometry = svg => [...svg.querySelectorAll('path')].map(p => p.getAttribute('d'));
      let shapesMatch = true, seedsMatch = true, repeatable = true, allOpaque = true;
      for (const seed of ['original', 'riso-test', 'coffee']) {
        const a = document.createElement('div'), b = document.createElement('div'), c = document.createElement('div');
        original.render(a, { seed }); riso.render(b, { seed }); original.render(c, { seed });
        shapesMatch &&= JSON.stringify(geometry(a)) === JSON.stringify(geometry(b));
        seedsMatch &&= a.querySelector('#pudding-cherry').getAttribute('transform') === b.querySelector('#pudding-cherry').getAttribute('transform');
        seedsMatch &&= [...a.querySelectorAll('#pudding-sprinkles > g')].every((p, i) => p.getAttribute('transform') === b.querySelectorAll('#pudding-sprinkles > g')[i].getAttribute('transform'));
        repeatable &&= a.innerHTML === c.innerHTML;
      }
      for (const [w,h] of [[480,853],[480,640],[480,600],[480,480],[480,384],[480,360],[480,320],[480,270]]) {
        const holder = document.createElement('div'); riso.render(holder, { seed: 'original' });
        const svg = composeOutput(holder.querySelector('svg'), { outputWidth: w, outputHeight: h, outputScale: 1 }, riso.layoutOutput);
        const canvas = await rasterizeArtwork(svg);
        const rgba = canvas.getContext('2d').getImageData(0,0,w,h).data;
        for (let i = 3; i < rgba.length; i += 4) if (rgba[i] !== 255) allOpaque = false;
      }
      return { shapesMatch, seedsMatch, repeatable, allOpaque };
    });
    assert.deepEqual(checks, { shapesMatch: true, seedsMatch: true, repeatable: true, allOpaque: true });
    await page.locator('#animation-controls summary').click();
    await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
    await page.locator('#animation-duration').fill('2'); await page.locator('#animation-duration').dispatchEvent('input');
    for (const [format, selector] of [['svg','[data-download="svg"]'],['png','[data-download="png"]'],['gif','#animation-download']]) {
      const pending = page.waitForEvent('download'); await page.locator(selector).click();
      const download = await pending; assert.equal(await download.failure(), null);
      await download.saveAs(path.join(artifactDirectory, `pudding-riso.${format}`));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(artifactDirectory, 'pudding-riso-mobile.png'), fullPage: true, animations: 'disabled' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    console.log('PASS: identical geometry and seeded toppings, original unchanged, 8 opaque frames, SVG/PNG/GIF downloads, mobile.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
