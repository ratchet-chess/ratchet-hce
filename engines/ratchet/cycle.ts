/**
 * Upcoming repetition: whether the side to move has a move into a position the hash history already holds. The
 * child of that move returns the draw score (the core's isRepetition), so the node is worth at least a draw.
 *
 * The method is Marcel van Kervinck's (A fast software-based method for upcoming cycle detection in search trees,
 * 2013): two positions an odd number of plies apart differ by one reversible move when the xor of their hashes is
 * that move's key, and a cuckoo table maps each such key to its move. The walk is Stockfish 6b782211
 * Position::upcoming_repetition's: it first xors the opponent's moves over the span, and looks a key up only where
 * they cancel. So the piece that differs is the mover's own.
 *
 * Forms not taken:
 * - Stockfish 91a76331 Position::has_game_cycle also answers when the opponent could have reached this position a
 *   move sooner ("no progress"), which is no draw for the side to move. Weiss fe8e513 HasCycle and Stash 079fcba
 *   game_has_cycle keep that case inside the tree.
 * - Incipit be29d4f draws on a single match at the root itself; this walk follows Stockfish 6b782211
 *   Position::upcoming_repetition and Stash 079fcba game_has_cycle, asking for a second occurrence when the earlier
 *   position is at or before the root.
 * - Weiss 073eda5 AlphaBeta tests only a move that takes the last one back, with no table.
 *
 * Feature: Upcoming_Repetition_Detection.
 */
import { moveFrom, moveTo, BISHOP, KING, KNIGHT, QUEEN, ROOK } from "../../core/constants";
import { bb, halfmove, hash, hashBack, pliesKept, ply } from "../../core/position";
import { KING_ATT, KNIGHT_ATT, bishopAttacks, bit, rookAttacks } from "../../core/tables";
import { Z_PIECE, Z_SIDE } from "../../core/zobrist";

const SLOTS = 8192;
const SLOT_MASK: u64 = SLOTS - 1;
/** an insert that displaces this many entries has met a loop, and its last entry is dropped: Ratchet's guard */
const KICKS_MAX = 512;

/** a reversible move's key: its piece on both squares and the side to move; 0 marks an empty slot */
const cycleKey = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * SLOTS));
/** the squares strictly between the move's two squares, which must be empty for it to be playable */
const cyclePath = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * SLOTS));
/** the move's two squares, the lower in the low six bits */
const cycleSquares = changetype<StaticArray<u16>>(memory.data(sizeof<u16>() * SLOTS));

@inline function slot1(key: u64): i32 {
  return <i32>(key & SLOT_MASK);
}

@inline function slot2(key: u64): i32 {
  return <i32>((key >> 16) & SLOT_MASK);
}

/** fills the table from the core's keys and returns how many moves it holds (3668 unless an insert looped) */
export function initCycle(): i32 {
  for (let i = 0; i < SLOTS; i++) cycleKey[i] = 0;
  let placed = 0;
  for (let color = 0; color < 2; color++) {
    for (let type = KNIGHT; type <= KING; type++) {
      const code = (color << 3) | type;
      for (let a = 0; a < 64; a++) {
        for (let b = a + 1; b < 64; b++) {
          const onLine = (rookAttacks(a, 0) & bit(b)) != 0;
          const onDiagonal = (bishopAttacks(a, 0) & bit(b)) != 0;
          let reaches = false;
          if (type == KNIGHT) reaches = (KNIGHT_ATT[a] & bit(b)) != 0;
          else if (type == KING) reaches = (KING_ATT[a] & bit(b)) != 0;
          else if (type == BISHOP) reaches = onDiagonal;
          else if (type == ROOK) reaches = onLine;
          else if (type == QUEEN) reaches = onLine || onDiagonal;
          if (!reaches) continue;

          let path: u64 = 0;
          if (type != KNIGHT && type != KING) {
            path = onLine
              ? rookAttacks(a, bit(b)) & rookAttacks(b, bit(a))
              : bishopAttacks(a, bit(b)) & bishopAttacks(b, bit(a));
          }
          let key = Z_PIECE[code * 64 + a] ^ Z_PIECE[code * 64 + b] ^ Z_SIDE;
          let squares: u16 = <u16>(a | (b << 6));
          let i = slot1(key);
          let kicks = 0;
          for (; kicks < KICKS_MAX; kicks++) {
            const k = cycleKey[i];
            const p = cyclePath[i];
            const s = cycleSquares[i];
            cycleKey[i] = key;
            cyclePath[i] = path;
            cycleSquares[i] = squares;
            if (k == 0) break;
            key = k;
            path = p;
            squares = s;
            i = i == slot1(key) ? slot2(key) : slot1(key);
          }
          if (kicks < KICKS_MAX) placed++;
        }
      }
    }
  }
  return placed;
}

/**
 * True if a move of the side to move, other than `excluded` (0 for none), reaches a position within the repetition
 * scan's span. The move is legal: its result is a position that stood on the board with the same side to move.
 */
export function upcomingRepetition(excluded: i32): bool {
  const end = min(halfmove, pliesKept());
  if (end < 3) return false;
  const now = hash;
  // the opponent's moves over the span, xored together; each pair of positions differs by one of them
  let theirs = now ^ hashBack(1) ^ Z_SIDE;
  for (let i = 3; i <= end; i += 2) {
    const then = hashBack(i);
    theirs ^= hashBack(i - 1) ^ then ^ Z_SIDE;
    if (theirs != 0) continue;
    const key = now ^ then;
    let j = slot1(key);
    if (cycleKey[j] != key) {
      j = slot2(key);
      if (cycleKey[j] != key) continue;
    }
    const occupied = bb[0] | bb[8];
    if (cyclePath[j] & occupied) continue;
    if (excluded != 0) {
      const a = <i32>cycleSquares[j] & 63;
      const b = <i32>cycleSquares[j] >> 6;
      const from = occupied & bit(a) ? a : b;
      if (moveFrom(excluded) == from && moveTo(excluded) == a + b - from) continue;
    }
    if (ply <= i) {
      // the matched position is at or before the root, so a draw needs an earlier occurrence
      // (Stockfish 6b782211). Feature: Upcoming_Repetition_Detection.
      let repeated = false;
      for (let k = i + 4; k <= end; k += 2) {
        if (hashBack(k) == then) {
          repeated = true;
          break;
        }
      }
      if (!repeated) continue;
    }
    return true;
  }
  return false;
}
