import { createRandom } from "../../seed.js";
import { fruitPositions } from "./seeds.js";
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
const ellipse = (cx, cy, rx, ry, attrs = {}) => el("ellipse", { cx, cy, rx, ry, ...attrs });
const layer = (name, children, attrs = {}) => el("g", { id: `fruit-roll-${name}`, "data-layer": name, ...attrs }, children);
const cake = "M254 74 C435 63 551 101 650 182 C737 253 776 353 775 465 C789 594 758 668 690 729 C604 804 458 811 318 796 C158 795 30 808 -42 718 C-126 623 -118 433 -77 291 C-48 172 47 82 149 76 C188 73 223 74 254 74 Z";
const cream = "M42 337 C77 229 181 171 309 169 C460 144 573 198 627 298 C679 390 705 519 650 617 C618 688 504 703 402 697 C247 717 119 710 61 622 C-3 530 2 428 42 337 Z";
const kiwi = "M137 332 L253 200 C291 222 314 259 320 306 L177 376 Z";
const mango = "M157 384 L253 373 C276 369 289 389 305 414 L348 474 C366 497 354 530 339 556 L306 626 C296 648 282 655 262 648 L140 613 C103 603 91 578 96 548 L115 427 C120 400 132 390 157 384 Z";
const peach = "M470 506 L558 598 L465 670 C441 635 433 603 442 567 C448 544 457 521 470 506 Z";
const curl = "M370 491 C394 484 429 486 443 490 C449 552 432 593 414 626 C386 676 369 709 348 750 L225 764 C282 714 327 663 349 604 C365 566 366 527 370 491 Z";

function gradient(name, stops, attrs = {}, radial = false) {
  return el(radial ? "radialGradient" : "linearGradient", { id: `fruit-roll-${name}`, ...attrs },
    stops.map(([offset, color, opacity = 1]) => el("stop", { offset, "stop-color": color, "stop-opacity": opacity })));
}

function berryOutline() {
  const random = createRandom("fruit-roll:strawberry-outline:1");
  const points = Array.from({ length: 48 }, (_, i) => {
    const angle = i * Math.PI * 2 / 48;
    const radius = 1 + (random() - .5) * .065;
    return [448 + Math.cos(angle) * 124 * radius, 336 + Math.sin(angle) * 125 * radius];
  });
  return points.map(([x,y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ") + " Z";
}

export function render(container, { seed = "original" } = {}) {
  const strawberry = berryOutline();
  const svg = el("svg", { xmlns: NS, class: "poster", viewBox: "-150 0 1000 870", role: "img", "aria-labelledby": "fruit-roll-title fruit-roll-desc" });
  svg.append(el("title", { id: "fruit-roll-title" }, ["Fruit Roll"]),
    el("desc", { id: "fruit-roll-desc" }, ["A tightly cropped cross-section of a golden sponge roll. Vanilla cream surrounds a green kiwi wedge, a coral strawberry slice, orange fruit and a yellow round fruit, with soft printed grain on peach-colored paper."]));
  const defs = el("defs", {}, [
    gradient("sponge", [[0,"#fff0b0"],[.53,"#fbe399"],[.72,"#f6d178"],[.88,"#edbc55"],[1,"#dba13b"]], { gradientUnits: "userSpaceOnUse", cx: 337, cy: 439, r: 445, gradientTransform: "translate(0 79.02) scale(1 .82)" }, true),
    gradient("cream-ink", [[0,"#fffce3"],[.75,"#fff8d5"],[1,"#f7e8b2"]], { cx: "49%", cy: "49%", r: "66%" }, true),
    gradient("berry-ink", [[0,"#f9cebd"],[.36,"#fbcfbc"],[.69,"#fbbca5"],[.88,"#f39a82"],[1,"#e97860"]], { cx: "50%", cy: "49%", r: "52%" }, true),
    gradient("kiwi-ink", [[0,"#d4dd85"],[.42,"#a7bd48"],[1,"#8d9f31"]], { x1: "15%", y1: "100%", x2: "70%", y2: "0%" }),
    gradient("mango-ink", [[0,"#ffe28b"],[.48,"#ffc250"],[1,"#f5a437"]], { cx: "35%", cy: "39%", r: "78%" }, true),
    gradient("golden-fruit-ink", [[0,"#ffe788"],[.65,"#ffdc58"],[1,"#f7d24d"]], { cx: "40%", cy: "45%", r: "65%" }, true),
    gradient("peach-ink", [[0,"#e97861"],[.3,"#f6a18a"],[.75,"#ffdcc5"],[1,"#ffe5cb"]]),
    gradient("curl-ink", [[0,"#fbe399"],[.4,"#f3ca6a"],[.75,"#e9b34c"],[1,"#dba13b"]], { x1: "0%", y1: "30%", x2: "100%", y2: "65%" }),
    gradient("curl-fade", [[0,"#ffffff"],[.45,"#ffffff"],[.75,"#ffffff",.4],[1,"#ffffff",0]], { gradientUnits: "userSpaceOnUse", x1: 0, y1: 490, x2: 0, y2: 740 }),
    el("mask", { id: "fruit-roll-curl-blend", maskUnits: "userSpaceOnUse", x: 200, y: 475, width: 270, height: 300 }, [rect(200,475,270,300,{ fill: "url(#fruit-roll-curl-fade)" })]),
    gradient("curl-shadow", [[0,"#bd862d",.38],[.45,"#bd862d",.25],[.8,"#bd862d",.07],[1,"#bd862d",0]], { gradientUnits: "userSpaceOnUse", x1: 0, y1: 490, x2: 0, y2: 730 }),
    ...[["cake",cake],["cream",cream],["kiwi",kiwi],["mango",mango],["strawberry",strawberry],["peach",peach],["curl",curl]].map(([name,d]) => el("clipPath", { id: `fruit-roll-${name}-clip` }, [path(d)])),
    el("filter", { id: "fruit-roll-soft-edge", x: "-5%", y: "-5%", width: "110%", height: "110%" }, [
      el("feGaussianBlur", { stdDeviation: "1.8" })
    ]),
    el("filter", { id: "fruit-roll-sponge-shade", x: "-30%", y: "-30%", width: "160%", height: "160%", "color-interpolation-filters": "sRGB" }, [
      el("feGaussianBlur", { stdDeviation: "12" })
    ]),
    el("filter", { id: "fruit-roll-edge", x: "-3%", y: "-3%", width: "106%", height: "106%" }, [
      el("feTurbulence", { type: "fractalNoise", baseFrequency: ".35", numOctaves: 2, seed: 31, result: "noise" }),
      el("feDisplacementMap", { in: "SourceGraphic", in2: "noise", scale: "3", xChannelSelector: "R", yChannelSelector: "G" })
    ]),
    el("filter", { id: "fruit-roll-print-grain", x: "0%", y: "0%", width: "100%", height: "100%", "color-interpolation-filters": "sRGB" }, [
      el("feTurbulence", { type: "fractalNoise", baseFrequency: ".78", numOctaves: 3, seed: 54, result: "grain" }),
      el("feColorMatrix", { in: "grain", type: "saturate", values: "0" }),
      el("feComponentTransfer", {}, [el("feFuncA", { type: "linear", slope: ".28" })]),
      el("feBlend", { in: "SourceGraphic", mode: "soft-light" })
    ])
  ]);
  const stipple = el("pattern", { id: "fruit-roll-stipple", width: 83, height: 79, patternUnits: "userSpaceOnUse" });
  const random = createRandom("fruit-roll:print-texture:1");
  for (let i = 0; i < 150; i++) stipple.append(ellipse(random()*83, random()*79, .3+random()*1.05, .3+random()*.85, { fill: i % 3 ? "#a97428" : "#fffbe1", opacity: i % 3 ? ".24" : ".62" }));
  defs.append(stipple);
  svg.append(defs);
  const print = layer("print", [], { filter: "url(#fruit-roll-print-grain)" });
  print.append(layer("background", [rect(-150,0,1000,870,{ fill: "#f1d3c3" })]));
  print.append(layer("sponge", [
    path(cake, { fill: "url(#fruit-roll-sponge)", filter: "url(#fruit-roll-edge)" }),
    layer("sponge-crumb", [
      path("M-20 270 C143 99 383 49 563 154 C653 209 699 286 731 384", { fill: "none", stroke: "#c68a2a", "stroke-width": 34, "stroke-linecap": "round", opacity: ".13", filter: "url(#fruit-roll-sponge-shade)" }),
      rect(-150,60,1000,760,{ fill: "url(#fruit-roll-stipple)" })
    ], { "clip-path": "url(#fruit-roll-cake-clip)" })
  ]));
  print.append(layer("cream", [
    path(cream, { fill: "url(#fruit-roll-cream-ink)", filter: "url(#fruit-roll-soft-edge)" }),
    layer("cream-folds", [
      path("M58 326 L197 326 L178 401 L57 454 Z", { fill: "#fff2b3", opacity: ".44" }),
      path("M376 167 L594 208 L594 335 L383 329 Z", { fill: "#fffdf0", opacity: ".48" }),
      path("M546 585 L684 584 L682 678 L567 704 Z", { fill: "#fffbe5", opacity: ".56" })
    ], { "clip-path": "url(#fruit-roll-cream-clip)" })
  ]));
  const kiwiLayer = layer("kiwi", [path(kiwi, { fill: "url(#fruit-roll-kiwi-ink)" })]);
  const kiwiDetails = layer("kiwi-fibers", [], { "clip-path": "url(#fruit-roll-kiwi-clip)" });
  for (let i = 0; i < 8; i++) kiwiDetails.append(path(`M155 360 L${251+i*12} ${195+i*17}`, { stroke: "#e1e899", "stroke-width": 4, opacity: ".4" }));
  for (const [x,y,angle] of [[216,270,40],[243,268,38],[257,285,47],[255,311,60],[204,296,35]]) kiwiDetails.append(ellipse(x,y,4,8,{ fill: "#536d27", opacity: ".83", transform: `rotate(${angle} ${x} ${y})` }));
  kiwiDetails.append(path(kiwi,{ fill: "url(#fruit-roll-stipple)", opacity: ".7" }));
  kiwiLayer.append(kiwiDetails);
  print.append(kiwiLayer);
  const berry = layer("strawberry", [path(strawberry,{ fill: "url(#fruit-roll-berry-ink)", filter: "url(#fruit-roll-edge)" })]);
  const fibers = layer("strawberry-fibers", [], { "clip-path": "url(#fruit-roll-strawberry-clip)" });
  for (let i = 0; i < 28; i++) {
    const angle = (i + (random() - .5) * .5) * Math.PI * 2 / 28;
    const inner = 49 + random() * 13, outer = 99 + random() * 16;
    const x = Math.cos(angle), y = Math.sin(angle);
    fibers.append(path(`M${448+x*inner} ${336+y*inner} L${448+x*outer-y*4} ${336+y*outer+x*4} L${448+x*outer+y*3} ${336+y*outer-x*3} Z`, { fill: "#ffdfcc", opacity: .25 + random() * .35, filter: "url(#fruit-roll-soft-edge)" }));
  }
  fibers.append(ellipse(449,338,49,55,{ fill: "#f5b9a4", opacity: ".25", filter: "url(#fruit-roll-soft-edge)" }), path(strawberry,{ fill: "url(#fruit-roll-stipple)", opacity: ".22" }));
  berry.append(fibers);
  print.append(berry);
  print.append(layer("mango", [
    path(mango,{ fill: "url(#fruit-roll-mango-ink)" }),
    path(mango,{ fill: "url(#fruit-roll-stipple)", opacity: ".18" })
  ]));
  print.append(layer("golden-fruit", [ellipse(565,499,66,65,{ fill: "url(#fruit-roll-golden-fruit-ink)", transform: "rotate(-22 565 499)", filter: "url(#fruit-roll-edge)" })]));
  const peachLayer = layer("peach", [path(peach,{ fill: "url(#fruit-roll-peach-ink)" })]);
  const peachFibers = layer("peach-fibers", [], { "clip-path": "url(#fruit-roll-peach-clip)" });
  for (let i = 0; i < 9; i++) peachFibers.append(path(`M539 596 L${444+i*3} ${520+i*18}`, { stroke: "#ffe2cc", "stroke-width": 5, opacity: ".53", filter: "url(#fruit-roll-soft-edge)" }));
  peachFibers.append(path(peach,{ fill: "url(#fruit-roll-stipple)", opacity: ".18" }));
  peachLayer.append(peachFibers);
  print.append(peachLayer);
  print.append(layer("sponge-curl", [
    path(curl,{ fill: "url(#fruit-roll-sponge)" }),
    path(curl,{ fill: "url(#fruit-roll-curl-ink)", mask: "url(#fruit-roll-curl-blend)" }),
    layer("curl-shading", [
      path("M442 491 C451 565 425 622 400 659 L348 750 L327 760 C361 696 399 638 418 582 C428 554 433 518 434 490 Z", { fill: "url(#fruit-roll-curl-shadow)", filter: "url(#fruit-roll-sponge-shade)" })
    ], { "clip-path": "url(#fruit-roll-curl-clip)" }),
    path(curl,{ fill: "url(#fruit-roll-stipple)" })
  ]));
  svg.append(print);
  for (const [name, { x, y }] of Object.entries(fruitPositions(seed))) {
    svg.querySelector(`#fruit-roll-${name}`).setAttribute("transform", `translate(${x} ${y})`);
  }
  container.replaceChildren(svg);
}

export function layoutOutput(svg, { outputWidth, outputHeight, outputScale }) {
  const scale = Math.min(outputWidth / 1000, outputHeight / 870) * outputScale;
  const width = outputWidth / scale, height = outputHeight / scale;
  const x = 350 - width / 2, y = 435 - height / 2;
  svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
  const background = svg.querySelector("#fruit-roll-background rect");
  for (const [key,value] of Object.entries({ x,y,width,height })) background.setAttribute(key,value);
  const filter = svg.querySelector("#fruit-roll-print-grain");
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  for (const [key,value] of Object.entries({ x,y,width,height })) filter.setAttribute(key,value);
}
