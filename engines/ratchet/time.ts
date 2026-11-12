/**
 * Time use: a soft limit checked between iterations and a hard limit checked
 * inside the search (Stockfish c0616d77's two limits; Weiss c735b8f's constants).
 * The soft limit stretches when the best move has taken a small share of the
 * nodes (Koivisto #115, Weiss 1401211). It does not stop while the last iteration
 * changed the best move: Weiss's `uncertain`. It also scales by how far the score
 * fell over three iterations (Berserk 787b2e1b scoreChangeFactor; Stockfish 11
 * fallingEval has the same clamp). Stash's one-iteration factor is rejected: it halved
 * the limit on a rise and doubled it on a fall. Stash's table for how
 * long the best move has held is left out, as in Polaris and Weiss: its first row
 * could not act behind `uncertain`, and the node share already reads a settled move.
 *
 * In sudden death with an increment under the overhead, the moves counted ahead fall
 * with a low clock (Stockfish 23493de0, one move per 20 ms). Two forms are rejected.
 * Stockfish applies the fall at every increment, which also drops the increments counted
 * and so changes play on a clock that pays its overhead. Ethereal's `tm_init` takes the
 * overhead once from the clock, which changes the limits on every clock.
 *
 * Every limit is in the host clock's milliseconds. Under the node clock the host
 * counts nodes as time, so these rules stay deterministic there.
 */
import {
  TM_HARD_CAP, TM_HARD_MUL, TM_INC_MOVES, TM_INC_MOVES_PER_MS, TM_MTG_CAP, TM_MTG_SHARE, TM_NODE_BASE, TM_NODE_MUL, TM_ONE_MOVE, TM_OVERHEAD, TM_SHARE,
  TM_FALL_BASE, TM_FALL_MAX, TM_FALL_MIN, TM_FALL_PER, TM_SHARE_CAP,
} from "./params";

@external("env", "clock") declare function hostClock(nodes: f64): f64;
@external("env", "poll") declare function hostPoll(): i32;

/** whether this search has a clock to keep */
export let timed = false;
let start: f64 = 0;
let soft: f64 = 0;
let hard: f64 = 0;
/** the last iterations' scores, oldest first, and how many of them this search has */
let score1 = 0;
let score2 = 0;
let score3 = 0;
let scores = 0;

/**
 * Sets the limits of one search from the host's (a limit not given is negative):
 * the side to move's clock and increment, moves to go, or a fixed move time.
 * With none of them the search is untimed. `legalMoves` is the root's count.
 */
export function startClock(timeMs: f64, incMs: f64, movesToGo: i32, moveTimeMs: f64, legalMoves: i32): void {
  start = hostClock(0);
  timed = true;
  scores = 0;
  if (moveTimeMs >= 0) {
    soft = f64.MAX_VALUE;
    hard = max<f64>(1, moveTimeMs - TM_OVERHEAD);
  } else if (timeMs >= 0) {
    const inc = max<f64>(0, incMs);
    if (movesToGo > 0) {
      const mtg = <f64>min(movesToGo, TM_MTG_CAP);
      const left = max<f64>(1, timeMs + mtg * (inc - TM_OVERHEAD));
      soft = min<f64>(left * TM_MTG_SHARE / mtg, TM_HARD_CAP * timeMs);
    } else {
      // Each move counted ahead brings one increment and costs one overhead. An increment under
      // the overhead leaves a net cost, and at the full count that cost is the whole of a low clock.
      // So the count then falls with the clock, and the cost is at most half of the clock.
      const ahead = inc < TM_OVERHEAD ? min<f64>(TM_INC_MOVES, timeMs * TM_INC_MOVES_PER_MS) : TM_INC_MOVES;
      const left = max<f64>(1, timeMs + ahead * (inc - TM_OVERHEAD));
      soft = min<f64>(left * TM_SHARE, TM_SHARE_CAP * timeMs);
    }
    hard = max<f64>(1, min<f64>(TM_HARD_MUL * soft, TM_HARD_CAP * timeMs - TM_OVERHEAD));
    if (legalMoves == 1) soft = min<f64>(soft, TM_ONE_MOVE);
  } else {
    timed = false;
  }
}

/** an untimed search: it stops at its depth or at the host's stop */
export function noClock(): void {
  timed = false;
}

/** whether the search must stop now: the hard limit has passed, or the host has input waiting */
export function mustStop(nodes: f64): bool {
  if (hostPoll()) return true;
  return timed && hostClock(nodes) - start >= hard;
}

/**
 * whether to start another iteration, given the best move's share of the nodes,
 * whether it just changed, and the iteration's score
 */
export function mayContinue(nodes: f64, bestShare: f64, uncertain: bool, score: i32): bool {
  if (!timed) return true;
  // a rise counts as no fall; before three iterations there is no window, so no factor
  const scale: f64 = scores >= 3 ? max<f64>(TM_FALL_MIN, min<f64>(TM_FALL_MAX, TM_FALL_BASE + TM_FALL_PER * <f64>max(0, score1 - score))) : 1;
  score1 = score2;
  score2 = score3;
  score3 = score;
  scores++;
  const elapsed = hostClock(nodes) - start;
  if (elapsed >= hard) return false;
  if (uncertain) return true;
  return elapsed < soft * scale * (TM_NODE_BASE + TM_NODE_MUL * (1 - bestShare));
}
