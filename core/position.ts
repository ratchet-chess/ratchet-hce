/**
 * Native 64-bit bitboard position, held in module globals so the compiled code
 * reads wasm globals and linear memory directly. One bitboard per piece code, with
 * type-0 codes 0 and 8 holding color occupancy, plus a mailbox.
 *
 * make() updates the Zobrist hash incrementally; unmake() restores it from the
 * hash history instead of recomputing it. The core keeps no eval state: a
 * release that keeps terms incrementally updates them beside make() and unmake().
 *
 * `ply` counts from the search root. Game moves are applied with playMove(), which
 * folds them into the repetition history and resets ply to 0, so the undo stack
 * only ever holds search moves.
 *
 * A hot table is static memory, changetype<StaticArray<T>>(memory.data(...)), not
 * new StaticArray<T>(...). Its address is then a constant in the code, not a global
 * to load on every read. It has no header, so its length is not readable.
 */
import {
  BISHOP,
  FLAG_CASTLE,
  FLAG_DOUBLE,
  FLAG_EP,
  KING,
  KNIGHT,
  MAX_PLY,
  NO_SQ,
  PAWN,
  QUEEN,
  ROOK,
  moveFrom,
  movePromo,
  moveTo,
} from "./constants";
import { KING_ATT, KNIGHT_ATT, PAWN_ATT, bishopAttacks, bit, rookAttacks } from "./tables";
import { Z_CASTLE, Z_EP, Z_PIECE, Z_SIDE } from "./zobrist";

const FLAG_SPECIAL = FLAG_EP | FLAG_CASTLE;
/** game positions whose hashes are kept for repetition detection */
const MAX_HISTORY = 1024;

export const bb = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * 16));
export const board = changetype<StaticArray<u8>>(memory.data(sizeof<u8>() * 64));
export let side: i32 = 0;
export let castling: i32 = 0;
export let ep: i32 = NO_SQ;
export let ply: i32 = 0;
export let hash: u64 = 0;
export let halfmove: i32 = 0;
/** the game's full-move number at the search root; moves in the search do not advance it */
export let fullmove: i32 = 1;

/** Undo record per ply, UNDO_STRIDE i32s: captured | castling << 8 | ep << 16, then halfmove. */
const UNDO_STRIDE = 2;
const undo = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY * UNDO_STRIDE));

/** hash per position: game history first, then the search path; the current one is at gameLen + ply */
const hashes = changetype<StaticArray<u64>>(memory.data(sizeof<u64>() * (MAX_HISTORY + MAX_PLY + 1)));
let gameLen: i32 = 0;

/** the castling rights left after a move from or to each square */
export const CASTLE_MASK = changetype<StaticArray<u8>>(memory.data(sizeof<u8>() * 64));

export function initPosition(): void {
  for (let s = 0; s < 64; s++) CASTLE_MASK[s] = 15;
  CASTLE_MASK[0] = 15 & ~2;
  CASTLE_MASK[7] = 15 & ~1;
  CASTLE_MASK[4] = 15 & ~3;
  CASTLE_MASK[56] = 15 & ~8;
  CASTLE_MASK[63] = 15 & ~4;
  CASTLE_MASK[60] = 15 & ~12;
}

export function clear(): void {
  for (let i = 0; i < 16; i++) bb[i] = 0;
  for (let s = 0; s < 64; s++) board[s] = 0;
  ply = 0;
  gameLen = 0;
  hash = 0;
}

/** sets the non-placement state after the pieces are put; completes the hash */
export function setState(s: i32, cr: i32, epSq: i32, hm: i32, fm: i32): void {
  side = s;
  fullmove = max(1, fm);
  castling = cr;
  ep = epSq < 0 ? NO_SQ : epSq;
  halfmove = hm;
  hash ^= Z_CASTLE[castling] ^ Z_EP[ep];
  if (side) hash ^= Z_SIDE;
  hashes[0] = hash;
}

// Full updates for make(): bitboards, mailbox, hash.

@inline export function addPiece(p: i32, s: i32): void {
  const b = bit(s);
  bb[p] |= b;
  bb[p & 8] |= b;
  board[s] = <u8>p;
  hash ^= Z_PIECE[(p << 6) + s];
}

@inline function removePiece(p: i32, s: i32): void {
  const b = ~bit(s);
  bb[p] &= b;
  bb[p & 8] &= b;
  board[s] = 0;
  hash ^= Z_PIECE[(p << 6) + s];
}

@inline function movePiece(p: i32, a: i32, b: i32): void {
  const m = bit(a) | bit(b);
  bb[p] ^= m;
  bb[p & 8] ^= m;
  board[a] = 0;
  board[b] = <u8>p;
  const i = p << 6;
  hash ^= Z_PIECE[i + a] ^ Z_PIECE[i + b];
}

// Board-only updates for unmake(); the rest is restored from the undo stack.

@inline function toggle(p: i32, s: i32): void {
  const b = bit(s);
  bb[p] ^= b;
  bb[p & 8] ^= b;
  board[s] ^= <u8>p;
}

@inline function shift(p: i32, a: i32, b: i32): void {
  const m = bit(a) | bit(b);
  bb[p] ^= m;
  bb[p & 8] ^= m;
  board[a] = 0;
  board[b] = <u8>p;
}

export function make(m: i32): void {
  const from = moveFrom(m);
  const to = moveTo(m);
  const piece = <i32>board[from];
  let captured = <i32>board[to];

  const u = ply * UNDO_STRIDE;
  undo[u + 1] = halfmove;
  const prevState = (castling << 8) | (ep << 16);

  hash ^= Z_SIDE ^ Z_EP[ep] ^ Z_CASTLE[castling];

  if (captured) removePiece(captured, to);
  movePiece(piece, from, to);

  if (m & FLAG_SPECIAL) {
    if (m & FLAG_EP) {
      const cs = to ^ 8;
      captured = <i32>board[cs];
      removePiece(captured, cs);
    } else {
      const rf = to > from ? from + 3 : from - 4;
      const rt = to > from ? from + 1 : from - 1;
      movePiece(<i32>board[rf], rf, rt);
    }
  }

  const promo = movePromo(m);
  if (promo) {
    removePiece(piece, to);
    addPiece((piece & 8) | promo, to);
  }

  undo[u] = captured | prevState;
  castling &= <i32>(CASTLE_MASK[from] & CASTLE_MASK[to]);
  ep = m & FLAG_DOUBLE ? (from + to) >> 1 : NO_SQ;
  halfmove = captured || (piece & 7) == PAWN ? 0 : halfmove + 1;
  hash ^= Z_EP[ep] ^ Z_CASTLE[castling];
  side ^= 1;
  ply++;
  hashes[gameLen + ply] = hash;
}

export function unmake(m: i32): void {
  const from = moveFrom(m);
  const to = moveTo(m);
  ply--;
  side ^= 1;
  const u = ply * UNDO_STRIDE;
  const state = undo[u];
  const captured = state & 0xff;

  const promo = movePromo(m);
  if (promo) {
    const p = <i32>board[to];
    toggle(p, to);
    toggle((p & 8) | PAWN, to);
  }

  shift(<i32>board[to], to, from);

  if (m & FLAG_SPECIAL) {
    if (m & FLAG_EP) {
      toggle(captured, to ^ 8);
    } else {
      const rf = to > from ? from + 3 : from - 4;
      const rt = to > from ? from + 1 : from - 1;
      shift(<i32>board[rt], rt, rf);
    }
  } else if (captured) {
    toggle(captured, to);
  }

  castling = (state >> 8) & 0xff;
  ep = state >> 16;
  halfmove = undo[u + 1];
  hash = hashes[gameLen + ply];
}

/**
 * Passes the move: the other side moves next and no en-passant capture stays
 * open. The fifty-move count restarts, so a repetition scan stops at the pass:
 * across it, a line would match positions from before the pass. The restart
 * is the core's choice; Crafty 10.18, for one, counted the pass as a move.
 */
export function makeNull(): void {
  const u = ply * UNDO_STRIDE;
  undo[u] = (castling << 8) | (ep << 16);
  undo[u + 1] = halfmove;
  hash ^= Z_SIDE ^ Z_EP[ep];
  ep = NO_SQ;
  halfmove = 0;
  side ^= 1;
  ply++;
  hashes[gameLen + ply] = hash;
}

export function unmakeNull(): void {
  ply--;
  side ^= 1;
  const u = ply * UNDO_STRIDE;
  ep = undo[u] >> 16;
  halfmove = undo[u + 1];
  hash = hashes[gameLen + ply];
}

/** applies a game move and makes the result the new search root */
export function playMove(m: i32): void {
  if (side) fullmove++;
  make(m);
  gameLen++;
  ply = 0;
  if (gameLen >= MAX_HISTORY) {
    // keep the most recent positions; a repetition cannot reach past 100 plies
    const keep = 128;
    for (let i = 0; i <= keep; i++) hashes[i] = hashes[gameLen - keep + i];
    gameLen = keep;
  }
}

/**
 * True if the current position draws by repetition within the halfmove window (Stockfish 6b782211 Position::is_draw,
 * Stash 079fcba game_is_drawn): once earlier strictly after the root (i > gameLen), or twice earlier at or before the
 * root (i <= gameLen). Incipit be29d4f is_repetition also draws on one earlier match at the root itself, the form not
 * taken.
 */
export function isRepetition(): bool {
  const cur = gameLen + ply;
  const stop = max(0, cur - halfmove);
  let seen = false;
  for (let i = cur - 4; i >= stop; i -= 2) {
    if (hashes[i] == hash) {
      if (i > gameLen || seen) return true;
      seen = true;
    }
  }
  return false;
}

/** how many positions the hash history holds before the current one, game and search path together */
@inline export function pliesKept(): i32 {
  return gameLen + ply;
}

/** the hash of the position `back` plies before the current one; `back` is at most pliesKept() */
@inline export function hashBack(back: i32): u64 {
  return hashes[gameLen + ply - back];
}

/** true if color `by` attacks s, with occupancy occ for slider rays */
export function attackedWith(s: i32, by: i32, occ: u64): bool {
  const by8 = by << 3;
  if (PAWN_ATT[((by ^ 1) << 6) + s] & bb[by8 | PAWN]) return true;
  if (KNIGHT_ATT[s] & bb[by8 | KNIGHT]) return true;
  if (KING_ATT[s] & bb[by8 | KING]) return true;
  const q = bb[by8 | QUEEN];
  if (bishopAttacks(s, occ) & (bb[by8 | BISHOP] | q)) return true;
  return (rookAttacks(s, occ) & (bb[by8 | ROOK] | q)) != 0;
}

export function inCheck(): bool {
  return attackedWith(<i32>ctz(bb[(side << 3) | KING]), side ^ 1, bb[0] | bb[8]);
}
