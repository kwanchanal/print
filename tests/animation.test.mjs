import test from "node:test";
import assert from "node:assert/strict";
import { animationDuration, variationSeed, frameDelay } from "../artworks/shared/animation-seeds.js";
import { toppings } from "../artworks/pudding/seeds.js";

test("animation starts at the selected seed and longer loops preserve their prefix", () => {
  const sequence = (seed, count) => Array.from({ length: count }, (_, i) => variationSeed(seed, i));
  const short = sequence("original", 9);
  assert.equal(short[0], "original");
  assert.deepEqual(short, sequence("original", 20).slice(0, 9));
  assert.equal(new Set(sequence("original", 20)).size, 20);
  assert.notDeepEqual(short, sequence("another", 9));
  assert.deepEqual(short.map(seed => toppings(seed)), sequence("original", 9).map(seed => toppings(seed)));
  assert.notDeepEqual(toppings(short[0]).cherry, toppings(short[1]).cherry);
  assert.notDeepEqual(toppings(short[0]).sprinkles, toppings(short[1]).sprinkles);
});

test("duration is a whole number of half-second frames bounded to 2-20", () => {
  assert.equal(frameDelay, 500);
  for (const [input, expected] of [[2, 2], [9, 9], [20, 20], [-1, 2], [99, 20], [9.4, 9], [NaN, 9], [Infinity, 9]]) {
    assert.equal(animationDuration(input), expected);
  }
});
