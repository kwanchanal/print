import { artworks } from "./artworks/registry.js";
import { newSeed } from "./seed.js";

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
}

function updateInkCount(svg) {
  const colors = new Set();
  svg.querySelectorAll("[fill], [stroke]").forEach((node) => [node.getAttribute("fill"), node.getAttribute("stroke")].forEach((color) => { if (color && color !== "none" && !color.startsWith("url(")) colors.add(color); }));
  outputState.inkCount = colors.size;
}

function setOutputRatio(ratio) {
  outputState.selectedRatio = ratio;
  calculateOutputDimensions(ratio);
  document.querySelectorAll(".ratio-button").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.ratio === ratio)));
  updateOutputSummary();
  if (currentId) loadArtwork(currentId);
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

async function loadArtwork(id) {
  const entry = artworks.find((artwork) => artwork.id === id) || artworks[0];
  const request = ++renderRequest;
  const seed = artworkState.seed;

  try {
    const [{ meta }, artworkModule] = await Promise.all([
      import(entry.metaPath),
      import(entry.artworkPath)
    ]);
    if (request !== renderRequest) return;
    artworkState.collection = entry.id;
    artworkState.algorithmVersion = artworkModule.algorithmVersion || "1";
    const presetSelect = document.getElementById("seed-preset");
    presetSelect.replaceChildren(new Option("Custom", ""), ...(artworkModule.presets || []).map(preset => new Option(preset.label, preset.seed)));
    presetSelect.value = (artworkModule.presets || []).some(preset => preset.seed === seed) ? seed : "";

    setMeta(meta);
    setSelected(entry.id);
    const startedAt = performance.now();
    calculateOutputDimensions(outputState.selectedRatio);
    stage.replaceChildren();
    artworkModule.render(stage, { ...artworkState, designSize: artworkModule.designSize });
    const svg = stage.querySelector("svg");
    if (svg) {
      svg.dataset.seed = seed;
      svg.dataset.collection = entry.id;
      svg.dataset.algorithmVersion = artworkState.algorithmVersion;
      svg.setAttribute("width", outputState.outputWidth);
      svg.setAttribute("height", outputState.outputHeight);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.transform = `scale(${outputState.outputScale})`;
      svg.style.transformOrigin = "center";
      updateInkCount(svg);
    }
    outputState.renderTime = performance.now() - startedAt;
    updateOutputSummary();
    const url = new URL(location.href);
    url.hash = entry.id;
    url.searchParams.set("seed", seed);
    url.searchParams.set("version", artworkState.algorithmVersion);
    window.history.replaceState(null, "", url);
  } catch (error) {
    stage.innerHTML = `<div class="error">Could not load artwork: ${entry.label}</div>`;
    console.error(error);
  }
}

function init() {
  const seedForm = document.createElement("form");
  seedForm.className = "seed-controls";
  seedForm.innerHTML = '<label for="seed-input">SEED</label><input id="seed-input" required maxlength="200" autocomplete="off"><div class="seed-actions"><button type="submit">APPLY</button><button type="button" id="seed-random">RANDOM</button></div><label for="seed-preset">PRESET</label><select id="seed-preset"><option value="original">Original</option></select>';
  document.querySelector(".toolbar").append(seedForm);
  document.getElementById("seed-input").value = artworkState.seed;
  seedForm.addEventListener("submit", event => { event.preventDefault(); applySeed(document.getElementById("seed-input").value); });
  document.getElementById("seed-random").addEventListener("click", () => applySeed(newSeed()));
  document.getElementById("seed-preset").addEventListener("change", event => {
    applySeed(event.target.value || newSeed());
  });
  const canvasPanel = document.getElementById("canvas-panel");
  const originalToolbar = document.querySelector(".toolbar");
  const canvasGroup = canvasPanel?.closest(".control-group");
  const outputReadout = document.querySelector(".output-readout");
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
    updateOutputSummary();
    const svg = stage.querySelector("svg");
    if (svg) svg.style.transform = `scale(${outputState.outputScale})`;
  });

  document.getElementById("randomize-button").addEventListener("click", () => {
    applySeed(newSeed());
  });
  document.getElementById("reset-offset").addEventListener("click", () => loadArtwork(currentId));
  document.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", () => {
      const svg = stage.querySelector("svg");
      if (!svg) return;
      const filename = `${svg.dataset.collection}-${svg.dataset.seed.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0,100)}-v${svg.dataset.algorithmVersion}-${outputState.selectedRatio.replace(":", "x")}`;
      const source = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
      const url = URL.createObjectURL(source);
      if (button.dataset.download === "png") {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = outputState.outputWidth;
          canvas.height = outputState.outputHeight;
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => { const pngUrl = URL.createObjectURL(blob); const pngLink = document.createElement("a"); pngLink.href = pngUrl; pngLink.download = `${filename}.png`; pngLink.click(); URL.revokeObjectURL(pngUrl); }, "image/png");
          URL.revokeObjectURL(url);
        };
        image.src = url;
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    });
  });

  options.replaceChildren(
    ...artworks.map((entry) => {
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

  const hashId = window.location.hash.replace("#", "");
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
