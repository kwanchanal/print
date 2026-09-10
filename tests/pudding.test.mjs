import test from "node:test";
import assert from "node:assert/strict";
import { toppings, onCream, sprinkleColors } from "../artworks/pudding/seeds.js";

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
