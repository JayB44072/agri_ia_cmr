export function fluctuate(base: number, delta: number, dec = 1): number {
  return parseFloat((base + (Math.random() * 2 - 1) * delta).toFixed(dec));
}
