import { section } from "./controls.js";
import { composeOutput, downloadBlob } from "./output.js";
import { variationSeed, animationDuration, frameDelay } from "./animation-seeds.js";
import { exportGIF } from "./gif-export.js";
import { exportMP4 } from "./mp4-export.js";

export function mountAnimation(container, showPreview) {
  const { root, summary, body } = section("ANIMATION");
  root.id = "animation-controls";
  root.hidden = true;
  summary.innerHTML = `<span>ANIMATION</span><label class="animation-summary-toggle" for="animation-enabled"><input id="animation-enabled" type="checkbox" aria-label="Animate Variations"></label>`;
  body.innerHTML = `
    <label class="collection-field" for="animation-duration"><span class="animation-row">DURATION<output id="animation-duration-value" for="animation-duration">4.5s</output></span><input id="animation-duration" type="range" min="2" max="20" step="1" value="9"></label>
    <div class="animation-row"><button id="animation-play" class="animation-icon" type="button" aria-label="Play animation" title="Play animation"><img alt="" width="16" height="16"></button><output id="animation-frame">1 / 9</output></div>
    <button id="animation-download" class="outline-button" type="button">DOWNLOAD GIF</button>
    <button id="animation-download-mp4" class="outline-button" type="button">DOWNLOAD MP4</button>
    <div id="animation-progress-row" class="animation-progress-row" hidden><progress id="animation-progress" max="9" value="0" aria-label="Animation export progress"></progress><button id="animation-cancel" class="animation-icon" type="button" aria-label="Cancel animation export" title="Cancel animation export"><img alt="" width="16" height="16"></button></div>
    <p id="animation-status" class="upload-status" role="status" aria-live="polite"></p>`;
  container.append(root);
  const find = id => root.querySelector(`#animation-${id}`);
  const enabledInput = find("enabled"), durationInput = find("duration"), play = find("play"), download = find("download");
  const downloadMP4 = find("download-mp4");
  const status = find("status"), progress = find("progress"), progressRow = find("progress-row");
  find("cancel").querySelector("img").src = new URL("./vendor/lucide/x.svg", import.meta.url).href;
  let context = null, enabled = true, playing = true, duration = 9, index = 0, timer = null, job = null;
  const frames = new Map();

  enabledInput.addEventListener("click", event => event.stopPropagation());

  function sync() {
    enabledInput.checked = enabled;
    durationInput.value = duration;
    find("duration-value").textContent = `${(duration * frameDelay / 1000).toFixed(1)}s`;
    find("frame").textContent = `${index + 1} / ${duration}`;
    play.disabled = !context || !enabled || Boolean(job);
    download.disabled = !context || !enabled || Boolean(job);
    downloadMP4.disabled = download.disabled;
    enabledInput.disabled = !context;
    durationInput.disabled = !context;
    const action = playing ? "Pause" : "Play";
    play.title = `${action} animation`;
    play.setAttribute("aria-label", play.title);
    play.querySelector("img").src = new URL(`./vendor/lucide/${playing ? "pause" : "play"}.svg`, import.meta.url).href;
    progressRow.hidden = !job;
    root.setAttribute("aria-busy", String(Boolean(job)));
  }

  function frame(i) {
    if (!frames.has(i)) {
      const holder = document.createElement("div");
      const seed = variationSeed(context.state.seed, i);
      context.module.render(holder, { ...context.state, seed });
      const svg = holder.querySelector("svg");
      svg.dataset.seed = seed;
      frames.set(i, svg);
    }
    return frames.get(i);
  }

  function display() {
    showPreview(enabled && context ? frame(index) : null);
    sync();
  }

  function stopTimer() { clearTimeout(timer); timer = null; }
  function schedule() {
    stopTimer();
    if (!playing || !enabled || !context || job || document.hidden) return;
    timer = setTimeout(() => { index = (index + 1) % duration; display(); schedule(); }, frameDelay);
  }

  function cancel(message = "Export cancelled.") {
    if (!job) return;
    job.abort();
    job = null;
    status.textContent = message;
    sync();
  }

  enabledInput.addEventListener("change", () => {
    cancel(); stopTimer();
    enabled = enabledInput.checked;
    playing = enabled;
    index = 0;
    status.textContent = "";
    display(); schedule();
  });
  durationInput.addEventListener("input", () => {
    cancel();
    duration = animationDuration(durationInput.value);
    index = 0;
    display(); schedule();
  });
  play.addEventListener("click", () => { playing = !playing; sync(); schedule(); });
  find("cancel").addEventListener("click", () => { cancel(); schedule(); });
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("pagehide", () => { stopTimer(); cancel(); });

  async function exportAnimation(format) {
    if (!context || !enabled || job) return;
    stopTimer();
    const controller = new AbortController();
    job = controller;
    const snapshot = context;
    const output = { ...context.output };
    const count = duration;
    progress.max = count; progress.value = 0;
    status.textContent = `Exporting 0 / ${count}`;
    sync();
    try {
      const encode = format === "mp4" ? exportMP4 : exportGIF;
      const blob = await encode({ count, signal: controller.signal,
        renderFrame: i => composeOutput(frame(i).cloneNode(true), output, snapshot.module.layoutOutput),
        onProgress: value => { progress.value = value; status.textContent = `Exporting ${value} / ${count}`; }
      });
      controller.signal.throwIfAborted();
      const { collection, seed, algorithmVersion } = snapshot.state;
      const safeSeed = seed.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
      const durationSeconds = (count * frameDelay / 1000).toFixed(1).replace(/\.0$/, "");
      downloadBlob(blob, `${collection}-${safeSeed}-v${algorithmVersion}-${output.selectedRatio.replace(":", "x")}-size${output.outputSize}-${durationSeconds}s.${format}`);
      status.textContent = `${format.toUpperCase()} ready.`;
    } catch (error) {
      if (job === controller && error.name !== "AbortError") {
        status.textContent = error.name === "NotSupportedError" ? error.message : `Could not export ${format.toUpperCase()}. Please try again.`;
        console.error(error);
      }
    } finally {
      if (job === controller) { job = null; sync(); schedule(); }
    }
  }
  download.addEventListener("click", () => exportAnimation("gif"));
  downloadMP4.addEventListener("click", () => exportAnimation("mp4"));
  sync();

  return {
    suspend() { stopTimer(); cancel(); context = null; frames.clear(); showPreview(null); sync(); },
    setContext(next) {
      const hadContext = Boolean(context);
      context = next.module.animation ? next : null;
      root.hidden = !context;
      if (context && !hadContext) { enabled = true; playing = true; }
      if (!context) { enabled = false; playing = false; }
      index = 0; frames.clear(); status.textContent = "";
      display(); schedule();
    },
    updateOutput(output) {
      cancel("Export cancelled: canvas changed.");
      if (context) context = { ...context, output: { ...output } };
      schedule();
    }
  };
}
