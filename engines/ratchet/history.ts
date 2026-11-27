/**
 * Move-ordering memory: one killer per ply (Weiss 0d00a00 UpdateQuietHistory), butterfly history by
 * side, from and to and by whether each of those squares is attacked, 1-, 2-, 4- and
 * 6-ply continuation history by the previous moves' piece and square, pawn history
 * by pawn structure, piece and square, and capture history by piece, square and
 * victim. A history entry moves by gravity, entry += bonus - entry * |bonus| / 16384
 * (Ethereal 0e47e9b update_history), so it stays within +-16384; a continuation entry decays
 * against its move's average entry instead (gravityFrom), and a pawn-history entry
 * stays within its own limit.
 *
 * The tables last between moves of a game (Stockfish 946fa476 id_loop) and are emptied
 * by newGame; a fresh go() empties them too, so a node signature starts clean.
 *
 * Features: Killer_Heuristic, History_Heuristic, Threat_History, Pawn_History.
 * Features: History_Heuristic#Continuation_History, History_Heuristic#Capture_History.
 */
import { BISHOP, KING, KNIGHT, MAX_PLY, PAWN, QUEEN, ROOK, moveFrom, moveTo } from "../../core/constants";
import { bb, hash, side } from "../../core/position";
import { KING_ATT, KNIGHT_ATT, bishopAttacks, rookAttacks } from "../../core/tables";
import {
  CAPTURE_THREATS,
  HIST_BONUS_MAX,
  HIST_BONUS_MUL,
  HIST_BONUS_SUB,
  HIST_MALUS_MAX,
  HIST_MALUS_MUL,
  HIST_MALUS_SUB,
  HIST_PAWN_MAX,
  THREAT_HISTORY,
} from "./params";
import { pawnAttacks } from "./geometry";
import { pawnKey } from "./state";

export const HIST_MAX = 16384;

/** (from attacked << 1 | to attacked) * 8192 + side * 4096 + (from | to << 6); butterflyIndex gives it */
export const butterfly = changetype<StaticArray<i16>>(memory.data(sizeof<i16>() * 4 * 2 * 4096));
/** pawn structures told apart, Stockfish b0658f09 PAWN_HISTORY_SIZE. Feature: Pawn_History. */
const PAWN_STRUCTURES = 512;
/** (pawn key's low bits) << 10 | (piece << 6 | square); pawnHistIndex gives it. 1 MiB */
export const pawnHist = changetype<StaticArray<i16>>(memory.data(sizeof<i16>() * PAWN_STRUCTURES * 1024));
/** a ply's attacked squares and the position they were made for, so a node makes them once */
const threatSet = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * (MAX_PLY + 2)));
const threatKey = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * (MAX_PLY + 2)));
/** (previous piece << 6 | its square) << 10 | (piece << 6 | square): 16 piece codes, so 2 MiB */
export const contHist = changetype<StaticArray<i16>>(memory.data(sizeof<i16>() * 1024 * 1024));
/**
 * (from attacked << 1 | to attacked) << 13 | (piece << 6 | square) << 3 | victim type;
 * the attacked bits are 0 without CAPTURE_THREATS.
 */
export const captureHist = changetype<StaticArray<i16>>(memory.data(sizeof<i16>() * 4 * 16 * 64 * 8));
/** one killer per ply, with room for the child of the deepest ply */
export const killers = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + 2)));

export function clearHistory(): void {
  for (let i = 0; i < 4 * 2 * 4096; i++) unchecked((butterfly[i] = 0));
  for (let i = 0; i < PAWN_STRUCTURES * 1024; i++) unchecked((pawnHist[i] = 0));
  // no position hashes to all ones in practice, and a false match would only reuse a stale set for one node
  for (let i = 0; i < MAX_PLY + 2; i++) unchecked((threatKey[i] = ~(<u64>0)));
  for (let i = 0; i < 1024 * 1024; i++) unchecked((contHist[i] = 0));
  for (let i = 0; i < 4 * 16 * 64 * 8; i++) unchecked((captureHist[i] = 0));
  for (let i = 0; i < MAX_PLY + 2; i++) unchecked((killers[i] = 0));
}

/** the bonus for the move that cut at `depth`, Weiss c735b8f Bonus. Feature: History_Heuristic. */
@inline export function bonusAt(depth: i32): i32 {
  return min(HIST_BONUS_MAX, max(0, HIST_BONUS_MUL * depth - HIST_BONUS_SUB));
}

/** the malus for each move tried before it */
@inline export function malusAt(depth: i32): i32 {
  return min(HIST_MALUS_MAX, max(0, HIST_MALUS_MUL * depth - HIST_MALUS_SUB));
}

@inline export function gravity(table: StaticArray<i16>, i: i32, bonus: i32): void {
  const e = <i32>unchecked(table[i]);
  unchecked((table[i] = <i16>(e + bonus - (e * abs(bonus)) / HIST_MAX)));
}

/** gravity within `limit` instead of HIST_MAX; |bonus| stays under the limit */
@inline export function gravityWithin(table: StaticArray<i16>, i: i32, bonus: i32, limit: i32): void {
  const e = <i32>unchecked(table[i]);
  unchecked((table[i] = <i16>(e + bonus - (e * abs(bonus)) / limit)));
}

/**
 * Every square the opponent attacks, x-rays not counted (Ethereal 341c43f allAttackedSquares), for the node at `p`:
 * made on first use and kept while the ply stays at this position, so its singular search and each later move reuse it.
 * Feature: Threat_History.
 */
@inline export function attackedAt(p: i32): u64 {
  if (unchecked(threatKey[p]) == hash) return unchecked(threatSet[p]);
  return makeThreats(p);
}

/** the set that keys the butterfly table: attackedAt, or 0 when THREAT_HISTORY is off. Feature: Threat_History. */
@inline export function threatsAt(p: i32): u64 {
  return THREAT_HISTORY == 0 ? 0 : attackedAt(p);
}

/**
 * The set that keys capture history: attackedAt, or 0 when CAPTURE_THREATS is off.
 * Feature: History_Heuristic#Capture_History.
 */
@inline export function captureThreatsAt(p: i32): u64 {
  return CAPTURE_THREATS == 0 ? 0 : attackedAt(p);
}

/** makes and keeps the set attackedAt returns; apart from it so that a kept set costs its callers no call */
function makeThreats(p: i32): u64 {
  const c = (side ^ 1) << 3;
  const occ = unchecked(bb[0] | bb[8]);
  const pawns = unchecked(bb[c | PAWN]);
  let t = pawnAttacks(pawns, c >> 3);
  t |= unchecked(KING_ATT[<i32>ctz(bb[c | KING])]);
  let n = unchecked(bb[c | KNIGHT]);
  while (n) {
    t |= unchecked(KNIGHT_ATT[<i32>ctz(n)]);
    n &= n - 1;
  }
  const queens = unchecked(bb[c | QUEEN]);
  let d = unchecked(bb[c | BISHOP]) | queens;
  while (d) {
    t |= bishopAttacks(<i32>ctz(d), occ);
    d &= d - 1;
  }
  let r = unchecked(bb[c | ROOK]) | queens;
  while (r) {
    t |= rookAttacks(<i32>ctz(r), occ);
    r &= r - 1;
  }
  unchecked((threatKey[p] = hash));
  unchecked((threatSet[p] = t));
  return t;
}

/** a quiet's butterfly entry for the side to move, given the node's attacked squares */
@inline export function butterflyIndex(m: i32, threats: u64): i32 {
  const bits = (<i32>((threats >> <u64>moveFrom(m)) & 1) << 1) | <i32>((threats >> <u64>moveTo(m)) & 1);
  return (bits << 13) | (side << 12) | (m & 4095);
}

/** the node's pawn-history row offset */
@inline export function pawnHistRow(): i32 {
  return (<i32>pawnKey & (PAWN_STRUCTURES - 1)) << 10;
}

/** a quiet's pawn-history entry: `pt` is its piece and square, as pieceTo gives them */
@inline export function pawnHistIndex(pt: i32): i32 {
  return pawnHistRow() | pt;
}

/** moves a quiet's pawn-history entry by `bonus` */
@inline export function rewardPawn(pt: i32, bonus: i32): void {
  gravityWithin(pawnHist, pawnHistIndex(pt), bonus, HIST_PAWN_MAX);
}

/**
 * Gravity against `base` instead of the entry itself, clamped to +-HIST_MAX
 * (Stash 93a6d5f update_piece_hist_entry).
 * Feature: History_Heuristic#Continuation_History.
 */
@inline export function gravityFrom(table: StaticArray<i16>, i: i32, base: i32, bonus: i32): void {
  const e = <i32>unchecked(table[i]) + bonus - (base * abs(bonus)) / HIST_MAX;
  unchecked((table[i] = <i16>max(-HIST_MAX, min(HIST_MAX, e))));
}
