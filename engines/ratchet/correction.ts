/**
 * Static-eval correction history, Stash 302136d (pawns), dcc25ed (non-pawn
 * pieces), ba73642 (minor pieces) and ea9fd72 (major pieces): five tables, by
 * the pawn key, each color's non-pawn key, the minor key and the major key, each
 * per side to move. An entry is a depth-weighted moving average of how far the
 * search's score fell from the static eval, kept in 1/256 of the engine's unit.
 * The search adds the five entries to the raw eval; the TT keeps the raw one, so
 * a probe corrects it again with the tables as they stand.
 *
 * The tables last between moves of a game and are emptied by newGame; a fresh
 * go() empties them too, so a node signature starts clean.
 */
import { CORR_MAX, CORR_WEIGHT_MAX } from "./params";
import { majorKey, minorKey, nonPawnKey, pawnKey } from "./state";

const SIZE = 16384;
const GRAIN = 256;
const WEIGHT_SCALE = 256;

/**
 * (table * 2 + side to move) * SIZE + the key's low bits; table 0 by pawns, 1
 * and 2 by White's and Black's non-pawn pieces, 3 by minor and 4 by major pieces
 */
const corr = new StaticArray<i32>(5 * 2 * SIZE);

export function clearCorrection(): void {
  for (let i = 0; i < corr.length; i++) unchecked((corr[i] = 0));
}

@inline function slot(table: i32, stm: i32, key: u64): i32 {
  return (table * 2 + stm) * SIZE + <i32>(key & <u64>(SIZE - 1));
}

/** the summed correction for the side to move, in the engine's unit (Stash correction_hist_score, once per table) */
@inline export function correction(stm: i32): i32 {
  return (
    unchecked(corr[slot(0, stm, pawnKey)]) / GRAIN +
    unchecked(corr[slot(1, stm, unchecked(nonPawnKey[0]))]) / GRAIN +
    unchecked(corr[slot(2, stm, unchecked(nonPawnKey[1]))]) / GRAIN +
    unchecked(corr[slot(3, stm, minorKey)]) / GRAIN +
    unchecked(corr[slot(4, stm, majorKey)]) / GRAIN
  );
}

/** moves one entry toward `diff`, weighted by depth, within CORR_MAX (Stash correction_hist_update) */
@inline function update(i: i32, w: i32, diff: i32): void {
  const v = (unchecked(corr[i]) * (WEIGHT_SCALE - w) + diff * GRAIN * w) / WEIGHT_SCALE;
  unchecked((corr[i] = max(-CORR_MAX * GRAIN, min(CORR_MAX * GRAIN, v))));
}

/** moves the side to move's entry in every table toward `diff`, the score less the static eval */
export function updateCorrection(stm: i32, depth: i32, diff: i32): void {
  const w = min(CORR_WEIGHT_MAX, 1 + depth);
  update(slot(0, stm, pawnKey), w, diff);
  update(slot(1, stm, unchecked(nonPawnKey[0])), w, diff);
  update(slot(2, stm, unchecked(nonPawnKey[1])), w, diff);
  update(slot(3, stm, minorKey), w, diff);
  update(slot(4, stm, majorKey), w, diff);
}
