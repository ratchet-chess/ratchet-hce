/**
 * The own engine's eval: material and piece-square tables, the king-pawn terms
 * (pawns.ts), the terms that read attack maps (pieces.ts), complexity, tapered between middlegame and endgame by phase (Fruit 2.0's form;
 * PeSTO's phase weights) after the endgame half is scaled (Stash 37), the side
 * to move's tempo, insufficient material, and KXK mop-up. Scores are for the
 * side to move, in the engine's unit.
 *
 * The search reads the packed (middlegame, endgame) sum that state.ts keeps
 * incrementally. evaluateScratch() recomputes it from params.ts, so a tuning
 * build that sets a table at run time is scored with its new values.
 */
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK } from "../../core/constants";
import { KING_ATT } from "../../core/tables";
import { bb, board, hash, side } from "../../core/position";
import {
  BISHOP_EG, BISHOP_MG, COMPLEXITY_ENDGAME, COMPLEXITY_FLANKS, COMPLEXITY_OFFSET, COMPLEXITY_PAWNS, KING_EG, KING_MG, KNIGHT_EG, KNIGHT_MG, MAT_EG, MAT_MG, MOPUP_CLOSE, MOPUP_EDGE, PAWN_EG, PAWN_MG,
  QUEEN_EG, QUEEN_MG, ROOK_EG, ROOK_MG, SCALE_BASE, SCALE_OCB, SCALE_OCB_PASSED, SCALE_OCB_PIECES, SCALE_OCB_PIECES_PER, SCALE_PER_PAWN,
  SCALE_ROOK_WING, TEMPO_EG, TEMPO_MG,
} from "./params";
import { initPawns, kingPawn, passedOf } from "./pawns";
import { initPieces, kingSafetyEg, kingSafetyMg, pieceTerms } from "./pieces";

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

/** fills PSQ from params.ts, and the pawn masks */
export function initEval(): void {
  initPawns();
  initPieces();
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

const DARK: u64 = 0xaa55aa55aa55aa55;
const KINGSIDE: u64 = 0xf0f0f0f0f0f0f0f0;
const QUEENSIDE: u64 = ~KINGSIDE;

/** a color's non-pawn material at the middlegame values, Stash's stack->material */
@inline function material(c: i32): i32 {
  const o = c << 3;
  return (
    MAT_MG[KNIGHT] * <i32>popcnt(bb[o | KNIGHT]) +
    MAT_MG[BISHOP] * <i32>popcnt(bb[o | BISHOP]) +
    MAT_MG[ROOK] * <i32>popcnt(bb[o | ROOK]) +
    MAT_MG[QUEEN] * <i32>popcnt(bb[o | QUEEN])
  );
}

/**
 * The endgame half's scale out of 256, for the side it favors, Stash 37
 * eval_scale_endgame. Stash's endgame-specific scale functions (endgame.c) are
 * not in Ratchet; their endings take the general factor.
 */
function endgameScale(eg: i32): i32 {
  const strong = eg > 0 ? 0 : 1;
  const weak = strong ^ 1;
  const sPawns = bb[(strong << 3) | PAWN];
  const wPawns = bb[(weak << 3) | PAWN];
  const bishop = MAT_MG[BISHOP];
  // no pawns, and at most a bishop ahead
  if (!sPawns) {
    const sMat = material(strong);
    const wMat = material(weak);
    if (sMat - wMat <= bishop) return sMat <= bishop ? 0 : max(((sMat - wMat) * 8) / bishop, 0);
  }
  // opposite bishops
  const wb = bb[BISHOP];
  const bbish = bb[8 | BISHOP];
  if (popcnt(wb) == 1 && popcnt(bbish) == 1 && ((wb & DARK) != 0) != ((bbish & DARK) != 0)) {
    return material(strong) + material(weak) > 2 * bishop
      ? SCALE_OCB_PIECES + SCALE_OCB_PIECES_PER * <i32>popcnt(bb[strong << 3])
      : SCALE_OCB + SCALE_OCB_PASSED * <i32>popcnt(passedOf[strong]);
  }
  // rook against rook, the strong side's pawns on one wing and not two ahead, the weak king beside its pawns
  const rook = MAT_MG[ROOK];
  if (
    ((sPawns & KINGSIDE) != 0) != ((sPawns & QUEENSIDE) != 0) &&
    popcnt(sPawns) < 2 + popcnt(wPawns) &&
    (KING_ATT[<i32>ctz(bb[(weak << 3) | KING])] & wPawns) != 0 &&
    material(strong) == rook &&
    material(weak) == rook
  ) {
    return SCALE_ROOK_WING;
  }
  return min(SCALE_BASE + SCALE_PER_PAWN * <i32>popcnt(sPawns), 256);
}

/** the eval's bound, below the search's mate range by more than the correction history can add */
const EVAL_MAX = 30000;

/**
 * The endgame half's adjustment by how likely the stronger side is to convert,
 * Xiphos 0.6's initiative and Ethereal 12.75 evaluateComplexity. It never changes
 * which side is ahead.
 */
function complexity(eg: i32, pawns: u64): i32 {
  const flanks = pawns & KINGSIDE && pawns & QUEENSIDE ? COMPLEXITY_FLANKS : 0;
  const pure = !(bb[0] ^ bb[KING] ^ bb[PAWN]) && !(bb[8] ^ bb[8 | KING] ^ bb[8 | PAWN]) ? COMPLEXITY_ENDGAME : 0;
  const c = COMPLEXITY_PAWNS * <i32>popcnt(pawns) + flanks + pure + COMPLEXITY_OFFSET;
  const v = max(c, -abs(eg));
  return eg > 0 ? v : eg < 0 ? -v : 0;
}

/**
 * The eval for the side to move from `psq`, the board's packed material and PSQT
 * sum. Without pawns, rooks or queens and with at most one minor each, it is a
 * draw. Against a bare king, the stronger side is paid for driving it to the edge
 * and bringing its own king close (KXK mop-up). `cached` lets the king-pawn
 * terms use their table.
 */
export function evalWith(psq: i32, cached: bool): i32 {
  const pawns = bb[PAWN] | bb[8 | PAWN];
  const rooks = bb[ROOK] | bb[8 | ROOK];
  const queens = bb[QUEEN] | bb[8 | QUEEN];
  const wMinors = <i32>popcnt(bb[KNIGHT] | bb[BISHOP]);
  const bMinors = <i32>popcnt(bb[8 | KNIGHT] | bb[8 | BISHOP]);
  if (!(pawns | rooks | queens) && wMinors <= 1 && bMinors <= 1) return 0;

  let phase = wMinors + bMinors + 2 * <i32>popcnt(rooks) + 4 * <i32>popcnt(queens);
  if (phase > PHASE_MAX) phase = PHASE_MAX;
  const kp = kingPawn(cached);
  const s = psq + kp + pieceTerms() + (side == 0 ? S(TEMPO_MG, TEMPO_EG) : -S(TEMPO_MG, TEMPO_EG));
  let v = mgOf(s) + kingSafetyMg;
  // at the full phase the endgame half weighs nothing
  if (phase < PHASE_MAX) {
    let eg = egOf(s) + kingSafetyEg;
    eg += complexity(eg, pawns);
    eg = (eg * endgameScale(eg)) / 256;
    v = (v * phase + eg * (PHASE_MAX - phase)) / PHASE_MAX;
  }

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
  // Ratchet's own guard: king safety's square is unbounded, and the TT and mate scores need the eval well inside i16
  v = max(min(v, EVAL_MAX), -EVAL_MAX);
  return side == 0 ? v : -v;
}

/** by low bits of the position's hash: its high 48 bits and its eval in the low 16, Ethereal 12.75 EvalEntry; 0 when empty */
const EVAL_CACHE_SIZE = 1 << 14;
const evalCache = new StaticArray<u64>(EVAL_CACHE_SIZE);

export function clearEvalCache(): void {
  for (let i = 0; i < EVAL_CACHE_SIZE; i++) unchecked((evalCache[i] = 0));
}

/** the eval for the search, from the cache where it can, Ethereal 12.75 getCachedEvaluation and storeCachedEvaluation */
export function evalCached(psq: i32): i32 {
  const i = <i32>(hash & <u64>(EVAL_CACHE_SIZE - 1));
  const entry = unchecked(evalCache[i]);
  if ((entry ^ hash) >> 16 == 0 && entry != 0) return <i32><i16>entry;
  const v = evalWith(psq, true);
  unchecked((evalCache[i] = (hash & ~<u64>0xffff) | <u64><u16>v));
  return v;
}

/** the eval recomputed from params.ts, for the host, the tuner and the gates */
export function evaluateScratch(): i32 {
  return evalWith(scratchPsq(), false);
}
