import test from "node:test";
import assert from "node:assert/strict";
import { toppings, onCream, sprinkleColors, cherryStem } from "../artworks/pudding/seeds.js";

test("Pudding seeds reproduce toppings and move both decorations", () => {
  assert.deepEqual(toppings("tea"), toppings("tea"));
  assert.notDeepEqual(toppings("tea").cherry, toppings("coffee").cherry);
  assert.notDeepEqual(toppings("tea").sprinkles, toppings("coffee").sprinkles);
  assert.deepEqual(toppings("original").cherry, { x: 468, y: 214 });
});

test("Toppings stay on cream, separated and clear of the cherry across seeds", () => {
  for (const seed of ["original", ...Array.from({ length: 200 }, (_, i) => `pudding-${i}`)]) {
    const { cherry, sprinkles } = toppings(seed);
    assert.ok(cherry.x >= 304 && cherry.x <= 471 && cherry.y >= 212 && cherry.y <= 246);
    assert.equal(sprinkles.length, 30, seed);
    assert.equal(new Set(sprinkles.map(p => p.color)).size, sprinkleColors.length);
    sprinkles.forEach((p, i) => {
      assert.ok(onCream(p.x, p.y));
      assert.ok(Math.hypot(p.x - cherry.x, p.y - cherry.y) >= 79);
      for (const q of sprinkles.slice(0, i)) assert.ok(Math.hypot(p.x - q.x, p.y - q.y) >= 14);
    });
  }
});

test("Seeded stems select only mirrored curves, stay attached, and fit the design", () => {
  const modes = new Set();
  assert.deepEqual(cherryStem("tea"), cherryStem("tea"));
  assert.notDeepEqual(cherryStem("tea"), cherryStem("coffee"));
  assert.deepEqual(cherryStem("original"), [[23, -39], [57, -78], [83, -127], [43, -159], [7, -189], [-42, -163], [-68, -133]]);
  for (let i = 0; i < 300; i++) {
    const seed = `stem-${i}`;
    const { cherry } = toppings(seed);
    const points = cherryStem(seed);
    assert.deepEqual(points[0], [23, -39]);
    const original = cherryStem("original");
    const cross = (points[1][0] - 23) * (points[2][1] + 39) - (points[1][1] + 39) * (points[2][0] - 23);
    modes.add(Math.sign(cross));
    assert.ok(Math.abs(cross) > 1);
    const distance = ([x, y], [px, py]) => Math.hypot(x - px, y - py);
    const scale = distance(points[0], points[1]) / distance(original[0], original[1]);
    for (let a = 0; a < points.length; a++) {
      for (let b = a + 1; b < points.length; b++) {
        assert.ok(Math.abs(distance(points[a], points[b]) / distance(original[a], original[b]) - scale) < 1e-10);
      }
    }
    // Cubic Beziers stay within their control-point hull, including between sampled points.
    for (const [x, y] of points) {
      assert.ok(x + cherry.x > 10 && x + cherry.x < 725);
      assert.ok(y + cherry.y > 20 && y <= -39);
    }
  }
  assert.deepEqual([...modes].sort(), [-1, 1]);
});
