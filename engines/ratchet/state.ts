/**
 * The search's make and unmake: the core's, with the packed material and PSQT sum
 * and the correction keys kept beside them. A move's change to each is read from
 * the board before the core makes it; unmake restores what was saved at the ply.
 */
import { FLAG_CASTLE, FLAG_EP, KING, MAX_PLY, PAWN, moveFrom, movePromo, moveTo } from "../../core/constants";
import { board, make, makeNull, ply, unmake, unmakeNull } from "../../core/position";
import { Z_PIECE } from "../../core/zobrist";
import { PSQ, scratchPsq } from "./eval";

/** the board's packed material and PSQT sum, White's view */
export let psq: i32 = 0;
const psqStack = new StaticArray<i32>(MAX_PLY + 1);

/** the pawns of both colors, hashed with the core's piece keys (Stockfish Position::set_state pawnKey) */
export let pawnKey: u64 = 0;
/** by color, that color's knights, bishops, rooks and queens (Stash dcc25ed nonpawn_key; Stockfish's nonPawnKey also hashes the king) */
export const nonPawnKey = new StaticArray<u64>(2);
/** pawn key, then the two non-pawn keys, saved per ply */
const keyStack = new StaticArray<u64>(3 * (MAX_PLY + 1));

/** sets the sum and the keys from the board, at a search's root */
export function refresh(): void {
  psq = scratchPsq();
  pawnKey = scratchPawnKey();
  unchecked((nonPawnKey[0] = scratchNonPawnKey(0)));
  unchecked((nonPawnKey[1] = scratchNonPawnKey(1)));
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

/** adds or removes piece `p` on square `s` in its key; a king is in none */
@inline function toggleKey(p: i32, s: i32): void {
  const t = p & 7;
  if (t == KING) return;
  const z = unchecked(Z_PIECE[(p << 6) + s]);
  if (t == PAWN) pawnKey ^= z;
  else unchecked((nonPawnKey[p >> 3] ^= z));
}

@inline function saveKeys(): void {
  const i = ply * 3;
  unchecked((keyStack[i] = pawnKey));
  unchecked((keyStack[i + 1] = nonPawnKey[0]));
  unchecked((keyStack[i + 2] = nonPawnKey[1]));
}

@inline function restoreKeys(): void {
  const i = ply * 3;
  pawnKey = unchecked(keyStack[i]);
  unchecked((nonPawnKey[0] = keyStack[i + 1]));
  unchecked((nonPawnKey[1] = keyStack[i + 2]));
}

export function doMove(m: i32): void {
  unchecked((psqStack[ply] = psq));
  saveKeys();
  const from = moveFrom(m);
  const to = moveTo(m);
  const piece = <i32>board[from];
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
  } else if (m & FLAG_CASTLE) {
    // the core's castling: the rook from the corner to the square the king crossed
    const rf = to > from ? from + 3 : from - 4;
    const rt = to > from ? from + 1 : from - 1;
    const rook = <i32>board[rf];
    d += at(rook, rt) - at(rook, rf);
    toggleKey(rook, rf);
    toggleKey(rook, rt);
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
