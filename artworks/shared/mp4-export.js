import { rasterizeArtwork } from "./output.js";
import { frameDelay } from "./animation-seeds.js";

export async function exportMP4({ count, renderFrame, signal, onProgress }) {
  signal.throwIfAborted();
  if (typeof VideoEncoder === "undefined") {
    throw new DOMException("MP4 encoding is unavailable in this browser. Try Chrome or Safari.", "NotSupportedError");
  }
  const { Output, BufferTarget, CanvasSource, Mp4OutputFormat, Quality, canEncodeVideo } =
    await import("./vendor/mediabunny.mjs");
  signal.throwIfAborted();
  const first = await rasterizeArtwork(renderFrame(0));
  signal.throwIfAborted();
  const canvas = document.createElement("canvas");
  // H.264 needs even dimensions. Extend the last edge pixel rather than stretch the artwork.
  canvas.width = first.width + first.width % 2;
  canvas.height = first.height + first.height % 2;
  const config = { width: canvas.width, height: canvas.height, quality: new Quality({ bitrate: 4000000 }) };
  if (!await canEncodeVideo("avc", config)) {
    throw new DOMException("H.264 MP4 encoding is unavailable in this browser. Try Chrome or Safari.", "NotSupportedError");
  }
  signal.throwIfAborted();
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target });
  const source = new CanvasSource(canvas, { codec: "avc", quality: config.quality });
  output.addVideoTrack(source, { frameRate: 1000 / frameDelay });
  const ctx = canvas.getContext("2d");
  let cancellation;
  const cancel = () => cancellation ||= output.cancel();
  const onAbort = () => { void cancel().catch(() => {}); };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    signal.throwIfAborted();
    await output.start();
    for (let i = 0; i < count; i++) {
      signal.throwIfAborted();
      const frame = i === 0 ? first : await rasterizeArtwork(renderFrame(i));
      signal.throwIfAborted();
      ctx.drawImage(frame, 0, 0);
      if (canvas.height > frame.height) ctx.drawImage(frame, 0, frame.height - 1, frame.width, 1, 0, frame.height, frame.width, 1);
      if (canvas.width > frame.width) ctx.drawImage(canvas, frame.width - 1, 0, 1, canvas.height, frame.width, 0, 1, canvas.height);
      await source.add(i * frameDelay / 1000, frameDelay / 1000, { keyFrame: true });
      signal.throwIfAborted();
      onProgress(i + 1, count);
    }
    await output.finalize();
    signal.throwIfAborted();
    return new Blob([target.buffer], { type: "video/mp4" });
  } finally {
    signal.removeEventListener("abort", onAbort);
    if (output.state !== "finalized") await cancel().catch(() => {});
  }
}
