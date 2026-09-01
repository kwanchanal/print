const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function path(d, attrs = {}) {
  return svgEl("path", { d, ...attrs });
}

function ellipse(cx, cy, rx, ry, attrs = {}) {
  return svgEl("ellipse", { cx, cy, rx, ry, ...attrs });
}

function rect(x, y, width, height, attrs = {}) {
  return svgEl("rect", { x, y, width, height, ...attrs });
}

function grainFilter(id, seed, frequency, density = 0.42) {
  return svgEl("filter", { id, x: "-8%", y: "-8%", width: "116%", height: "116%" }, [
    svgEl("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: frequency,
      numOctaves: "4",
      seed,
      result: "noise"
    }),
    svgEl("feColorMatrix", {
      in: "noise",
      type: "matrix",
      values: `0 0 0 0 0.8  0 0 0 0 0.45  0 0 0 0 0.12  0 0 0 ${density} 0`,
      result: "warmNoise"
    }),
    svgEl("feBlend", { in: "SourceGraphic", in2: "warmNoise", mode: "multiply" })
  ]);
}

function makeArt() {
  const svg = svgEl("svg", {
    class: "poster",
    viewBox: "0 0 600 600",
    role: "img",
    "aria-labelledby": "art-title art-desc"
  });

  svg.append(
    svgEl("title", { id: "art-title" }, [document.createTextNode("Geometric butternut squash")]),
    svgEl("desc", { id: "art-desc" }, [
      document.createTextNode("A geometric yellow butternut squash with halftone grain, seed pockets, and a muted isometric bottom.")
    ])
  );

  const defs = svgEl("defs");
  const bodyShape =
    "M300 39 C236 39 202 61 202 112 L202 238 C202 281 174 306 153 359 C126 427 155 485 231 497 C253 501 275 501 300 501 C325 501 347 501 369 497 C445 485 474 427 447 359 C426 306 398 281 398 238 L398 112 C398 61 364 39 300 39 Z";
  const capShape =
    "M152 411 C170 466 229 529 300 549 C371 529 430 466 448 411 C431 464 369 500 300 500 C231 500 169 464 152 411 Z";

  defs.append(
    svgEl("linearGradient", { id: "skin-gradient", x1: "300", y1: "36", x2: "300", y2: "510", gradientUnits: "userSpaceOnUse" }, [
      svgEl("stop", { offset: "0", "stop-color": "#ffd94a" }),
      svgEl("stop", { offset: ".38", "stop-color": "#f6b936" }),
      svgEl("stop", { offset: ".74", "stop-color": "#ef982b" }),
      svgEl("stop", { offset: "1", "stop-color": "#e5872b" })
    ]),
    svgEl("radialGradient", { id: "skin-glow", cx: "48%", cy: "22%", r: "73%" }, [
      svgEl("stop", { offset: "0", "stop-color": "#ffe66e", "stop-opacity": ".92" }),
      svgEl("stop", { offset: ".48", "stop-color": "#f6ae31", "stop-opacity": ".22" }),
      svgEl("stop", { offset: "1", "stop-color": "#b95725", "stop-opacity": ".2" })
    ]),
    svgEl("linearGradient", { id: "cap-gradient", x1: "176", y1: "410", x2: "420", y2: "552", gradientUnits: "userSpaceOnUse" }, [
      svgEl("stop", { offset: "0", "stop-color": "#d9d0a4" }),
      svgEl("stop", { offset: ".48", "stop-color": "#b4aa7a" }),
      svgEl("stop", { offset: "1", "stop-color": "#837857" })
    ]),
    svgEl("clipPath", { id: "body-clip" }, [path(bodyShape)]),
    svgEl("clipPath", { id: "cap-clip" }, [path(capShape)]),
    svgEl("pattern", { id: "dot-print", width: "6", height: "6", patternUnits: "userSpaceOnUse", patternTransform: "rotate(-12)" }, [
      svgEl("circle", { cx: "1.2", cy: "1.4", r: ".9", fill: "#a95c25", opacity: ".28" }),
      svgEl("circle", { cx: "4.8", cy: "4.6", r: ".42", fill: "#ffeaa0", opacity: ".2" })
    ]),
    svgEl("pattern", { id: "fine-print", width: "4", height: "4", patternUnits: "userSpaceOnUse", patternTransform: "rotate(7)" }, [
      svgEl("circle", { cx: "1", cy: "1", r: ".42", fill: "#8f4a20", opacity: ".26" }),
      svgEl("circle", { cx: "3", cy: "3", r: ".28", fill: "#fff2b8", opacity: ".2" })
    ]),
    grainFilter("grain-heavy", "28", ".78", ".36"),
    grainFilter("grain-soft", "51", "1.15", ".18")
  );

  svg.appendChild(defs);
  svg.append(rect(0, 0, 600, 600, { fill: "#fbfaf7" }));

  const squash = svgEl("g", { filter: "url(#grain-heavy)" });

  squash.append(
    path("M283 8 L296 8 L296 71 L281 71 Z", { fill: "#c7bb7b", opacity: ".82" }),
    path("M298 8 L309 8 L313 71 L296 71 Z", { fill: "#e3d796", opacity: ".9" }),
    path("M314 9 L327 9 L334 70 L316 70 Z", { fill: "#b8aa70", opacity: ".72" }),
    path("M268 30 L332 30 L339 72 L262 72 Z", { fill: "#d8cb8e", opacity: ".36" })
  );

  squash.append(path(bodyShape, { fill: "url(#skin-gradient)" }));

  const bodyLayers = svgEl("g", { "clip-path": "url(#body-clip)" });
  bodyLayers.append(
    path("M158 496 C191 332 200 188 232 42 L289 38 C276 181 255 354 236 507 Z", { fill: "#ffe76a", opacity: ".34" }),
    path("M325 39 L386 44 C381 181 398 338 440 491 L362 508 C345 366 331 192 325 39 Z", { fill: "#b85f25", opacity: ".18" }),
    path("M288 38 L313 38 C302 176 306 364 314 507 L282 507 C291 359 295 177 288 38 Z", { fill: "#fff19a", opacity: ".15" }),
    path("M126 316 C185 389 231 431 300 451 C236 493 169 479 151 421 C142 390 143 356 126 316 Z", { fill: "#cf7828", opacity: ".15" }),
    path("M474 316 C415 389 369 431 300 451 C364 493 431 479 449 421 C458 390 457 356 474 316 Z", { fill: "#bf6727", opacity: ".16" }),
    path("M126 31 H474 V510 H126 Z", { fill: "url(#dot-print)", opacity: ".82" }),
    path("M126 31 H474 V510 H126 Z", { fill: "url(#fine-print)", opacity: ".5" }),
    path("M204 67 C255 48 345 48 396 67 L396 122 C343 96 257 96 204 122 Z", { fill: "#ffdf50", opacity: ".16" })
  );
  squash.append(bodyLayers);

  squash.append(path(capShape, { fill: "url(#cap-gradient)", opacity: ".92" }));

  const capLayers = svgEl("g", { "clip-path": "url(#cap-clip)" });
  for (let i = 0; i <= 15; i += 1) {
    const angle = (-74 + i * 12) * Math.PI / 180;
    capLayers.append(
      svgEl("line", {
        x1: "300",
        y1: "499",
        x2: 300 + Math.cos(angle) * 178,
        y2: 499 + Math.sin(angle) * 145,
        stroke: "#766d51",
        "stroke-width": "2.2",
        "stroke-linecap": "round",
        opacity: ".5"
      })
    );
  }
  capLayers.append(rect(160, 405, 280, 150, { fill: "url(#fine-print)", opacity: ".62" }));
  squash.append(capLayers);

  squash.append(
    ellipse(300, 500, 13, 13, { fill: "#d8ca8e", opacity: ".96" }),
    ellipse(300, 500, 7, 7, { fill: "#efe0a6", opacity: ".7" })
  );

  squash.append(makeSeedPocket(256, 364, 1));
  squash.append(makeSeedPocket(344, 364, -1));

  squash.append(
    path("M205 98 C203 176 207 244 188 303", {
      fill: "none",
      stroke: "#ffe872",
      "stroke-width": "3",
      "stroke-linecap": "round",
      opacity: ".18"
    }),
    path("M396 98 C398 176 394 244 412 303", {
      fill: "none",
      stroke: "#a95522",
      "stroke-width": "3",
      "stroke-linecap": "round",
      opacity: ".15"
    })
  );

  svg.appendChild(squash);
  svg.appendChild(makeDust());
  return svg;
}

function makeSeedPocket(cx, cy, flip) {
  const group = svgEl("g", { transform: `translate(${cx} ${cy}) scale(${flip} 1)` });
  group.append(
    path("M0 -74 C41 -74 51 -34 42 25 C35 67 18 91 -20 83 C-45 78 -56 49 -52 8 C-47 -45 -32 -74 0 -74 Z", {
      fill: "#c76024",
      opacity: ".9"
    }),
    path("M-1 -66 C18 -49 23 37 -13 76 C30 70 40 28 39 -16 C38 -57 22 -74 -1 -66 Z", {
      fill: "#833c18",
      opacity: ".23"
    }),
    path("M-58 -79 H55 V92 H-58 Z", { fill: "url(#fine-print)", opacity: ".48" })
  );

  [
    [-22, -43, -14], [1, -49, -7], [-29, -22, -9], [-5, -25, -6],
    [-32, -2, -8], [-8, -4, -5], [-31, 19, -7], [-7, 18, -5],
    [-24, 41, -9], [0, 39, -6]
  ].forEach(([x, y, rotate]) => {
    group.append(ellipse(x, y, 13, 7, {
      fill: "#ffedae",
      opacity: ".96",
      transform: `rotate(${rotate} ${x} ${y})`
    }));
  });

  return group;
}

function makeDust() {
  const dust = svgEl("g", { opacity: ".38", filter: "url(#grain-soft)" });
  let seed = 123456;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 900; i += 1) {
    const x = rand() * 600;
    const y = rand() * 600;
    const r = 0.35 + rand() * 1.25;
    const warm = rand() > 0.4;
    dust.append(svgEl("circle", {
      cx: x.toFixed(2),
      cy: y.toFixed(2),
      r: r.toFixed(2),
      fill: warm ? "#a65c28" : "#fff0ae",
      opacity: warm ? ".2" : ".18"
    }));
  }

  return dust;
}

export function render(container) {
  container.replaceChildren(makeArt());
}
