/**
 * 0x88 mailbox position: board state, make/unmake and attack detection.
 *
 * Square index is rank * 16 + file, a1 = 0, h8 = 0x77. A square is off-board iff
 * (sq & 0x88) !== 0; this also holds for the small negative indices that offsets
 * produce near rank 1, so no bounds check precedes the 0x88 test.
 */

import {
  BISHOP,
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
  parseFen,
} from "../../../host/fen.ts";

/** off-board (127 & 0x88 !== 0) and fits the Uint8Array undo stack */
export const NO_SQ = 127;

// Move layout: from (7 bits) | to << 7 | promo type << 14 | flags.
export const FLAG_EP = 1 << 17;
export const FLAG_CASTLE = 1 << 18;
export const FLAG_DOUBLE = 1 << 19;
const FLAG_SPECIAL = FLAG_EP | FLAG_CASTLE;

export const MAX_PLY = 128;

export const KNIGHT_OFFSETS = new Int8Array([33, 31, 18, 14, -14, -18, -31, -33]);
export const KING_OFFSETS = new Int8Array([17, 16, 15, 1, -1, -15, -16, -17]);
export const DIAG_OFFSETS = new Int8Array([17, 15, -15, -17]);
export const ORTHO_OFFSETS = new Int8Array([16, 1, -1, -16]);

/** castling rights kept after a move touches a square: rights &= CASTLE_MASK[sq] */
const CASTLE_MASK = new Uint8Array(128).fill(15);
CASTLE_MASK[0x00] = 15 & ~CASTLE_WQ;
CASTLE_MASK[0x07] = 15 & ~CASTLE_WK;
CASTLE_MASK[0x04] = 15 & ~(CASTLE_WK | CASTLE_WQ);
CASTLE_MASK[0x70] = 15 & ~CASTLE_BQ;
CASTLE_MASK[0x77] = 15 & ~CASTLE_BK;
CASTLE_MASK[0x74] = 15 & ~(CASTLE_BK | CASTLE_BQ);

export class Position {
  board = new Uint8Array(128);
  side = WHITE;
  castling = 0;
  ep = NO_SQ;
  ply = 0;
  kingSq = new Int32Array(2);

  // Undo stack, indexed by ply.
  private undoCaptured = new Uint8Array(MAX_PLY);
  private undoCastling = new Uint8Array(MAX_PLY);
  private undoEp = new Uint8Array(MAX_PLY);

  static fromFen(fen: string): Position {
    const f = parseFen(fen);
    const pos = new Position();
    for (let sq = 0; sq < 64; sq++) {
      const p = f.board[sq];
      const x = ((sq >> 3) << 4) | (sq & 7);
      pos.board[x] = p;
      if ((p & 7) === KING) pos.kingSq[p >> 3] = x;
    }
    pos.side = f.side;
    pos.castling = f.castling;
    if (f.ep >= 0) pos.ep = ((f.ep >> 3) << 4) | (f.ep & 7);
    return pos;
  }

  make(m: number): void {
    const b = this.board;
    const from = m & 0x7f;
    const to = (m >>> 7) & 0x7f;
    const side = this.side;
    const ply = this.ply;
    const piece = b[from];
    let captured = b[to];

    this.undoCastling[ply] = this.castling;
    this.undoEp[ply] = this.ep;

    b[to] = piece;
    b[from] = 0;

    if (m & FLAG_SPECIAL) {
      if (m & FLAG_EP) {
        const capSq = side === WHITE ? to - 16 : to + 16;
        captured = b[capSq];
        b[capSq] = 0;
      } else if (to > from) {
        b[from + 1] = b[from + 3];
        b[from + 3] = 0;
      } else {
        b[from - 1] = b[from - 4];
        b[from - 4] = 0;
      }
    }

    const promo = (m >>> 14) & 7;
    if (promo) b[to] = (side << 3) | promo;
    if ((piece & 7) === KING) this.kingSq[side] = to;

    this.undoCaptured[ply] = captured;
    this.castling &= CASTLE_MASK[from] & CASTLE_MASK[to];
    this.ep = m & FLAG_DOUBLE ? (from + to) >> 1 : NO_SQ;
    this.side = side ^ 1;
    this.ply = ply + 1;
  }

  unmake(m: number): void {
    const b = this.board;
    const from = m & 0x7f;
    const to = (m >>> 7) & 0x7f;
    const ply = --this.ply;
    const side = (this.side ^= 1);
    const captured = this.undoCaptured[ply];

    b[from] = (m >>> 14) & 7 ? (side << 3) | PAWN : b[to];

    if (m & FLAG_SPECIAL) {
      if (m & FLAG_EP) {
        b[to] = 0;
        b[side === WHITE ? to - 16 : to + 16] = captured;
      } else if (to > from) {
        b[to] = 0;
        b[from + 3] = b[from + 1];
        b[from + 1] = 0;
      } else {
        b[to] = 0;
        b[from - 4] = b[from - 1];
        b[from - 1] = 0;
      }
    } else {
      b[to] = captured;
    }

    if ((b[from] & 7) === KING) this.kingSq[side] = from;
    this.castling = this.undoCastling[ply];
    this.ep = this.undoEp[ply];
  }

  /** true if `by` attacks `sq` */
  attacked(sq: number, by: number): boolean {
    const b = this.board;
    const c = by << 3;
    let s: number;

    const pawn = c | PAWN;
    if (by === WHITE) {
      s = sq - 15;
      if (!(s & 0x88) && b[s] === pawn) return true;
      s = sq - 17;
      if (!(s & 0x88) && b[s] === pawn) return true;
    } else {
      s = sq + 15;
      if (!(s & 0x88) && b[s] === pawn) return true;
      s = sq + 17;
      if (!(s & 0x88) && b[s] === pawn) return true;
    }

    const knight = c | KNIGHT;
    for (let i = 0; i < 8; i++) {
      s = sq + KNIGHT_OFFSETS[i];
      if (!(s & 0x88) && b[s] === knight) return true;
    }

    const king = c | KING;
    for (let i = 0; i < 8; i++) {
      s = sq + KING_OFFSETS[i];
      if (!(s & 0x88) && b[s] === king) return true;
    }

    const bishop = c | BISHOP;
    const rook = c | ROOK;
    const queen = c | QUEEN;
    for (let i = 0; i < 4; i++) {
      const d = DIAG_OFFSETS[i];
      for (s = sq + d; !(s & 0x88); s += d) {
        const p = b[s];
        if (p) {
          if (p === bishop || p === queen) return true;
          break;
        }
      }
    }
    for (let i = 0; i < 4; i++) {
      const d = ORTHO_OFFSETS[i];
      for (s = sq + d; !(s & 0x88); s += d) {
        const p = b[s];
        if (p) {
          if (p === rook || p === queen) return true;
          break;
        }
      }
    }
    return false;
  }
}
