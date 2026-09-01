import { artworks } from "./artworks/registry.js";

const select = document.getElementById("artwork-select");
const options = document.getElementById("artwork-options");
const stage = document.getElementById("artwork-stage");
const title = document.getElementById("artwork-title");
const description = document.getElementById("artwork-description");
const tags = document.getElementById("artwork-tags");
let currentId = "";

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

  try {
    const [{ meta }, artworkModule] = await Promise.all([
      import(entry.metaPath),
      import(entry.artworkPath)
    ]);

    setMeta(meta);
    setSelected(entry.id);
    stage.replaceChildren();
    artworkModule.render(stage);
    window.history.replaceState(null, "", `#${entry.id}`);
  } catch (error) {
    stage.innerHTML = `<div class="error">Could not load artwork: ${entry.label}</div>`;
    console.error(error);
  }
}

function init() {
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
