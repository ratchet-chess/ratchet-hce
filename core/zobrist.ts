/** Zobrist keys, filled from a fixed seed so hashes are identical across runs. */

/** piece code * 64 + square */
export const Z_PIECE = new StaticArray<u64>(16 * 64);
/** by castling-rights mask */
export const Z_CASTLE = new StaticArray<u64>(16);
/** by en-passant square; index 64 (no square) stays 0 */
export const Z_EP = new StaticArray<u64>(65);
export let Z_SIDE: u64 = 0;

let seed: u64 = 0x2545f4914f6cdd1d;
function next(): u64 {
  // splitmix64
  seed += 0x9e3779b97f4a7c15;
  let z = seed;
  z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9;
  z = (z ^ (z >> 27)) * 0x94d049bb133111eb;
  return z ^ (z >> 31);
}

export function initZobrist(): void {
  for (let i = 0; i < 16 * 64; i++) Z_PIECE[i] = next();
  for (let i = 0; i < 16; i++) Z_CASTLE[i] = next();
  for (let i = 0; i < 64; i++) Z_EP[i] = next();
  Z_SIDE = next();
}
