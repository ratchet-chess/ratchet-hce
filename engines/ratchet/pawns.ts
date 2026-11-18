/**
 * The king-pawn eval and its table, after Stash 37 kp_eval.c: pawn structure
 * (backward, doubled, isolated, phalanx, defenders), passed and candidate pawns by
 * rank, and each passer's distance to both kings, each form named where it is
 * applied. Its value depends only on the pawns and the kings, so
 * it is cached by a key of both (Stash 37 king_pawn_probe). An entry also keeps the
 * passed-pawn set, which endgame scaling reads. King shelter and pawn storm follow
 * Ethereal 12.75 evaluateKingsPawns, as a value here and a share of the safety sum
 * that pieces.ts reads with the span of each color's pawns.
 *
 * Every score is a packed (middlegame, endgame) pair, White's view.
 */
import { FILE_A, KING, PAWN } from "../../core/constants";
import { bb } from "../../core/position";
import { Z_PIECE } from "../../core/zobrist";
import {
  PASSED_OUR_KING_EG, PASSED_OUR_KING_MG, PASSED_THEIR_KING_EG, PASSED_THEIR_KING_MG, PAWN_BACKWARD_EG, PAWN_BACKWARD_MG,
  PAWN_BACKWARD_OPEN_EG, PAWN_BACKWARD_OPEN_MG, PAWN_CANDIDATE_EG, PAWN_CANDIDATE_MG, PAWN_DEFENDER_EG, PAWN_DEFENDER_MG, PAWN_DOUBLED_EG, PAWN_DOUBLED_MG, PAWN_ISOLATED_EG, PAWN_ISOLATED_MG, PAWN_PASSED_EG,
  PAWN_PASSED_MG, PAWN_PHALANX_EG, PAWN_PHALANX_MG, SAFETY_SHELTER_EG, SAFETY_SHELTER_MG, SAFETY_STORM_EG, SAFETY_STORM_MG, SHELTER_EG, SHELTER_MG,
  STORM_EG, STORM_MG,
} from "./params";
import { FILE_H, distance, pawnAttacks, pawnAttacks2, relRank } from "./geometry";
import { S } from "./score";
import { pawnKey } from "./state";

// ---------------------------------------------------------------- masks

/** by color and square: the squares ahead on its file */
export const FORWARD = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 128));
/** by color and square: the squares ahead on the neighboring files, which its pawn may one day attack */
const SPAN = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 128));

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

// ---------------------------------------------------------------- table

/** entries, a power of two */
const SIZE = 8192;
/** words in an entry, one cache line: the key; the value and both safety shares; the passed sets; the spans */
const WORDS = 8;
const kpTable = memory.data(sizeof<u64>() * WORDS * SIZE, 64);

/** the passed pawns of each color, from the last kingPawn() */
export const passedOf = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** the span of each color's pawns, from the last kingPawn() */
export const spanOf = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** each color's king's share of the safety sum, packed, from the last kingPawn() */
export const safetyOf = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 2));

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
  // the pawn key with both kings, Stash 37 king_pawn_key; never 0 for a real board, so 0 marks an empty slot
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

  // the squares our pawns may one day attack (Stash 37 compute_attack_span)
  let span: u64 = 0;
  let b = ours;
  while (b) {
    span |= unchecked(SPAN[(us << 6) + <i32>ctz(b)]);
    b &= b - 1;
  }

  unchecked((spanOf[us] = span));

  // isolated, per pawn, Weiss 2.0 EvalPawns; Stash 37 evaluate_doubled_isolated counts it once per file
  let isolated: u64 = 0;
  for (let f = 0; f < 8; f++) {
    const file = FILE_A << <u64>f;
    const neighbors = ((file >> 1) & ~FILE_H) | ((file << 1) & ~FILE_A);
    if (!(neighbors & ours)) isolated |= ours & file;
  }
  v += S(PAWN_ISOLATED_MG, PAWN_ISOLATED_EG) * <i32>popcnt(isolated);

  // doubled, per directly stacked pawn, Weiss 2.0 EvalPawns; Stash 37 evaluate_doubled_isolated counts it once per file
  v += S(PAWN_DOUBLED_MG, PAWN_DOUBLED_EG) * <i32>popcnt(ours & (ours << 8));

  // backward, Stash 37 evaluate_backward's stop-square test: a stop square attacked by their pawns and out of our span. Not
  // isolated, and one value each for an open and a closed file (Ethereal 12.75 evaluatePawns PawnBackwards); Stash 37 scores only the open file
  const stops = us == 0 ? ours << 8 : ours >> 8;
  const stuck = stops & theirAtt & ~span;
  let backward = (us == 0 ? stuck >> 8 : stuck << 8) & ~isolated;
  if (backward) {
    let closed: u64 = 0;
    b = theirs;
    while (b) {
      closed |= unchecked(FORWARD[(them << 6) + <i32>ctz(b)]);
      b &= b - 1;
    }
    v += S(PAWN_BACKWARD_MG, PAWN_BACKWARD_EG) * <i32>popcnt(backward & closed);
    v += S(PAWN_BACKWARD_OPEN_MG, PAWN_BACKWARD_OPEN_EG) * <i32>popcnt(backward & ~closed);
  }

  // phalanx and defenders, Stash 37 evaluate_connected
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

  // passed pawns, the plain mask: no enemy pawn ahead on its file or the next (Weiss 2.0 EvalPawns PassedMask), so a
  // rear twin passes too, which Fruit 2.1 pawn_comp_info rejects. A candidate has its own table (Ethereal 12.75
  // evaluatePawns PawnCandidatePasser) and is not in the passed set: the file ahead is free and their pawns' control of
  // it is matched by ours (Stash 37 evaluate_passed, vendor/cpw/pages/Candidate_Passed_Pawn.wiki). Stash 37 merges the two
  let passed: u64 = 0;
  b = ours;
  while (b) {
    const s = <i32>ctz(b);
    const path = unchecked(FORWARD[(us << 6) + s]);
    if (!(path & theirs)) {
      const r = relRank(s, us);
      if (!(unchecked(SPAN[(us << 6) + s]) & theirs)) {
        v += S(unchecked(PAWN_PASSED_MG[r]), unchecked(PAWN_PASSED_EG[r]));
        passed |= (<u64>1) << <u64>s;
      } else if (!(path & theirAtt & ~ourAtt) && !(path & theirAtt2 & ~ourAtt2)) {
        v += S(unchecked(PAWN_CANDIDATE_MG[r]), unchecked(PAWN_CANDIDATE_EG[r]));
      }
    }
    b &= b - 1;
  }
  unchecked((passedOf[us] = passed));

  // each passer, by both kings' distance to it, linear per rank, Ethereal 12.75 evaluatePassed; Stash 37
  // evaluate_passed_pos PassedOurKingDistance is a 2-D table, which adds cells that only sparse data fills
  b = passed;
  while (b) {
    const s = <i32>ctz(b);
    const r = relRank(s, us);
    v += S(unchecked(PASSED_OUR_KING_MG[r]), unchecked(PASSED_OUR_KING_EG[r])) * distance(ourKing, s);
    v += S(unchecked(PASSED_THEIR_KING_MG[r]), unchecked(PASSED_THEIR_KING_EG[r])) * distance(theirKing, s);
    b &= b - 1;
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
