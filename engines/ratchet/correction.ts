/**
 * Static-eval correction history by pawn structure, Stash 302136d: per side to
 * move and pawn key, a depth-weighted moving average of how far the search's
 * score fell from the static eval, kept in 1/256 of the engine's unit. The search
 * adds it to the raw eval; the TT keeps the raw one, so a probe corrects it again
 * with the table as it stands.
 *
 * The table lasts between moves of a game and is emptied by newGame; a fresh
 * go() empties it too, so a node signature starts clean.
 */
import { CORR_MAX, CORR_WEIGHT_MAX } from "./params";
import { pawnKey } from "./state";

const SIZE = 16384;
const GRAIN = 256;
const WEIGHT_SCALE = 256;

/** side * SIZE + the pawn key's low bits */
const pawnCorr = new StaticArray<i32>(2 * SIZE);

export function clearCorrection(): void {
  for (let i = 0; i < pawnCorr.length; i++) unchecked((pawnCorr[i] = 0));
}

@inline function slot(stm: i32): i32 {
  return stm * SIZE + <i32>(pawnKey & <u64>(SIZE - 1));
}

/** the correction for the side to move, in the engine's unit (Stash get_correction) */
@inline export function correction(stm: i32): i32 {
  return unchecked(pawnCorr[slot(stm)]) / GRAIN;
}

/** moves the side to move's entry toward `diff`, the score less the static eval, weighted by depth (Stash add_correction_history) */
export function updateCorrection(stm: i32, depth: i32, diff: i32): void {
  const i = slot(stm);
  const w = min(CORR_WEIGHT_MAX, 1 + depth);
  const v = (unchecked(pawnCorr[i]) * (WEIGHT_SCALE - w) + diff * GRAIN * w) / WEIGHT_SCALE;
  unchecked((pawnCorr[i] = max(-CORR_MAX * GRAIN, min(CORR_MAX * GRAIN, v))));
}
