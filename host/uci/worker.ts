/**
 * Search worker: owns the WASM engine and runs commands that the UCI thread posts,
 * one at a time. A search blocks this thread, so stop requests arrive through the
 * shared stop flag rather than as messages.
 */
import { parentPort, workerData } from "node:worker_threads";
import { parseFen } from "../fen.ts";
import { Engine, MATE, START_FEN, moveToUci } from "../wasm.ts";
import type { GoLimits } from "./limits.ts";

export type WorkerCommand =
  | { cmd: "position"; fen: string; moves: string[] }
  | { cmd: "go"; limits: GoLimits }
  | { cmd: "newgame" }
  | { cmd: "hash"; mb: number }
  | { cmd: "tune"; id: number; value: number }
  | { cmd: "eval" }
  | { cmd: "debug"; on: boolean };

const port = parentPort!;
const stop: Int32Array = workerData.stop;
const engine = await Engine.load(workerData.release);
if (!engine.clocked) throw new Error(`${workerData.release} does not time itself, so it cannot play`);
if (workerData.level) engine.setGameLevel(workerData.level);
let sideToMove = 0;
/** UCI's debug mode: each search then reports the engine's record of its time use, if the build keeps one */
let debug = false;

/**
 * Nodes per millisecond of the engine's own clock when the launcher is given
 * --nodestime, 0 otherwise. The engine then times itself in nodes, as Fishtest's
 * nodestime does: a game's first go sets its clock from the GUI's, and each move
 * charges nodes / nodesTime and credits the increment, whatever the wall clock
 * says. Searches stay deterministic in nodes and independent of the machine.
 * If nodesTime exceeds the host's speed, the GUI's real clock runs down faster than
 * this one, so the GUI needs a margin, as tools/pool.ts gives it.
 */
const nodesTime: number = workerData.nodesTime;

/**
 * Ratchet's guard, for a release with levels in place of a clock: its move waits
 * until this long after the go. Such a release can reply within a millisecond,
 * and an anchor that hands each go to a search thread can miss a go that comes
 * before the thread waits again (Stash 9, MissingPawn), and lose on time. The
 * wait costs the release nothing, since it ignores its clock.
 */
const MIN_REPLY_MS = 100;
const pause = new Int32Array(new SharedArrayBuffer(4));
/** the engine's own remaining time under --nodestime, from the game's first go */
let ownMs: number | undefined;

function scoreText(s: number): string {
  if (s > MATE - 256) return `mate ${Math.ceil((MATE - s) / 2)}`;
  if (s < -MATE + 256) return `mate -${Math.ceil((MATE + s) / 2)}`;
  return `cp ${s}`;
}

/** the limits with the side to move's time replaced by the engine's own clock */
function ownClock(limits: GoLimits): GoLimits {
  const key = sideToMove === 0 ? "wtime" : "btime";
  if (limits[key] === undefined) return limits;
  ownMs ??= limits[key];
  return { ...limits, [key]: ownMs };
}

/**
 * A search: the host passes the side to move's limits to the release, which
 * times itself, and supplies its clock: wall time or, under --nodestime, nodes.
 * The host's stop reaches the release as waiting input. A clock already run
 * out passes as 0. A node limit is refused, since no original takes one. In an
 * infinite search, the move waits for the GUI's stop, as UCI requires.
 */
function go(limits: GoLimits): void {
  if (limits.nodes !== undefined) throw new Error("a release takes no node limit");
  if (nodesTime) limits = ownClock(limits);
  const given = (ms: number | undefined) => (ms === undefined ? undefined : Math.max(0, ms));
  const t0 = performance.now();
  engine.clock = nodesTime ? (nodes) => nodes / nodesTime : () => performance.now();
  engine.poll = () => Atomics.load(stop, 0);
  engine.onIteration = (depth, score, nodes) => {
    const ms = performance.now() - t0;
    const nps = Math.round((nodes * 1000) / Math.max(ms, 1));
    const pv = engine.pv().map(moveToUci).join(" ");
    port.postMessage(`info depth ${depth} score ${scoreText(score)} nodes ${nodes} nps ${nps} time ${Math.round(ms)} pv ${pv}`);
    return 0;
  };
  const white = sideToMove === 0;
  const best = engine.goClock({
    timeMs: limits.infinite ? undefined : given(white ? limits.wtime : limits.btime),
    incMs: white ? limits.winc : limits.binc,
    movesToGo: limits.movestogo,
    moveTimeMs: limits.infinite ? undefined : given(limits.movetime),
    depth: limits.depth,
  });
  if (limits.infinite) Atomics.wait(stop, 0, 0);
  if (nodesTime && ownMs !== undefined) {
    const inc = (sideToMove === 0 ? limits.winc : limits.binc) ?? 0;
    ownMs = Math.max(1, ownMs - engine.nodes() / nodesTime + inc);
  }
  if (engine.leveled) {
    const wait = MIN_REPLY_MS - (performance.now() - t0);
    if (wait > 0) Atomics.wait(pause, 0, 0, wait);
  }
  const t = debug ? engine.timeTrace() : undefined;
  if (t) {
    const f = (x: number) => (x > 1e15 ? "none" : String(Math.round(x * 1000) / 1000));
    port.postMessage(`info string time rule ${t.rule} elapsed ${f(t.elapsed)} soft ${f(t.soft)} hard ${f(t.hard)} score ${f(t.score)} node ${f(t.node)} veto ${t.veto}`);
  }
  port.postMessage(`bestmove ${best ? moveToUci(best) : "0000"}`);
}

port.on("message", (c: WorkerCommand) => {
  switch (c.cmd) {
    case "position":
      engine.setPosition(c.fen, c.moves);
      sideToMove = parseFen(c.fen).side ^ (c.moves.length & 1);
      break;
    case "go":
      go(c.limits);
      break;
    case "newgame":
      engine.newGame();
      ownMs = undefined;
      break;
    case "hash":
      engine.setHash(c.mb);
      break;
    case "tune":
      engine.tune(c.id, c.value);
      break;
    case "eval":
      port.postMessage(`eval cp ${engine.evaluate()}`);
      break;
    case "debug":
      debug = c.on;
      break;
  }
});

engine.setPosition(START_FEN, []);
port.postMessage(`name Ratchet${engine.version ? ` ${engine.version}` : ""}`);
port.postMessage("ready");
