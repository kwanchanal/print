import { render as renderFruitRoll } from "../fruit-roll/artwork.js";
export { algorithmVersion, designSize, presets, animation, layoutOutput } from "../fruit-roll/artwork.js";

const ink = {
  red: "#ff593e",
  yellow: "#ffe45d",
  blue: "#426bb5",
  sky: "#a3dded",
  pink: "#f7a2ce",
  paper: "#fffdf2",
  green: "#3c9653",
  dark: "#334891",
  caramel: "#f2a632"
};

const colors = new Map([
  ["#f1d3c3", ink.pink], ["#c68a2a", ink.caramel], ["#a97428", ink.caramel], ["#fffbe1", ink.paper],
  ["#fff2b3", ink.paper], ["#fffdf0", ink.paper], ["#fffbe5", ink.paper], ["#ffdfcc", ink.paper],
  ["#f5b9a4", ink.pink], ["#e1e899", ink.sky], ["#536d27", ink.green], ["#ffe2cc", ink.paper]
]);

function element(tag, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

function recolorStops(svg, id, color) {
  const stops = svg.querySelectorAll(`#fruit-roll-${id} stop`);
  const colors = Array.isArray(color) ? color : [color];
  stops.forEach((stop, index) => stop.setAttribute("stop-color", colors[Math.min(index, colors.length - 1)]));
}

function flattenInk(svg) {
  for (const node of svg.querySelectorAll('[filter="url(#fruit-roll-edge)"], [filter="url(#fruit-roll-soft-edge)"]')) {
    node.removeAttribute("filter");
  }
  for (const stop of svg.querySelectorAll("#fruit-roll-sponge stop")) stop.setAttribute("stop-opacity", ".96");
  svg.querySelectorAll("#fruit-roll-stipple circle").forEach(circle => circle.setAttribute("opacity", ".42"));
}

export function render(container, options = {}) {
  renderFruitRoll(container, options);
  const svg = container.querySelector("svg");
  svg.querySelector("title").textContent = "FRUIT ROLL - RISO";
  svg.querySelector("desc").textContent = "A risograph-style fruit roll in the Pudding RISO palette, with pink paper, lemon yellow sponge, coral fruit, green kiwi and blue ink grain.";
  for (const node of svg.querySelectorAll("[fill], [stroke]")) {
    for (const attr of ["fill", "stroke"]) {
      const color = colors.get(node.getAttribute(attr));
      if (color) node.setAttribute(attr, color);
    }
  }
  recolorStops(svg, "sponge", ["#ffe45d", "#ffe45d", "#efb62f", "#efb62f", "#c68d32"]);
  recolorStops(svg, "cream-ink", ["#fffdf2", "#fffdf2", "#e9e4d5"]);
  recolorStops(svg, "berry-ink", ["#ff593e", "#ff593e", "#dd4339", "#dd4339", "#a7493f"]);
  recolorStops(svg, "kiwi-ink", ["#3c9653", "#3c9653", "#267b50"]);
  recolorStops(svg, "mango-ink", ["#ffe45d", "#ffe45d", "#f2a632"]);
  recolorStops(svg, "golden-fruit-ink", ["#ffe45d", "#ffe45d", "#f2a632"]);
  recolorStops(svg, "peach-ink", ["#ff593e", "#ff593e", "#dd4339", "#dd4339"]);
  recolorStops(svg, "curl-ink", ["#ffe45d", "#ffe45d", "#f2a632", "#c68d32"]);
  recolorStops(svg, "curl-shadow", ["#c68d32", "#c68d32", "#a74922", "#7e3c2e"]);
  svg.querySelector("#fruit-roll-background rect").setAttribute("fill", ink.pink);
  svg.querySelector("#fruit-roll-print-grain").replaceChildren(
    element("feTurbulence", { type: "fractalNoise", baseFrequency: ".7", numOctaves: "3", seed: "54", result: "noise" }),
    element("feColorMatrix", { in: "noise", type: "matrix", values: "0 0 0 0 1  0 0 0 0 .98  0 0 0 0 .84  0 0 0 .55 -.28", result: "paperGrain" }),
    element("feBlend", { in: "paperGrain", in2: "SourceGraphic", mode: "normal" })
  );
  flattenInk(svg);
}
