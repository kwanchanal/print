import { createRandom } from "../../seed.js";

const kernels = {
  "Floyd-Steinberg": [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]],
  Atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
  "Jarvis-Judice-Ninke": [[1, 0, 7 / 48], [2, 0, 5 / 48], [-2, 1, 3 / 48], [-1, 1, 5 / 48], [0, 1, 7 / 48], [1, 1, 5 / 48], [2, 1, 3 / 48], [-2, 2, 1 / 48], [-1, 2, 3 / 48], [0, 2, 5 / 48], [1, 2, 3 / 48], [2, 2, 1 / 48]],
  "Two-Row Sierra": [[1, 0, 4 / 16], [2, 0, 3 / 16], [-2, 1, 1 / 16], [-1, 1, 2 / 16], [0, 1, 3 / 16], [1, 1, 2 / 16], [2, 1, 1 / 16]]
};
export const algorithms = [...Object.keys(kernels), "Ordered 2x2", "Ordered 4x4", "Ordered 8x8"];
export const palettes = {
  Custom: ["#000000", "#62d0a6"],
  "Black & White": ["#000000", "#ffffff"],
  CMYK: ["#00ffff", "#ff00ff", "#ffff00", "#000000", "#ffffff"],
  "Warm Sunset": ["#2d1e2f", "#d7263d", "#f46036", "#f9c80e", "#ffe9b3"],
  "Retro Pop": ["#1d1b1f", "#ff3864", "#35ff69", "#00bfff", "#ffd166", "#f8f9fa"],
  "Web Safe 8": ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"]
};
const clamp = value => Math.max(0, Math.min(255, value));

export function bayerMatrix(size) {
  let matrix = [[0]];
  for (let n = 1; n < size; n *= 2) {
    const next = Array.from({ length: n * 2 }, () => Array(n * 2));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const value = matrix[y][x] * 4;
      next[y][x] = value; next[y][x + n] = value + 2;
      next[y + n][x] = value + 3; next[y + n][x + n] = value + 1;
    }
    matrix = next;
  }
  return matrix;
}

export function randomImage(seed, width = 600, height = 600) {
  const random = createRandom(`halftone:1:${seed}`);
  const fields = Array.from({ length: 5 }, () => ({ x: random(), y: random(), frequency: 5 + random() * 20, phase: random() * 6.28 }));
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      let value = 0.5;
      for (const field of fields) value += 0.17 * Math.sin(Math.hypot(x / width - field.x, y / height - field.y) * field.frequency + field.phase + channel * 1.4);
      pixels[index + channel] = value * 255;
    }
    pixels[index + 3] = 255;
  }
  return pixels;
}

export function dither(pixels, width, height, settings) {
  if (!algorithms.includes(settings.algorithm)) throw new Error("Unknown dithering algorithm");
  const block = Math.max(1, Math.min(12, Math.round(settings.scale) || 3));
  const columns = Math.ceil(width / block), rows = Math.ceil(height / block);
  const colors = settings.palette === "Custom" ? [settings.color1, settings.color2] : palettes[settings.palette];
  if (!colors?.length) throw new Error("Unknown color palette");
  const rgb = colors.map(hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)));
  const values = new Float32Array(columns * rows * 3);
  // Average complete blocks before quantization, including partial edge blocks.
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const endX = Math.min(width, (col + 1) * block), endY = Math.min(height, (row + 1) * block);
    const count = (endX - col * block) * (endY - row * block);
    const target = (row * columns + col) * 3;
    for (let y = row * block; y < endY; y++) for (let x = col * block; x < endX; x++) {
      const index = (y * width + x) * 4, alpha = pixels[index + 3] / 255;
      for (let channel = 0; channel < 3; channel++) {
        const value = pixels[index + channel] * alpha + 255 * (1 - alpha);
        values[target + channel] += clamp((value - 128) * settings.contrast + 128 + settings.brightness) / count;
      }
    }
  }
  const orderedSize = settings.algorithm.startsWith("Ordered") ? Number(settings.algorithm.match(/\d+/)[0]) : 0;
  const matrix = orderedSize ? bayerMatrix(orderedSize) : null;
  const result = new Uint8Array(columns * rows);
  for (let row = 0; row < rows; row++) {
    const direction = !matrix && row % 2 ? -1 : 1;
    for (let step = 0; step < columns; step++) {
      const col = direction === 1 ? step : columns - step - 1;
      const index = row * columns + col, offset = index * 3;
      const threshold = matrix ? (matrix[row % orderedSize][col % orderedSize] / (orderedSize * orderedSize) - 0.5) * 50 : 0;
      let nearest = 0, distance = Infinity;
      for (let p = 0; p < rgb.length; p++) {
        const dr = clamp(values[offset] + threshold) - rgb[p][0];
        const dg = clamp(values[offset + 1] + threshold) - rgb[p][1];
        const db = clamp(values[offset + 2] + threshold) - rgb[p][2];
        const candidate = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
        if (candidate < distance) { distance = candidate; nearest = p; }
      }
      result[index] = nearest;
      if (matrix) continue;
      // Mirror each diffusion kernel on alternate rows (serpentine scanning).
      for (const [dx, dy, weight] of kernels[settings.algorithm]) {
        const x = col + dx * direction, y = row + dy;
        if (x < 0 || x >= columns || y >= rows) continue;
        const target = (y * columns + x) * 3;
        for (let channel = 0; channel < 3; channel++) values[target + channel] += (values[offset + channel] - rgb[nearest][channel]) * weight;
      }
    }
  }
  return { indices: result, colors, columns, rows, block, width, height };
}

export function colorPaths({ indices, colors, columns, rows, block, width, height }) {
  const paths = colors.map(() => []);
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns;) {
    const color = indices[row * columns + col], start = col;
    while (col < columns && indices[row * columns + col] === color) col++;
    const x = start * block, y = row * block;
    const w = Math.min(width, col * block) - x, h = Math.min(block, height - y);
    paths[color].push(`M${x} ${y}h${w}v${h}h${-w}z`);
  }
  return paths.map(parts => parts.join(""));
}
