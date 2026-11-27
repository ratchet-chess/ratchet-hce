/**
 * The Texel tuner's neutral resolver: a material-only capture search that takes a
 * position to a quiet one, the same for every subject tuned. Its material values
 * (1, 3, 3, 5, 9 pawns) and its move order (most valuable victim, then least
 * valuable attacker) are the core's own, not any engine's. It searches the core's
 * noisy moves: captures, en passant and queen promotions. A side may stand pat;
 * the search does not test for check.
 */
import { MAX_MOVES, MAX_PLY, PAWN, QUEEN, moveFrom, movePromo, moveTo } from "./constants";
import { generateMoves } from "./movegen";
import { bb, board, make, playMove, side, unmake } from "./position";

/** the deepest capture sequence searched; deeper positions stand pat */
const MAX_DEPTH = 32;

const VALUE: StaticArray<i32> = [0, 100, 300, 300, 500, 900, 0];
const list = new StaticArray<i32>(MAX_PLY * MAX_MOVES);
const keys = new StaticArray<i32>(MAX_PLY * MAX_MOVES);
const pv = new StaticArray<i32>(MAX_DEPTH * MAX_DEPTH);
const pvLen = new StaticArray<i32>(MAX_DEPTH + 1);

/** the material balance for the side to move */
function material(): i32 {
  let m = 0;
  for (let t = PAWN; t <= QUEEN; t++) m += VALUE[t] * (<i32>popcnt(bb[t]) - <i32>popcnt(bb[8 | t]));
  return side ? -m : m;
}

function search(depth: i32, alpha: i32, beta: i32): i32 {
  pvLen[depth] = 0;
  const stand = material();
  if (stand >= beta || depth >= MAX_DEPTH) return stand;
  if (stand > alpha) alpha = stand;
  const start = depth * MAX_MOVES;
  const end = generateMoves(list, start, false);
  for (let i = start; i < end; i++) {
    const m = list[i];
    const victim = (<i32>board[moveTo(m)]) & 7;
    const promo = movePromo(m);
    // an empty target square is en passant, which takes a pawn, unless the move only promotes
    const gain = (victim ? VALUE[victim] : promo ? 0 : VALUE[PAWN]) + (promo ? VALUE[promo] - VALUE[PAWN] : 0);
    keys[i] = gain * 8 - ((<i32>board[moveFrom(m)]) & 7);
  }
  for (let i = start; i < end; i++) {
    // the best remaining move to the front: a deterministic order, ties by list position
    let best = i;
    for (let j = i + 1; j < end; j++) if (keys[j] > keys[best]) best = j;
    const m = list[best];
    const k = keys[best];
    list[best] = list[i];
    keys[best] = keys[i];
    list[i] = m;
    keys[i] = k;
    make(m);
    const score = -search(depth + 1, -beta, -alpha);
    unmake(m);
    if (score > alpha) {
      alpha = score;
      pv[depth * MAX_DEPTH] = m;
      const n = pvLen[depth + 1];
      for (let j = 0; j < n; j++) pv[depth * MAX_DEPTH + 1 + j] = pv[(depth + 1) * MAX_DEPTH + j];
      pvLen[depth] = n + 1;
      if (score >= beta) return score;
    }
  }
  return alpha;
}

/** plays the resolver's principal variation on the position as game moves; returns its length */
export function resolveQuiet(): i32 {
  search(0, -1000000, 1000000);
  const n = pvLen[0];
  for (let i = 0; i < n; i++) playMove(pv[i]);
  return n;
}
