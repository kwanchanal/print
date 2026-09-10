import { algorithms, palettes, randomImage, dither, colorPaths } from "./engine.js";
import { dropdown, section } from "../shared/controls.js";
import { createImageSource } from "../shared/image-source.js";

export const algorithmVersion = "1";
export const designSize = { width: 600, height: 600 };
export const capabilities = { presets: ["Upload", "Random"], exports: ["svg", "png"] };
const source = createImageSource();
export const { getPreset, seedEnabled, resolveSeed, choosePreset } = source;
const settings = { algorithm: "Floyd-Steinberg", palette: "Custom", scale: 3, brightness: 0, contrast: 0.5, color1: "#000000", color2: "#62d0a6" };
let cachedImage = null, cachedSeed = null, cachedPixels = null, width = 600, height = 600;
const ns = "http://www.w3.org/2000/svg";

export function initialize(params) {
  source.initialize(params);
  if (algorithms.includes(params.get("algorithm"))) settings.algorithm = params.get("algorithm");
  if (Object.hasOwn(palettes, params.get("palette"))) settings.palette = params.get("palette");
  for (const [key, min, max] of [["scale", 1, 12], ["brightness", -100, 100], ["contrast", 0, 1]]) {
    if (!params.has(key)) continue;
    const value = Number(params.get(key));
    if (Number.isFinite(value)) settings[key] = Math.max(min, Math.min(max, key === "scale" ? Math.round(value) : value));
  }
  for (const key of ["color1", "color2"]) if (/^#[a-f\d]{6}$/i.test(params.get(key))) settings[key] = params.get(key);
}

export function writeURL(url) {
  url.searchParams.set("preset", getPreset());
  for (const [key, value] of Object.entries(settings)) url.searchParams.set(key, value);
}

export function render(container, { seed }) {
  const image = source.getImage();
  if (getPreset() === "Upload" && !image) {
    const empty = document.createElement("div"); empty.className = "artwork-empty";
    empty.textContent = "Upload an image"; container.append(empty); return;
  }
  if (!cachedPixels || image !== cachedImage || seed !== cachedSeed) {
    if (image) {
      const scale = 600 / Math.max(image.naturalWidth, image.naturalHeight);
      width = Math.max(1, Math.round(image.naturalWidth * scale));
      height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      cachedPixels = context.getImageData(0, 0, width, height).data;
    } else {
      width = 600; height = 600; cachedPixels = randomImage(seed, width, height);
    }
    cachedImage = image; cachedSeed = seed;
  }
  const result = dither(cachedPixels, width, height, settings);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 600 600"); svg.setAttribute("shape-rendering", "crispEdges");
  const group = document.createElementNS(ns, "g");
  group.setAttribute("transform", `translate(${(600 - width) / 2} ${(600 - height) / 2})`);
  colorPaths(result).forEach((data, index) => {
    if (!data) return;
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", data); path.setAttribute("fill", result.colors[index]); group.append(path);
  });
  svg.append(group); container.append(svg);
}

export function mountControls(container, { refresh, setSeed }) {
  source.mount(container, setSeed);
  const pattern = section("DITHERING"); pattern.root.open = true;
  pattern.body.append(dropdown("Dithering algorithm", algorithms.map(value => ({ value, label: value })), settings.algorithm, value => { settings.algorithm = value; refresh(); }));
  const scaleLabel = document.createElement("label"); scaleLabel.className = "collection-field"; scaleLabel.textContent = "Dither scale";
  const scaleInput = document.createElement("input"); scaleInput.type = "number";
  scaleInput.min = "1"; scaleInput.max = "12"; scaleInput.step = "1"; scaleInput.value = settings.scale;
  scaleInput.setAttribute("aria-label", "Dither scale");
  scaleInput.addEventListener("input", () => {
    if (scaleInput.value === "" || !scaleInput.validity.valid) return;
    settings.scale = Number(scaleInput.value); refresh();
  });
  scaleInput.addEventListener("change", () => { scaleInput.value = settings.scale; });
  scaleLabel.append(scaleInput); pattern.body.append(scaleLabel); container.append(pattern.root);
  const color = section("COLOR PALETTE"); color.root.open = true;
  const swatches = document.createElement("div"); swatches.className = "halftone-swatches"; swatches.hidden = settings.palette !== "Custom";
  color.body.append(dropdown("Color palette", Object.keys(palettes).map(value => ({ value, label: value })), settings.palette, value => {
    settings.palette = value; swatches.hidden = value !== "Custom"; refresh();
  }));
  for (const [key, label] of [["color1", "Color 1"], ["color2", "Color 2"]]) {
    const field = document.createElement("label"); field.className = "collection-field"; field.textContent = label;
    const input = document.createElement("input"); input.type = "color"; input.value = settings[key]; input.setAttribute("aria-label", label);
    input.addEventListener("input", () => { settings[key] = input.value; refresh(); });
    field.append(input); swatches.append(field);
  }
  color.body.append(swatches); container.append(color.root);
  const adjustments = section("IMAGE ADJUSTMENTS");
  for (const [key, label, min, max, step] of [["brightness", "Brightness", -100, 100, 1], ["contrast", "Contrast", 0, 1, 0.1]]) {
    const field = document.createElement("label"); field.className = "collection-field";
    const caption = document.createElement("span"), input = document.createElement("input");
    input.type = "range"; input.min = min; input.max = max; input.step = step; input.value = settings[key]; input.setAttribute("aria-label", label);
    caption.textContent = `${label} ${settings[key]}`;
    input.addEventListener("input", () => { settings[key] = Number(input.value); caption.textContent = `${label} ${settings[key]}`; refresh(); });
    field.append(caption, input); adjustments.body.append(field);
  }
  container.append(adjustments.root);
}
