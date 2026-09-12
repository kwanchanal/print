import { createRandom } from "../../seed.js";
import { toppings, cherryStem } from "./seeds.js";
export { algorithmVersion, designSize, presets } from "./seeds.js";
export const animation = true;

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  node.append(...children);
  return node;
}
const path = (d, attrs = {}) => el("path", { d, ...attrs });
const rect = (x, y, width, height, attrs = {}) => el("rect", { x, y, width, height, ...attrs });
const layer = (name, children, attrs = {}) => el("g", { id: `pudding-${name}`, "data-layer": name, ...attrs }, children);
const cream = "M215 347 C210 312 230 286 255 277 C280 268 275 247 307 239 C329 236 342 220 329 202 C320 188 307 191 297 199 C300 176 328 155 355 158 C386 154 406 177 420 201 C433 224 435 250 461 265 C493 281 539 304 533 347 Z";
const custard = "M204 344 L542 348 L577 627 L152 627 Z";
const bowl = "M100 623 L634 626 C613 685 590 714 533 729 C493 739 449 735 419 742 C388 749 380 782 379 823 L379 891 C379 910 382 915 399 917 C446 920 501 923 507 939 L209 941 C209 925 265 920 312 917 C335 915 340 910 341 892 L343 827 C342 785 331 753 304 744 C281 735 236 739 198 728 C144 714 111 679 100 623 Z";

function gradient(id, stops, attrs = {}) {
  return el("linearGradient", { id: `pudding-${id}`, ...attrs }, stops.map(([offset, color, opacity = 1]) =>
    el("stop", { offset, "stop-color": color, "stop-opacity": opacity })));
}

function makeArt(seed) {
  const svg = el("svg", { xmlns: NS, class: "poster", viewBox: "0 0 735 994", role: "img", "aria-labelledby": "pudding-title pudding-desc" });
  svg.append(el("title", { id: "pudding-title" }, ["Pudding"]),
    el("desc", { id: "pudding-desc" }, ["A golden pudding in a silver dessert coupe on a striped napkin. Whipped cream holds rainbow sprinkles and a red cherry. A softly grainy risograph print."]));
  svg.append(el("defs", {}, [
    gradient("custard-ink", [["0", "#f6d972"], [".5", "#f1ca60"], ["1", "#e5b64d"]]),
    gradient("caramel-ink", [["0", "#a64b21", .95], [".18", "#b56b25", .72], [".48", "#c88b30", .32], [".76", "#c88b30", .08], ["1", "#c88b30", 0]],
      { gradientUnits: "userSpaceOnUse", x1: 0, y1: 344, x2: 0, y2: 390 }),
    gradient("silver-ink", [["0", "#92928b"], [".46", "#acaba4"], ["1", "#858680"]]),
    el("clipPath", { id: "pudding-cream-clip" }, [path(cream)]),
    el("clipPath", { id: "pudding-custard-clip" }, [path(custard)]),
    el("clipPath", { id: "pudding-bowl-clip" }, [path(bowl)]),
    el("pattern", { id: "pudding-halftone", width: 3.6, height: 3.6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(19)" }, [
      el("circle", { cx: .8, cy: .8, r: .48, fill: "#623c29", opacity: .25 })
    ]),
    // Fixed noise seeds keep the ink and paper identical as toppings move.
    el("filter", { id: "pudding-riso", x: "0%", y: "0%", width: "100%", height: "100%", "color-interpolation-filters": "sRGB" }, [
      el("feTurbulence", { type: "fractalNoise", baseFrequency: .72, numOctaves: 3, seed: 38, result: "grain" }),
      el("feColorMatrix", { in: "grain", type: "saturate", values: 0 }),
      el("feComponentTransfer", {}, [el("feFuncA", { type: "linear", slope: .3 })]),
      el("feBlend", { in: "SourceGraphic", mode: "soft-light" })
    ]),
    el("filter", { id: "pudding-mottle", x: "0%", y: "0%", width: "100%", height: "100%", "color-interpolation-filters": "sRGB" }, [
      el("feTurbulence", { type: "fractalNoise", baseFrequency: .018, numOctaves: 3, seed: 12 }),
      el("feColorMatrix", { type: "saturate", values: 0 }),
      el("feComponentTransfer", {}, [el("feFuncA", { type: "linear", slope: .08 })]),
      el("feBlend", { in: "SourceGraphic", mode: "soft-light" })
    ])
  ]));
  const print = layer("print", [], { filter: "url(#pudding-riso)" });
  print.append(layer("background", [rect(0, 0, 735, 994, { fill: "#401e13" })]));
  const table = layer("table", [rect(0, 775, 735, 219, { fill: "#8c6239" })]);
  const woodRandom = createRandom("pudding:wood:1");
  for (let i = 0; i < 190; i++) {
    const y = 777 + woodRandom() * 217;
    table.append(path(`M0 ${y} Q${200 + woodRandom() * 300} ${y + woodRandom() * 8} 735 ${y + woodRandom() * 3}`, {
      fill: "none", stroke: i % 3 ? "#54371f" : "#d9b478", "stroke-width": .4 + woodRandom() * 1.8, opacity: .13
    }));
  }
  print.append(table, layer("napkin", [
    path("M128 821 L679 824 L627 994 L59 994 Z", { fill: "#e9e2d2" }),
    path("M118 847 L671 848 M644 823 L585 994", { stroke: "#b8a98c", "stroke-width": 4, fill: "none", opacity: .8 })
  ]));
  print.append(layer("cream", [
    path(cream, { fill: "#e9e4d5" }),
    layer("cream-folds", [
      path("M345 157 C375 197 353 250 321 286 C308 302 301 330 308 348 L215 348 C214 309 238 285 263 276 C282 264 283 245 311 238 C338 232 340 216 329 201 C320 190 306 191 297 199 Z", { fill: "#c9c5b6", opacity: .58 }),
      path("M353 157 C393 203 369 252 340 282 C318 304 304 324 314 349 C295 326 310 302 329 279 C358 246 379 198 353 157 Z", { fill: "#faf6e9" }),
      path("M398 182 C430 235 407 267 384 297 L357 348 C368 316 374 299 392 273 C412 240 413 214 398 182 Z", { fill: "#faf6e9", opacity: .8 }),
      path("M457 260 C456 294 434 324 414 348 L466 348 C484 327 504 308 505 295 Z", { fill: "#d1cdbf", opacity: .65 }),
      path("M472 270 C486 295 454 327 447 347 C465 327 497 299 486 283 Z", { fill: "#f9f5e7", opacity: .65 })
    ], { "clip-path": "url(#pudding-cream-clip)" })
  ]));
  const { cherry, sprinkles } = toppings(seed);
  const stem = cherryStem(seed).map(point => point.join(" "));
  print.append(layer("sprinkles", sprinkles.map(({ x, y, angle, color }, i) =>
    el("g", { id: `pudding-sprinkle-${i}`, transform: `translate(${x} ${y}) rotate(${angle})` }, [
      path("M-3.6 1 L3.6 1", { fill: "none", stroke: "#786658", "stroke-width": 3.8, opacity: .18, "stroke-linecap": "round" }),
      path("M-3.6 0 L3.6 0", { fill: "none", stroke: color, "stroke-width": 3.3, "stroke-linecap": "round" })
    ])), { "clip-path": "url(#pudding-cream-clip)" }));
  print.append(layer("cherry", [
    layer("cherry-stem", [path(`M${stem[0]} C${stem.slice(1, 4).join(" ")} C${stem.slice(4).join(" ")}`, {
      fill: "none", stroke: "#cb512d", "stroke-width": 4.2, "stroke-linecap": "round"
    })]),
    layer("cherry-fruit", [
      path("M0 -64 C-33 -72 -67 -45 -69 -12 C-76 29 -48 61 -9 63 C29 65 67 45 70 8 C73 -22 52 -45 29 -46 C20 -60 10 -64 0 -64 Z", { fill: "#dc4b28" }),
      path("M-59 -24 C-64 19 -39 49 -3 54 C34 60 59 33 63 9 C70 51 23 71 -12 62 C-53 59 -77 19 -59 -24 Z", { fill: "#bb3823", opacity: .25 }),
      path("M-44 -38 C-28 -56 -4 -59 10 -49", { stroke: "#ee6936", "stroke-width": 8, "stroke-linecap": "round", fill: "none", opacity: .25 })
    ])
  ], { transform: `translate(${cherry.x} ${cherry.y})` }));
  print.append(layer("custard", [
    path(custard, { fill: "url(#pudding-custard-ink)" }),
    layer("custard-ink-overlap", [
      path("M204 345 L223 346 L178 627 L152 627 Z", { fill: "#fff09a", opacity: .23 }),
      path("M526 347 L542 348 L577 627 L555 627 Z", { fill: "#c68d32", opacity: .22 }),
      rect(150, 345, 430, 283, { fill: "url(#pudding-halftone)", opacity: .45 })
    ], { "clip-path": "url(#pudding-custard-clip)" })
  ]));
  print.append(layer("caramel", [
    path(custard, { fill: "url(#pudding-caramel-ink)" }),
    path("M204 344 L542 348", { stroke: "#a74922", "stroke-width": 2, opacity: .45 })
  ], { "clip-path": "url(#pudding-custard-clip)" }));
  print.append(layer("coupe", [
    path(bowl, { fill: "url(#pudding-silver-ink)" }),
    layer("coupe-shading", [
      path("M99 625 C204 749 482 770 635 626 L633 728 L102 743 Z", { fill: "#797d77", opacity: .16 }),
      path("M311 748 L407 748 M334 787 L386 787", { fill: "none", stroke: "#686d67", "stroke-width": 4, opacity: .45 }),
      path("M211 936 L506 934", { fill: "none", stroke: "#616761", "stroke-width": 8, opacity: .44 }),
      rect(100, 623, 535, 318, { fill: "url(#pudding-halftone)", opacity: .32 })
    ], { "clip-path": "url(#pudding-bowl-clip)" })
  ]));
  svg.append(layer("paper", [print], { filter: "url(#pudding-mottle)" }));
  return svg;
}

export function render(container, { seed = "original" } = {}) {
  container.replaceChildren(makeArt(seed));
}

export function layoutOutput(svg, { outputWidth, outputHeight, outputScale }) {
  const scale = Math.min(outputWidth / 735, outputHeight / 994) * outputScale;
  const width = outputWidth / scale;
  const height = outputHeight / scale;
  const x = (735 - width) / 2;
  const y = (994 - height) / 2;
  svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);

  const background = svg.querySelector("#pudding-background rect");
  for (const [key, value] of Object.entries({ x, y, width, height })) background.setAttribute(key, value);

  // Keep the horizon attached to the coupe; only the table surface fills the new bounds.
  const tableHeight = Math.max(1, y + height - 775);
  svg.querySelector("#pudding-table").setAttribute("transform",
    `translate(${x} 775) scale(${width / 735} ${tableHeight / 219}) translate(0 -775)`);
  for (const id of ["pudding-riso", "pudding-mottle"]) {
    const filter = svg.querySelector(`#${id}`);
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    for (const [key, value] of Object.entries({ x, y, width, height })) filter.setAttribute(key, value);
  }
}
