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
  /**
   * each right's rook square, in the order of the rights' bits (K, Q, k, q), -1 where the right is absent. A Chess960
   * start puts the rooks on any file; parseFen fills it, and a record without it is read as a standard start.
   */
  rooks?: number[];
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
  // KQkq as X-FEN reads it, the outermost rook on that side of the king, which is the corner's in a standard start;
  // a file letter as Shredder-FEN reads it, the rook on that file, its side by the king's file
  let rights = 0;
  const rooks = [-1, -1, -1, -1];
  for (const ch of castling ?? "-") {
    const color = ch === ch.toLowerCase() ? BLACK : WHITE;
    const lower = ch.toLowerCase();
    const k = kingFile(board, color);
    let i = -1;
    let sq = -1;
    if (lower === "k" || lower === "q") {
      i = (color << 1) | (lower === "q" ? 1 : 0);
      sq = outerRook(board, color, i & 1 ? -1 : 1, k);
    } else if (lower >= "a" && lower <= "h") {
      const file = lower.charCodeAt(0) - 97;
      i = (color << 1) | (file < k ? 1 : 0);
      sq = color * 56 + file;
    }
    if (i < 0) continue;
    rights |= 1 << i;
    rooks[i] = sq;
  }
  const epSq = ep && ep !== "-" ? (ep.charCodeAt(1) - 49) * 8 + (ep.charCodeAt(0) - 97) : -1;
  return {
    board, side: side === "b" ? BLACK : WHITE, castling: rights, ep: epSq, halfmove: Number(halfmove ?? 0) || 0,
    fullmove: Number(fullmove ?? 1) || 1, rooks,
  };
}

/** the file of `color`'s king on its back rank, the e-file if it is elsewhere */
function kingFile(board: Uint8Array, color: number): number {
  for (let f = 0; f < 8; f++) if (board[color * 56 + f] === ((color << 3) | KING)) return f;
  return 4;
}

/** the square of `color`'s outermost back-rank rook beyond the king's file in direction `dir`; the corner if none */
function outerRook(board: Uint8Array, color: number, dir: number, king: number): number {
  const rook = (color << 3) | ROOK;
  for (let f = dir > 0 ? 7 : 0; f !== king; f -= dir) if (board[color * 56 + f] === rook) return color * 56 + f;
  return color * 56 + (dir > 0 ? 7 : 0);
}

/** each present right's rook square, from `f.rooks` or, for a record without it, by X-FEN's reading of the board */
export function castleRooks(f: ParsedFen): number[] {
  if (f.rooks) return f.rooks.map((r, i) => (f.castling & (1 << i) ? r : -1));
  return [0, 1, 2, 3].map((i) => {
    if (!(f.castling & (1 << i))) return -1;
    const color = i >> 1;
    return outerRook(f.board, color, i & 1 ? -1 : 1, kingFile(f.board, color));
  });
}

/** the FEN of `f`; with `chess960`, its rights in Shredder-FEN, each as its rook's file */
export function formatFen(f: ParsedFen, chess960 = false): string {
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
  if (chess960) {
    castleRooks(f).forEach((r, i) => {
      if (r >= 0) rights += i >> 1 ? "abcdefgh"[r & 7] : "ABCDEFGH"[r & 7];
    });
  } else {
    if (f.castling & CASTLE_WK) rights += "K";
    if (f.castling & CASTLE_WQ) rights += "Q";
    if (f.castling & CASTLE_BK) rights += "k";
    if (f.castling & CASTLE_BQ) rights += "q";
  }
  const ep = f.ep < 0 ? "-" : "abcdefgh"[f.ep & 7] + ((f.ep >> 3) + 1);
  return `${ranks.join("/")} ${f.side ? "b" : "w"} ${rights || "-"} ${ep} ${f.halfmove} ${f.fullmove}`;
}
