const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
(async () => {
  const artifacts = await fs.mkdtemp(path.join(os.tmpdir(), 'fruit-roll-'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${process.env.PRINT_URL || 'http://127.0.0.1:8790/'}#fruit-roll`);
    await page.locator('#fruit-roll-kiwi').waitFor();
    await page.locator('#animation-enabled').uncheck();
    const seed = async value => {
      await page.locator('#seed-input').fill(value); await page.locator('#seed-input').press('Enter');
      await page.waitForFunction(v => new URL(location.href).searchParams.get('seed') === v && document.querySelector('#artwork-stage > svg').dataset.seed === v, value);
    };
    const placements = () => page.locator('#fruit-roll-kiwi').getAttribute('transform');
    await seed('tea'); const first = await placements();
    await seed('coffee'); assert.notEqual(await placements(), first);
    await seed('tea'); assert.equal(await placements(), first);
    const invariant = await page.evaluate(async () => {
      const { render } = await import('/artworks/fruit-roll/artwork.js');
      const snapshots = ['tea','coffee'].map(seed => {
        const holder = document.createElement('div'); render(holder, { seed });
        for (const name of ['kiwi','strawberry','mango','golden-fruit','peach']) holder.querySelector(`#fruit-roll-${name}`).removeAttribute('transform');
        return holder.innerHTML;
      });
      return snapshots[0] === snapshots[1];
    });
    assert.ok(invariant);
    await page.locator('[aria-controls="canvas-panel"]').click();
    await page.locator('[data-ratio="1:1"]').click();
    await seed('original');
    await page.screenshot({ path: path.join(artifacts,'desktop.png'), animations: 'disabled' });
    for (const format of ['svg','png']) {
      const pending = page.waitForEvent('download'); await page.locator(`[data-download="${format}"]`).click();
      const file = await pending; await file.saveAs(path.join(artifacts,`fruit-roll.${format}`));
      assert.equal(await file.failure(), null);
    }
    await page.locator('#animation-controls summary').click();
    await page.locator('#animation-enabled').check();
    await page.locator('#animation-duration').fill('2'); await page.locator('#animation-duration').dispatchEvent('input');
    for (const [format, selector] of [['gif','#animation-download'],['mp4','#animation-download-mp4']]) {
      const pending = page.waitForEvent('download', { timeout: 60000 }); await page.locator(selector).click();
      const file = await pending; await file.saveAs(path.join(artifacts,`fruit-roll.${format}`));
      assert.equal(await file.failure(), null);
      const bytes = await fs.readFile(path.join(artifacts,`fruit-roll.${format}`));
      assert.equal(format === 'gif' ? bytes.toString('ascii',0,6) : bytes.toString('ascii',4,8), format === 'gif' ? 'GIF89a' : 'ftyp');
    }
    await page.locator('#animation-enabled').uncheck();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(artifacts,'mobile.png'), fullPage: true, animations: 'disabled' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    console.log(`PASS: reproducible positions, unchanged shapes/texture, SVG/PNG/GIF/MP4 exports, desktop/mobile. Artifacts: ${artifacts}`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
