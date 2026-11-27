/**
 * Attack and geometry tables for native 64-bit bitboards, square a1 = 0.
 * Sliders use plain magic bitboards. initTables() tries the generated magics in
 * magics.ts first and searches with a seeded generator only if one fails.
 */
import { KNOWN_MAGICS } from "./magics";

export const KNIGHT_ATT = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 64));
export const KING_ATT = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 64));
/** squares a pawn of a color (0 or 1) on s attacks, at color * 64 + s */
export const PAWN_ATT = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 128));
/** squares strictly between a and b when aligned, at a * 64 + b */
export const BETWEEN = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 4096));
/** the full edge-to-edge line through a and b when aligned, at a * 64 + b */
export const LINE = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 4096));

/** per-record magic data, 32 bytes each (mask, mul, shift, offset): rooks 0..63, bishops 64..127 */
const MAGIC = memory.data(32 * 128, 64);
const MAGIC_MASK: usize = 0;
const MAGIC_MUL: usize = 8;
const MAGIC_SHIFT: usize = 16;
const MAGIC_OFFSET: usize = 24;
/** sum of 2^(mask bits) over all rook and bishop squares */
const SLIDER_ATT = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 107648));

const DF: StaticArray<i32> = [1, -1, 0, 0, 1, 1, -1, -1];
const DR: StaticArray<i32> = [0, 0, 1, -1, 1, -1, 1, -1];
const KDF: StaticArray<i32> = [1, 2, 2, 1, -1, -2, -2, -1];
const KDR: StaticArray<i32> = [2, 1, -1, -2, -2, -1, 1, 2];

@inline export function bit(s: i32): u64 {
  return (<u64>1) << (<u64>s);
}

@inline function onBoard(f: i32, r: i32): bool {
  return f >= 0 && f < 8 && r >= 0 && r < 8;
}

/** slider attacks from s by ray walking; d0 is 0 for rook directions, 4 for bishop */
function slowAttacks(s: i32, occ: u64, d0: i32): u64 {
  let a: u64 = 0;
  for (let d = d0; d < d0 + 4; d++) {
    const df = DF[d];
    const dr = DR[d];
    let f = (s & 7) + df;
    let r = (s >> 3) + dr;
    while (onBoard(f, r)) {
      a |= bit(r * 8 + f);
      if (occ & bit(r * 8 + f)) break;
      f += df;
      r += dr;
    }
  }
  return a;
}

/** relevant occupancy: the rays minus their last square */
function relevantMask(s: i32, d0: i32): u64 {
  let m: u64 = 0;
  for (let d = d0; d < d0 + 4; d++) {
    const df = DF[d];
    const dr = DR[d];
    let f = (s & 7) + df;
    let r = (s >> 3) + dr;
    while (onBoard(f + df, r + dr)) {
      m |= bit(r * 8 + f);
      f += df;
      r += dr;
    }
  }
  return m;
}

let seed: u64 = 0x9e3779b97f4a7c15;
function rand64(): u64 {
  seed ^= seed >> 12;
  seed ^= seed << 25;
  seed ^= seed >> 27;
  return seed * 0x2545f4914f6cdd1d;
}

const occs = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 4096));
const atts = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 4096));
const used = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 4096));
const stored = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 4096));

export function initTables(): void {
  for (let s = 0; s < 64; s++) {
    const f = s & 7;
    const r = s >> 3;
    for (let i = 0; i < 8; i++) {
      if (onBoard(f + KDF[i], r + KDR[i])) KNIGHT_ATT[s] |= bit((r + KDR[i]) * 8 + f + KDF[i]);
      if (onBoard(f + DF[i], r + DR[i])) KING_ATT[s] |= bit((r + DR[i]) * 8 + f + DF[i]);
    }
    for (let df = -1; df <= 1; df += 2) {
      if (onBoard(f + df, r + 1)) PAWN_ATT[s] |= bit((r + 1) * 8 + f + df);
      if (onBoard(f + df, r - 1)) PAWN_ATT[64 + s] |= bit((r - 1) * 8 + f + df);
    }
    for (let d = 0; d < 8; d++) {
      // the whole line through s in this direction and its opposite
      let line: u64 = bit(s);
      for (let ff = f + DF[d], rr = r + DR[d]; onBoard(ff, rr); ff += DF[d], rr += DR[d]) line |= bit(rr * 8 + ff);
      for (let ff = f - DF[d], rr = r - DR[d]; onBoard(ff, rr); ff -= DF[d], rr -= DR[d]) line |= bit(rr * 8 + ff);
      let between: u64 = 0;
      for (let ff = f + DF[d], rr = r + DR[d]; onBoard(ff, rr); ff += DF[d], rr += DR[d]) {
        const t = rr * 8 + ff;
        BETWEEN[s * 64 + t] = between;
        LINE[s * 64 + t] = line;
        between |= bit(t);
      }
    }
  }

  let offset = 0;
  let epoch = 0;
  for (let k = 0; k < 128; k++) {
    const s = k & 63;
    const d0 = k < 64 ? 0 : 4;
    const mask = relevantMask(s, d0);
    const bits = <i32>popcnt(mask);
    const n = 1 << bits;
    let sub: u64 = 0;
    let i = 0;
    do {
      occs[i] = sub;
      atts[i] = slowAttacks(s, sub, d0);
      i++;
      sub = (sub - mask) & mask;
    } while (sub != 0);

    const shift = <u64>(64 - bits);
    let first = true;
    for (;;) {
      let magic = KNOWN_MAGICS[k];
      if (!first || magic == 0) {
        magic = rand64() & rand64() & rand64();
        if (popcnt((mask * magic) >> 56) < 6) continue;
      }
      first = false;
      epoch++;
      let ok = true;
      for (let j = 0; j < n; j++) {
        const idx = <i32>((occs[j] * magic) >> shift);
        if (used[idx] != epoch) {
          used[idx] = epoch;
          stored[idx] = atts[j];
        } else if (stored[idx] != atts[j]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const e = MAGIC + (<usize>k << 5);
      store<u64>(e, mask, MAGIC_MASK);
      store<u64>(e, magic, MAGIC_MUL);
      store<u64>(e, shift, MAGIC_SHIFT);
      store<i32>(e, offset, MAGIC_OFFSET);
      for (let j = 0; j < n; j++) {
        if (used[j] == epoch) SLIDER_ATT[offset + j] = stored[j];
      }
      offset += n;
      break;
    }
  }
}

/** a record's magic number */
export function magicAt(k: i32): u64 {
  return load<u64>(MAGIC + (<usize>k << 5), MAGIC_MUL);
}

@inline export function rookAttacks(s: i32, occ: u64): u64 {
  const e = MAGIC + (<usize>s << 5);
  const idx = ((occ & load<u64>(e, MAGIC_MASK)) * load<u64>(e, MAGIC_MUL)) >> load<u64>(e, MAGIC_SHIFT);
  return SLIDER_ATT[load<i32>(e, MAGIC_OFFSET) + <i32>idx];
}

@inline export function bishopAttacks(s: i32, occ: u64): u64 {
  const e = MAGIC + 2048 + (<usize>s << 5);
  const idx = ((occ & load<u64>(e, MAGIC_MASK)) * load<u64>(e, MAGIC_MUL)) >> load<u64>(e, MAGIC_SHIFT);
  return SLIDER_ATT[load<i32>(e, MAGIC_OFFSET) + <i32>idx];
}
