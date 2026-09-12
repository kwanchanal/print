import { createRandom } from "../../seed.js";

export const algorithmVersion = "5";
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
  // Preserve the original fruit and sprinkle placement when adding seeded stems in v2.
  const cherryRandom = createRandom(`pudding:1:${seed}:cherry`);
  const cherry = seed === "original" ? { x: 468, y: 214 } : {
    x: 304 + cherryRandom() * 167,
    y: 212 + cherryRandom() * 34
  };
  const random = createRandom(`pudding:1:${seed}:sprinkles`);
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

export function cherryStem(seed = "original") {
  const points = [[23, -39], [57, -78], [83, -127], [43, -159], [7, -189], [-42, -163], [-68, -133]];
  if (seed === "original") return points;
  const random = createRandom(`pudding:${algorithmVersion}:${seed}:stem`);
  const direction = random() < .5 ? -1 : 1;
  const scale = .65 + random() * .35;
  const angle = (random() - .5) * .7;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  // Uniform scaling and rotation preserve the curve's shape and attachment point.
  return points.map(([x, y]) => [
    23 + scale * ((x - 23) * direction * cos - (y + 39) * sin),
    -39 + scale * ((x - 23) * direction * sin + (y + 39) * cos)
  ]);
}
