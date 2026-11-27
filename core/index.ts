/**
 * WASM exports of the core: position setup, legal moves, perft, the state walk,
 * a position read back square by square, and the Texel tuner's neutral resolver
 * (resolve.ts). The host loads a position square by square, applies game moves
 * with playMove(), then runs perft in a single call. The own engine's index
 * re-exports the position setup, legal moves, perft and the state walk beside its search.
 */
import { generateMoves } from "./movegen";
import { MAX_MOVES, MAX_PLY } from "./constants";
import {
  addPiece,
  attackedWith,
  bb,
  board,
  castling,
  clear,
  ep,
  halfmove,
  hash,
  inCheck,
  initPosition,
  make,
  playMove,
  ply,
  setState,
  side,
  unmake,
} from "./position";
import { initTables, magicAt } from "./tables";
import { Z_CASTLE, Z_EP, Z_PIECE, Z_SIDE, initZobrist } from "./zobrist";

const moves = new StaticArray<i32>(MAX_PLY * MAX_MOVES);
const rootMoves = new StaticArray<i32>(MAX_MOVES);

export function initCore(): void {
  initTables();
  initZobrist();
  initPosition();
}

export { clear, setState, playMove };

export function put(s: i32, p: i32): void {
  addPiece(p, s);
}

/** fills the root move list; read it with rootMove(i) */
export function legalMoves(): i32 {
  return generateMoves(rootMoves, 0, true);
}

export { resolveQuiet } from "./resolve";

/** the piece code on square `s`, 0 if empty */
export function pieceAt(s: i32): i32 {
  return <i32>board[s];
}

/** the side to move, castling rights, en passant square and halfmove clock, for a host reading a position back */
export function sideToMove(): i32 {
  return side;
}
export function castlingRights(): i32 {
  return castling;
}
export function epSquare(): i32 {
  return ep;
}
export function halfmoveClock(): i32 {
  return halfmove;
}

/** true if the side to move is in check */
export function inCheckNow(): bool {
  return inCheck();
}

export function rootMove(i: i32): i32 {
  return rootMoves[i];
}

/** true if color `by` attacks square `s` in the current position */
export function attacked(s: i32, by: i32): bool {
  return attackedWith(s, by, bb[0] | bb[8]);
}

function perftRec(depth: i32, bulk: bool): u64 {
  const start = ply * MAX_MOVES;
  const end = generateMoves(moves, start, true);
  if (depth == 1 && bulk) return <u64>(end - start);
  let count: u64 = 0;
  for (let i = start; i < end; i++) {
    const m = moves[i];
    make(m);
    count += depth == 1 ? 1 : perftRec(depth - 1, bulk);
    unmake(m);
  }
  return count;
}

/** leaf count as f64, so the host never sees a BigInt */
export function perft(depth: i32, bulk: bool): f64 {
  return depth == 0 ? 1 : <f64>perftRec(depth, bulk);
}

/** recomputes the hash from the board; true if the incremental one matches */
function stateMatches(): bool {
  let h: u64 = Z_CASTLE[castling] ^ Z_EP[ep];
  if (side) h ^= Z_SIDE;
  for (let s = 0; s < 64; s++) {
    const p = <i32>board[s];
    if (p) h ^= Z_PIECE[(p << 6) + s];
  }
  return h == hash;
}

/** walks the tree to `depth` checking incremental state after every make and unmake; returns mismatches */
export function checkedWalk(depth: i32): i32 {
  let bad = stateMatches() ? 0 : 1;
  if (depth == 0) return bad;
  const start = ply * MAX_MOVES;
  const end = generateMoves(moves, start, true);
  for (let i = start; i < end; i++) {
    const mv = moves[i];
    make(mv);
    bad += checkedWalk(depth - 1);
    unmake(mv);
    if (!stateMatches()) bad++;
  }
  return bad;
}

/** magic multiplier of record k, for tools/gen-magics.ts */
export function magicNumber(k: i32): u64 {
  return magicAt(k);
}
