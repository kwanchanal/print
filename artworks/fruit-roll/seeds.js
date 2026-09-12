import { createRandom } from "../../seed.js";

export const algorithmVersion = "1";
export const designSize = { width: 1000, height: 870 };
export const presets = [{ seed: "original", label: "Original" }];

const oval = (cx, cy, rx, ry) => Array.from({ length: 20 }, (_, i) => {
  const angle = i * Math.PI / 10;
  return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
});
export const fruitBounds = {
  kiwi: [[137,332],[253,200],[292,229],[316,274],[320,306],[177,376]],
  strawberry: oval(448,336,130,131),
  mango: [[115,427],[132,390],[157,379],[253,369],[280,383],[354,475],[362,507],[306,635],[278,654],[133,616],[94,583],[92,548]],
  "golden-fruit": oval(565,499,68,68),
  peach: [[470,506],[558,598],[465,670],[441,625],[437,585],[450,543]]
};
const creamBounds = [[42,337],[78,267],[175,191],[309,169],[459,174],[573,231],[627,298],[668,389],[680,489],[665,570],[650,617],[601,668],[504,697],[402,697],[250,702],[150,680],[61,622],[26,536],[20,433]];
// Convex strips follow the wider curved fold without blocking the cream beside it.
const curlBounds = [
  [[370,484],[446,484],[445,545],[359,545]],
  [[359,545],[445,545],[424,610],[345,610]],
  [[345,610],[424,610],[394,670],[310,670]],
  [[310,670],[394,670],[357,740],[244,740]],
  [[244,740],[357,740],[348,765],[225,765]]
];

export function translatedFruit(name, { x, y }) {
  return fruitBounds[name].map(([px,py]) => [px+x,py+y]);
}

function inside([x,y], polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax,ay] = polygon[i], [bx,by] = polygon[j];
    if ((ay > y) !== (by > y) && x < (bx-ax)*(y-ay)/(by-ay)+ax) result = !result;
  }
  return result;
}

// Separating-axis checks on conservative convex fruit outlines keep translations apart.
function overlaps(a, b) {
  for (const polygon of [a,b]) {
    for (let i = 0; i < polygon.length; i++) {
      const [x,y] = polygon[i], [nx,ny] = polygon[(i+1)%polygon.length];
      const project = ([px,py]) => px*(y-ny)+py*(nx-x);
      const pa = a.map(project), pb = b.map(project);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}

export function validPlacement(name, position, placements) {
  const shape = translatedFruit(name, position);
  return shape.every(point => inside(point, creamBounds)) && !curlBounds.some(strip => overlaps(shape, strip)) &&
    Object.entries(placements).every(([other, offset]) => other === name || !overlaps(shape, translatedFruit(other, offset)));
}

export function fruitPositions(seed = "original") {
  const placements = Object.fromEntries(Object.keys(fruitBounds).map(name => [name, { x: 0, y: 0 }]));
  if (seed === "original") return placements;
  const random = createRandom(`fruit-roll:${algorithmVersion}:${seed}:positions`);
  const names = Object.keys(placements);
  // Several bounded passes let neighbors make room without moving the cake or changing fruit size.
  for (let pass = 0; pass < 3; pass++) {
    for (const name of names) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const candidate = { x: (random()-.5)*70, y: (random()-.5)*60 };
        if (validPlacement(name, candidate, placements)) { placements[name] = candidate; break; }
      }
    }
  }
  return placements;
}
