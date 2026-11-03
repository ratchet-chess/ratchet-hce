/**
 * The own engine's eval: material and piece-square tables, tapered between
 * middlegame and endgame by phase (Fruit 2.0's form; PeSTO's phase weights),
 * the side to move's tempo, insufficient material, and KXK mop-up. Scores are
 * for the side to move, in the engine's unit.
 *
 * The search reads the packed (middlegame, endgame) sum that state.ts keeps
 * incrementally. evaluateScratch() recomputes it from params.ts, so a tuning
 * build that sets a table at run time is scored with its new values.
 */
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK } from "../../core/constants";
import { bb, board, side } from "../../core/position";
import {
  BISHOP_EG, BISHOP_MG, KING_EG, KING_MG, KNIGHT_EG, KNIGHT_MG, MAT_EG, MAT_MG, MOPUP_CLOSE, MOPUP_EDGE, PAWN_EG, PAWN_MG,
  QUEEN_EG, QUEEN_MG, ROOK_EG, ROOK_MG, TEMPO_EG, TEMPO_MG,
} from "./params";

/** engine units per centipawn; the host reads centipawns */
export const UNITS_PER_CP = 4;

/** phase weights by piece type, PeSTO (CPW "PeSTO's Evaluation Function"): N 1, B 1, R 2, Q 4, out of 24 */
const PHASE_MAX = 24;

/**
 * A (middlegame, endgame) pair packed in one i32, the endgame in the high half
 * (Stockfish's Score). Sums and differences of packed pairs stay exact while each
 * half stays within i16.
 */
@inline export function S(mg: i32, eg: i32): i32 {
  return (eg << 16) + mg;
}

@inline export function mgOf(s: i32): i32 {
  return <i32><i16>s;
}

@inline export function egOf(s: i32): i32 {
  return <i32><i16>((s + 0x8000) >> 16);
}

/** material plus PSQT per piece code and square, White's view: piece code << 6 | square */
export const PSQ = new StaticArray<i32>(16 * 64);

function tableMg(type: i32, s: i32): i32 {
  switch (type) {
    case PAWN: return PAWN_MG[s];
    case KNIGHT: return KNIGHT_MG[s];
    case BISHOP: return BISHOP_MG[s];
    case ROOK: return ROOK_MG[s];
    case QUEEN: return QUEEN_MG[s];
    default: return KING_MG[s];
  }
}

function tableEg(type: i32, s: i32): i32 {
  switch (type) {
    case PAWN: return PAWN_EG[s];
    case KNIGHT: return KNIGHT_EG[s];
    case BISHOP: return BISHOP_EG[s];
    case ROOK: return ROOK_EG[s];
    case QUEEN: return QUEEN_EG[s];
    default: return KING_EG[s];
  }
}

/** a piece's packed value on a square, read from params.ts: White's at s, Black's mirrored and negated */
function pieceValue(p: i32, s: i32): i32 {
  const type = p & 7;
  const rel = p & 8 ? s ^ 56 : s;
  const v = S(MAT_MG[type] + tableMg(type, rel), MAT_EG[type] + tableEg(type, rel));
  return p & 8 ? -v : v;
}

/** fills PSQ from params.ts */
export function initEval(): void {
  for (let type = PAWN; type <= KING; type++) {
    for (let s = 0; s < 64; s++) {
      PSQ[(type << 6) + s] = pieceValue(type, s);
      PSQ[((8 | type) << 6) + s] = pieceValue(8 | type, s);
    }
  }
}

/** the packed material and PSQT sum of the board, from params.ts */
export function scratchPsq(): i32 {
  let v = 0;
  for (let s = 0; s < 64; s++) {
    const p = <i32>board[s];
    if (p) v += pieceValue(p, s);
  }
  return v;
}

/** the center Manhattan distance of a square, 0 to 6 */
@inline function centerDistance(s: i32): i32 {
  const f = s & 7;
  const r = s >> 3;
  return max(3 - f, f - 4) + max(3 - r, r - 4);
}

/**
 * The eval for the side to move from `psq`, the board's packed material and PSQT
 * sum. Without pawns, rooks or queens and with at most one minor each, it is a
 * draw. Against a bare king, the stronger side is paid for driving it to the edge
 * and bringing its own king close (KXK mop-up).
 */
export function evalWith(psq: i32): i32 {
  const pawns = bb[PAWN] | bb[8 | PAWN];
  const rooks = bb[ROOK] | bb[8 | ROOK];
  const queens = bb[QUEEN] | bb[8 | QUEEN];
  const wMinors = <i32>popcnt(bb[KNIGHT] | bb[BISHOP]);
  const bMinors = <i32>popcnt(bb[8 | KNIGHT] | bb[8 | BISHOP]);
  if (!(pawns | rooks | queens) && wMinors <= 1 && bMinors <= 1) return 0;

  let phase = wMinors + bMinors + 2 * <i32>popcnt(rooks) + 4 * <i32>popcnt(queens);
  if (phase > PHASE_MAX) phase = PHASE_MAX;
  const s = psq + (side == 0 ? S(TEMPO_MG, TEMPO_EG) : -S(TEMPO_MG, TEMPO_EG));
  let v = (mgOf(s) * phase + egOf(s) * (PHASE_MAX - phase)) / PHASE_MAX;

  // KXK: one side has its king alone, the other at least one piece
  const wKing = <i32>ctz(bb[KING]);
  const bKing = <i32>ctz(bb[8 | KING]);
  const wAlone = bb[0] == bb[KING];
  const bAlone = bb[8] == bb[8 | KING];
  if (wAlone != bAlone) {
    const weak = wAlone ? wKing : bKing;
    const strongPieces = wAlone ? bb[8] & ~bb[8 | PAWN] & ~bb[8 | KING] : bb[0] & ~bb[PAWN] & ~bb[KING];
    if (strongPieces) {
      const dist = abs((wKing & 7) - (bKing & 7)) + abs((wKing >> 3) - (bKing >> 3));
      const mop = MOPUP_EDGE * centerDistance(weak) + MOPUP_CLOSE * (14 - dist);
      v += wAlone ? -mop : mop;
    }
  }
  return side == 0 ? v : -v;
}

/** the eval recomputed from params.ts, for the host, the tuner and the gates */
export function evaluateScratch(): i32 {
  return evalWith(scratchPsq());
}
