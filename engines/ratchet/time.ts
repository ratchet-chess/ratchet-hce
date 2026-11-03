/**
 * Time use: a soft limit checked between iterations and a hard limit checked
 * inside the search (Stockfish c0616d77's two limits; Weiss c735b8f's constants).
 * The soft limit stretches when the best move has taken a small share of the
 * nodes (Koivisto #115, Weiss 1401211). It does not stop while the last iteration
 * changed the best move: Weiss's `uncertain`.
 *
 * Every limit is in the host clock's milliseconds. Under the node clock the host
 * counts nodes as time, so these rules stay deterministic there.
 */
import {
  TM_HARD_CAP, TM_HARD_MUL, TM_INC_MOVES, TM_MTG_CAP, TM_MTG_SHARE, TM_NODE_BASE, TM_NODE_MUL, TM_ONE_MOVE, TM_OVERHEAD, TM_SHARE,
  TM_SHARE_CAP,
} from "./params";

@external("env", "clock") declare function hostClock(nodes: f64): f64;
@external("env", "poll") declare function hostPoll(): i32;

/** whether this search has a clock to keep */
export let timed = false;
let start: f64 = 0;
let soft: f64 = 0;
let hard: f64 = 0;

/**
 * Sets the limits of one search from the host's (a limit not given is negative):
 * the side to move's clock and increment, moves to go, or a fixed move time.
 * With none of them the search is untimed. `legalMoves` is the root's count.
 */
export function startClock(timeMs: f64, incMs: f64, movesToGo: i32, moveTimeMs: f64, legalMoves: i32): void {
  start = hostClock(0);
  timed = true;
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
      const left = max<f64>(1, timeMs + TM_INC_MOVES * (inc - TM_OVERHEAD));
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

/** whether to start another iteration, given the best move's share of the nodes and whether it just changed */
export function mayContinue(nodes: f64, bestShare: f64, uncertain: bool): bool {
  if (!timed) return true;
  const elapsed = hostClock(nodes) - start;
  if (elapsed >= hard) return false;
  if (uncertain) return true;
  return elapsed < soft * (TM_NODE_BASE + TM_NODE_MUL * (1 - bestShare));
}
