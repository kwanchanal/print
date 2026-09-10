import { GIFEncoder, quantize, applyPalette } from "./vendor/gifenc.js";

const gif = GIFEncoder();
let palette;
self.onmessage = ({ data }) => {
  try {
    if (data.type === "finish") {
      gif.finish();
      const bytes = gif.bytes();
      self.postMessage({ bytes }, [bytes.buffer]);
    } else {
      const rgba = new Uint8Array(data.rgba);
      // Normalize the library's 5-bit RGB buckets: gifenc caches the first color in
      // each bucket, which otherwise varies when a topping moves over that pixel.
      for (let i = 0; i < rgba.length; i += 4) {
        rgba[i] = (rgba[i] & 248) | 4;
        rgba[i + 1] = (rgba[i + 1] & 248) | 4;
        rgba[i + 2] = (rgba[i + 2] & 248) | 4;
      }
      // A fixed palette keeps unchanged paper and ink pixels identical between frames.
      palette ||= quantize(rgba, 256);
      gif.writeFrame(applyPalette(rgba, palette), data.width, data.height,
        { palette, delay: data.delay, repeat: 0, dispose: 1 });
      self.postMessage({ ready: true });
    }
  } catch (error) { self.postMessage({ error: error.message }); }
};
