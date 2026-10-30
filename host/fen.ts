/**
 * FEN reading and writing, through a representation-neutral record, shared by every board
 * representation so they all read positions the same way.
 *
 * Square index is rank * 8 + file, a1 = 0. Piece code is (color << 3) | type.
 */

export const WHITE = 0;
export const BLACK = 1;

export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export interface ParsedFen {
  /** piece code per square, 0 for empty */
  board: Uint8Array;
  side: number;
  castling: number;
  /** en-passant target square, or -1 */
  ep: number;
  /** plies since the last capture or pawn move */
  halfmove: number;
  /** the full-move number, from 1 */
  fullmove: number;
}

const FEN_PIECES = "pnbrqk";

export function parseFen(fen: string): ParsedFen {
  const [placement, side, castling, ep, halfmove, fullmove] = fen.trim().split(/\s+/);
  const board = new Uint8Array(64);
  let rank = 7;
  let file = 0;
  for (const ch of placement) {
    if (ch === "/") {
      rank--;
      file = 0;
    } else if (ch >= "1" && ch <= "8") {
      file += ch.charCodeAt(0) - 48;
    } else {
      const type = FEN_PIECES.indexOf(ch.toLowerCase()) + 1;
      if (type === 0) throw new Error(`bad FEN piece '${ch}' in ${fen}`);
      const color = ch === ch.toLowerCase() ? BLACK : WHITE;
      board[rank * 8 + file] = (color << 3) | type;
      file++;
    }
  }
  let rights = 0;
  for (const ch of castling ?? "-") {
    if (ch === "K") rights |= CASTLE_WK;
    else if (ch === "Q") rights |= CASTLE_WQ;
    else if (ch === "k") rights |= CASTLE_BK;
    else if (ch === "q") rights |= CASTLE_BQ;
  }
  const epSq = ep && ep !== "-" ? (ep.charCodeAt(1) - 49) * 8 + (ep.charCodeAt(0) - 97) : -1;
  return { board, side: side === "b" ? BLACK : WHITE, castling: rights, ep: epSq, halfmove: Number(halfmove ?? 0) || 0, fullmove: Number(fullmove ?? 1) || 1 };
}

/** the FEN of `f` */
export function formatFen(f: ParsedFen): string {
  const ranks: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = "";
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = f.board[rank * 8 + file];
      if (!p) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      const ch = FEN_PIECES[(p & 7) - 1];
      row += p >> 3 ? ch : ch.toUpperCase();
    }
    ranks.push(empty ? row + empty : row);
  }
  let rights = "";
  if (f.castling & CASTLE_WK) rights += "K";
  if (f.castling & CASTLE_WQ) rights += "Q";
  if (f.castling & CASTLE_BK) rights += "k";
  if (f.castling & CASTLE_BQ) rights += "q";
  const ep = f.ep < 0 ? "-" : "abcdefgh"[f.ep & 7] + ((f.ep >> 3) + 1);
  return `${ranks.join("/")} ${f.side ? "b" : "w"} ${rights || "-"} ${ep} ${f.halfmove} ${f.fullmove}`;
}
