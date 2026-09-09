import { createRandom } from "../../seed.js";

export const algorithmVersion = "1";
export const designSize = { width: 600, height: 600 };
export const presets = [{ seed: "original", label: "Original" }];
const anchors = [
  [-22, -43, -14], [1, -49, -7], [-29, -22, -9], [-5, -25, -6],
  [-32, -2, -8], [-8, -4, -5], [-31, 19, -7], [-7, 18, -5],
  [-24, 41, -9], [0, 39, -6]
];

export function seedPositions(seed, pocket) {
  if (seed === "original") return anchors.map(point => [...point]);
  const random = createRandom(`butternut:${algorithmVersion}:${seed}:${pocket}`);
  const placed = [];
  for (const [x, y, angle] of anchors) {
    let candidate = [x, y, angle];
    // Bounded jitter preserves the composition; elliptical spacing limits overlap.
    for (let attempt = 0; attempt < 40; attempt++) {
      const next = [x + (random() - 0.5) * 10, y + (random() - 0.5) * 10, angle + (random() - 0.5) * 16];
      if (placed.every(([px, py]) => ((next[0] - px) / 23) ** 2 + ((next[1] - py) / 15) ** 2 >= 1)) {
        candidate = next;
        break;
      }
    }
    placed.push(candidate);
  }
  return placed;
}
