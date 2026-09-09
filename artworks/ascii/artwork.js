import { palettes, randomPixels, convertPixels } from "./engine.js";
import { dropdown, section } from "../shared/controls.js";
import { newSeed } from "../../seed.js";

export const algorithmVersion = "1";
export const designSize = { width: 600, height: 600 };
export const capabilities = { presets: ["Upload", "Random"], exports: ["svg", "png"] };
const settings = { palette: "Medium", characters: palettes.Medium, columns: 80, size: 8, spacing: 0, brightness: 0, contrast: 0, colorMode: "Monochrome", color: "#191919", glow: true };
let mode = "Upload", uploadedImage = null, uploadedSeed = null, uploadRequest = 0, fileLabel = "";
const ns = "http://www.w3.org/2000/svg";

export function initialize(params) {
  mode = params.get("preset") === "Random" ? "Random" : "Upload";
  const ranges = { columns: [40, 160], size: [6, 16], spacing: [-2, 6], brightness: [-100, 100], contrast: [-100, 100] };
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (!params.has(key)) continue;
    const value = Number(params.get(key));
    if (Number.isFinite(value)) settings[key] = Math.max(min, Math.min(max, value));
  }
  if (Object.hasOwn(palettes, params.get("palette")) || params.get("palette") === "Custom") settings.palette = params.get("palette");
  if (params.has("characters")) settings.characters = params.get("characters").slice(0, 200);
  if (/^#[a-f\d]{6}$/i.test(params.get("color"))) settings.color = params.get("color");
  if (params.get("colorMode") === "Source Colors") settings.colorMode = "Source Colors";
  if (params.has("glow")) settings.glow = params.get("glow") === "true";
}
export function writeURL(url) {
  url.searchParams.set("preset", mode);
  for (const [key, value] of Object.entries(settings)) url.searchParams.set(key, value);
}
export function seedEnabled() { return mode === "Random"; }
export function resolveSeed(seed) { return mode === "Upload" && uploadedSeed ? uploadedSeed : seed; }
export function getPreset() { return mode; }
export function choosePreset(value) {
  mode = value;
  return mode === "Upload" ? uploadedSeed || newSeed() : newSeed();
}
function svgNode(name, attrs = {}) {
  const node = document.createElementNS(ns, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
export function render(container, { seed }) {
  if (mode === "Upload" && !uploadedImage) {
    const empty = document.createElement("div"); empty.className = "artwork-empty";
    empty.textContent = "Upload an image"; container.append(empty); return;
  }
  const columns = Math.round(settings.columns);
  const step = Math.max(1, settings.size * 0.6 + settings.spacing);
  const aspect = mode === "Upload" ? uploadedImage.naturalHeight / uploadedImage.naturalWidth : 1;
  const rows = Math.min(600, Math.max(1, Math.round(columns * aspect * step / settings.size)));
  let pixels;
  if (mode === "Random") pixels = randomPixels(seed, columns, rows);
  else {
    const sample = document.createElement("canvas"); sample.width = columns; sample.height = rows;
    const context = sample.getContext("2d", { willReadFrequently: true });
    context.drawImage(uploadedImage, 0, 0, columns, rows);
    pixels = context.getImageData(0, 0, columns, rows).data;
  }
  const cells = convertPixels(pixels, settings);
  const svg = svgNode("svg", { viewBox: "0 0 600 600" });
  const padding = settings.size * 2, width = columns * step + padding * 2, height = rows * settings.size + padding * 2;
  const scale = Math.min(600 / width, 600 / height) * settings.size / 8;
  const group = svgNode("g", { transform: `translate(${(600 - width * scale) / 2} ${(600 - height * scale) / 2}) scale(${scale})` });
  if (settings.glow) {
    const defs = svgNode("defs");
    const filter = svgNode("filter", { id: "ascii-glow", x: "-50%", y: "-50%", width: "200%", height: "200%" });
    filter.append(svgNode("feGaussianBlur", { stdDeviation: settings.size * 0.3, result: "blur" }));
    const merge = svgNode("feMerge");
    merge.append(svgNode("feMergeNode", { in: "blur" }), svgNode("feMergeNode", { in: "SourceGraphic" }));
    filter.append(merge); defs.append(filter); svg.append(defs); group.setAttribute("filter", "url(#ascii-glow)");
  }
  const text = svgNode("text", { "font-family": "Courier New, monospace", "font-size": settings.size, "xml:space": "preserve" });
  cells.forEach((cell, index) => {
    if (cell.character === " ") return;
    const span = svgNode("tspan", { x: padding + (index % columns) * step, y: padding + (Math.floor(index / columns) + 0.8) * settings.size, fill: settings.colorMode === "Source Colors" ? cell.color : settings.color });
    span.textContent = cell.character; text.append(span);
  });
  group.append(text); svg.append(group); container.append(svg);
}
export function mountControls(container, { refresh, setSeed }) {
  const source = section("IMAGE SOURCE"); source.root.open = true; source.root.hidden = mode !== "Upload";
  const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.id = "ascii-upload"; input.setAttribute("aria-label", "Upload image");
  const status = document.createElement("p"); status.className = "upload-status"; status.role = "status"; status.textContent = fileLabel;
  input.addEventListener("change", async () => {
    const file = input.files[0]; if (!file) return;
    const request = ++uploadRequest;
    if (!file.type.startsWith("image/")) { status.textContent = "Choose an image file."; return; }
    if (file.size > 20 * 1024 * 1024) { status.textContent = "Choose an image smaller than 20 MB."; return; }
    status.textContent = "Loading...";
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url;
      const [bytes] = await Promise.all([file.arrayBuffer(), image.decode()]);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      if (request !== uploadRequest) return;
      uploadedImage = image;
      uploadedSeed = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
      fileLabel = file.name; status.textContent = fileLabel;
      if (mode === "Upload" && container.isConnected) setSeed(uploadedSeed);
    } catch { if (request === uploadRequest) status.textContent = "Could not read this image. Choose another file."; }
    finally { URL.revokeObjectURL(url); }
  });
  source.body.append(input, status); container.append(source.root);
  const characters = section("CHARACTERS");
  const custom = document.createElement("input"); custom.type = "text"; custom.maxLength = 200; custom.value = settings.characters;
  custom.setAttribute("aria-label", "Custom characters"); custom.disabled = settings.palette !== "Custom";
  custom.addEventListener("input", () => { settings.characters = custom.value; refresh(); });
  characters.body.append(dropdown("Character palette", [...Object.keys(palettes), "Custom"].map(value => ({ value, label: value })), settings.palette, value => {
    settings.palette = value; custom.disabled = value !== "Custom";
    if (value !== "Custom") { settings.characters = palettes[value]; custom.value = settings.characters; }
    refresh();
  }), custom);
  const slider = (body, key, label, min, max, step) => {
    const field = document.createElement("label"); field.className = "collection-field";
    const caption = document.createElement("span"), control = document.createElement("input");
    control.type = "range"; control.min = min; control.max = max; control.step = step; control.value = settings[key]; control.setAttribute("aria-label", label);
    const update = () => { caption.textContent = `${label} ${settings[key]}`; };
    control.addEventListener("input", () => { settings[key] = Number(control.value); update(); refresh(); });
    update(); field.append(caption, control); body.append(field);
  };
  slider(characters.body, "columns", "Width", 40, 160, 5);
  slider(characters.body, "size", "Character size", 6, 16, 1);
  slider(characters.body, "spacing", "Character spacing", -2, 6, 0.1); container.append(characters.root);
  const adjustments = section("IMAGE ADJUSTMENTS");
  slider(adjustments.body, "brightness", "Brightness", -100, 100, 1);
  slider(adjustments.body, "contrast", "Contrast", -100, 100, 1); container.append(adjustments.root);
  const color = section("COLOR & GLOW");
  const tint = document.createElement("input"); tint.type = "color"; tint.value = settings.color; tint.setAttribute("aria-label", "Display color"); tint.disabled = settings.colorMode === "Source Colors";
  tint.addEventListener("input", () => { settings.color = tint.value; refresh(); });
  color.body.append(dropdown("Color mode", ["Monochrome", "Source Colors"].map(value => ({ value, label: value })), settings.colorMode, value => {
    settings.colorMode = value; tint.disabled = value === "Source Colors"; refresh();
  }), tint);
  const glow = document.createElement("label"), checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = settings.glow;
  checkbox.addEventListener("change", () => { settings.glow = checkbox.checked; refresh(); });
  glow.append(checkbox, " Glow"); color.body.append(glow); container.append(color.root);
}
