import test from "node:test";
import assert from "node:assert/strict";
import { fruitPositions, validPlacement } from "../artworks/fruit-roll/seeds.js";

test("Fruit Roll preserves the reference and reproduces seeded translations", () => {
  assert.ok(Object.values(fruitPositions("original")).every(({x,y}) => x === 0 && y === 0));
  assert.deepEqual(fruitPositions("tea"), fruitPositions("tea"));
  assert.notDeepEqual(fruitPositions("tea"), fruitPositions("coffee"));
});

test("Fruit stays inside the cream, clear of neighbors and the sponge curl", () => {
  for (const seed of ["original", ...Array.from({length: 100}, (_,i) => `fruit-${i}`)]) {
    const positions = fruitPositions(seed);
    for (const [name, position] of Object.entries(positions)) {
      assert.ok(validPlacement(name, position, positions), `${seed}: ${name}`);
    }
  }
});
