export const frameDelay = 500;

export function variationSeed(seed, index) {
  return index === 0 ? seed : JSON.stringify(["animation", 1, seed, index]);
}

export function animationDuration(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(2, Math.min(20, Math.round(number))) : 9;
}
