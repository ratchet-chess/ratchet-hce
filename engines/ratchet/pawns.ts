/**
 * The king-pawn eval and its table, Stash 37 kp_eval.c: pawn structure (backward,
 * doubled, isolated, phalanx, defenders), passed pawns by rank, and each passer's
 * distance to both kings. Its value depends only on the pawns and the kings, so
 * it is cached by a key of both (Stash king_pawn_probe). An entry also keeps the
 * passed-pawn set, which endgame scaling reads.
 *
 * Every score is a packed (middlegame, endgame) pair, White's view.
 */
import { FILE_A, KING, PAWN } from "../../core/constants";
import { bb } from "../../core/position";
import { Z_PIECE } from "../../core/zobrist";
import { S } from "./eval";
import {
  PASSED_OUR_KING_EG, PASSED_OUR_KING_MG, PASSED_THEIR_KING_EG, PASSED_THEIR_KING_MG, PAWN_BACKWARD_EG, PAWN_BACKWARD_MG,
  PAWN_DEFENDER_EG, PAWN_DEFENDER_MG, PAWN_DOUBLED_EG, PAWN_DOUBLED_MG, PAWN_ISOLATED_EG, PAWN_ISOLATED_MG, PAWN_PASSED_EG,
  PAWN_PASSED_MG, PAWN_PHALANX_EG, PAWN_PHALANX_MG,
} from "./params";
import { pawnKey } from "./state";

// ---------------------------------------------------------------- masks

const FILE_H: u64 = FILE_A << 7;
/** by color and square: the squares ahead on its file */
const FORWARD = new StaticArray<u64>(128);
/** by color and square: the squares ahead on the neighboring files, which its pawn may one day attack */
const SPAN = new StaticArray<u64>(128);

export function initPawns(): void {
  for (let s = 0; s < 64; s++) {
    const f = s & 7;
    const r = s >> 3;
    let w: u64 = 0;
    let b: u64 = 0;
    for (let rr = r + 1; rr < 8; rr++) w |= (<u64>1) << <u64>(rr * 8 + f);
    for (let rr = r - 1; rr >= 0; rr--) b |= (<u64>1) << <u64>(rr * 8 + f);
    FORWARD[s] = w;
    FORWARD[64 + s] = b;
    const side = (f > 0 ? FILE_A << <u64>(f - 1) : 0) | (f < 7 ? FILE_A << <u64>(f + 1) : 0);
    let wAhead: u64 = 0;
    let bAhead: u64 = 0;
    for (let rr = r + 1; rr < 8; rr++) wAhead |= (<u64>0xff) << <u64>(rr * 8);
    for (let rr = r - 1; rr >= 0; rr--) bAhead |= (<u64>0xff) << <u64>(rr * 8);
    SPAN[s] = side & wAhead;
    SPAN[64 + s] = side & bAhead;
  }
  clearPawns();
}

/** the squares a color's pawns attack */
@inline function pawnAttacks(p: u64, color: i32): u64 {
  return color == 0 ? ((p << 7) & ~FILE_H) | ((p << 9) & ~FILE_A) : ((p >> 9) & ~FILE_H) | ((p >> 7) & ~FILE_A);
}

/** the squares a color's pawns attack twice */
@inline function pawnAttacks2(p: u64, color: i32): u64 {
  return color == 0 ? ((p << 7) & ~FILE_H) & ((p << 9) & ~FILE_A) : ((p >> 9) & ~FILE_H) & ((p >> 7) & ~FILE_A);
}

@inline function relRank(s: i32, color: i32): i32 {
  return color == 0 ? s >> 3 : 7 - (s >> 3);
}

@inline function distance(a: i32, b: i32): i32 {
  return max(abs((a & 7) - (b & 7)), abs((a >> 3) - (b >> 3)));
}

// ---------------------------------------------------------------- table

/** entries, as Stash's KING_PAWN_ENTRY_NB */
const SIZE = 32768;
const kpKey = new StaticArray<u64>(SIZE);
const kpValue = new StaticArray<i32>(SIZE);
/** by entry and color: the passed pawns */
const kpPassed = new StaticArray<u64>(2 * SIZE);

/** the passed pawns of each color, from the last kingPawn() */
export const passedOf = new StaticArray<u64>(2);

export function clearPawns(): void {
  for (let i = 0; i < SIZE; i++) {
    unchecked((kpKey[i] = 0));
    unchecked((kpValue[i] = 0));
  }
}

/**
 * The king-pawn value, White's view, and the passed sets in passedOf. `cached`
 * probes and fills the table; the tuner and the gates pass false, since a tuning
 * build changes the constants under a filled table.
 */
export function kingPawn(cached: bool): i32 {
  const wk = <i32>ctz(bb[KING]);
  const bk = <i32>ctz(bb[8 | KING]);
  // the pawn key with both kings, Stash's king_pawn_key; never 0 for a real board, so 0 marks an empty slot
  const key = pawnKey ^ unchecked(Z_PIECE[(KING << 6) + wk]) ^ unchecked(Z_PIECE[((8 | KING) << 6) + bk]);
  const i = <i32>(key & <u64>(SIZE - 1));
  if (cached && unchecked(kpKey[i]) == key) {
    unchecked((passedOf[0] = kpPassed[2 * i]));
    unchecked((passedOf[1] = kpPassed[2 * i + 1]));
    return unchecked(kpValue[i]);
  }
  const wp = bb[PAWN];
  const bp = bb[8 | PAWN];
  const att0 = pawnAttacks(wp, 0);
  const att1 = pawnAttacks(bp, 1);
  const att20 = pawnAttacks2(wp, 0);
  const att21 = pawnAttacks2(bp, 1);
  passedOf[0] = 0;
  passedOf[1] = 0;
  const v =
    sideValue(0, wp, bp, att0, att1, att20, att21, wk, bk) - sideValue(1, bp, wp, att1, att0, att21, att20, bk, wk);
  if (cached) {
    unchecked((kpKey[i] = key));
    unchecked((kpValue[i] = v));
    unchecked((kpPassed[2 * i] = passedOf[0]));
    unchecked((kpPassed[2 * i + 1] = passedOf[1]));
  }
  return v;
}

// ---------------------------------------------------------------- terms

/** one color's king-pawn terms, its own view; it records its passers in passedOf */
function sideValue(us: i32, ours: u64, theirs: u64, ourAtt: u64, theirAtt: u64, ourAtt2: u64, theirAtt2: u64, ourKing: i32, theirKing: i32): i32 {
  const them = us ^ 1;
  let v = 0;

  // the squares our pawns may one day attack (Stash compute_attack_span)
  let span: u64 = 0;
  let b = ours;
  while (b) {
    span |= unchecked(SPAN[(us << 6) + <i32>ctz(b)]);
    b &= b - 1;
  }

  // backward, Stash evaluate_backward: a stop square attacked by their pawns and out of our span, on an open file
  const stops = us == 0 ? ours << 8 : ours >> 8;
  const stuck = stops & theirAtt & ~span;
  let backward = us == 0 ? stuck >> 8 : stuck << 8;
  if (backward) {
    let closed: u64 = 0;
    b = theirs;
    while (b) {
      closed |= unchecked(FORWARD[(them << 6) + <i32>ctz(b)]);
      b &= b - 1;
    }
    backward &= ~closed;
    v += S(PAWN_BACKWARD_MG, PAWN_BACKWARD_EG) * <i32>popcnt(backward);
  }

  // phalanx and defenders, Stash evaluate_connected
  let phalanx = ours & ((ours >> 1) & ~FILE_H);
  while (phalanx) {
    const r = relRank(<i32>ctz(phalanx), us);
    v += S(unchecked(PAWN_PHALANX_MG[r]), unchecked(PAWN_PHALANX_EG[r]));
    phalanx &= phalanx - 1;
  }
  let defenders = ours & pawnAttacks(ours, them);
  while (defenders) {
    const r = relRank(<i32>ctz(defenders), us);
    v += S(unchecked(PAWN_DEFENDER_MG[r]), unchecked(PAWN_DEFENDER_EG[r]));
    defenders &= defenders - 1;
  }

  // passed pawns, Stash evaluate_passed: a free file ahead, and their pawns' control of it matched by ours
  let passed: u64 = 0;
  b = ours;
  while (b) {
    const s = <i32>ctz(b);
    const path = unchecked(FORWARD[(us << 6) + s]);
    if (!(path & theirs) && !(path & theirAtt & ~ourAtt) && !(path & theirAtt2 & ~ourAtt2)) {
      const r = relRank(s, us);
      v += S(unchecked(PAWN_PASSED_MG[r]), unchecked(PAWN_PASSED_EG[r]));
      passed |= (<u64>1) << <u64>s;
    }
    b &= b - 1;
  }
  unchecked((passedOf[us] = passed));

  // each passer near queening, by both kings' distance to it, Stash evaluate_passed_pos
  b = passed;
  while (b) {
    const s = <i32>ctz(b);
    const steps = 7 - relRank(s, us);
    if (steps <= 4) {
      const o = (steps - 1) * 6 + min(steps + 2, distance(ourKing, s)) - 1;
      const t = (steps - 1) * 6 + min(steps + 2, distance(theirKing, s)) - 1;
      v += S(unchecked(PASSED_OUR_KING_MG[o]), unchecked(PASSED_OUR_KING_EG[o]));
      v += S(unchecked(PASSED_THEIR_KING_MG[t]), unchecked(PASSED_THEIR_KING_EG[t]));
    }
    b &= b - 1;
  }

  // doubled and isolated, once per file, Stash evaluate_doubled_isolated
  for (let f = 0; f < 8; f++) {
    const file = FILE_A << <u64>f;
    const onFile = ours & file;
    if (!onFile) continue;
    if (onFile & (onFile - 1)) v += S(PAWN_DOUBLED_MG, PAWN_DOUBLED_EG);
    const neighbors = ((file >> 1) & ~FILE_H) | ((file << 1) & ~FILE_A);
    if (!(neighbors & ours)) v += S(PAWN_ISOLATED_MG, PAWN_ISOLATED_EG);
  }
  return v;
}
