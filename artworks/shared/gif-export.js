import { rasterizeArtwork } from "./output.js";
import { frameDelay } from "./animation-seeds.js";

export async function exportGIF({ count, renderFrame, signal, onProgress }) {
  signal.throwIfAborted();
  const worker = new Worker(new URL("./gif-worker.js", import.meta.url), { type: "module" });
  const send = (message, transfer = []) => new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
    };
    const fail = error => { cleanup(); reject(error); };
    const abort = () => fail(new DOMException("Export cancelled", "AbortError"));
    const timeout = setTimeout(() => fail(new Error("GIF encoding timed out. Please try again.")), 30000);
    worker.onmessage = ({ data }) => {
      if (data.error) fail(new Error(data.error));
      else { cleanup(); resolve(data); }
    };
    worker.onerror = () => fail(new Error("Could not start GIF encoding. Please try again."));
    worker.onmessageerror = () => fail(new Error("Could not read GIF output."));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else worker.postMessage(message, transfer);
  });
  try {
    for (let i = 0; i < count; i++) {
      signal.throwIfAborted();
      const canvas = await rasterizeArtwork(renderFrame(i));
      signal.throwIfAborted();
      const { width, height } = canvas;
      const { data } = canvas.getContext("2d").getImageData(0, 0, width, height);
      await send({ type: "frame", rgba: data.buffer, width, height, delay: frameDelay }, [data.buffer]);
      onProgress(i + 1, count);
    }
    const { bytes } = await send({ type: "finish" });
    signal.throwIfAborted();
    return new Blob([bytes], { type: "image/gif" });
  } finally { worker.terminate(); }
}
