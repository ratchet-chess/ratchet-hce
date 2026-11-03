/**
 * Move-ordering memory: one killer per ply (Weiss 0d00a00), butterfly history by
 * side, from and to, 1- and 2-ply continuation history by the previous moves'
 * piece and square, and capture history by piece, square and victim. Every
 * history entry moves by gravity, entry += bonus - entry * |bonus| / 16384
 * (Ethereal update_history), so it stays within +-16384.
 *
 * The tables last between moves of a game and are emptied by newGame (Stockfish
 * 946fa476); a fresh go() empties them too, so a node signature starts clean.
 */
import { MAX_PLY } from "../../core/constants";
import { HIST_BONUS_MAX, HIST_BONUS_MUL, HIST_BONUS_SUB, HIST_MALUS_MAX, HIST_MALUS_MUL, HIST_MALUS_SUB } from "./params";

export const HIST_MAX = 16384;

/** side * 4096 + (from | to << 6) */
export const butterfly = new StaticArray<i16>(2 * 4096);
/** (previous piece << 6 | its square) << 10 | (piece << 6 | square): 16 piece codes, so 2 MiB */
export const contHist = new StaticArray<i16>(1024 * 1024);
/** (piece << 6 | square) << 3 | victim type */
export const captureHist = new StaticArray<i16>(16 * 64 * 8);
/** one killer per ply, with room for the child of the deepest ply */
export const killers = new StaticArray<i32>(MAX_PLY + 2);

export function clearHistory(): void {
  for (let i = 0; i < butterfly.length; i++) unchecked((butterfly[i] = 0));
  for (let i = 0; i < contHist.length; i++) unchecked((contHist[i] = 0));
  for (let i = 0; i < captureHist.length; i++) unchecked((captureHist[i] = 0));
  for (let i = 0; i < killers.length; i++) unchecked((killers[i] = 0));
}

/** the bonus for the move that cut at `depth`, Weiss c735b8f */
@inline export function bonusAt(depth: i32): i32 {
  return min(HIST_BONUS_MAX, max(0, HIST_BONUS_MUL * depth - HIST_BONUS_SUB));
}

/** the malus for each move tried before it */
@inline export function malusAt(depth: i32): i32 {
  return min(HIST_MALUS_MAX, max(0, HIST_MALUS_MUL * depth - HIST_MALUS_SUB));
}

@inline export function gravity(table: StaticArray<i16>, i: i32, bonus: i32): void {
  const e = <i32>unchecked(table[i]);
  unchecked((table[i] = <i16>(e + bonus - (e * abs(bonus)) / HIST_MAX)));
}
