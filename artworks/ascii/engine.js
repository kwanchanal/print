import { createRandom } from "../../seed.js";

export const palettes = {
  Medium: "@#S%?*+;:,. ", Light: "#&@%$*o!;.", Minimal: "#:. ",
  Dense: "$@B%8&WM#*oahkbdpqwmZ0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  Smooth: "@%#*+=-:. ", Blocks: "@#\u2588\u2593\u2592\u2591:. ",
  Lines: "|/\\_-:. ", Binary: "10 ", DotMatrix: "@#o*+=-:. ",
  Retro: "MWNXK0Okxdolc:;,. ", MinimalWide: "@$=:. "
};

export function randomPixels(seed, width, height) {
  const random = createRandom(`ascii:1:${seed}`);
  const waves = Array.from({ length: 6 }, () => ({
    x: random() * 2 - 1, y: random() * 2 - 1,
    frequency: 3 + random() * 12, phase: random() * Math.PI * 2,
    weight: 0.1 + random() * 0.25
  }));
  const tint = [random(), random(), random()];
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = x / width * 2 - 1, v = y / height * 2 - 1;
    let value = 0.5;
    for (const wave of waves) {
      value += Math.cos(Math.hypot(u - wave.x, v - wave.y) * wave.frequency + wave.phase) * wave.weight;
    }
    value = Math.max(0, Math.min(1, value));
    const index = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) pixels[index + c] = 255 * Math.min(1, value * (0.5 + tint[c]));
    pixels[index + 3] = 255;
  }
  return pixels;
}

export function convertPixels(pixels, settings) {
  const chars = Array.from((settings.palette === "Custom" ? settings.characters : palettes[settings.palette])?.replace(/\s/g, " ") || " ");
  const factor = 259 * (settings.contrast + 255) / (255 * (259 - settings.contrast));
  const cells = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const rgb = [0, 1, 2].map(channel => Math.max(0, Math.min(255, Math.round(factor * (pixels[i + channel] - 128) + 128 + settings.brightness))));
    const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
    cells.push({ character: pixels[i + 3] === 0 ? " " : chars[Math.floor((1 - brightness / 255) * (chars.length - 1))], color: `rgb(${rgb.join(",")})` });
  }
  return cells;
}
