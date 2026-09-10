import { newSeed } from "../../seed.js";
import { section } from "./controls.js";

export function createImageSource() {
  let mode = "Upload", image = null, seed = null, filename = "", request = 0;
  return {
    initialize(params) { mode = params.get("preset") === "Random" ? "Random" : "Upload"; },
    getPreset: () => mode,
    seedEnabled: () => mode === "Random",
    resolveSeed: value => mode === "Upload" && seed ? seed : value,
    choosePreset(value) { mode = value; return mode === "Upload" && seed ? seed : newSeed(); },
    getImage: () => mode === "Upload" ? image : null,
    mount(container, setSeed) {
      const source = section("IMAGE SOURCE"); source.root.open = true; source.root.hidden = mode !== "Upload";
      const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.setAttribute("aria-label", "Upload image");
      const status = document.createElement("p"); status.className = "upload-status"; status.role = "status"; status.textContent = filename;
      input.addEventListener("change", async () => {
        const file = input.files[0]; if (!file) return;
        const ticket = ++request;
        if (!file.type.startsWith("image/")) { status.textContent = "Choose an image file."; return; }
        if (file.size > 20 * 1024 * 1024) { status.textContent = "Choose an image smaller than 20 MB."; return; }
        status.textContent = "Loading...";
        const url = URL.createObjectURL(file);
        try {
          const candidate = new Image(); candidate.src = url;
          const [bytes] = await Promise.all([file.arrayBuffer(), candidate.decode()]);
          const digest = await crypto.subtle.digest("SHA-256", bytes);
          if (ticket !== request) return;
          image = candidate; filename = file.name;
          seed = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
          status.textContent = filename;
          if (mode === "Upload" && source.root.isConnected) setSeed(seed);
        } catch { if (ticket === request) status.textContent = "Could not read this image. Choose another file."; }
        finally { URL.revokeObjectURL(url); }
      });
      source.body.append(input, status); container.append(source.root);
    }
  };
}
