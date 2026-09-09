import test from "node:test";
import assert from "node:assert/strict";
import { randomPixels, convertPixels, palettes } from "../artworks/ascii/engine.js";

test("a named seed reproduces pixels independently of other renders", () => {
  const first = randomPixels("kwanchanok", 80, 48);
  const other = randomPixels("another seed", 80, 48);
  assert.deepEqual(first, randomPixels("kwanchanok", 80, 48));
  assert.notDeepEqual(first, other);
});

test("all palettes convert black and white to their endpoint characters", () => {
  for (const [palette, characters] of Object.entries(palettes)) {
    const cells = convertPixels(new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255]), { palette, brightness: 0, contrast: 0 });
    assert.equal(cells[0].character, characters.at(-1));
    assert.equal(cells[1].character, characters[0]);
  }
});

test("custom Unicode, empty palette, alpha and channel clipping", () => {
  const pixels = new Uint8Array([255, 255, 255, 255, 0, 0, 0, 0]);
  const settings = { palette: "Custom", characters: "\u2588.", brightness: 100, contrast: 100 };
  assert.deepEqual(convertPixels(pixels, settings)[0], { character: "\u2588", color: "rgb(255,255,255)" });
  assert.equal(convertPixels(pixels, settings)[1].character, " ");
  assert.equal(convertPixels(pixels, { ...settings, characters: "" })[0].character, " ");
});
