/**
 * Pseudo-legal move generation for the 0x88 position. Legality is the caller's job:
 * make the move, then reject it if the mover's king is attacked.
 */
import { BISHOP, BLACK, CASTLE_BK, CASTLE_BQ, CASTLE_WK, CASTLE_WQ, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from "../../../host/fen.ts";
import {
  DIAG_OFFSETS,
  FLAG_CASTLE,
  FLAG_DOUBLE,
  FLAG_EP,
  KING_OFFSETS,
  KNIGHT_OFFSETS,
  ORTHO_OFFSETS,
  type Position,
} from "./position.ts";

/** Writes moves into `out` from index `start`; returns the index past the last move. */
export function generateMoves(pos: Position, out: Int32Array, start: number): number {
  const b = pos.board;
  const side = pos.side;
  const them = side ^ 1;
  let n = start;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = b[sq];
    if (!p || p >> 3 !== side) continue;

    switch (p & 7) {
      case PAWN: {
        const fwd = side === WHITE ? 16 : -16;
        const rank = sq >> 4;
        const promoRank = side === WHITE ? 6 : 1;
        const to = sq + fwd;
        if (!b[to]) {
          if (rank === promoRank) {
            n = pushPromos(out, n, sq | (to << 7));
          } else {
            out[n++] = sq | (to << 7);
            const to2 = to + fwd;
            if (rank === (side === WHITE ? 1 : 6) && !b[to2]) {
              out[n++] = sq | (to2 << 7) | FLAG_DOUBLE;
            }
          }
        }
        for (let k = -1; k <= 1; k += 2) {
          const t = to + k;
          if (t & 0x88) continue;
          const q = b[t];
          if (q && q >> 3 === them) {
            if (rank === promoRank) n = pushPromos(out, n, sq | (t << 7));
            else out[n++] = sq | (t << 7);
          } else if (t === pos.ep) {
            out[n++] = sq | (t << 7) | FLAG_EP;
          }
        }
        break;
      }
      case KNIGHT:
        n = genSteps(b, side, sq, KNIGHT_OFFSETS, out, n);
        break;
      case BISHOP:
        n = genSlides(b, side, sq, DIAG_OFFSETS, out, n);
        break;
      case ROOK:
        n = genSlides(b, side, sq, ORTHO_OFFSETS, out, n);
        break;
      case QUEEN:
        n = genSlides(b, side, sq, DIAG_OFFSETS, out, n);
        n = genSlides(b, side, sq, ORTHO_OFFSETS, out, n);
        break;
      case KING:
        n = genSteps(b, side, sq, KING_OFFSETS, out, n);
        break;
    }
  }

  // Castling: rights imply king and rook are home. The king's destination square
  // is left to the caller's legality check.
  const cr = pos.castling;
  if (side === WHITE) {
    if (cr & CASTLE_WK && !b[5] && !b[6] && !pos.attacked(4, BLACK) && !pos.attacked(5, BLACK)) {
      out[n++] = 4 | (6 << 7) | FLAG_CASTLE;
    }
    if (cr & CASTLE_WQ && !b[3] && !b[2] && !b[1] && !pos.attacked(4, BLACK) && !pos.attacked(3, BLACK)) {
      out[n++] = 4 | (2 << 7) | FLAG_CASTLE;
    }
  } else {
    if (cr & CASTLE_BK && !b[0x75] && !b[0x76] && !pos.attacked(0x74, WHITE) && !pos.attacked(0x75, WHITE)) {
      out[n++] = 0x74 | (0x76 << 7) | FLAG_CASTLE;
    }
    if (cr & CASTLE_BQ && !b[0x73] && !b[0x72] && !b[0x71] && !pos.attacked(0x74, WHITE) && !pos.attacked(0x73, WHITE)) {
      out[n++] = 0x74 | (0x72 << 7) | FLAG_CASTLE;
    }
  }

  return n;
}

function pushPromos(out: Int32Array, n: number, base: number): number {
  out[n++] = base | (QUEEN << 14);
  out[n++] = base | (ROOK << 14);
  out[n++] = base | (BISHOP << 14);
  out[n++] = base | (KNIGHT << 14);
  return n;
}

function genSteps(b: Uint8Array, side: number, sq: number, offsets: Int8Array, out: Int32Array, n: number): number {
  for (let i = 0; i < offsets.length; i++) {
    const to = sq + offsets[i];
    if (to & 0x88) continue;
    const q = b[to];
    if (!q || q >> 3 !== side) out[n++] = sq | (to << 7);
  }
  return n;
}

function genSlides(b: Uint8Array, side: number, sq: number, offsets: Int8Array, out: Int32Array, n: number): number {
  for (let i = 0; i < offsets.length; i++) {
    const d = offsets[i];
    for (let to = sq + d; !(to & 0x88); to += d) {
      const q = b[to];
      if (q) {
        if (q >> 3 !== side) out[n++] = sq | (to << 7);
        break;
      }
      out[n++] = sq | (to << 7);
    }
  }
  return n;
}
