/**
 * Static-eval correction history, Stash 302136d add_correction_history (pawns),
 * dcc25ed correction_hist_update (non-pawn pieces), ba73642 board_minor_key (minor
 * pieces) and ea9fd72 board_major_key (major pieces): five tables, by
 * the pawn key, each color's non-pawn key, the minor key and the major key, each
 * per side to move. An entry is a depth-weighted moving average of how far the
 * search's score fell from the static eval, kept in 1/256 of the engine's unit.
 * The search adds the five entries to the raw eval; the TT keeps the raw one, so
 * a probe corrects it again with the tables as they stand.
 *
 * A sixth table is by the last two moves (Clockwork e774be4 get_cont_corr_slot): the continuation
 * row of the move two plies back, then the piece and square of the last move.
 * A null move or the root's edge on either ply leaves it out.
 *
 * The tables last between moves of a game and are emptied by newGame; a fresh
 * go() empties them too, so a node signature starts clean. Feature: Static_Evaluation_Correction_History.
 */
import { CORR_CONT, CORR_MAX, CORR_WEIGHT_MAX, CORR_W_CONT, CORR_W_MAJOR, CORR_W_MINOR, CORR_W_NONPAWN_THEM, CORR_W_NONPAWN_US, CORR_W_PAWN } from "./params";
import { majorKey, minorKey, nonPawnKey, pawnKey } from "./state";

const SIZE = 16384;
const GRAIN = 256;
const WEIGHT_SCALE = 256;

/**
 * (table * 2 + side to move) * SIZE + the key's low bits; table 0 by pawns, 1
 * and 2 by White's and Black's non-pawn pieces, 3 by minor and 4 by major pieces
 */
const corr = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 5 * 2 * SIZE));

/** by the last two moves: a continuation row (piece and square, times 1024) plus the last move's piece and square */
const contCorr = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 1024 * 1024));

export function clearCorrection(): void {
  for (let i = 0; i < 5 * 2 * SIZE; i++) unchecked((corr[i] = 0));
  if (CORR_CONT != 0) for (let i = 0; i < 1024 * 1024; i++) unchecked((contCorr[i] = 0));
}

/**
 * the sixth table's entry for a node, or -1 for none: `cm` and `fm` are the continuation rows of the moves one ply and
 * two plies back, -1 where there is no such move
 */
@inline export function contSlot(cm: i32, fm: i32): i32 {
  return CORR_CONT != 0 && fm >= 0 && cm >= 0 ? fm + (cm >> 10) : -1;
}

@inline function slot(table: i32, stm: i32, key: u64): i32 {
  return (table * 2 + stm) * SIZE + <i32>(key & <u64>(SIZE - 1));
}

/** the weighted sum of the six correction tables for the side to move, in the engine's unit (Weiss 2a3f84c GetCorrectionHistory; unweighted Stash dcc25ed sum not taken). Feature: Static_Evaluation_Correction_History. */
@inline export function correction(stm: i32, cont: i32): i32 {
  const sum =
    (cont >= 0 ? CORR_W_CONT * unchecked(contCorr[cont]) : 0) +
    CORR_W_PAWN * unchecked(corr[slot(0, stm, pawnKey)]) +
    CORR_W_NONPAWN_US * unchecked(corr[slot(1 + stm, stm, unchecked(nonPawnKey[stm]))]) +
    CORR_W_NONPAWN_THEM * unchecked(corr[slot(1 + (stm ^ 1), stm, unchecked(nonPawnKey[stm ^ 1]))]) +
    CORR_W_MINOR * unchecked(corr[slot(3, stm, minorKey)]) +
    CORR_W_MAJOR * unchecked(corr[slot(4, stm, majorKey)]);
  return sum / (GRAIN * WEIGHT_SCALE);
}

/** moves one entry toward `diff`, weighted by depth, within CORR_MAX (Stash dcc25ed correction_hist_update). Feature: Static_Evaluation_Correction_History. */
@inline function update(table: StaticArray<i32>, i: i32, w: i32, diff: i32): void {
  const v = (unchecked(table[i]) * (WEIGHT_SCALE - w) + diff * GRAIN * w) / WEIGHT_SCALE;
  unchecked((table[i] = max(-CORR_MAX * GRAIN, min(CORR_MAX * GRAIN, v))));
}

/** moves the side to move's entry in every table toward `diff`, the score less the static eval; `cont` is contSlot's */
export function updateCorrection(stm: i32, depth: i32, diff: i32, cont: i32): void {
  const w = min(CORR_WEIGHT_MAX, 1 + depth);
  update(corr, slot(0, stm, pawnKey), w, diff);
  update(corr, slot(1, stm, unchecked(nonPawnKey[0])), w, diff);
  update(corr, slot(2, stm, unchecked(nonPawnKey[1])), w, diff);
  update(corr, slot(3, stm, minorKey), w, diff);
  update(corr, slot(4, stm, majorKey), w, diff);
  if (cont >= 0) update(contCorr, cont, w, diff);
}
