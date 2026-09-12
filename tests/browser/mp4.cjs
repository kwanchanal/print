const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs/promises');
(async () => {
  const artifactDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'print-mp4-'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') console.log(m.text()); });
    await page.goto(`${process.env.PRINT_URL || 'http://127.0.0.1:8790/'}#pudding-riso`);
    await page.locator('#animation-controls summary').click();
    await page.locator('#animation-enabled').check();
    await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
    async function save(name) {
      const pending = page.waitForEvent('download', { timeout: 60000 });
      await page.locator('#animation-download-mp4').click();
      const download = await pending;
      await download.saveAs(path.join(artifactDirectory, `${name}.mp4`));
      const data = await fs.readFile(path.join(artifactDirectory, `${name}.mp4`));
      assert.equal(data.toString('ascii', 4, 8), 'ftyp');
      await page.route(`**/${name}.mp4`, route => route.fulfill({ body: data, contentType: 'video/mp4' }));
      return download.suggestedFilename();
    }
    assert.match(await save('pudding-video'), /-4\.5s\.mp4$/);
    const check = await page.evaluate(async () => {
      const video = document.createElement('video');
      video.src = '/pudding-video.mp4'; video.muted = true;
      await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = reject; });
      const { Input, BlobSource, ALL_FORMATS, CanvasSink } = await import('/artworks/shared/vendor/mediabunny.mjs');
      const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(await (await fetch('/pudding-video.mp4')).blob()) });
      const sink = new CanvasSink(await input.getPrimaryVideoTrack());
      const hashes = [];
      for (const time of [.1, .3, .7, 4.2]) {
        const { canvas } = await sink.getCanvas(time);
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let hash = 2166136261;
        for (const byte of pixels) hash = Math.imul(hash ^ byte, 16777619);
        hashes.push(hash);
      }
      input.dispose();
      return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, hashes };
    });
    console.log(check);
    assert.equal(check.width, 480); assert.equal(check.height, 640); assert.equal(check.duration, 4.5);
    assert.equal(check.hashes[0], check.hashes[1]); assert.notEqual(check.hashes[0], check.hashes[2]);
    assert.notEqual(check.hashes[0], check.hashes[3]);
    await page.screenshot({ path: path.join(artifactDirectory, 'mp4-desktop.png'), animations: 'disabled' });
    await page.locator('#animation-duration').fill('20'); await page.locator('#animation-duration').dispatchEvent('input');
    await page.locator('#animation-download-mp4').click(); await page.locator('#animation-cancel').click();
    assert.equal(await page.locator('#animation-status').textContent(), 'Export cancelled.');
    assert.ok(await page.locator('#animation-download').isEnabled());
    assert.ok(await page.locator('#animation-download-mp4').isEnabled());
    await page.locator('#animation-duration').fill('2'); await page.locator('#animation-duration').dispatchEvent('input');
    await page.locator('[aria-controls="canvas-panel"]').click(); await page.locator('[data-ratio="9:16"]').click();
    assert.match(await save('pudding-video-tall'), /9x16.*-1s\.mp4$/);
    const tall = await page.evaluate(async () => {
      const video = document.createElement('video'); video.src = '/pudding-video-tall.mp4';
      await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
      return [video.videoWidth, video.videoHeight, video.duration];
    });
    assert.deepEqual(tall, [480, 854, 1]);
    await page.evaluate(() => { window.savedVideoEncoder = window.VideoEncoder; window.VideoEncoder = undefined; });
    await page.locator('#animation-download-mp4').click();
    await page.waitForFunction(() => document.querySelector('#animation-status').textContent.includes('unavailable'));
    assert.ok(await page.locator('#animation-download').isEnabled());
    await page.evaluate(() => { window.VideoEncoder = window.savedVideoEncoder; });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(artifactDirectory, 'mp4-mobile.png'), fullPage: true, animations: 'disabled' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    console.log('PASS: real MP4, decoded playback, 4.5-second duration, half-second holds, variations, 9:16 padding, cancel, unsupported browser, mobile.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
