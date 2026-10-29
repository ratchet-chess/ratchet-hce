/**
 * Encodings every engine module shares: piece types, the move layout, board
 * masks and the search's size limits. It imports nothing, so any module can
 * use it without an import cycle.
 */

// A piece code is color << 3 | type, with color 0 for white and 1 for black.
// Type 0 is unused by pieces: codes 0 and 8 index each color's occupancy.
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

/** the en passant square when there is none */
export const NO_SQ = 64;

// Move layout: from (6 bits) | to << 6 | promo type << 12 | flags.
export const FLAG_EP = 1 << 15;
export const FLAG_CASTLE = 1 << 16;
export const FLAG_DOUBLE = 1 << 17;

@inline export function moveFrom(m: i32): i32 {
  return m & 63;
}

@inline export function moveTo(m: i32): i32 {
  return (m >>> 6) & 63;
}

/** the piece type promoted to, 0 for a move that does not promote */
@inline export function movePromo(m: i32): i32 {
  return (m >>> 12) & 7;
}

export const FILE_A: u64 = 0x0101010101010101;

/** plies the search reaches at most, root included */
export const MAX_PLY = 128;
/** move-list slots per ply */
export const MAX_MOVES = 256;
