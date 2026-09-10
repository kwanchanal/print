const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
(async () => {
  const artifactDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'print-animation-'));
  console.log(`Artifacts: ${artifactDirectory}`);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${process.env.PRINT_URL || 'http://127.0.0.1:8790/'}#pudding`);
    await page.locator('#pudding-cherry').waitFor();
    await page.locator('#animation-controls summary').click();
    assert.equal(await page.locator('#animation-duration').inputValue(), '9');
    assert.ok(await page.locator('#animation-download').isEnabled());
    const base = await page.locator('#pudding-cherry').getAttribute('transform');
    await page.locator('#animation-enabled').check();
    await page.waitForFunction(() => document.querySelector('#animation-frame').textContent === '2 / 9');
    assert.notEqual(await page.locator('#pudding-cherry').getAttribute('transform'), base);
    await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
    const paused = await page.locator('#animation-frame').textContent();
    await page.waitForTimeout(1150);
    assert.equal(await page.locator('#animation-frame').textContent(), paused);
    const downloadGIF = async name => {
      const pending = page.waitForEvent('download', { timeout: 60000 });
      await page.locator('#animation-download').click();
      const item = await pending;
      await item.saveAs(path.join(artifactDirectory, `${name}.gif`));
      return item.suggestedFilename();
    };
    assert.match(await downloadGIF('pudding-animation'), /-4\.5s\.gif$/);
    assert.equal(await page.locator('#animation-status').textContent(), 'GIF ready.');
    await downloadGIF('pudding-animation-repeat');
    assert.deepEqual(await fs.readFile(path.join(artifactDirectory, 'pudding-animation.gif')), await fs.readFile(path.join(artifactDirectory, 'pudding-animation-repeat.gif')));
    const bytes = await fs.readFile(path.join(artifactDirectory, 'pudding-animation.gif'));
    await page.route('**/__test.gif', route => route.fulfill({ contentType: 'image/gif', body: bytes }));
    const decoded = await page.evaluate(async () => {
      const data = await (await fetch('/__test.gif')).arrayBuffer();
      const decoder = new ImageDecoder({ data, type: 'image/gif' });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      const results = [];
      let first;
      for (let i = 0; i < track.frameCount; i++) {
        const { image } = await decoder.decode({ frameIndex: i });
        const canvas = document.createElement('canvas');
        canvas.width = image.displayWidth; canvas.height = image.displayHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let changed = 0, changedBelowCream = 0, transparent = 0;
        const samples = [];
        if (!first) first = new Uint8ClampedArray(rgba);
        for (let p = 0; p < rgba.length; p += 4) {
          if (rgba[p + 3] !== 255) transparent++;
          if (rgba[p] !== first[p] || rgba[p + 1] !== first[p + 1] || rgba[p + 2] !== first[p + 2]) {
            changed++;
            if (p / 4 / canvas.width >= 230) {
              changedBelowCream++;
              if (samples.length < 15) samples.push([p / 4 % canvas.width, Math.floor(p / 4 / canvas.width), Array.from(first.slice(p,p+3)), Array.from(rgba.slice(p,p+3))]);
            }
          }
        }
        results.push({ width: canvas.width, height: canvas.height, duration: image.duration, changed, changedBelowCream, transparent, samples });
        image.close();
      }
      const loop = track.repetitionCount;
      decoder.close();
      return { frames: results, loopsForever: loop === Infinity };
    });
    assert.equal(decoded.frames.length, 9);
    assert.ok(decoded.loopsForever);
    for (const [index, f] of decoded.frames.entries()) {
      assert.equal(f.duration, 500000);
      assert.equal(f.width, 480); assert.equal(f.height, 640);
      assert.equal(f.transparent, 0); assert.equal(f.changedBelowCream, 0);
      if (index) assert.ok(f.changed > 0);
    }
    console.log('GIF decoded: 9 frames, 1s each, infinite loop, opaque 480x640, fixed background, moving toppings, identical bytes on repeat.');
    await page.screenshot({ path: path.join(artifactDirectory, 'animation-desktop.png'), animations: 'disabled' });
    await page.locator('#animation-duration').fill('2');
    await page.locator('#animation-duration').dispatchEvent('input');
    await page.getByRole('button', { name: 'Play animation', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#animation-frame').textContent === '2 / 2');
    await page.waitForFunction(() => document.querySelector('#animation-frame').textContent === '1 / 2');
    await page.locator('#animation-enabled').uncheck();
    assert.equal(await page.locator('#pudding-cherry').getAttribute('transform'), base);
    await page.locator('#animation-enabled').check();
    await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
    await page.locator('#animation-duration').fill('20');
    await page.locator('#animation-duration').dispatchEvent('input');
    await page.locator('#animation-download').click();
    await page.locator('#animation-cancel').click();
    assert.equal(await page.locator('#animation-status').textContent(), 'Export cancelled.');
    assert.ok(await page.locator('#animation-download').isEnabled());
    await page.evaluate(() => {
      const originalWorker = window.Worker;
      window.Worker = class {
        constructor() {
          window.Worker = originalWorker;
          throw new Error('Simulated worker startup failure');
        }
      };
    });
    await page.locator('#animation-download').click();
    await page.waitForFunction(() => document.querySelector('#animation-status').textContent.includes('Could not export'));
    assert.ok(await page.locator('#animation-download').isEnabled());
    assert.match(await downloadGIF('pudding-animation-long'), /-10s\.gif$/);
    const longBytes = await fs.readFile(path.join(artifactDirectory, 'pudding-animation-long.gif'));
    await page.route('**/__long.gif', route => route.fulfill({ contentType: 'image/gif', body: longBytes }));
    const longCount = await page.evaluate(async () => {
      const decoder = new ImageDecoder({ data: await (await fetch('/__long.gif')).arrayBuffer(), type: 'image/gif' });
      await decoder.tracks.ready;
      const count = decoder.tracks.selectedTrack.frameCount;
      decoder.close();
      return count;
    });
    assert.equal(longCount, 20);
    await page.locator('#animation-download').click();
    await page.locator('#seed-input').fill('new-animation');
    await page.locator('#seed-input').press('Enter');
    await page.waitForFunction(() => document.querySelector('#artwork-stage > svg').dataset.seed === 'new-animation');
    assert.equal(await page.locator('#animation-controls').getAttribute('aria-busy'), 'false');
    await page.locator('#animation-duration').fill('2');
    await page.locator('#animation-duration').dispatchEvent('input');
    await page.locator('[aria-controls="canvas-panel"]').click();
    await page.locator('[data-ratio="16:9"]').click();
    await page.locator('#output-size-control').fill('30');
    await page.locator('#output-size-control').dispatchEvent('input');
    assert.match(await downloadGIF('pudding-animation-wide'), /16x9-size30-2s\.gif$/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(artifactDirectory, 'animation-mobile.png'), fullPage: true, animations: 'disabled' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('#artwork-select').click();
    await page.locator('[data-value="butternut"]').click();
    await page.waitForFunction(() => document.querySelector('#artwork-stage > svg').dataset.collection === 'butternut');
    assert.ok(await page.locator('#animation-controls').isHidden());
    await page.locator('#artwork-select').click();
    await page.locator('[data-value="pudding"]').click();
    await page.waitForFunction(() => document.querySelector('#artwork-stage > svg').dataset.collection === 'pudding');
    assert.ok(await page.locator('#animation-enabled').isChecked());
    assert.deepEqual(errors, []);
    console.log('PASS: Play/pause, loop, duration bounds, disabling, cancel, seed invalidation, frame/size export, mobile, collection switch.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
