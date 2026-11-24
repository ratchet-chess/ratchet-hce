/**
 * The own engine's eval: material and piece-square tables, the king-pawn terms
 * (pawns.ts), the terms that read attack maps (pieces.ts), complexity, tapered between middlegame and endgame by phase (Fruit 2.1 material_comp_info's form;
 * PeSTO's phase weights) after the endgame half is scaled (Stash 37 eval_scale_endgame), the side
 * to move's tempo, insufficient material, the wrong bishop with rook pawns, and KXK mop-up. Scores are for the
 * side to move, in the engine's unit.
 *
 * The search reads the packed (middlegame, endgame) sum that state.ts keeps
 * incrementally (psq.ts). evaluateScratch() recomputes it from params.ts, so a
 * tuning build that sets a table at run time is scored with its new values.
 * Features: Tapered_Eval, Draw_Evaluation, Initiative, Tempo, Wrong_Color_Bishop_and_Rook_Pawn, Mop-up_Evaluation.
 */
import { BISHOP, FILE_A, KING, KNIGHT, PAWN, QUEEN, ROOK } from "../../core/constants";
import { bb, hash, side } from "../../core/position";
import { KING_ATT } from "../../core/tables";
import {
  COMPLEXITY_ENDGAME, COMPLEXITY_FLANKS, COMPLEXITY_OFFSET, COMPLEXITY_PAWNS, MAT_MG, MOPUP_CLOSE, MOPUP_CORNER, MOPUP_EDGE, SCALE_BASE, SCALE_OCB,
  SCALE_OCB_PASSED,
  SCALE_OCB_PIECES, SCALE_OCB_PIECES_PER, SCALE_PER_PAWN, TEMPO_EG, TEMPO_MG,
} from "./params";
import { DARK, FILE_H, distance } from "./geometry";
import { initPawns, kingPawn, passedOf } from "./pawns";
import { initPieces, kingSafetyEg, kingSafetyMg, pieceTerms } from "./pieces";
import { initPsq, scratchPsq } from "./psq";
import { S, egOf, mgOf } from "./score";

/** engine units per centipawn; the host reads centipawns */
export const UNITS_PER_CP = 4;

/** phase weights by piece type, PeSTO (CPW "PeSTO's Evaluation Function"): N 1, B 1, R 2, Q 4, out of 24 */
const PHASE_MAX = 24;

/** fills the eval's tables from params.ts */
export function initEval(): void {
  initPawns();
  initPieces();
  initPsq();
}

/** the center Manhattan distance of a square, 0 to 6 */
@inline function centerDistance(s: i32): i32 {
  const f = s & 7;
  const r = s >> 3;
  return max(3 - f, f - 4) + max(3 - r, r - 4);
}

/**
 * A square's Manhattan distance to the nearer corner of one color, 0 to 7: the dark corners a1 and h8, or the light
 * corners h1 and a8 (CPW "KBNK Endgame", Corner-Distance; Stash 37 eval_kbnk has it as file minus rank after a flip)
 * Feature: KBNK_Endgame.
 */
@inline function cornerDistance(s: i32, dark: bool): i32 {
  const d = (dark ? s & 7 : 7 - (s & 7)) + (s >> 3);
  return min(d, 14 - d);
}

/**
 * Whether `strong` cannot win with bishops and rook pawns: its other men are its king, its pawns are on one rook
 * file, its bishops miss the queening square, the other side has a king and pawns only, and that king holds the
 * queening square. The king holds it when it is within one step (Stockfish 11 Endgame<KBPsK>), or when it wins the
 * race there against the other king and the front pawn, with the tempo (CPW "Wrong Color Bishop and Rook Pawn", Uri's
 * rule). Stash 37 scale_kbpsk's graded scale beyond one step is not taken: the positions these tests leave are won
 * more often than drawn. Stockfish 11's second rule, the blocked b- or g-pawn, is not taken. Read against the Syzygy
 * tables in <artifacts>/runs/hce-reads/wrong-bishop-forms.txt: no won position called a draw against a bare king.
 * Feature: Wrong_Color_Bishop_and_Rook_Pawn.
 */
function wrongBishop(strong: i32, wKing: i32, bKing: i32): bool {
  const o = strong << 3;
  const x = o ^ 8;
  const pawns = bb[o | PAWN];
  const bishops = bb[o | BISHOP];
  if (!pawns || !bishops || bb[o] != (pawns | bishops | bb[o | KING]) || bb[x] != (bb[x | PAWN] | bb[x | KING])) return false;
  const file = !(pawns & ~FILE_A) ? 0 : !(pawns & ~FILE_H) ? 7 : -1;
  if (file < 0) return false;
  const q = strong == 0 ? 56 + file : file;
  if (bishops & (((DARK >> q) & 1) != 0 ? DARK : ~DARK)) return false;
  const sKing = strong == 0 ? wKing : bKing;
  const xKing = strong == 0 ? bKing : wKing;
  const d = distance(xKing, q);
  if (d <= 1) return true;
  const front = strong == 0 ? 63 - <i32>clz(pawns) : <i32>ctz(pawns);
  const dl = d + (side == strong ? 1 : 0);
  const dp = min(distance(front, q), 5) + ((xKing & 7) == file ? 1 : 0);
  return dl < distance(sKing, q) && dl < dp;
}

const KINGSIDE: u64 = 0xf0f0f0f0f0f0f0f0;
const QUEENSIDE: u64 = ~KINGSIDE;

/** a color's non-pawn material at the middlegame values, Stash 37 stack->material. Feature: Material. */
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
 * The endgame half's scale out of 256, for the side it favors: Stash 37 eval_scale_endgame,
 * one-wing rook scaling (Stockfish 16836f39 and 67818ee9), single-queen scaling (Stockfish
 * c7194bd9 and 69d3be42), one-minor-one-pawn scaling (Lynx 1d3047b5), and general one-wing
 * strong-pawn damping (Weiss b65b91e), and the wrong bishop with rook pawns (`wrongBishop`). The other narrow
 * endgame-specific functions of Stash 37 endgame.c are not taken.
 * Features: Draw_Evaluation, Wrong_Color_Bishop_and_Rook_Pawn, Bishops_of_Opposite_Colors.
 */
function endgameScale(eg: i32, wKing: i32, bKing: i32, phase: i32): i32 {
  const strong = eg > 0 ? 0 : 1;
  const weak = strong ^ 1;
  const sPawns = bb[(strong << 3) | PAWN];
  const bishop = MAT_MG[BISHOP];
  // no pawns, and at most a minor ahead. Stash 37 draws the line at its bishop, which its values make the greater minor;
  // the line here is the greater of the two tuned minors, so a tune that puts the knight above the bishop cannot carry
  // a lone knight past it
  // Feature: Draw_Evaluation.
  if (!sPawns) {
    const minor = max(MAT_MG[KNIGHT], bishop);
    const sMat = material(strong);
    const wMat = material(weak);
    if (sMat - wMat <= minor) return sMat <= minor ? 0 : max(((sMat - wMat) * 8) / minor, 0);
  }
  // its material is at most phase 2, which spares most positions the test
  if (phase <= 2 && wrongBishop(strong, wKing, bKing)) return 0;
  // opposite bishops
  const wb = bb[BISHOP];
  const bbish = bb[8 | BISHOP];
  if (popcnt(wb) == 1 && popcnt(bbish) == 1 && ((wb & DARK) != 0) != ((bbish & DARK) != 0)) {
    return material(strong) + material(weak) > 2 * bishop
      ? SCALE_OCB_PIECES + SCALE_OCB_PIECES_PER * <i32>popcnt(bb[strong << 3])
      : SCALE_OCB + SCALE_OCB_PASSED * <i32>popcnt(passedOf[strong]);
  }
  const sPawnCount = <i32>popcnt(sPawns);
  // one minor vs one minor with a single strong pawn, Lynx 1d3047b5. Feature: Draw_Evaluation.
  if (phase == 2 && sPawnCount == 1 && (bb[KNIGHT] | wb) != 0 && (bb[8 | KNIGHT] | bbish) != 0) return 128;
  const oneWing = sPawns != 0 && (!(sPawns & KINGSIDE) || !(sPawns & QUEENSIDE));
  // one-wing rook endgame with small pawn lead and defending king near its pawns, Stockfish 16836f39 and 67818ee9, Stash 37 eval_scale_endgame
  // Feature: Draw_Evaluation.
  if (phase == 4 && oneWing && popcnt(bb[ROOK]) == 1 && popcnt(bb[8 | ROOK]) == 1) {
    const wPawns = bb[(weak << 3) | PAWN];
    if (sPawnCount <= <i32>popcnt(wPawns) + 1 && (unchecked(KING_ATT[weak == 0 ? wKing : bKing]) & wPawns) != 0) return 130;
  }
  let scale = min(SCALE_BASE + SCALE_PER_PAWN * sPawnCount, 256);
  // single-queen endgame scaled by enemy minor count, Stockfish c7194bd9 and 69d3be42. Feature: Draw_Evaluation.
  if (popcnt(bb[QUEEN] | bb[8 | QUEEN]) == 1) {
    const oppMinors = bb[QUEEN] ? <i32>popcnt(bb[8 | KNIGHT] | bbish) : <i32>popcnt(bb[KNIGHT] | wb);
    return min(scale, 148 + 12 * oppMinors);
  }
  // strong pawns on one wing only, Weiss b65b91e ScaleFactor. Feature: Draw_Evaluation.
  if (oneWing) scale = max(scale - 24, 32);
  return scale;
}

/** the eval's bound, below the search's mate range by more than the correction history can add */
const EVAL_MAX = 30000;

/**
 * The endgame half's adjustment by how likely the stronger side is to convert,
 * Xiphos 0.6 eval's initiative and Ethereal 12.75 evaluateComplexity. It never changes
 * which side is ahead. Feature: Initiative.
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
 * sum. Without pawns, rooks or queens, at most one minor each, or two knights
 * against at most one minor, is a draw (CPW "Draw Evaluation"). Against a bare king, the stronger side is paid for
 * driving it to the edge and bringing its own king close (KXK mop-up, CPW "Mop-up
 * Evaluation"). With a bishop and a knight it is also paid for a corner of the bishop's color, where the mate is
 * (`cornerDistance`); Stockfish 11 Endgame<KBNK>'s 64-entry table is the form not taken. It is paid nothing when its
 * bishops and rook pawns cannot win (`wrongBishop`). `cached` lets the king-pawn terms use their table.
 * Features: Draw_Evaluation, Mop-up_Evaluation, KBNK_Endgame, Wrong_Color_Bishop_and_Rook_Pawn, Tapered_Eval, Tempo.
 */
export function evalWith(psq: i32, cached: bool): i32 {
  const pawns = bb[PAWN] | bb[8 | PAWN];
  const rooks = bb[ROOK] | bb[8 | ROOK];
  const queens = bb[QUEEN] | bb[8 | QUEEN];
  const wMinors = <i32>popcnt(bb[KNIGHT] | bb[BISHOP]);
  const bMinors = <i32>popcnt(bb[8 | KNIGHT] | bb[8 | BISHOP]);
  if (!(pawns | rooks | queens)) {
    if (wMinors <= 1 && bMinors <= 1) return 0;
    // two knights against a bare king or one minor, CPW "Draw Evaluation"'s simple heuristics. Its other heuristics, two
    // bishops against a bishop and two minors against one without the bishop pair, are not taken: the scale above
    // already holds those endings near a draw
    if (wMinors == 2 && popcnt(bb[KNIGHT]) == 2 && bMinors <= 1) return 0;
    if (bMinors == 2 && popcnt(bb[8 | KNIGHT]) == 2 && wMinors <= 1) return 0;
  }

  let phase = wMinors + bMinors + 2 * <i32>popcnt(rooks) + 4 * <i32>popcnt(queens);
  if (phase > PHASE_MAX) phase = PHASE_MAX;
  const wKing = <i32>ctz(bb[KING]);
  const bKing = <i32>ctz(bb[8 | KING]);
  const kp = kingPawn(cached, wKing, bKing);
  const s = psq + kp + pieceTerms(wKing, bKing, pawns, phase) + (side == 0 ? S(TEMPO_MG, TEMPO_EG) : -S(TEMPO_MG, TEMPO_EG));
  let v = mgOf(s) + kingSafetyMg;
  // at the full phase the endgame half weighs nothing
  if (phase < PHASE_MAX) {
    let eg = egOf(s) + kingSafetyEg;
    eg += complexity(eg, pawns);
    eg = (eg * endgameScale(eg, wKing, bKing, phase)) / 256;
    v = (v * phase + eg * (PHASE_MAX - phase)) / PHASE_MAX;
  }

  // KXK: one side has its king alone, the other at least one piece
  const wAlone = bb[0] == bb[KING];
  const bAlone = bb[8] == bb[8 | KING];
  if (wAlone != bAlone) {
    const weak = wAlone ? wKing : bKing;
    const o = wAlone ? 8 : 0;
    const strongPieces = bb[o] & ~bb[o | PAWN] & ~bb[o | KING];
    if (strongPieces && !wrongBishop(o >> 3, wKing, bKing)) {
      const dist = abs((wKing & 7) - (bKing & 7)) + abs((wKing >> 3) - (bKing >> 3));
      let mop = MOPUP_EDGE * centerDistance(weak) + MOPUP_CLOSE * (14 - dist);
      const bishops = bb[o | BISHOP];
      if (!pawns && popcnt(strongPieces) == 2 && popcnt(bishops) == 1 && bb[o | KNIGHT] != 0) {
        mop += MOPUP_CORNER * (7 - cornerDistance(weak, (bishops & DARK) != 0));
      }
      v += wAlone ? -mop : mop;
    }
  }
  // Ratchet's own guard: king safety's square is unbounded, and the TT and mate scores need the eval well inside i16
  v = max(min(v, EVAL_MAX), -EVAL_MAX);
  return side == 0 ? v : -v;
}

/** by low bits of the position's hash: its high 48 bits and its eval in the low 16, Ethereal 12.75 EvalEntry; 0 when empty. Feature: Evaluation_Hash_Table. */
const EVAL_CACHE_SIZE = 1 << 14;
const evalCache = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * EVAL_CACHE_SIZE));

export function clearEvalCache(): void {
  for (let i = 0; i < EVAL_CACHE_SIZE; i++) unchecked((evalCache[i] = 0));
}

/** the eval for the search, from the cache where it can, Ethereal 12.75 getCachedEvaluation and storeCachedEvaluation. Feature: Evaluation_Hash_Table. */
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
