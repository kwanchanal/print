import { createRandom } from "../../seed.js";

export const algorithmVersion = "1";
export const designSize = { width: 735, height: 994 };
export const presets = [{ seed: "original", label: "Original" }];
export const sprinkleColors = ["#e75239", "#efb62f", "#258c89", "#d96b94", "#657fc0", "#f8f1d9"];

// An inset polygon avoids the cream's curled tip and scalloped outer edge.
const creamInset = [[232, 328], [241, 303], [280, 288], [306, 259], [345, 245],
  [355, 187], [376, 185], [397, 207], [418, 253], [468, 280], [507, 308], [517, 328]];

export function onCream(x, y) {
  let inside = false;
  for (let i = 0, j = creamInset.length - 1; i < creamInset.length; j = i++) {
    const [ax, ay] = creamInset[i];
    const [bx, by] = creamInset[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

export function toppings(seed = "original") {
  const cherryRandom = createRandom(`pudding:${algorithmVersion}:${seed}:cherry`);
  const cherry = seed === "original" ? { x: 468, y: 214 } : {
    x: 304 + cherryRandom() * 167,
    y: 212 + cherryRandom() * 34
  };
  const random = createRandom(`pudding:${algorithmVersion}:${seed}:sprinkles`);
  const sprinkles = [];
  for (let attempt = 0; attempt < 12000 && sprinkles.length < 30; attempt++) {
    const x = 232 + random() * 285;
    const y = 185 + random() * 143;
    if (!onCream(x, y) || Math.hypot(x - cherry.x, y - cherry.y) < 79) continue;
    if (sprinkles.some(p => Math.hypot(x - p.x, y - p.y) < 14)) continue;
    sprinkles.push({ x, y, angle: random() * 180, color: sprinkleColors[sprinkles.length % sprinkleColors.length] });
  }
  return { cherry, sprinkles };
}
