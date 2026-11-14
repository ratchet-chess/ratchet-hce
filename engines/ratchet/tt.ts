/**
 * The transposition table: 32-byte buckets of three 10-byte entries (Ethereal 0e47e9b
 * TTBucket, Alexandria 829daf4 TTBucket's layout), indexed by a 32 x 32 -> 64 multiply of the key's
 * low half, checked by its top 16 bits.
 *
 * Entry: key16 u16 | move u16 | score i16 | raw eval i16 | depth u8 | flags u8,
 * flags = bound (2 bits) | PV (1 bit) << 2 | generation (5 bits) << 3. Bound 0 is
 * an empty slot. The move keeps the core's low 15 bits and a castle bit above them; the
 * probe restores the other flags from the board. qsearch stores at depth 0.
 */
import { FLAG_CASTLE, FLAG_DOUBLE, FLAG_EP, PAWN, moveFrom, moveTo } from "../../core/constants";
import { board, ep } from "../../core/position";
import { isLegal } from "../../core/movegen";
import { TT_AGE_STORE } from "./params";

/** the stored move's castle bit: a Chess960 castle's king can move one square or none, so its step cannot tell */
const TT_CASTLE = 0x8000;

export const BOUND_UPPER = 1;
export const BOUND_LOWER = 2;
export const BOUND_EXACT = 3;

const BUCKET_BYTES = 32;
const ENTRY_BYTES = 10;
const ENTRIES = 3;

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

/** a new table of `mb` megabytes, emptied */
export function ttAlloc(mb: i32): void {
  const bytes = <usize>max(1, mb) << 20;
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

/** finds `key`; on a hit sets the tt* fields and returns true */
export function ttProbe(key: u64): bool {
  const b = bucketOf(key);
  const check = <u16>(key >> 48);
  for (let i = 0; i < ENTRIES; i++) {
    const e = b + <usize>i * ENTRY_BYTES;
    const flags = <i32>load<u8>(e, 9);
    if (load<u16>(e) == check && flags & 3) {
      ttMove = <i32>load<u16>(e, 2);
      ttScore = <i32>load<i16>(e, 4);
      ttEval = <i32>load<i16>(e, 6);
      ttDepth = <i32>load<u8>(e, 8);
      ttBound = flags & 3;
      ttPv = (flags & 4) != 0;
      return true;
    }
  }
  return false;
}

/**
 * Stores a search result. The slot is the key's own, or else the one with the
 * least depth less 8 per generation of age (Stockfish 9dbb3ae8 TranspositionTable::probe). A result for the
 * same key that is not exact and is more than 2 plies shallower is dropped, and a
 * store without a move keeps the old one (Ethereal 0e47e9b tt_store).
 */
export function ttStore(key: u64, move: i32, score: i32, rawEval: i32, depth: i32, bound: i32, pv: bool): void {
  if (!ttEnabled) return;
  let stored = (move & 0x7fff) | (move & FLAG_CASTLE ? TT_CASTLE : 0);
  const b = bucketOf(key);
  const check = <u16>(key >> 48);
  let slot: usize = 0;
  let worst = i32.MAX_VALUE;
  for (let i = 0; i < ENTRIES; i++) {
    const e = b + <usize>i * ENTRY_BYTES;
    const flags = <i32>load<u8>(e, 9);
    if (load<u16>(e) == check && flags & 3) {
      if (bound != BOUND_EXACT && depth < <i32>load<u8>(e, 8) - 2 && (TT_AGE_STORE == 0 || flags >> 3 == generation)) return;
      if (!stored) stored = <i32>load<u16>(e, 2);
      slot = e;
      break;
    }
    const value = flags & 3 ? <i32>load<u8>(e, 8) - 8 * ((32 + generation - (flags >> 3)) & 31) : i32.MIN_VALUE;
    if (value < worst) {
      worst = value;
      slot = e;
    }
  }
  store<u16>(slot, check);
  store<u16>(slot, <u16>stored, 2);
  store<i16>(slot, <i16>score, 4);
  store<i16>(slot, <i16>rawEval, 6);
  store<u8>(slot, <u8>depth, 8);
  store<u8>(slot, <u8>(bound | (pv ? 4 : 0) | (generation << 3)), 9);
}

/** the table's stored move as a legal move of this position with its flags, or 0 */
export function fullMove(m: i32): i32 {
  if (!m) return 0;
  if (m & TT_CASTLE) return isLegal((m & 0x7fff) | FLAG_CASTLE) ? (m & 0x7fff) | FLAG_CASTLE : 0;
  const from = moveFrom(m);
  const to = moveTo(m);
  const type = <i32>board[from] & 7;
  if (type == PAWN) {
    if (abs(to - from) == 16) m |= FLAG_DOUBLE;
    else if (to == ep && (to & 7) != (from & 7) && !board[to]) m |= FLAG_EP;
  }
  return isLegal(m) ? m : 0;
}
