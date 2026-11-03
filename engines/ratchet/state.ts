/**
 * The search's make and unmake: the core's, with the packed material and PSQT sum
 * kept beside them. A move's change to the sum is read from the board before the
 * core makes it; unmake restores the sum saved at the ply.
 */
import { FLAG_CASTLE, FLAG_EP, MAX_PLY, moveFrom, movePromo, moveTo } from "../../core/constants";
import { board, make, makeNull, ply, unmake, unmakeNull } from "../../core/position";
import { PSQ, scratchPsq } from "./eval";

/** the board's packed material and PSQT sum, White's view */
export let psq: i32 = 0;
const psqStack = new StaticArray<i32>(MAX_PLY + 1);

/** sets the sum from the board, at a search's root */
export function refresh(): void {
  psq = scratchPsq();
}

@inline function at(p: i32, s: i32): i32 {
  return unchecked(PSQ[(p << 6) + s]);
}

export function doMove(m: i32): void {
  unchecked((psqStack[ply] = psq));
  const from = moveFrom(m);
  const to = moveTo(m);
  const piece = <i32>board[from];
  const captured = <i32>board[to];
  let d = at(piece, to) - at(piece, from);
  if (captured) d -= at(captured, to);
  if (m & FLAG_EP) {
    const cs = to ^ 8;
    d -= at(<i32>board[cs], cs);
  } else if (m & FLAG_CASTLE) {
    // the core's castling: the rook from the corner to the square the king crossed
    const rf = to > from ? from + 3 : from - 4;
    const rt = to > from ? from + 1 : from - 1;
    const rook = <i32>board[rf];
    d += at(rook, rt) - at(rook, rf);
  }
  const promo = movePromo(m);
  if (promo) d += at((piece & 8) | promo, to) - at(piece, to);
  psq += d;
  make(m);
}

export function undoMove(m: i32): void {
  unmake(m);
  psq = unchecked(psqStack[ply]);
}

export function doNull(): void {
  unchecked((psqStack[ply] = psq));
  makeNull();
}

export function undoNull(): void {
  unmakeNull();
  psq = unchecked(psqStack[ply]);
}
