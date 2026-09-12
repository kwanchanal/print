import { render as renderPudding } from "../pudding/artwork.js";
export { algorithmVersion, designSize, presets, animation, layoutOutput } from "../pudding/artwork.js";

const ink = {
  red: "#ff593e", yellow: "#ffe45d", blue: "#426bb5", sky: "#a3dded",
  pink: "#f7a2ce", paper: "#fffdf2", green: "#3c9653", dark: "#334891",
  caramel: "#f2a632", cherryShadow: "#dd4339", cherryLight: "#ff986d"
};
const colors = new Map([
  ["#401e13", ink.pink], ["#8c6239", ink.blue],
  ["#54371f", ink.dark], ["#d9b478", ink.sky],
  ["#e9e2d2", ink.sky], ["#b8a98c", ink.paper],
  ["#e9e4d5", ink.paper], ["#c9c5b6", ink.yellow],
  ["#faf6e9", ink.paper], ["#d1cdbf", ink.pink], ["#f9f5e7", ink.paper],
  ["#786658", ink.dark], ["#e75239", ink.red], ["#efb62f", ink.yellow],
  ["#258c89", ink.blue], ["#d96b94", ink.pink], ["#657fc0", ink.green], ["#f8f1d9", ink.paper],
  ["#cb512d", ink.dark], ["#dc4b28", ink.red], ["#bb3823", ink.cherryShadow], ["#ee6936", ink.cherryLight],
  ["#fff09a", ink.paper], ["#c68d32", ink.caramel], ["#a74922", ink.caramel],
  ["#797d77", ink.paper], ["#686d67", ink.paper], ["#616761", ink.dark], ["#623c29", ink.red]
]);

function element(tag, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

export function render(container, options = {}) {
  renderPudding(container, options);
  const svg = container.querySelector("svg");
  svg.querySelector("title").textContent = "PUDDING - RISO";
  svg.querySelector("desc").textContent = "A lemon-yellow pudding with golden caramel, ivory whipped cream, a coral cherry and rainbow sprinkles in a green coupe. A pink background, blue table and sky-blue striped napkin, with risograph-style ink grain.";
  for (const node of svg.querySelectorAll("[fill], [stroke]")) {
    for (const attr of ["fill", "stroke"]) {
      const color = colors.get(node.getAttribute(attr));
      if (color) node.setAttribute(attr, color);
    }
  }
  for (const [id, color] of [["custard", ink.yellow], ["silver", ink.green], ["caramel", ink.caramel]]) {
    for (const stop of svg.querySelectorAll(`#pudding-${id}-ink stop`)) stop.setAttribute("stop-color", color);
  }
  // Keep the existing geometry and seed mapping, but print broad, flat color plates.
  svg.querySelector("#pudding-cream-folds > path").setAttribute("opacity", ".25");
  svg.querySelector("#pudding-cream-folds > path:nth-child(4)").setAttribute("opacity", ".22");
  svg.querySelector("#pudding-coupe-shading > path").setAttribute("opacity", ".22");
  svg.querySelector("#pudding-cherry-fruit > path:nth-child(2)").setAttribute("opacity", "1");
  svg.querySelector("#pudding-cherry-fruit > path:nth-child(3)").setAttribute("opacity", ".7");
  for (const line of svg.querySelectorAll("#pudding-table > path")) line.setAttribute("opacity", ".035");
  svg.querySelector("#pudding-mottle feFuncA").setAttribute("slope", ".025");

  // Fixed paper-colored ink dropout replaces the original photographic grain.
  svg.querySelector("#pudding-riso").replaceChildren(
    element("feTurbulence", { type: "fractalNoise", baseFrequency: ".62", numOctaves: "3", seed: "38", result: "noise" }),
    element("feColorMatrix", { in: "noise", type: "matrix", values: "0 0 0 0 1  0 0 0 0 .984  0 0 0 0 .929  0 0 0 .65 -.32", result: "paperGrain" }),
    element("feComposite", { in: "paperGrain", in2: "SourceGraphic", operator: "in", result: "clippedGrain" }),
    element("feBlend", { in: "clippedGrain", in2: "SourceGraphic", mode: "normal" })
  );
}
