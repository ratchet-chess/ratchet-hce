/**
 * The transposition table: 32-byte buckets holding one 64-bit word of three packed 21-bit key fragments and three
 * 8-byte entries (Clockwork 8ee523a TTCluster), indexed by a 32 x 32 -> 64 multiply of the key's low half and checked
 * by its top 21 bits (non-zero, with 0 marking an empty slot). Ethereal 0e47e9b TTBucket and Alexandria 829daf4
 * TTBucket store three 10-byte entries with 16-bit keys and two bytes of padding, the form not taken.
 *
 * Entry (8 bytes): move u16 | score i16 | raw eval i16 | depth u8 | flags u8,
 * flags = bound (2 bits) | PV (1 bit) << 2 | generation (5 bits) << 3. Bound 0 is
 * never stored. The move keeps the core's low 15 bits, and ttMoveOf restores its
 * flags from the board. qsearch stores at depth 0.
 *
 * Features: Transposition_Table, Transposition_Table#Bucket_Systems, Transposition_Table#Aging.
 */
import { FLAG_CASTLE, FLAG_DOUBLE, FLAG_EP, KING, PAWN, moveFrom, moveTo } from "../../core/constants";
import { board, ep } from "../../core/position";
import { isLegal } from "../../core/movegen";
import { TT_AGE_STORE } from "./params";

export const BOUND_UPPER = 1;
export const BOUND_LOWER = 2;
export const BOUND_EXACT = 3;

const BUCKET_BYTES = 32;
const ENTRY_BYTES = 8;
const ENTRIES = 3;
const FRAG_WIDTH = 21;
const FRAG_MASK: u64 = 0x1fffff;
/** low and high bit of each 21-bit lane (0, 21, 42 and 20, 41, 62), for SWAR 3-way fragment lookup */
const FRAG_LSB: u64 = 0x0000040000200001;
const FRAG_MSB: u64 = 0x4000020000100000;

/** the allocation, and the table inside it on a cache line, so no 32-byte bucket crosses one */
let block: usize = 0;
let table: usize = 0;
let buckets: u64 = 0;
let generation = 0;

/** a probe's fields, valid after ttProbe returns true */
export let ttMove = 0;
export let ttScore = 0;
export let ttEval = 0;
export let ttDepth = 0;
export let ttBound = 0;
export let ttPv = false;

/**
 * The largest table, four buckets short of 1 GiB. AssemblyScript's stub runtime refuses a block of 1 GiB less its
 * header, or more (std/assembly/rt/common.ts BLOCK_MAXSIZE), and the block is the table and 64 bytes to align it.
 * A Hash of 1024, the option's maximum, gets this size.
 */
const MAX_BYTES: u64 = (1 << 30) - 4 * BUCKET_BYTES;

/** a new table of `mb` megabytes, emptied; at most MAX_BYTES */
export function ttAlloc(mb: i32): void {
  const bytes = <usize>min<u64>(<u64>max(1, mb) << 20, MAX_BYTES);
  if (block) heap.free(block);
  block = heap.alloc(bytes + 64);
  table = (block + 63) & ~<usize>63;
  buckets = <u64>(bytes / BUCKET_BYTES);
  ttClear();
}

export function ttClear(): void {
  memory.fill(table, 0, <usize>buckets * BUCKET_BYTES);
  generation = 0;
}

/** whether stores are kept; the window gate turns them off, so a cleared table stays empty and never hits */
let ttEnabled = true;

export function ttEnable(on: bool): void {
  ttEnabled = on;
}

/** a new search: older entries age, so they are replaced first */
export function ttNewSearch(): void {
  generation = (generation + 1) & 31;
}

@inline function bucketOf(key: u64): usize {
  return table + <usize>(((key & 0xffffffff) * buckets) >> 32) * BUCKET_BYTES;
}

/** top 21 bits of `key`, mapped out of 0 so 0 uniquely marks an empty bucket slot */
@inline function fragmentOf(key: u64): u64 {
  const f = key >> 43;
  return f ? f : 1;
}

/**
 * the permille of entries in the first 1000 buckets that this search stored, for UCI's hashfull: Weiss c735b8f
 * HashFull counts only the current generation, where Ethereal 0e47e9b tt_hashfull counts every filled entry.
 * Feature: Hashfull.
 */
export function ttHashfull(): i32 {
  const n = <usize>min<u64>(1000, buckets);
  let used = 0;
  for (let i: usize = 0; i < n; i++) {
    for (let j = 0; j < ENTRIES; j++) {
      const flags = <i32>load<u8>(table + i * BUCKET_BYTES + 8 + <usize>j * ENTRY_BYTES, 7);
      if (flags & 3 && flags >> 3 == generation) used++;
    }
  }
  return <i32>((<u64>used * 1000) / (<u64>n * ENTRIES));
}

/** finds `key`; on a hit sets the tt* fields and returns true */
export function ttProbe(key: u64): bool {
  const b = bucketOf(key);
  const frag = fragmentOf(key);
  const zeros = (frag * FRAG_LSB) ^ load<u64>(b);
  const matches = (zeros - FRAG_LSB) & ~zeros & FRAG_MSB;
  if (!matches) return false;
  // ctz(matches) is 20, 41 or 62 -> slot 0, 1 or 2 without division
  const idx = (<i32>ctz(matches) * 3) >> 6;
  const e = b + 8 + (<usize>idx << 3);
  const flags = <i32>load<u8>(e, 7);
  ttMove = <i32>load<u16>(e);
  ttScore = <i32>load<i16>(e, 2);
  ttEval = <i32>load<i16>(e, 4);
  ttDepth = <i32>load<u8>(e, 6);
  ttBound = flags & 3;
  ttPv = (flags & 4) != 0;
  return true;
}

/**
 * Stores a search result. The slot is the key's own, else an empty slot, else the one with the
 * least depth less 8 per generation of age (Stockfish 9dbb3ae8 TranspositionTable::probe). A result for the
 * same key that is not exact and is more than 2 plies shallower than an entry of this search is dropped
 * (TT_AGE_STORE), and a store without a move keeps the old one (Ethereal 0e47e9b tt_store).
 * Features: Transposition_Table#Bucket_Systems, Transposition_Table#Aging, Transposition_Table#Depth-Preferred.
 */
export function ttStore(key: u64, move: i32, score: i32, rawEval: i32, depth: i32, bound: i32, pv: bool): void {
  if (!ttEnabled) return;
  let stored = move & 0x7fff;
  const b = bucketOf(key);
  const frag = fragmentOf(key);
  const frags = load<u64>(b);
  const zeros = (frag * FRAG_LSB) ^ frags;
  const matches = (zeros - FRAG_LSB) & ~zeros & FRAG_MSB;
  let idx = 0;
  if (matches) {
    idx = (<i32>ctz(matches) * 3) >> 6;
    const e = b + 8 + (<usize>idx << 3);
    const flags = <i32>load<u8>(e, 7);
    if (bound != BOUND_EXACT && depth < <i32>load<u8>(e, 6) - 2 && (TT_AGE_STORE == 0 || flags >> 3 == generation)) {
      return;
    }
    if (!stored) stored = <i32>load<u16>(e);
  } else {
    const empty = (frags - FRAG_LSB) & ~frags & FRAG_MSB;
    if (empty) {
      idx = (<i32>ctz(empty) * 3) >> 6;
    } else {
      let worst = i32.MAX_VALUE;
      for (let i = 0; i < ENTRIES; i++) {
        const e = b + 8 + (<usize>i << 3);
        const flags = <i32>load<u8>(e, 7);
        const value = <i32>load<u8>(e, 6) - 8 * ((32 + generation - (flags >> 3)) & 31);
        if (value < worst) {
          worst = value;
          idx = i;
        }
      }
    }
    const shift = <u64>(idx * FRAG_WIDTH);
    store<u64>(b, (frags & ~(FRAG_MASK << shift)) | (frag << shift));
  }
  const slot = b + 8 + (<usize>idx << 3);
  store<u16>(slot, <u16>stored);
  store<i16>(slot, <i16>score, 2);
  store<i16>(slot, <i16>rawEval, 4);
  store<u8>(slot, <u8>depth, 6);
  store<u8>(slot, <u8>(bound | (pv ? 4 : 0) | (generation << 3)), 7);
}

/** the table's 15-bit move as a legal move of this position with its flags, or 0 */
export function ttMoveOf(m: i32): i32 {
  if (!m) return 0;
  const from = moveFrom(m);
  const to = moveTo(m);
  const type = <i32>board[from] & 7;
  if (type == KING && abs(to - from) == 2) m |= FLAG_CASTLE;
  else if (type == PAWN) {
    if (abs(to - from) == 16) m |= FLAG_DOUBLE;
    else if (to == ep && (to & 7) != (from & 7) && !board[to]) m |= FLAG_EP;
  }
  return isLegal(m) ? m : 0;
}
