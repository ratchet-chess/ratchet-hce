/**
 * The king-pawn eval and its table, Stash 37 kp_eval.c: pawn structure (backward,
 * doubled, isolated, phalanx, defenders), passed pawns by rank, and each passer's
 * distance to both kings. Its value depends only on the pawns and the kings, so
 * it is cached by a key of both (Stash king_pawn_probe). An entry also keeps the
 * passed-pawn set, which endgame scaling reads. King shelter and pawn storm follow
 * Ethereal 12.75 evaluateKingsPawns, as a value here and a share of the safety sum
 * that pieces.ts reads with the span of each color's pawns.
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
  PAWN_PASSED_MG, PAWN_PHALANX_EG, PAWN_PHALANX_MG, SAFETY_SHELTER_EG, SAFETY_SHELTER_MG, SAFETY_STORM_EG, SAFETY_STORM_MG, SHELTER_EG, SHELTER_MG,
  STORM_EG, STORM_MG,
} from "./params";
import { pawnKey } from "./state";

// ---------------------------------------------------------------- masks

const FILE_H: u64 = FILE_A << 7;
/** by color and square: the squares ahead on its file */
export const FORWARD = new StaticArray<u64>(128);
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
@inline export function pawnAttacks(p: u64, color: i32): u64 {
  return color == 0 ? ((p << 7) & ~FILE_H) | ((p << 9) & ~FILE_A) : ((p >> 9) & ~FILE_H) | ((p >> 7) & ~FILE_A);
}

/** the squares a color's pawns attack twice */
@inline export function pawnAttacks2(p: u64, color: i32): u64 {
  return color == 0 ? ((p << 7) & ~FILE_H) & ((p << 9) & ~FILE_A) : ((p >> 9) & ~FILE_H) & ((p >> 7) & ~FILE_A);
}

@inline export function relRank(s: i32, color: i32): i32 {
  return color == 0 ? s >> 3 : 7 - (s >> 3);
}

@inline function distance(a: i32, b: i32): i32 {
  return max(abs((a & 7) - (b & 7)), abs((a >> 3) - (b >> 3)));
}

// ---------------------------------------------------------------- table

/** entries, a power of two */
const SIZE = 8192;
/** words in an entry, one cache line: the key; the value and both safety shares; the passed sets; the spans */
const WORDS = 8;
const kpStore = new StaticArray<u64>(WORDS * SIZE + WORDS);
/** the first entry, on a cache line's start */
const kpTable = (changetype<usize>(kpStore) + 63) & ~(<usize>63);

/** the passed pawns of each color, from the last kingPawn() */
export const passedOf = new StaticArray<u64>(2);
/** the span of each color's pawns, from the last kingPawn() */
export const spanOf = new StaticArray<u64>(2);
/** each color's king's share of the safety sum, packed, from the last kingPawn() */
export const safetyOf = new StaticArray<i32>(2);

export function clearPawns(): void {
  for (let i = 0; i < SIZE; i++) store<u64>(kpTable + (<usize>i << 6), 0);
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
  const entry = kpTable + (<usize>(key & <u64>(SIZE - 1)) << 6);
  if (cached && load<u64>(entry) == key) {
    unchecked((safetyOf[0] = load<i32>(entry, 12)));
    unchecked((safetyOf[1] = load<i32>(entry, 16)));
    unchecked((passedOf[0] = load<u64>(entry, 24)));
    unchecked((passedOf[1] = load<u64>(entry, 32)));
    unchecked((spanOf[0] = load<u64>(entry, 40)));
    unchecked((spanOf[1] = load<u64>(entry, 48)));
    return load<i32>(entry, 8);
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
    store<u64>(entry, key);
    store<i32>(entry, v, 8);
    store<i32>(entry, unchecked(safetyOf[0]), 12);
    store<i32>(entry, unchecked(safetyOf[1]), 16);
    store<u64>(entry, unchecked(passedOf[0]), 24);
    store<u64>(entry, unchecked(passedOf[1]), 32);
    store<u64>(entry, unchecked(spanOf[0]), 40);
    store<u64>(entry, unchecked(spanOf[1]), 48);
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

  unchecked((spanOf[us] = span));

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
  return v + shelter(us, ours, theirs, ourKing);
}

/**
 * The pawn shield and storm around a color's king, its own view, on the king's file
 * and its neighbors, Ethereal 12.75 evaluateKingsPawns; records its share of the
 * safety sum in safetyOf. A distance counts ranks from the king, 7 for no pawn.
 */
function shelter(us: i32, ours: u64, theirs: u64, king: i32): i32 {
  const kingFile = king & 7;
  const kingRank = king >> 3;
  const ahead: u64 = us == 0 ? <u64>-1 << <u64>(kingRank * 8) : <u64>-1 >> <u64>((7 - kingRank) * 8);
  let v = 0;
  let safety = 0;
  for (let f = max(kingFile - 1, 0), last = min(kingFile + 1, 7); f <= last; f++) {
    const file = (FILE_A << <u64>f) & ahead;
    const ownDist = rankDistance(ours & file, us, kingRank);
    const theirDist = rankDistance(theirs & file, us, kingRank);
    const onKing = f == kingFile ? 1 : 0;
    const sh = (onKing << 6) | (f << 3) | ownDist;
    v += S(unchecked(SHELTER_MG[sh]), unchecked(SHELTER_EG[sh]));
    const sa = (onKing << 3) | ownDist;
    safety += S(unchecked(SAFETY_SHELTER_MG[sa]), unchecked(SAFETY_SHELTER_EG[sa]));
    const blocked = ownDist != 7 && ownDist == theirDist - 1 ? 1 : 0;
    const st = (blocked << 5) | (min(f, 7 - f) << 3) | theirDist;
    v += S(unchecked(STORM_MG[st]), unchecked(STORM_EG[st]));
    const ss = (blocked << 3) | theirDist;
    safety += S(unchecked(SAFETY_STORM_MG[ss]), unchecked(SAFETY_STORM_EG[ss]));
  }
  unchecked((safetyOf[us] = safety));
  return v;
}

/** ranks from the king to the nearest of these pawns, seen from color `us`; 7 if none */
@inline function rankDistance(pawns: u64, us: i32, kingRank: i32): i32 {
  if (!pawns) return 7;
  return us == 0 ? (<i32>ctz(pawns) >> 3) - kingRank : kingRank - ((63 - <i32>clz(pawns)) >> 3);
}
