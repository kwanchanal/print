import test from "node:test";
import assert from "node:assert/strict";
import { algorithms, palettes, bayerMatrix, randomImage, dither, colorPaths } from "../artworks/halftone/engine.js";

const defaults = { algorithm: "Floyd-Steinberg", palette: "Black & White", scale: 1, brightness: 0, contrast: 1, color1: "#000000", color2: "#62d0a6" };

test("named seeds reproduce the source and different seeds vary it", () => {
  assert.deepEqual(randomImage("kwanchanok", 24, 24), randomImage("kwanchanok", 24, 24));
  assert.notDeepEqual(randomImage("kwanchanok", 24, 24), randomImage("another", 24, 24));
});

test("Bayer matrices have the expected orientation and all thresholds", () => {
  assert.deepEqual(bayerMatrix(2), [[0, 2], [3, 1]]);
  assert.deepEqual(bayerMatrix(4)[0], [0, 8, 2, 10]);
  for (const size of [2, 4, 8]) assert.deepEqual(bayerMatrix(size).flat().sort((a, b) => a - b), Array.from({ length: size * size }, (_, i) => i));
});

test("diffusion and ordered dithering produce known patterns", () => {
  const pixels = new Uint8ClampedArray([128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255]);
  assert.deepEqual([...dither(pixels, 2, 2, defaults).indices], [1, 0, 0, 1]);
  assert.deepEqual([...dither(pixels, 2, 2, { ...defaults, algorithm: "Ordered 2x2" }).indices], [0, 1, 1, 0]);
});

test("all seven algorithms and six palettes are repeatable without mutating input", () => {
  const pixels = randomImage("matrix", 31, 23), original = pixels.slice();
  for (const algorithm of algorithms) for (const palette of Object.keys(palettes)) {
    const settings = { ...defaults, algorithm, palette, scale: 3 };
    const first = dither(pixels, 31, 23, settings);
    assert.equal(first.indices.length, 11 * 8);
    assert.ok(first.indices.every(index => index < first.colors.length));
    assert.deepEqual(first, dither(pixels, 31, 23, settings));
    assert.ok(colorPaths(first).every(path => !path.includes("NaN")));
  }
  assert.deepEqual(pixels, original);
});

test("partial edge blocks retain their dimensions and white pixels in SVG", () => {
  const pixels = new Uint8ClampedArray(5 * 4 * 4).fill(255);
  const result = dither(pixels, 5, 4, { ...defaults, scale: 3 });
  assert.deepEqual(colorPaths(result), ["", "M0 0h5v3h-5zM0 3h5v1h-5z"]);
});

test("alpha composites on white and adjustments affect output", () => {
  const transparent = new Uint8ClampedArray([0, 0, 0, 0]);
  assert.equal(dither(transparent, 1, 1, defaults).indices[0], 1);
  const gray = new Uint8ClampedArray([100, 100, 100, 255]);
  assert.equal(dither(gray, 1, 1, defaults).indices[0], 0);
  assert.equal(dither(gray, 1, 1, { ...defaults, brightness: 100 }).indices[0], 1);
  assert.equal(dither(gray, 1, 1, { ...defaults, contrast: 0 }).indices[0], 1);
});
