/**
 * The search's make and unmake: the core's, with the packed material and PSQT sum
 * and the correction keys kept beside them. A move's change to each is read from
 * the board before the core makes it; unmake restores what was saved at the ply.
 */
import { BISHOP, FLAG_CASTLE, FLAG_EP, KING, KNIGHT, MAX_PLY, PAWN, QUEEN, ROOK, moveFrom, movePromo, moveTo } from "../../core/constants";
import { ROOK_SQ, board, castleIndex, make, makeNull, ply, unmake, unmakeNull } from "../../core/position";
import { Z_PIECE } from "../../core/zobrist";
import { PSQ, scratchPsq } from "./eval";

/** the board's packed material and PSQT sum, White's view */
export let psq: i32 = 0;
const psqStack = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + 1)));

/** the pawns of both colors, hashed with the core's piece keys (Stockfish 15 Position::set_state pawnKey) */
export let pawnKey: u64 = 0;
/** by color, that color's knights, bishops, rooks and queens (Stash dcc25ed nonpawn_key; Stockfish 7cdd5e89 Position::set_state nonPawnKey also hashes the king) */
export const nonPawnKey = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 2));
/** both colors' knights and bishops, and both kings (Stash ba73642 minor_key, the kings added where it reads the key) */
export let minorKey: u64 = 0;
/** both colors' rooks and queens, and both kings (Stash ea9fd72 major_key, likewise) */
export let majorKey: u64 = 0;
/** the pawn key, the two non-pawn keys, the minor and the major key, saved per ply */
const KEYS = 5;
const keyStack = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * (KEYS * (MAX_PLY + 1))));

/** piece-type bits: knights, bishops and kings; rooks, queens and kings */
const MINOR_TYPES = (1 << KNIGHT) | (1 << BISHOP) | (1 << KING);
const MAJOR_TYPES = (1 << ROOK) | (1 << QUEEN) | (1 << KING);

/** sets the sum and the keys from the board, at a search's root */
export function refresh(): void {
  psq = scratchPsq();
  pawnKey = scratchPawnKey();
  unchecked((nonPawnKey[0] = scratchNonPawnKey(0)));
  unchecked((nonPawnKey[1] = scratchNonPawnKey(1)));
  minorKey = scratchTypesKey(MINOR_TYPES);
  majorKey = scratchTypesKey(MAJOR_TYPES);
}

/** sets the pawn key to one saved from this position, for the eval bench */
export function setPawnKey(key: u64): void {
  pawnKey = key;
}

/** the minor key, from the board */
export function scratchMinorKey(): u64 {
  return scratchTypesKey(MINOR_TYPES);
}

/** the major key, from the board */
export function scratchMajorKey(): u64 {
  return scratchTypesKey(MAJOR_TYPES);
}

/** both colors' pieces of the types set in `types`, hashed */
function scratchTypesKey(types: i32): u64 {
  let k: u64 = 0;
  for (let s = 0; s < 64; s++) {
    const p = <i32>board[s];
    if (p && (types >> (p & 7)) & 1) k ^= unchecked(Z_PIECE[(p << 6) + s]);
  }
  return k;
}

/** the pawn key, from the board */
export function scratchPawnKey(): u64 {
  let k: u64 = 0;
  for (let s = 0; s < 64; s++) {
    const p = <i32>board[s];
    if ((p & 7) == PAWN) k ^= unchecked(Z_PIECE[(p << 6) + s]);
  }
  return k;
}

/** a color's non-pawn key, from the board */
export function scratchNonPawnKey(color: i32): u64 {
  let k: u64 = 0;
  for (let s = 0; s < 64; s++) {
    const p = <i32>board[s];
    const t = p & 7;
    if (t != 0 && t != PAWN && t != KING && p >> 3 == color) k ^= unchecked(Z_PIECE[(p << 6) + s]);
  }
  return k;
}

@inline function at(p: i32, s: i32): i32 {
  return unchecked(PSQ[(p << 6) + s]);
}

/** adds or removes piece `p` on square `s` in each key that holds it */
@inline function toggleKey(p: i32, s: i32): void {
  const t = p & 7;
  const z = unchecked(Z_PIECE[(p << 6) + s]);
  if (t == PAWN) pawnKey ^= z;
  else if (t != KING) unchecked((nonPawnKey[p >> 3] ^= z));
  if ((MINOR_TYPES >> t) & 1) minorKey ^= z;
  if ((MAJOR_TYPES >> t) & 1) majorKey ^= z;
}

@inline function saveKeys(): void {
  const i = ply * KEYS;
  unchecked((keyStack[i] = pawnKey));
  unchecked((keyStack[i + 1] = nonPawnKey[0]));
  unchecked((keyStack[i + 2] = nonPawnKey[1]));
  unchecked((keyStack[i + 3] = minorKey));
  unchecked((keyStack[i + 4] = majorKey));
}

@inline function restoreKeys(): void {
  const i = ply * KEYS;
  pawnKey = unchecked(keyStack[i]);
  unchecked((nonPawnKey[0] = keyStack[i + 1]));
  unchecked((nonPawnKey[1] = keyStack[i + 2]));
  minorKey = unchecked(keyStack[i + 3]);
  majorKey = unchecked(keyStack[i + 4]);
}

export function doMove(m: i32): void {
  unchecked((psqStack[ply] = psq));
  saveKeys();
  const from = moveFrom(m);
  const to = moveTo(m);
  const piece = <i32>board[from];
  if (m & FLAG_CASTLE) {
    // the core's castling (core/position.ts make): the rook from its square to the one beside the king's
    // destination; in Chess960 the king's destination may hold that rook, so nothing is captured
    const rf = <i32>ROOK_SQ[castleIndex(to)];
    const rt = (to & 7) == 6 ? to - 1 : to + 1;
    const rook = <i32>board[rf];
    psq += at(piece, to) - at(piece, from) + at(rook, rt) - at(rook, rf);
    toggleKey(piece, from);
    toggleKey(piece, to);
    toggleKey(rook, rf);
    toggleKey(rook, rt);
    make(m);
    return;
  }
  const captured = <i32>board[to];
  const promo = movePromo(m);
  const arrives = promo ? (piece & 8) | promo : piece;
  let d = at(arrives, to) - at(piece, from);
  toggleKey(piece, from);
  toggleKey(arrives, to);
  if (captured) {
    d -= at(captured, to);
    toggleKey(captured, to);
  }
  if (m & FLAG_EP) {
    const cs = to ^ 8;
    const victim = <i32>board[cs];
    d -= at(victim, cs);
    toggleKey(victim, cs);
  }
  psq += d;
  make(m);
}

export function undoMove(m: i32): void {
  unmake(m);
  psq = unchecked(psqStack[ply]);
  restoreKeys();
}

/** a null move changes no piece, so the keys stand */
export function doNull(): void {
  unchecked((psqStack[ply] = psq));
  makeNull();
}

export function undoNull(): void {
  unmakeNull();
  psq = unchecked(psqStack[ply]);
}
