/**
 * The three calls a release makes to whatever runs it: its clock, a check for
 * waiting input, and a report after each finished iteration. A release calls
 * these, never an import of its own.
 *
 * The tool build (`index.ts`) imports them from the JavaScript host (host/wasm.ts).
 * The WASI build (`wasi.ts`, compiled with `--use WASI=1`) answers them inside the
 * module, from core/uci.ts. `isDefined(WASI)` is settled at compile time, so each
 * build holds only its own branch.
 *
 * This file does not import core/uci.ts: an import would put that module's buffers
 * and statics into every tool build. Its three answers are `@global` there, and only
 * a WASI entry imports it, so only the WASI build resolves the names below.
 */

@external("env", "clock") declare function envClock(nodes: f64): f64;
@external("env", "poll") declare function envPoll(): i32;
@external("env", "onIteration") declare function envIteration(depth: i32, score: i32, nodes: f64): i32;

/** the clock in milliseconds; `nodes` is the search's count so far, which a node clock reads as time */
@inline export function hostClock(nodes: f64): f64 {
  if (isDefined(WASI)) return uciClock(nodes);
  return envClock(nodes);
}

/** non-zero when the search must stop for the host: a `stop` or `quit` is waiting */
@inline export function hostPoll(): i32 {
  if (isDefined(WASI)) return uciPoll();
  return envPoll();
}

/** the report after a finished iteration: its depth, its score for the side to move, the nodes so far */
@inline export function hostIteration(depth: i32, score: i32, nodes: f64): i32 {
  if (isDefined(WASI)) return uciIteration(depth, score, nodes);
  return envIteration(depth, score, nodes);
}
