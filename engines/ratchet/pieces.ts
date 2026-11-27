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
import { bb, castling, side } from "../../core/position";
import { KING_ATT, KNIGHT_ATT, bishopAttacks, bit, rookAttacks } from "../../core/tables";
import { DARK, FILE_H, RANK_1, distance, pawnAttacks, relRank } from "./geometry";
import {
  BEHIND_BISHOP_EG,
  BEHIND_BISHOP_MG,
  BEHIND_KNIGHT_EG,
  BEHIND_KNIGHT_MG,
  BISHOP_BAD_PAWNS_EG,
  BISHOP_BAD_PAWNS_MG,
  BISHOP_KING_RING_EG,
  BISHOP_KING_RING_MG,
  BISHOP_LONG_EG,
  BISHOP_LONG_MG,
  BISHOP_PAIR_EG,
  BISHOP_PAIR_MG,
  BISHOP_PAWNS_EG,
  BISHOP_PAWNS_MG,
  BISHOP_RAMMED_EG,
  BISHOP_RAMMED_MG,
  BISHOP_XRAY_PAWNS_EG,
  BISHOP_XRAY_PAWNS_MG,
  FAR_KNIGHT_EG,
  FAR_KNIGHT_MG,
  FLANK_ATTACK_EG,
  FLANK_ATTACK_MG,
  MOB_BISHOP_EG,
  MOB_BISHOP_MG,
  MOB_KNIGHT_EG,
  MOB_KNIGHT_MG,
  MOB_QUEEN_EG,
  MOB_QUEEN_MG,
  MOB_ROOK_EG,
  MOB_ROOK_MG,
  OUTPOST_BISHOP_EG,
  OUTPOST_BISHOP_MG,
  OUTPOST_KNIGHT_EG,
  OUTPOST_KNIGHT_MG,
  PASSED_ADVANCE_EG,
  PASSED_ADVANCE_MG,
  PASSED_DEFENDED_STOP_EG,
  PASSED_DEFENDED_STOP_MG,
  PASSED_ENEMY_ROOK_BEHIND_EG,
  PASSED_ENEMY_ROOK_BEHIND_MG,
  PASSED_ROOK_BEHIND_EG,
  PASSED_ROOK_BEHIND_MG,
  PASSED_SAFE_PATH_EG,
  PASSED_SAFE_PATH_MG,
  PASSED_SQUARE_EG,
  ROOK_BURIED_EG,
  ROOK_BURIED_MG,
  ROOK_FILE_EG,
  ROOK_FILE_MG,
  ROOK_QUEEN_FILE_EG,
  ROOK_QUEEN_FILE_MG,
  ROOK_TRAPPED_EG,
  ROOK_TRAPPED_MG,
  SAFETY_ATTACK_EG,
  SAFETY_ATTACK_MG,
  SAFETY_BISHOP_EG,
  SAFETY_BISHOP_MG,
  SAFETY_CHECK_BISHOP_EG,
  SAFETY_CHECK_BISHOP_MG,
  SAFETY_CHECK_KNIGHT_EG,
  SAFETY_CHECK_KNIGHT_MG,
  SAFETY_CHECK_QUEEN_EG,
  SAFETY_CHECK_QUEEN_MG,
  SAFETY_CHECK_ROOK_EG,
  SAFETY_CHECK_ROOK_MG,
  SAFETY_FLANK_ATTACK2_EG,
  SAFETY_FLANK_ATTACK2_MG,
  SAFETY_FLANK_ATTACK_EG,
  SAFETY_FLANK_ATTACK_MG,
  SAFETY_FLANK_DEFENSE2_EG,
  SAFETY_FLANK_DEFENSE2_MG,
  SAFETY_FLANK_DEFENSE_EG,
  SAFETY_FLANK_DEFENSE_MG,
  SAFETY_KNIGHT_EG,
  SAFETY_KNIGHT_MG,
  SAFETY_NO_QUEEN_EG,
  SAFETY_NO_QUEEN_MG,
  SAFETY_OFFSET_EG,
  SAFETY_OFFSET_MG,
  SAFETY_QUEEN_EG,
  SAFETY_QUEEN_MG,
  SAFETY_ROOK_EG,
  SAFETY_ROOK_MG,
  SAFETY_UNSAFE_EG,
  SAFETY_UNSAFE_MG,
  SAFETY_WEAK_EG,
  SAFETY_WEAK_MG,
  SPACE_EG,
  SPACE_MG,
  THREAT_MINOR_BY_KING_EG,
  THREAT_MINOR_BY_KING_MG,
  THREAT_MINOR_BY_MAJOR_EG,
  THREAT_MINOR_BY_MAJOR_MG,
  THREAT_MINOR_BY_MINOR_EG,
  THREAT_MINOR_BY_MINOR_MG,
  THREAT_MINOR_BY_PAWN_EG,
  THREAT_MINOR_BY_PAWN_MG,
  THREAT_OVERLOADED_EG,
  THREAT_OVERLOADED_MG,
  THREAT_PUSH_EG,
  THREAT_PUSH_MG,
  THREAT_QUEEN_EG,
  THREAT_QUEEN_MG,
  THREAT_ROOK_BY_KING_EG,
  THREAT_ROOK_BY_KING_MG,
  THREAT_ROOK_BY_LESSER_EG,
  THREAT_ROOK_BY_LESSER_MG,
  THREAT_WEAK_PAWN_EG,
  THREAT_WEAK_PAWN_MG,
} from "./params";
import { FORWARD, passedOf, safetyOf, spanOf } from "./pawns";
import { S, egOf, mgOf } from "./score";

// ---------------------------------------------------------------- masks

const CENTER: u64 = 0x0000001818000000;
const CENTRAL_FILES: u64 = (FILE_A << 2) | (FILE_A << 3) | (FILE_A << 4) | (FILE_A << 5);
const LONG_DIAGONALS: u64 = 0x8142241818244281;
/** by square: empty-board bishop rays, for enemy-pawn x-ray counts without a slider lookup */
const BISHOP_RAYS = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 64));

/**
 * By color and square: the king's area, Ethereal 12.75 kingAreaMasks: its moves,
 * its square and the rank ahead, a file wider on the edge.
 * Feature: King_Safety#Attacking_King_Zone.
 */
const KING_AREA = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 128));
/**
 * by color and its king's file: the king's flank, files a to d, c to f or e to h, on the color's first five ranks
 * (Clockwork 641d9f5 king_flank). Not taken: Stockfish 11 KingFlank, three files wide for a king on
 * an edge file. Feature: King_Safety#Square_Control.
 */
const KING_FLANK = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 16));

/**
 * The safety sum's divisors, Ethereal 12.75 evaluateKings's 720 and 20: the
 * square's scales by the seeds' conversion, so its output converts too. The
 * endgame half is linear in its sum, so its divisor and every SAFETY_*_EG value
 * are a quarter of that scale: the penalty is the same, and the packed sum's
 * endgame half stays within i16. Feature: King_Safety#Attacking_King_Zone.
 */
const KS_DIV_MG = 3512;
const KS_DIV_EG = 5;

export function initPieces(): void {
  for (let f = 0; f < 8; f++) {
    const first = f <= 2 ? 0 : f <= 4 ? 2 : 4;
    const files = (FILE_A | (FILE_A << 1) | (FILE_A << 2) | (FILE_A << 3)) << <u64>first;
    KING_FLANK[f] = files & 0x000000ffffffffff;
    KING_FLANK[8 + f] = files & 0xffffffffff000000;
  }
  for (let s = 0; s < 64; s++) {
    BISHOP_RAYS[s] = bishopAttacks(s, 0);
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
/** by color: the king's area less squares its own pawns attack twice */
const kingZone = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
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

/**
 * Records a piece's attacks in the maps; attacks on the enemy king's area count
 * past squares its pawns hold twice, Ethereal 12.75 evaluateKnights.
 * Features: Attack_and_Defend_Maps, King_Safety#Attacking_King_Zone.
 */
@inline function record(us: i32, type: i32, att: u64, weight: i32): void {
  const them = us ^ 1;
  unchecked((attacked2[us] |= att & attacked[us]));
  unchecked((attacked[us] |= att));
  unchecked((attackedBy[(us << 3) | type] |= att));
  const zone = att & unchecked(kingZone[them]);
  if (zone) {
    unchecked((zoneAttacks[them] += <i32>popcnt(zone)));
    unchecked((zoneAttackers[them] += 1));
    unchecked((zoneWeight[them] += weight));
  }
}

// ---------------------------------------------------------------- pieces

/**
 * A minor's outpost cell by [outside file][pawn-defended], or -1: Ethereal 12.75
 * KnightOutpost, on relative ranks 4 to 6 and out of every enemy pawn's reach.
 * Feature: Outposts.
 */
@inline function outpost(us: i32, b: u64): i32 {
  const ranks = us == 0 ? (<u64>0xffffff) << 24 : (<u64>0xffffff) << 16;
  if (!(b & ranks & ~unchecked(spanOf[us ^ 1]))) return -1;
  const outside = (b & (FILE_A | FILE_H)) != 0 ? 2 : 0;
  return outside + ((b & unchecked(attackedBy[(us << 3) | PAWN])) != 0 ? 1 : 0);
}

/**
 * Knights: Ethereal 12.75 evaluateKnights, less its pawn-king and closedness
 * parts; the mobility table is Stash 37 KnightMobility.
 * Features: Outposts, Minor_Behind_Pawn, Knight_In_Siberia, Mobility, King_Safety#Attacking_King_Zone.
 */
@inline function knights(us: i32, ownKing: i32, theirKing: i32): i32 {
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

/**
 * Bishops: Ethereal 12.75 evaluateBishops, seeing through own bishops and
 * queens; same-color pawn terms Laser 1.7, bad bishop Weiss 11a0f72, x-ray enemy
 * pawns Stockfish a91cb9fc, king-ring alignment Stockfish d1ec10cd, mobility
 * Stash 37.
 * Features: Bishop_Pair, Bad_Bishop, Bishop_X-Ray_Pawns, Bishop_on_King_Ring, Bishop_Long_Diagonal.
 * Features: Outposts, Minor_Behind_Pawn, Mobility, King_Safety#Attacking_King_Zone.
 */
@inline function bishops(us: i32, occ: u64, pawns: u64, blockedCentral: i32): i32 {
  const them = us ^ 1;
  const o = us << 3;
  const t = them << 3;
  const seen = occ ^ (bb[o | BISHOP] | bb[o | QUEEN]);
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
    const sameColor = <i32>popcnt(bb[o | PAWN] & shade);
    v += S(BISHOP_PAWNS_MG, BISHOP_PAWNS_EG) * sameColor;
    v += S(BISHOP_RAMMED_MG, BISHOP_RAMMED_EG) * <i32>popcnt(unchecked(rammed[us]) & shade);
    if (blockedCentral) v += S(BISHOP_BAD_PAWNS_MG, BISHOP_BAD_PAWNS_EG) * (sameColor * blockedCentral);
    const rays = unchecked(BISHOP_RAYS[s]);
    v += S(BISHOP_XRAY_PAWNS_MG, BISHOP_XRAY_PAWNS_EG) * <i32>popcnt(rays & bb[t | PAWN]);
    const cell = outpost(us, b);
    if (cell >= 0) v += S(unchecked(OUTPOST_BISHOP_MG[cell]), unchecked(OUTPOST_BISHOP_EG[cell]));
    if (b & unchecked(behindPawn[us])) v += S(BEHIND_BISHOP_MG, BEHIND_BISHOP_EG);
    const onLong = (b & LONG_DIAGONALS & ~CENTER) != 0;
    const kingRay = !(att & unchecked(kingZone[them])) && (rays & unchecked(kingArea[them])) != 0;
    if (onLong || kingRay) {
      const pawnAtt = bishopAttacks(s, pawns);
      if (onLong) {
        const center = pawnAtt & CENTER;
        if (center & (center - 1)) v += S(BISHOP_LONG_MG, BISHOP_LONG_EG);
      }
      if (kingRay && (pawnAtt & unchecked(kingArea[them])) != 0) v += S(BISHOP_KING_RING_MG, BISHOP_KING_RING_EG);
    }
    const n = <i32>popcnt(att & unchecked(mobility[us]));
    v += S(unchecked(MOB_BISHOP_MG[n]), unchecked(MOB_BISHOP_EG[n]));
    pieces &= pieces - 1;
  }
  return v;
}

/**
 * Rooks, seeing through own rooks and queens (Ethereal 12.75 evaluateRooks):
 * file terms Ethereal 12.75 RookFile; queen file, trapped and mobility Stash 37.
 * Features: Rook_on_Open_File, Rook_on_Queen_File, Trapped_Pieces, Mobility, King_Safety#Attacking_King_Zone.
 */
@inline function rooks(us: i32, occ: u64, kingSq: i32): i32 {
  const o = us << 3;
  const t = (us ^ 1) << 3;
  const seen = occ ^ (bb[o | ROOK] | bb[o | QUEEN]);
  const kingFile = kingSq & 7;
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
    // hemmed in by its own king, Stash 37 RookTrapped: king off the start e-file and between rook and center.
    // Feature: Trapped_Pieces.
    if (n <= 4 && relRank(s, us) <= 1 && kingFile != 4 && kingFile != f && kingFile < f == kingFile > 4) {
      v += castling & (us == 0 ? 3 : 12) ? S(ROOK_TRAPPED_MG, ROOK_TRAPPED_EG) : S(ROOK_BURIED_MG, ROOK_BURIED_EG);
    }
    pieces &= pieces - 1;
  }
  return v;
}

/**
 * Queens: mobility over Stash 37 QueenMobility, seeing through nothing as
 * Ethereal 12.75 evaluateQueens. Features: Mobility, King_Safety#Attacking_King_Zone.
 */
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

/**
 * Phase-gated early-middlegame space, Clockwork 958d0d0 evaluate_sf_space and
 * Stockfish db59696a space (vendor/cpw/pages/Space.wiki). Feature: Space.
 */
@inline function space(us: i32, blockedPawns: i32): i32 {
  const them = us ^ 1;
  const o = us << 3;
  const t = them << 3;
  const mask: u64 = us == 0 ? 0x000000003c3c3c00 : 0x003c3c3c00000000;
  const ownPawns = bb[o | PAWN];
  const safe = mask & ~ownPawns & ~unchecked(attackedBy[t | PAWN]);
  let behind = ownPawns;
  behind |= us == 0 ? behind >> 8 : behind << 8;
  behind |= us == 0 ? behind >> 16 : behind << 16;
  const bonus = <i32>popcnt(safe) + <i32>popcnt(behind & safe & ~unchecked(attacked[them]));
  const weight = <i32>popcnt(bb[o]) - 3 + min(blockedPawns, 9);
  if (weight <= 0) return 0;
  const factor = bonus * weight * weight;
  return S((SPACE_MG * factor) / 1024, (SPACE_EG * factor) / 1024);
}

// ---------------------------------------------------------------- king safety

/**
 * The penalty on a color's king, its own view, added to kingSafetyMg and
 * kingSafetyEg: Ethereal 12.75 evaluateKings's sum, without its count rescale, and
 * Stash 37 evaluate_safety's UnsafeCheck. It counts from two attackers, or one with an enemy queen.
 * The king's flank adds four counts to the sum (Clockwork bedb1e8 evaluate_king_safety) and returns a
 * penalty that needs no attacker on the area, packed, the color's own view
 * (Stockfish 11 FlankAttacks). Features: King_Safety#Attacking_King_Zone, King_Safety#Square_Control.
 */
@inline function kingSafety(us: i32, occ: u64, kingSq: i32): i32 {
  const them = us ^ 1;
  const o = us << 3;
  const t = them << 3;
  const enemyQueens = bb[t | QUEEN];
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
  const theirB = unchecked(attackedBy[t | BISHOP]);
  const theirR = unchecked(attackedBy[t | ROOK]);
  const theirQ = unchecked(attackedBy[t | QUEEN]);
  const bishopRays = (theirB | theirQ) != 0 ? bishopAttacks(kingSq, occ) : 0;
  const rookRays = (theirR | theirQ) != 0 ? rookAttacks(kingSq, occ) : 0;
  const knightChecks = unchecked(KNIGHT_ATT[kingSq]) & unchecked(attackedBy[t | KNIGHT]);
  const bishopChecks = bishopRays & theirB;
  const rookChecks = rookRays & theirR;
  const queenChecks = (bishopRays | rookRays) & theirQ;

  // the endgame half is the eval's largest packed half; its values' scale keeps it within i16 (README, Packed eval)
  let sum = unchecked(zoneWeight[us]) + unchecked(safetyOf[us]) + S(SAFETY_OFFSET_MG, SAFETY_OFFSET_EG);
  sum += S(SAFETY_ATTACK_MG, SAFETY_ATTACK_EG) * unchecked(zoneAttacks[us]);
  sum += S(SAFETY_WEAK_MG, SAFETY_WEAK_EG) * <i32>popcnt(weak & unchecked(kingArea[us]));
  if (!enemyQueens) sum += S(SAFETY_NO_QUEEN_MG, SAFETY_NO_QUEEN_EG);
  sum += S(SAFETY_CHECK_QUEEN_MG, SAFETY_CHECK_QUEEN_EG) * <i32>popcnt(queenChecks & safe);
  sum += S(SAFETY_CHECK_ROOK_MG, SAFETY_CHECK_ROOK_EG) * <i32>popcnt(rookChecks & safe);
  sum += S(SAFETY_CHECK_BISHOP_MG, SAFETY_CHECK_BISHOP_EG) * <i32>popcnt(bishopChecks & safe);
  sum += S(SAFETY_CHECK_KNIGHT_MG, SAFETY_CHECK_KNIGHT_EG) * <i32>popcnt(knightChecks & safe);
  const checks = (knightChecks | bishopChecks | rookChecks | queenChecks) & ~bb[t];
  sum += S(SAFETY_UNSAFE_MG, SAFETY_UNSAFE_EG) * <i32>popcnt(checks & ~safe);
  sum +=
    S(SAFETY_FLANK_ATTACK_MG, SAFETY_FLANK_ATTACK_EG) * flankAttacks +
    S(SAFETY_FLANK_ATTACK2_MG, SAFETY_FLANK_ATTACK2_EG) * flankAttacks2;
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

/**
 * Each passer's room to advance (Ethereal 12.75 evaluatePassed), rook behind
 * (Weiss c735b8f EvalPassedPawns), defended stop & enemy major behind (Sirius
 * ideas, no constants taken), and rule of the square (Weiss 3e95de9 PassedSquare,
 * vendor/cpw/pages/Rule_of_the_Square.wiki).
 * Features: Passed_Pawn, Tarrasch_Rule, Rule_of_the_Square.
 */
@inline function passers(us: i32, occ: u64, theirKing: i32): i32 {
  const mine = unchecked(passedOf[us]);
  if (!mine) return 0;
  const them = us ^ 1;
  const o = us << 3;
  const t = them << 3;
  const enemy = bb[t];
  const ourAtt = unchecked(attacked[us]);
  const theirAtt = unchecked(attacked[them]);
  const enemyNoPieces = (enemy ^ bb[t | KING] ^ bb[t | PAWN]) == 0;
  const enemyToMove = side == them ? 1 : 0;
  let v = 0;
  let b = mine;
  while (b) {
    const s = <i32>ctz(b);
    const here = bit(s);
    const stop = up(here, us);
    const cell = ((stop & occ ? 0 : 2) + (stop & theirAtt ? 0 : 1)) * 8 + relRank(s, us);
    v += S(unchecked(PASSED_ADVANCE_MG[cell]), unchecked(PASSED_ADVANCE_EG[cell]));
    if (stop & ourAtt) v += S(PASSED_DEFENDED_STOP_MG, PASSED_DEFENDED_STOP_EG);
    const ahead = unchecked(FORWARD[(us << 6) + s]);
    if (!((ahead | here) & (enemy | theirAtt))) v += S(PASSED_SAFE_PATH_MG, PASSED_SAFE_PATH_EG);
    const behindFile = unchecked(FORWARD[(them << 6) + s]);
    if (behindFile & bb[o | ROOK]) v += S(PASSED_ROOK_BEHIND_MG, PASSED_ROOK_BEHIND_EG);
    if (behindFile & (bb[t | ROOK] | bb[t | QUEEN])) v += S(PASSED_ENEMY_ROOK_BEHIND_MG, PASSED_ENEMY_ROOK_BEHIND_EG);
    if (enemyNoPieces) {
      const promoSq = us == 0 ? 56 + (s & 7) : s & 7;
      if (min(5, distance(s, promoSq)) < distance(theirKing, promoSq) - enemyToMove) v += S(0, PASSED_SQUARE_EG);
    }
    b &= b - 1;
  }
  return v;
}

// ---------------------------------------------------------------- threats

/**
 * Threats against a color's pieces, and its safe pushes that attack non-pawn
 * pieces, Ethereal 12.75 evaluateThreats.
 * Features: Hanging_Piece, Overloading, Threat_by_Pawn_Push.
 */
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

  // squares a safe push reaches, single or double, and the enemy non-pawn pieces it would then attack
  const third = us == 0 ? RANK_1 << 16 : RANK_1 << 40;
  let push = up(pawns, us) & ~occ;
  push |= up(push & ~byPawns & third, us) & ~occ;
  push &= ~byPawns & (ours1 | ~theirs1);
  const pushAttacks = pawnAttacks(push, us) & bb[t] & ~bb[t | PAWN] & ~unchecked(attackedBy[o | PAWN]);

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
export function pieceTerms(wk: i32, bk: i32, pawns: u64, phase: i32): i32 {
  const occ = bb[0] | bb[8];
  const wp = bb[PAWN];
  const bp = bb[8 | PAWN];
  const wL = (wp << 7) & ~FILE_H;
  const wR = (wp << 9) & ~FILE_A;
  const bL = (bp >> 9) & ~FILE_H;
  const bR = (bp >> 7) & ~FILE_A;
  const wpAtt = wL | wR;
  const bpAtt = bL | bR;
  const wpAtt2 = wL & wR;
  const bpAtt2 = bL & bR;
  const wkAtt = unchecked(KING_ATT[wk]);
  const bkAtt = unchecked(KING_ATT[bk]);
  unchecked((attackedBy[PAWN] = wpAtt));
  unchecked((attackedBy[8 | PAWN] = bpAtt));
  unchecked((attackedBy[KING] = wkAtt));
  unchecked((attackedBy[8 | KING] = bkAtt));
  unchecked((attacked[0] = wpAtt | wkAtt));
  unchecked((attacked2[0] = wpAtt & wkAtt));
  unchecked((attacked[1] = bpAtt | bkAtt));
  unchecked((attacked2[1] = bpAtt & bkAtt));
  // mobility area, Stash 37 evaldata_init_next: no enemy pawn attacks, own king, or own pawn that is blocked or on
  // its low ranks. Feature: Mobility.
  const wBlocked = wp & (occ >> 8);
  const bBlocked = bp & (occ << 8);
  unchecked((mobility[0] = ~(bpAtt | bit(wk) | wBlocked | (wp & ((RANK_1 << 8) | (RANK_1 << 16))))));
  unchecked((mobility[1] = ~(wpAtt | bit(bk) | bBlocked | (bp & ((RANK_1 << 40) | (RANK_1 << 48))))));
  unchecked((rammed[0] = wp & (bp >> 8)));
  unchecked((rammed[1] = bp & (wp << 8)));
  unchecked((behindPawn[0] = pawns >> 8));
  unchecked((behindPawn[1] = pawns << 8));
  const wArea = unchecked(KING_AREA[wk]);
  const bArea = unchecked(KING_AREA[64 + bk]);
  unchecked((kingArea[0] = wArea));
  unchecked((kingArea[1] = bArea));
  unchecked((kingZone[0] = wArea & ~wpAtt2));
  unchecked((kingZone[1] = bArea & ~bpAtt2));
  // a color's pawns count on the other's king's area once both areas are set
  unchecked((zoneAttacks[1] = <i32>popcnt(wpAtt & bArea)));
  unchecked((zoneAttacks[0] = <i32>popcnt(bpAtt & wArea)));
  unchecked((zoneAttackers[0] = 0));
  unchecked((zoneAttackers[1] = 0));
  unchecked((zoneWeight[0] = 0));
  unchecked((zoneWeight[1] = 0));

  const wBlockedC = <i32>popcnt(wBlocked & CENTRAL_FILES);
  const bBlockedC = <i32>popcnt(bBlocked & CENTRAL_FILES);
  let v = knights(0, wk, bk) - knights(1, bk, wk);
  v += bishops(0, occ, pawns, wBlockedC) - bishops(1, occ, pawns, bBlockedC);
  v += rooks(0, occ, wk) - rooks(1, occ, bk);
  v += queens(0, occ) - queens(1, occ);
  if (phase >= 18) {
    const blockedPawns = <i32>popcnt((wp << 8) & (bp | bpAtt2)) + <i32>popcnt((bp >> 8) & (wp | wpAtt2));
    v += space(0, blockedPawns) - space(1, blockedPawns);
  }
  v += passers(0, occ, bk) - passers(1, occ, wk);
  v += threats(0, occ) - threats(1, occ);
  kingSafetyMg = 0;
  kingSafetyEg = 0;
  v += kingSafety(0, occ, wk) - kingSafety(1, occ, bk);
  return v;
}
