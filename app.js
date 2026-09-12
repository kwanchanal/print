import { artworks } from "./artworks/registry.js";
import { newSeed } from "./seed.js";
import { composeOutput, downloadArtwork } from "./artworks/shared/output.js";
import { mountAnimation } from "./artworks/shared/animation.js";
import { dropdown } from "./artworks/shared/controls.js";

const select = document.getElementById("artwork-select");
const options = document.getElementById("artwork-options");
const stage = document.getElementById("artwork-stage");
const title = document.getElementById("artwork-title");
const description = document.getElementById("artwork-description");
const tags = document.getElementById("artwork-tags");
let currentId = "";
const initialParams = new URLSearchParams(location.search);
const artworkState = { collection: "", seed: initialParams.get("seed") || "original", algorithmVersion: "1" };
let renderRequest = 0;
let activeModule = null;
let mountedId = "";
let remountControls = false;
const collectionSeeds = new Map();
const initialized = new Set();
let sourceArtwork = null;
let previewArtwork = null;
let animationControls = null;
let puddingStyle = location.hash.slice(1) === "pudding-riso" || initialParams.get("style") === "riso" ? "riso" : "standard";
let styleControls = null;

function presentArtwork() {
  if (!sourceArtwork) return;
  const svg = composeOutput((previewArtwork || sourceArtwork).cloneNode(true), outputState, activeModule?.layoutOutput);
  svg.dataset.seed = previewArtwork?.dataset.seed || artworkState.seed;
  svg.dataset.collection = artworkState.collection;
  svg.dataset.algorithmVersion = artworkState.algorithmVersion;
  stage.replaceChildren(svg);
}

function applySeed(seed) {
  seed = seed.trim();
  if (!seed) return;
  artworkState.seed = seed;
  document.getElementById("seed-input").value = seed;
  loadArtwork(currentId);
}
const outputState = { selectedRatio: "3:4", outputWidth: 480, outputHeight: 640, outputSize: 45, outputScale: 1, inkCount: 0, renderTime: 0 };
const ratioValues = ["9:16", "3:4", "4:5", "1:1", "5:4", "4:3", "3:2", "16:9"];

function calculateOutputDimensions(ratio) {
  const [width, height] = ratio.split(":").map(Number);
  outputState.outputWidth = 480;
  outputState.outputHeight = Math.round(outputState.outputWidth * height / width);
}

function updateOutputSummary() {
  const outputSummary = document.querySelector(".output-readout");
  if (outputSummary) {
    outputSummary.querySelector("#output-ratio").textContent = outputState.selectedRatio;
    outputSummary.querySelector("#output-size").textContent = `${outputState.outputSize}%`;
    outputSummary.querySelector("#output-inks").textContent = String(outputState.inkCount).padStart(2, "0");
    outputSummary.querySelector("#output-render").textContent = `${outputState.outputWidth}×${outputState.outputHeight} · ${Math.round(outputState.renderTime)}MS`;
  }
  stage.style.aspectRatio = `${outputState.outputWidth} / ${outputState.outputHeight}`;
  const viewer = stage.parentElement;
  const ratio = outputState.outputWidth / outputState.outputHeight;
  stage.style.width = `${Math.max(1, Math.min(520, viewer.clientWidth - 48, (viewer.clientHeight - 48) * ratio))}px`;
}

function updateInkCount(svg) {
  const colors = new Set();
  svg.querySelectorAll("[fill], [stroke]").forEach((node) => [node.getAttribute("fill"), node.getAttribute("stroke")].forEach((color) => { if (color && color !== "none" && !color.startsWith("url(")) colors.add(color); }));
  outputState.inkCount = colors.size;
}

function setOutputRatio(ratio) {
  outputState.selectedRatio = ratio;
  calculateOutputDimensions(ratio);
  animationControls?.updateOutput(outputState);
  document.querySelectorAll(".ratio-button").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.ratio === ratio)));
  updateOutputSummary();
  presentArtwork();
}

function setMeta(meta) {
  title.textContent = meta.title;
  description.textContent = meta.description;
  tags.replaceChildren(
    ...meta.tags.map((tag) => {
      const item = document.createElement("span");
      item.className = "tag";
      item.textContent = tag;
      return item;
    })
  );
}

function setOpen(isOpen) {
  select.setAttribute("aria-expanded", String(isOpen));
  options.dataset.open = String(isOpen);
}

function setSelected(id) {
  const entry = artworks.find((artwork) => artwork.id === id) || artworks[0];
  currentId = entry.id;
  select.textContent = entry.label;
  options.querySelectorAll("[role='option']").forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.value === entry.id));
  });
}

function getArtworkEntry(id) {
  const collectionId = id === "pudding-riso" ? "pudding" : id;
  if (collectionId === "pudding" && puddingStyle === "riso") return artworks.find(artwork => artwork.id === "pudding-riso");
  return artworks.find(artwork => artwork.id === collectionId) || artworks[0];
}

function syncStyleControls() {
  if (!styleControls) return;
  const visible = currentId === "pudding";
  styleControls.hidden = !visible;
  if (!visible) return;
  const toggle = styleControls.querySelector(".style-toggle");
  const panel = styleControls.querySelector(".style-panel");
  const checkbox = styleControls.querySelector(".style-checkbox");
  checkbox.checked = puddingStyle === "riso";
  panel.hidden = !checkbox.checked;
  toggle.setAttribute("aria-expanded", String(checkbox.checked));
  toggle.querySelector("span").textContent = `${checkbox.checked ? "-" : "+"} STYLE`;
}

function setPuddingStyle(style) {
  puddingStyle = style;
  syncStyleControls();
  loadArtwork("pudding");
}

async function loadArtwork(id) {
  animationControls?.suspend();
  const entry = getArtworkEntry(id);
  const collectionId = entry.id === "pudding-riso" ? "pudding" : entry.id;
  const request = ++renderRequest;

  try {
    const [{ meta }, artworkModule] = await Promise.all([
      import(entry.metaPath),
      import(entry.artworkPath)
    ]);
    if (request !== renderRequest) return;
    if (artworkState.collection && artworkState.collection !== collectionId) collectionSeeds.set(artworkState.collection, artworkState.seed);
    if (artworkState.collection !== collectionId) {
      artworkState.seed = collectionSeeds.get(collectionId) || (!artworkState.collection ? artworkState.seed : "original");
    }
    if (!initialized.has(entry.id)) {
      artworkModule.initialize?.(entry.id === location.hash.slice(1) ? initialParams : new URLSearchParams());
      initialized.add(entry.id);
    }
    if (artworkModule.capabilities?.presets && artworkState.seed === "original") artworkState.seed = newSeed();
    artworkState.seed = artworkModule.resolveSeed?.(artworkState.seed) || artworkState.seed;
    const seed = artworkState.seed;
    activeModule = artworkModule;
    artworkState.collection = collectionId;
    artworkState.algorithmVersion = artworkModule.algorithmVersion || "1";
    collectionPresets = artworkModule.presets || [];
    syncPresetMenu();
    const seedEnabled = artworkModule.seedEnabled?.() ?? true;
    const seedInput = document.getElementById("seed-input");
    seedInput.value = seed;
    seedInput.disabled = !seedEnabled;
    document.querySelectorAll(".seed-actions button").forEach(button => { button.disabled = !seedEnabled; });
    if (mountedId !== entry.id || remountControls) {
      const controls = document.getElementById("collection-controls");
      controls.replaceChildren();
      artworkModule.mountControls?.(controls, {
        refresh: () => { if (currentId === collectionId) loadArtwork(collectionId); },
        setSeed: value => { if (currentId === collectionId) applySeed(value); }
      });
      mountedId = entry.id; remountControls = false;
    }

    setMeta(meta);
    setSelected(collectionId);
    syncStyleControls();
    const startedAt = performance.now();
    calculateOutputDimensions(outputState.selectedRatio);
    stage.replaceChildren();
    artworkModule.render(stage, { ...artworkState, designSize: artworkModule.designSize });
    const svg = stage.querySelector("svg");
    sourceArtwork = svg?.cloneNode(true) || null;
    if (svg) {
      updateInkCount(svg);
      presentArtwork();
    }
    document.querySelectorAll("[data-download]").forEach(button => {
      button.disabled = !svg;
      button.hidden = !(artworkModule.capabilities?.exports || ["svg", "png"]).includes(button.dataset.download);
    });
    outputState.renderTime = performance.now() - startedAt;
    updateOutputSummary();
    animationControls?.setContext({ module: artworkModule, state: { ...artworkState }, output: { ...outputState } });
    const url = new URL(location.href);
    url.search = "";
    url.hash = collectionId;
    url.searchParams.set("seed", seed);
    url.searchParams.set("version", artworkState.algorithmVersion);
    if (collectionId === "pudding" && puddingStyle === "riso") url.searchParams.set("style", "riso");
    artworkModule.writeURL?.(url);
    window.history.replaceState(null, "", url);
  } catch (error) {
    if (request !== renderRequest) return;
    sourceArtwork = null;
    document.querySelectorAll("[data-download]").forEach(button => { button.disabled = true; });
    stage.innerHTML = `<div class="error">Could not load artwork: ${entry.label}</div>`;
    console.error(error);
  }
}

let collectionPresets = [{ seed: "original", label: "Original" }];

function syncPresetMenu() {
  const button = document.getElementById("preset-button");
  const list = document.getElementById("preset-options");
  const selected = collectionPresets.find(preset => preset.seed === artworkState.seed);
  const specialPresets = activeModule?.capabilities?.presets;
  button.textContent = specialPresets ? activeModule.getPreset() : selected?.label || "Custom";
  const presetChoices = specialPresets ? specialPresets.map(label => ({ seed: label, label })) : [{ seed: "", label: "Custom" }, ...collectionPresets];
  list.replaceChildren(...presetChoices.map((option) => {
    const item = document.createElement("li");
    item.role = "option";
    item.tabIndex = -1;
    item.textContent = option.label;
    item.setAttribute("aria-selected", String(specialPresets ? option.label === activeModule.getPreset() : option.seed === (selected?.seed || "")));
    const choose = () => {
      button.setAttribute("aria-expanded", "false");
      list.dataset.open = "false";
      button.focus();
      remountControls = Boolean(specialPresets);
      applySeed(specialPresets ? activeModule.choosePreset(option.label) : option.seed || newSeed());
    };
    item.addEventListener("click", choose);
    item.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); }
    });
    return item;
  }));
}

function init() {
  new ResizeObserver(updateOutputSummary).observe(stage.parentElement);
  const seedForm = document.createElement("form");
  seedForm.className = "seed-controls";
  seedForm.innerHTML = '<label for="seed-input">SEED</label><input id="seed-input" required maxlength="200" autocomplete="off"><div class="seed-actions"><button type="submit">APPLY</button><button type="button" id="seed-random">RANDOM</button></div><label for="preset-button">PRESET</label>';
  document.querySelector(".toolbar").append(seedForm);
  const presetMenu = document.createElement("div");
  presetMenu.className = "sheet-select";
  presetMenu.innerHTML = '<button id="preset-button" class="sheet-select-button" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="preset-options">Original</button><ul id="preset-options" class="sheet-options" role="listbox" aria-label="Preset"></ul>';
  seedForm.append(presetMenu);
  const presetButton = document.getElementById("preset-button");
  const presetOptions = document.getElementById("preset-options");
  const closePreset = () => { presetButton.setAttribute("aria-expanded", "false"); presetOptions.dataset.open = "false"; };
  presetButton.addEventListener("click", () => {
    const open = presetButton.getAttribute("aria-expanded") !== "true";
    presetButton.setAttribute("aria-expanded", String(open));
    presetOptions.dataset.open = String(open);
    setOpen(false);
  });
  presetMenu.addEventListener("keydown", event => {
    if (event.key === "Escape") { closePreset(); presetButton.focus(); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      presetButton.setAttribute("aria-expanded", "true"); presetOptions.dataset.open = "true";
      const items = Array.from(presetOptions.children);
      const index = items.indexOf(document.activeElement);
      items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    }
  });
  document.addEventListener("click", event => { if (!presetMenu.contains(event.target)) closePreset(); });
  presetMenu.addEventListener("focusout", event => { if (!presetMenu.contains(event.relatedTarget)) closePreset(); });
  syncPresetMenu();
  document.getElementById("seed-input").value = artworkState.seed;
  seedForm.addEventListener("submit", event => { event.preventDefault(); applySeed(document.getElementById("seed-input").value); });
  document.getElementById("seed-random").addEventListener("click", () => applySeed(newSeed()));
  const canvasPanel = document.getElementById("canvas-panel");
  const collectionControls = document.createElement("div");
  collectionControls.id = "collection-controls";
  canvasPanel.closest(".control-group").after(collectionControls);
  styleControls = document.createElement("section");
  styleControls.id = "style-controls";
  styleControls.className = "control-group";
  styleControls.innerHTML = '<button class="section-toggle style-toggle" type="button" aria-expanded="false" aria-controls="style-panel"><span>+ STYLE</span><input class="style-checkbox" type="checkbox" aria-label="Use RISO style"></button><div id="style-panel" class="section-content style-panel" hidden></div>';
  collectionControls.after(styleControls);
  const stylePanel = styleControls.querySelector(".style-panel");
  stylePanel.append(
    dropdown("Style", [{ value: "riso", label: "RISO" }], "riso", () => setPuddingStyle("riso"))
  );
  const styleToggle = styleControls.querySelector(".style-toggle");
  const styleCheckbox = styleControls.querySelector(".style-checkbox");
  styleToggle.addEventListener("click", event => {
    if (event.target === styleCheckbox) return;
    styleCheckbox.checked = !styleCheckbox.checked;
    setPuddingStyle(styleCheckbox.checked ? "riso" : "standard");
  });
  styleCheckbox.addEventListener("change", () => setPuddingStyle(styleCheckbox.checked ? "riso" : "standard"));
  syncStyleControls();
  const animationContainer = document.createElement("div");
  collectionControls.after(animationContainer);
  animationControls = mountAnimation(animationContainer, svg => {
    previewArtwork = svg;
    presentArtwork();
  });
  const originalToolbar = document.querySelector(".toolbar");
  const canvasGroup = canvasPanel?.closest(".control-group");
  const frameControls = document.querySelector(".frame-controls");
  if (canvasPanel && originalToolbar && canvasGroup) {
    originalToolbar.style.display = "block";
    canvasGroup.before(originalToolbar);
    if (frameControls) canvasPanel.append(frameControls);
  }

  document.querySelectorAll(".section-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      if (event.target.classList.contains("square-check")) return;
      const content = document.getElementById(toggle.getAttribute("aria-controls"));
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.querySelector("span").textContent = `${isOpen ? "+" : "-"} CANVAS`;
      content.hidden = isOpen;
    });
  });

  const ratioGrid = document.getElementById("ratio-grid");
  ratioValues.forEach((ratio) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ratio-button";
    button.dataset.ratio = ratio;
    button.setAttribute("aria-pressed", String(ratio === "3:4"));
    button.innerHTML = `<span class="ratio-box"></span>${ratio}`;
    const [ratioWidth, ratioHeight] = ratio.split(":").map(Number);
    const ratioBox = button.querySelector(".ratio-box");
    const boxScale = Math.min(20 / ratioWidth, 20 / ratioHeight);
    ratioBox.style.width = `${Math.round(ratioWidth * boxScale)}px`;
    ratioBox.style.height = `${Math.round(ratioHeight * boxScale)}px`;
    button.addEventListener("click", () => setOutputRatio(ratio));
    ratioGrid.append(button);
  });

  const sizeControl = document.createElement("label");
  sizeControl.className = "size-control";
  sizeControl.innerHTML = `SIZE <input id="output-size-control" type="range" min="10" max="140" value="45" />`;
  document.getElementById("canvas-panel").prepend(sizeControl);
  sizeControl.querySelector("input").addEventListener("input", (event) => {
    outputState.outputSize = Number(event.target.value);
    outputState.outputScale = outputState.outputSize / 45;
    calculateOutputDimensions(outputState.selectedRatio);
    animationControls?.updateOutput(outputState);
    updateOutputSummary();
    presentArtwork();
  });

  document.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", async () => {
      const svg = stage.querySelector("svg");
      if (!svg) return;
      const filename = `${svg.dataset.collection}-${svg.dataset.seed.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0,100)}-v${svg.dataset.algorithmVersion}-${outputState.selectedRatio.replace(":", "x")}`;
      try { await downloadArtwork(svg, button.dataset.download, filename); }
      catch (error) { console.error(error); alert("Could not export this image. Please try again."); }
    });
  });

  options.replaceChildren(
    ...artworks.filter(entry => entry.id !== "pudding-riso").map((entry) => {
      const option = document.createElement("li");
      option.dataset.value = entry.id;
      option.role = "option";
      option.tabIndex = -1;
      option.textContent = entry.label;
      option.addEventListener("click", () => {
        setOpen(false);
        loadArtwork(entry.id);
      });
      return option;
    })
  );

  const hashId = window.location.hash.replace("#", "") === "pudding-riso" ? "pudding" : window.location.hash.replace("#", "");
  const firstId = artworks.some((entry) => entry.id === hashId) ? hashId : artworks[0].id;
  setSelected(firstId);
  select.addEventListener("click", () => {
    const isOpen = select.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });
  select.addEventListener("keydown", (event) => {
    const currentIndex = artworks.findIndex((entry) => entry.id === currentId);
    if (event.key === "Escape") setOpen(false);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = artworks[(currentIndex + step + artworks.length) % artworks.length];
      loadArtwork(next.id);
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".sheet-select")) setOpen(false);
  });
  loadArtwork(firstId);
}

init();
