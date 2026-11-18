/**
 * The eval terms that read attack maps: mobility, the knight, bishop and rook
 * terms, king safety, passed-pawn advance and threats. pieceTerms() builds the
 * maps in its piece loop, CPW "Attack and Defend Maps" on the fly.
 *
 * Every score is a packed (middlegame, endgame) pair, White's view. kingPawn() runs
 * first: this file reads its passedOf, spanOf and safetyOf.
 *
 * Each per-color function is inlined at pieceTerms()'s two calls. The constant color
 * folds its branches and turns its table reads into constant addresses.
 */
import { BISHOP, FILE_A, KING, KNIGHT, PAWN, QUEEN, ROOK } from "../../core/constants";
import { bb, castling } from "../../core/position";
import { KING_ATT, KNIGHT_ATT, bishopAttacks, bit, rookAttacks } from "../../core/tables";
import { DARK, FILE_H, RANK_1, distance, pawnAttacks, pawnAttacks2, relRank } from "./geometry";
import {
  BEHIND_BISHOP_EG, BEHIND_BISHOP_MG, BEHIND_KNIGHT_EG, BEHIND_KNIGHT_MG, BISHOP_LONG_EG, BISHOP_LONG_MG, BISHOP_PAIR_EG, BISHOP_PAIR_MG,
  BISHOP_PAWNS_EG, BISHOP_PAWNS_MG, BISHOP_RAMMED_EG, BISHOP_RAMMED_MG, FAR_KNIGHT_EG, FAR_KNIGHT_MG, FLANK_ATTACK_EG, FLANK_ATTACK_MG,
  MOB_BISHOP_EG, MOB_BISHOP_MG,
  MOB_KNIGHT_EG, MOB_KNIGHT_MG, MOB_QUEEN_EG, MOB_QUEEN_MG, MOB_ROOK_EG, MOB_ROOK_MG, OUTPOST_BISHOP_EG, OUTPOST_BISHOP_MG,
  OUTPOST_KNIGHT_EG, OUTPOST_KNIGHT_MG, PASSED_ADVANCE_EG, PASSED_ADVANCE_MG, PASSED_ROOK_BEHIND_EG, PASSED_ROOK_BEHIND_MG,
  PASSED_SAFE_PATH_EG, PASSED_SAFE_PATH_MG, ROOK_BURIED_EG, ROOK_BURIED_MG, ROOK_FILE_EG, ROOK_FILE_MG, ROOK_QUEEN_FILE_EG, ROOK_QUEEN_FILE_MG,
  ROOK_TRAPPED_EG, ROOK_TRAPPED_MG, SAFETY_ATTACK_EG, SAFETY_ATTACK_MG, SAFETY_BISHOP_EG, SAFETY_BISHOP_MG, SAFETY_CHECK_BISHOP_EG,
  SAFETY_CHECK_BISHOP_MG, SAFETY_CHECK_KNIGHT_EG, SAFETY_CHECK_KNIGHT_MG, SAFETY_CHECK_QUEEN_EG, SAFETY_CHECK_QUEEN_MG, SAFETY_CHECK_ROOK_EG,
  SAFETY_CHECK_ROOK_MG, SAFETY_FLANK_ATTACK2_EG, SAFETY_FLANK_ATTACK2_MG, SAFETY_FLANK_ATTACK_EG, SAFETY_FLANK_ATTACK_MG,
  SAFETY_FLANK_DEFENSE2_EG, SAFETY_FLANK_DEFENSE2_MG, SAFETY_FLANK_DEFENSE_EG, SAFETY_FLANK_DEFENSE_MG,
  SAFETY_KNIGHT_EG, SAFETY_KNIGHT_MG, SAFETY_NO_QUEEN_EG, SAFETY_NO_QUEEN_MG, SAFETY_OFFSET_EG, SAFETY_OFFSET_MG,
  SAFETY_QUEEN_EG, SAFETY_QUEEN_MG, SAFETY_ROOK_EG, SAFETY_ROOK_MG, SAFETY_UNSAFE_EG, SAFETY_UNSAFE_MG, SAFETY_WEAK_EG, SAFETY_WEAK_MG,
  THREAT_MINOR_BY_KING_EG, THREAT_MINOR_BY_KING_MG, THREAT_MINOR_BY_MAJOR_EG, THREAT_MINOR_BY_MAJOR_MG, THREAT_MINOR_BY_MINOR_EG,
  THREAT_MINOR_BY_MINOR_MG, THREAT_MINOR_BY_PAWN_EG, THREAT_MINOR_BY_PAWN_MG, THREAT_OVERLOADED_EG, THREAT_OVERLOADED_MG, THREAT_PUSH_EG,
  THREAT_PUSH_MG, THREAT_QUEEN_EG, THREAT_QUEEN_MG, THREAT_ROOK_BY_KING_EG, THREAT_ROOK_BY_KING_MG, THREAT_ROOK_BY_LESSER_EG,
  THREAT_ROOK_BY_LESSER_MG, THREAT_WEAK_PAWN_EG, THREAT_WEAK_PAWN_MG,
} from "./params";
import { FORWARD, passedOf, safetyOf, spanOf } from "./pawns";
import { S, egOf, mgOf } from "./score";

// ---------------------------------------------------------------- masks

const CENTER: u64 = 0x0000001818000000;
const LONG_DIAGONALS: u64 = 0x8142241818244281;

/** by color and square: the king's area, Ethereal 12.75 kingAreaMasks: its moves, its square and the rank ahead, a file wider on the edge */
const KING_AREA = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 128));
/**
 * by color and its king's file: the king's flank, files a to d, c to f or e to h, on the color's first five ranks
 * (Clockwork 641d9f5 king_flank). Not taken: Stockfish 11 KingFlank, three files wide for a king on
 * an edge file.
 */
const KING_FLANK = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 16));

/** the safety sum's divisors, Ethereal 12.75 evaluateKings's 720 and 20: the square's scales by the seeds' conversion, so its output converts too */
const KS_DIV_MG = 3512;
const KS_DIV_EG = 20;

export function initPieces(): void {
  for (let f = 0; f < 8; f++) {
    const first = f <= 2 ? 0 : f <= 4 ? 2 : 4;
    const files = (FILE_A | (FILE_A << 1) | (FILE_A << 2) | (FILE_A << 3)) << <u64>first;
    KING_FLANK[f] = files & 0x000000ffffffffff;
    KING_FLANK[8 + f] = files & 0xffffffffff000000;
  }
  for (let s = 0; s < 64; s++) {
    const around = KING_ATT[s] | bit(s);
    let w = around | (KING_ATT[s] << 8);
    let b = around | (KING_ATT[s] >> 8);
    if ((s & 7) == 0) {
      w |= w << 1;
      b |= b << 1;
    }
    if ((s & 7) == 7) {
      w |= w >> 1;
      b |= b >> 1;
    }
    KING_AREA[s] = w;
    KING_AREA[64 + s] = b;
  }
}

// ---------------------------------------------------------------- maps

/** by color: squares attacked, and attacked at least twice */
const attacked = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
const attacked2 = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** by color << 3 | piece type: squares that type attacks */
const attackedBy = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 16));
/** by color: the squares its pawns attack twice */
const pawnDouble = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** by color: the squares its pieces' mobility counts */
const mobility = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** by color: its own pawns rammed against an enemy pawn */
const rammed = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** by color: the squares directly behind any pawn, from its side */
const behindPawn = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** by color, of its own king: the area, and the attacks, attackers and weights on it */
const kingArea = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
const zoneAttacks = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 2));
const zoneAttackers = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 2));
const zoneWeight = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 2));

/** king safety's halves, White's view, from the last pieceTerms(): unpacked, since the square can leave i16 */
export let kingSafetyMg = 0;
export let kingSafetyEg = 0;

@inline function up(b: u64, us: i32): u64 {
  return us == 0 ? b << 8 : b >> 8;
}

/** the pawn and king entries of a color's maps, and its mobility area, Stash 37 evaldata_init_next: no enemy pawn attacks, own king, or own pawn that is blocked or on its low ranks */
@inline function setup(us: i32, occ: u64): void {
  const them = us ^ 1;
  const ours = bb[(us << 3) | PAWN];
  const theirs = bb[(them << 3) | PAWN];
  const pawnAtt = pawnAttacks(ours, us);
  const kingSq = <i32>ctz(bb[(us << 3) | KING]);
  const kingAtt = KING_ATT[kingSq];
  attackedBy[(us << 3) | PAWN] = pawnAtt;
  attackedBy[(us << 3) | KING] = kingAtt;
  attacked[us] = pawnAtt | kingAtt;
  attacked2[us] = pawnAtt & kingAtt;
  pawnDouble[us] = pawnAttacks2(ours, us);
  const low = us == 0 ? (RANK_1 << 8) | (RANK_1 << 16) : (RANK_1 << 40) | (RANK_1 << 48);
  const stuck = ours & (up(occ, them) | low);
  mobility[us] = ~(pawnAttacks(theirs, them) | bit(kingSq) | stuck);
  rammed[us] = ours & up(theirs, them);
  behindPawn[us] = up(bb[PAWN] | bb[8 | PAWN], them);
  kingArea[us] = KING_AREA[(us << 6) + kingSq];
  zoneAttackers[us] = 0;
  zoneWeight[us] = 0;
}

/** records a piece's attacks in the maps; attacks on the enemy king's area count past squares its pawns hold twice, Ethereal 12.75 evaluateKnights */
@inline function record(us: i32, type: i32, att: u64, weight: i32): void {
  const them = us ^ 1;
  unchecked((attacked2[us] |= att & attacked[us]));
  unchecked((attacked[us] |= att));
  unchecked((attackedBy[(us << 3) | type] |= att));
  const zone = att & unchecked(kingArea[them]) & ~unchecked(pawnDouble[them]);
  if (zone) {
    unchecked((zoneAttacks[them] += <i32>popcnt(zone)));
    unchecked((zoneAttackers[them] += 1));
    unchecked((zoneWeight[them] += weight));
  }
}

// ---------------------------------------------------------------- pieces

/** a minor's outpost cell by [outside file][pawn-defended], or -1: Ethereal 12.75 KnightOutpost, on relative ranks 4 to 6 and out of every enemy pawn's reach */
@inline function outpost(us: i32, b: u64): i32 {
  const ranks = us == 0 ? (<u64>0xffffff) << 24 : (<u64>0xffffff) << 16;
  if (!(b & ranks & ~unchecked(spanOf[us ^ 1]))) return -1;
  const outside = (b & (FILE_A | FILE_H)) != 0 ? 2 : 0;
  return outside + ((b & unchecked(attackedBy[(us << 3) | PAWN])) != 0 ? 1 : 0);
}

/** knights: Ethereal 12.75 evaluateKnights, less its pawn-king and closedness parts; the mobility table is Stash 37 KnightMobility */
@inline function knights(us: i32): i32 {
  const them = us ^ 1;
  const ownKing = <i32>ctz(bb[(us << 3) | KING]);
  const theirKing = <i32>ctz(bb[(them << 3) | KING]);
  const weight = S(SAFETY_KNIGHT_MG, SAFETY_KNIGHT_EG);
  unchecked((attackedBy[(us << 3) | KNIGHT] = 0));
  let v = 0;
  let pieces = bb[(us << 3) | KNIGHT];
  while (pieces) {
    const s = <i32>ctz(pieces);
    const b = bit(s);
    const att = unchecked(KNIGHT_ATT[s]);
    record(us, KNIGHT, att, weight);
    const cell = outpost(us, b);
    if (cell >= 0) v += S(unchecked(OUTPOST_KNIGHT_MG[cell]), unchecked(OUTPOST_KNIGHT_EG[cell]));
    if (b & unchecked(behindPawn[us])) v += S(BEHIND_KNIGHT_MG, BEHIND_KNIGHT_EG);
    const far = min(distance(s, ownKing), distance(s, theirKing));
    if (far >= 4) v += S(unchecked(FAR_KNIGHT_MG[far - 4]), unchecked(FAR_KNIGHT_EG[far - 4]));
    const n = <i32>popcnt(att & unchecked(mobility[us]));
    v += S(unchecked(MOB_KNIGHT_MG[n]), unchecked(MOB_KNIGHT_EG[n]));
    pieces &= pieces - 1;
  }
  return v;
}

/** bishops: Ethereal 12.75 evaluateBishops, seeing through own bishops and queens; the same-color pawn terms are Laser 1.7 evaluate's BISHOP_PAWN_COLOR_PENALTY, the mobility table Stash 37 BishopMobility */
@inline function bishops(us: i32, occ: u64): i32 {
  const o = us << 3;
  const seen = occ ^ (bb[o | BISHOP] | bb[o | QUEEN]);
  const pawns = bb[PAWN] | bb[8 | PAWN];
  const weight = S(SAFETY_BISHOP_MG, SAFETY_BISHOP_EG);
  unchecked((attackedBy[o | BISHOP] = 0));
  let v = 0;
  let pieces = bb[o | BISHOP];
  if (pieces & DARK && pieces & ~DARK) v += S(BISHOP_PAIR_MG, BISHOP_PAIR_EG);
  while (pieces) {
    const s = <i32>ctz(pieces);
    const b = bit(s);
    const att = bishopAttacks(s, seen);
    record(us, BISHOP, att, weight);
    const shade = b & DARK ? DARK : ~DARK;
    v += S(BISHOP_PAWNS_MG, BISHOP_PAWNS_EG) * <i32>popcnt(bb[o | PAWN] & shade);
    v += S(BISHOP_RAMMED_MG, BISHOP_RAMMED_EG) * <i32>popcnt(unchecked(rammed[us]) & shade);
    const cell = outpost(us, b);
    if (cell >= 0) v += S(unchecked(OUTPOST_BISHOP_MG[cell]), unchecked(OUTPOST_BISHOP_EG[cell]));
    if (b & unchecked(behindPawn[us])) v += S(BEHIND_BISHOP_MG, BEHIND_BISHOP_EG);
    if (b & LONG_DIAGONALS & ~CENTER) {
      const center = bishopAttacks(s, pawns) & CENTER;
      if (center & (center - 1)) v += S(BISHOP_LONG_MG, BISHOP_LONG_EG);
    }
    const n = <i32>popcnt(att & unchecked(mobility[us]));
    v += S(unchecked(MOB_BISHOP_MG[n]), unchecked(MOB_BISHOP_EG[n]));
    pieces &= pieces - 1;
  }
  return v;
}

/** rooks, seeing through own rooks and queens (Ethereal 12.75 evaluateRooks): file terms Ethereal 12.75 RookFile; the queen's file, trapped and mobility table Stash 37 RookXrayQueen, RookTrapped, RookBuried and RookMobility */
@inline function rooks(us: i32, occ: u64): i32 {
  const o = us << 3;
  const t = (us ^ 1) << 3;
  const seen = occ ^ (bb[o | ROOK] | bb[o | QUEEN]);
  const kingFile = <i32>ctz(bb[o | KING]) & 7;
  const weight = S(SAFETY_ROOK_MG, SAFETY_ROOK_EG);
  unchecked((attackedBy[o | ROOK] = 0));
  let v = 0;
  let pieces = bb[o | ROOK];
  while (pieces) {
    const s = <i32>ctz(pieces);
    const f = s & 7;
    const file = FILE_A << <u64>f;
    const att = rookAttacks(s, seen);
    record(us, ROOK, att, weight);
    if (!(file & bb[o | PAWN])) {
      const open = file & bb[t | PAWN] ? 0 : 1;
      v += S(unchecked(ROOK_FILE_MG[open]), unchecked(ROOK_FILE_EG[open]));
    }
    if (file & bb[t | QUEEN]) v += S(ROOK_QUEEN_FILE_MG, ROOK_QUEEN_FILE_EG);
    const n = <i32>popcnt(att & unchecked(mobility[us]));
    v += S(unchecked(MOB_ROOK_MG[n]), unchecked(MOB_ROOK_EG[n]));
    // hemmed in by its own king, Stash 37 RookTrapped: the king between the rook and the board's middle
    if (n <= 4 && relRank(s, us) <= 1 && kingFile != f && kingFile < f == kingFile >= 4) {
      v += castling & (us == 0 ? 3 : 12) ? S(ROOK_TRAPPED_MG, ROOK_TRAPPED_EG) : S(ROOK_BURIED_MG, ROOK_BURIED_EG);
    }
    pieces &= pieces - 1;
  }
  return v;
}

/** queens: mobility over Stash 37 QueenMobility, seeing through nothing as Ethereal 12.75 evaluateQueens */
@inline function queens(us: i32, occ: u64): i32 {
  const o = us << 3;
  const weight = S(SAFETY_QUEEN_MG, SAFETY_QUEEN_EG);
  unchecked((attackedBy[o | QUEEN] = 0));
  let v = 0;
  let pieces = bb[o | QUEEN];
  while (pieces) {
    const s = <i32>ctz(pieces);
    const att = bishopAttacks(s, occ) | rookAttacks(s, occ);
    record(us, QUEEN, att, weight);
    const n = <i32>popcnt(att & unchecked(mobility[us]));
    v += S(unchecked(MOB_QUEEN_MG[n]), unchecked(MOB_QUEEN_EG[n]));
    pieces &= pieces - 1;
  }
  return v;
}

// ---------------------------------------------------------------- king safety

/**
 * The penalty on a color's king, its own view, added to kingSafetyMg and
 * kingSafetyEg: Ethereal 12.75 evaluateKings's sum, without its count rescale, and
 * Stash 37 evaluate_safety's UnsafeCheck. It counts from two attackers, or one with an enemy queen.
 * The king's flank adds four counts to the sum (Clockwork bedb1e8 evaluate_king_safety) and returns a
 * penalty that needs no attacker on the area, packed, the color's own view
 * (Stockfish 11 FlankAttacks).
 */
@inline function kingSafety(us: i32, occ: u64): i32 {
  const them = us ^ 1;
  const o = us << 3;
  const t = them << 3;
  const enemyQueens = bb[t | QUEEN];
  const kingSq = <i32>ctz(bb[o | KING]);
  const ours1 = unchecked(attacked[us]);
  const ours2 = unchecked(attacked2[us]);
  const theirs1 = unchecked(attacked[them]);
  const theirs2 = unchecked(attacked2[them]);
  const flank = unchecked(KING_FLANK[o + (kingSq & 7)]);
  const flankAttacks = <i32>popcnt(theirs1 & flank);
  const flankAttacks2 = <i32>popcnt(theirs2 & flank);
  const flankValue = -S(FLANK_ATTACK_MG, FLANK_ATTACK_EG) * (flankAttacks + flankAttacks2);
  if (unchecked(zoneAttackers[us]) <= 1 - <i32>popcnt(enemyQueens)) return flankValue;
  const weak = theirs1 & ~ours2 & (~ours1 | unchecked(attackedBy[o | QUEEN]) | unchecked(attackedBy[o | KING]));
  const safe = ~bb[t] & (~ours1 | (weak & theirs2));
  const bishopRays = bishopAttacks(kingSq, occ);
  const rookRays = rookAttacks(kingSq, occ);
  const knightChecks = unchecked(KNIGHT_ATT[kingSq]) & unchecked(attackedBy[t | KNIGHT]);
  const bishopChecks = bishopRays & unchecked(attackedBy[t | BISHOP]);
  const rookChecks = rookRays & unchecked(attackedBy[t | ROOK]);
  const queenChecks = (bishopRays | rookRays) & unchecked(attackedBy[t | QUEEN]);

  let sum = unchecked(zoneWeight[us]) + unchecked(safetyOf[us]) + S(SAFETY_OFFSET_MG, SAFETY_OFFSET_EG);
  sum += S(SAFETY_ATTACK_MG, SAFETY_ATTACK_EG) * unchecked(zoneAttacks[us]);
  sum += S(SAFETY_WEAK_MG, SAFETY_WEAK_EG) * <i32>popcnt(weak & unchecked(kingArea[us]));
  if (!enemyQueens) sum += S(SAFETY_NO_QUEEN_MG, SAFETY_NO_QUEEN_EG);
  sum += S(SAFETY_CHECK_QUEEN_MG, SAFETY_CHECK_QUEEN_EG) * <i32>popcnt(queenChecks & safe);
  sum += S(SAFETY_CHECK_ROOK_MG, SAFETY_CHECK_ROOK_EG) * <i32>popcnt(rookChecks & safe);
  sum += S(SAFETY_CHECK_BISHOP_MG, SAFETY_CHECK_BISHOP_EG) * <i32>popcnt(bishopChecks & safe);
  sum += S(SAFETY_CHECK_KNIGHT_MG, SAFETY_CHECK_KNIGHT_EG) * <i32>popcnt(knightChecks & safe);
  sum += S(SAFETY_UNSAFE_MG, SAFETY_UNSAFE_EG) * <i32>popcnt((knightChecks | bishopChecks | rookChecks | queenChecks) & ~safe);
  sum += S(SAFETY_FLANK_ATTACK_MG, SAFETY_FLANK_ATTACK_EG) * flankAttacks + S(SAFETY_FLANK_ATTACK2_MG, SAFETY_FLANK_ATTACK2_EG) * flankAttacks2;
  sum += S(SAFETY_FLANK_DEFENSE_MG, SAFETY_FLANK_DEFENSE_EG) * <i32>popcnt(ours1 & flank);
  sum += S(SAFETY_FLANK_DEFENSE2_MG, SAFETY_FLANK_DEFENSE2_EG) * <i32>popcnt(ours2 & flank);

  const mg = mgOf(sum);
  const eg = egOf(sum);
  const penaltyMg = -(mg * max(mg, 0)) / KS_DIV_MG;
  const penaltyEg = -max(eg, 0) / KS_DIV_EG;
  kingSafetyMg += us == 0 ? penaltyMg : -penaltyMg;
  kingSafetyEg += us == 0 ? penaltyEg : -penaltyEg;
  return flankValue;
}

// ---------------------------------------------------------------- passed pawns

/** each passer's room to advance, Ethereal 12.75 evaluatePassed; a rook behind it, Weiss c735b8f EvalPassedPawns. Rank and king distance are in pawns.ts. */
@inline function passers(us: i32, occ: u64): i32 {
  const them = us ^ 1;
  const o = us << 3;
  const enemy = bb[them << 3];
  const theirAtt = unchecked(attacked[them]);
  const mine = unchecked(passedOf[us]);
  let v = 0;
  let b = mine;
  while (b) {
    const s = <i32>ctz(b);
    const here = bit(s);
    const stop = up(here, us);
    const cell = ((stop & occ ? 0 : 2) + (stop & theirAtt ? 0 : 1)) * 8 + relRank(s, us);
    v += S(unchecked(PASSED_ADVANCE_MG[cell]), unchecked(PASSED_ADVANCE_EG[cell]));
    const ahead = unchecked(FORWARD[(us << 6) + s]);
    // only the front passer of a file asks for a clear path
    if (!(ahead & mine) && !((ahead | here) & (enemy | theirAtt))) v += S(PASSED_SAFE_PATH_MG, PASSED_SAFE_PATH_EG);
    if (unchecked(FORWARD[(them << 6) + s]) & bb[o | ROOK]) v += S(PASSED_ROOK_BEHIND_MG, PASSED_ROOK_BEHIND_EG);
    b &= b - 1;
  }
  return v;
}

// ---------------------------------------------------------------- threats

/** threats against a color's pieces, and its safe pushes that attack, Ethereal 12.75 evaluateThreats */
@inline function threats(us: i32, occ: u64): i32 {
  const them = us ^ 1;
  const o = us << 3;
  const t = them << 3;
  const pawns = bb[o | PAWN];
  const minors = bb[o | KNIGHT] | bb[o | BISHOP];
  const rookSet = bb[o | ROOK];
  const queenSet = bb[o | QUEEN];
  const byPawns = unchecked(attackedBy[t | PAWN]);
  const byMinors = unchecked(attackedBy[t | KNIGHT]) | unchecked(attackedBy[t | BISHOP]);
  const byMajors = unchecked(attackedBy[t | ROOK]) | unchecked(attackedBy[t | QUEEN]);
  const byKing = unchecked(attackedBy[t | KING]);
  const ours1 = unchecked(attacked[us]);
  const ours2 = unchecked(attacked2[us]);
  const theirs1 = unchecked(attacked[them]);
  const theirs2 = unchecked(attacked2[them]);

  // attacked and undefended, or attacked twice, defended at most once and not by a pawn
  const poor = (theirs1 & ~ours1) | (theirs2 & ~ours2 & ~unchecked(attackedBy[o | PAWN]));
  const weakMinors = minors & poor;
  const overloaded = (minors | rookSet | queenSet) & ours1 & ~ours2 & theirs1 & ~theirs2;

  // squares a safe push reaches, single or double, and the enemy pieces it would then attack
  const third = us == 0 ? RANK_1 << 16 : RANK_1 << 40;
  let push = up(pawns, us) & ~occ;
  push |= up(push & ~byPawns & third, us) & ~occ;
  push &= ~byPawns & (ours1 | ~theirs1);
  const pushAttacks = pawnAttacks(push, us) & bb[t] & ~unchecked(attackedBy[o | PAWN]);

  let v = S(THREAT_WEAK_PAWN_MG, THREAT_WEAK_PAWN_EG) * <i32>popcnt(pawns & ~byPawns & poor);
  v += S(THREAT_MINOR_BY_PAWN_MG, THREAT_MINOR_BY_PAWN_EG) * <i32>popcnt(minors & byPawns);
  v += S(THREAT_MINOR_BY_MINOR_MG, THREAT_MINOR_BY_MINOR_EG) * <i32>popcnt(minors & byMinors);
  v += S(THREAT_MINOR_BY_MAJOR_MG, THREAT_MINOR_BY_MAJOR_EG) * <i32>popcnt(weakMinors & byMajors);
  v += S(THREAT_ROOK_BY_LESSER_MG, THREAT_ROOK_BY_LESSER_EG) * <i32>popcnt(rookSet & (byPawns | byMinors));
  v += S(THREAT_MINOR_BY_KING_MG, THREAT_MINOR_BY_KING_EG) * <i32>popcnt(weakMinors & byKing);
  v += S(THREAT_ROOK_BY_KING_MG, THREAT_ROOK_BY_KING_EG) * <i32>popcnt(rookSet & poor & byKing);
  v += S(THREAT_QUEEN_MG, THREAT_QUEEN_EG) * <i32>popcnt(queenSet & theirs1);
  v += S(THREAT_OVERLOADED_MG, THREAT_OVERLOADED_EG) * <i32>popcnt(overloaded);
  v += S(THREAT_PUSH_MG, THREAT_PUSH_EG) * <i32>popcnt(pushAttacks);
  return v;
}

// ---------------------------------------------------------------- the whole

/** the terms above as a packed sum, White's view, with king safety's halves in kingSafetyMg and kingSafetyEg */
export function pieceTerms(): i32 {
  const occ = bb[0] | bb[8];
  setup(0, occ);
  setup(1, occ);
  // a color's pawns count on the other's king's area once both areas are set
  unchecked((zoneAttacks[1] = <i32>popcnt(attackedBy[PAWN] & kingArea[1])));
  unchecked((zoneAttacks[0] = <i32>popcnt(attackedBy[8 | PAWN] & kingArea[0])));
  let v = knights(0) - knights(1);
  v += bishops(0, occ) - bishops(1, occ);
  v += rooks(0, occ) - rooks(1, occ);
  v += queens(0, occ) - queens(1, occ);
  v += passers(0, occ) - passers(1, occ);
  v += threats(0, occ) - threats(1, occ);
  kingSafetyMg = 0;
  kingSafetyEg = 0;
  v += kingSafety(0, occ) - kingSafety(1, occ);
  return v;
}
