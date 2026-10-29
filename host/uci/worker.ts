/**
 * Search worker: owns the WASM engine and runs commands that the UCI thread posts,
 * one at a time. A search blocks this thread, so stop requests arrive through the
 * shared stop flag rather than as messages.
 */
import { appendFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import { parseFen } from "../fen.ts";
import { Engine, MATE, START_FEN, moveToUci } from "../wasm.ts";
import { IterationClock, MAX_DEPTH, budget, type GoLimits } from "./time.ts";

export type WorkerCommand =
  | { cmd: "position"; fen: string; moves: string[] }
  | { cmd: "go"; limits: GoLimits }
  | { cmd: "newgame" }
  | { cmd: "hash"; mb: number }
  | { cmd: "tune"; id: number; value: number };

const port = parentPort!;
const stop: Int32Array = workerData.stop;
const engine = await Engine.load(workerData.release);
let sideToMove = 0;

/**
 * Nodes per millisecond of the engine's own clock when the launcher is given
 * --nodestime, 0 otherwise. The engine then times itself in nodes, as Fishtest's
 * nodestime does: a game's first go sets its clock from the GUI's, and each move
 * charges nodes / nodesTime and credits the increment, whatever the wall clock
 * says. Searches stay deterministic in nodes and independent of the machine.
 * nodesTime must stay below the host's speed, so the GUI's real clock, which
 * runs down slower, never flags.
 */
const nodesTime: number = workerData.nodesTime;
/** the engine's own remaining time under --nodestime, from the game's first go */
let ownMs: number | undefined;

/**
 * The time log: with RATCHET_TIMELOG set to a file, each search appends one JSON
 * line naming the rule that ended it, for tools/time-rules.ts. A line names the
 * engine by its build directory, so two sides of a match share one file. The
 * environment does not reach a worker's container, so it logs on the main box only.
 */
const timeLog = process.env.RATCHET_TIMELOG;
const engineName = basename(join(import.meta.dirname, "../.."));

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

function go(limits: GoLimits): void {
  if (nodesTime) limits = ownClock(limits);
  const { hardMs } = budget(limits, sideToMove);
  // under --nodestime the hard limit is a node count, so the clock reads nodes
  const maxNodes = Math.min(limits.nodes ?? Infinity, nodesTime ? hardMs * nodesTime : Infinity);
  const clock = new IterationClock(hardMs, maxNodes);
  const t0 = performance.now();
  const elapsed = (nodes: number) => (nodesTime ? nodes / nodesTime : performance.now() - t0);
  // the rule that ended the search; "depth" when the search ran to its depth
  let rule = "depth";
  engine.poll = () => {
    if (Atomics.load(stop, 0) !== 0) rule = "stop";
    else if (elapsed(engine.nodes()) >= hardMs) rule = "hard";
    else if (engine.nodes() >= maxNodes) rule = "nodes";
    else return 0;
    return 1;
  };
  engine.onIteration = (depth, score, nodes) => {
    const ms = performance.now() - t0;
    const nps = Math.round((nodes * 1000) / Math.max(ms, 1));
    const pv = engine.pv().map(moveToUci).join(" ");
    port.postMessage(`info depth ${depth} score ${scoreText(score)} nodes ${nodes} nps ${nps} time ${Math.round(ms)} pv ${pv}`);
    if (Atomics.load(stop, 0) !== 0) rule = "stop";
    else if (clock.stopAfter(nodes, elapsed(nodes))) rule = clock.reason;
    else return 0;
    return 1;
  };
  const best = engine.go(Math.min(limits.depth ?? MAX_DEPTH, MAX_DEPTH));
  if (timeLog) {
    const left = sideToMove === 0 ? limits.wtime : limits.btime;
    const line = { engine: engineName, rule, ms: Math.round(elapsed(engine.nodes())), hardMs: Math.round(hardMs), left, depth: engine.depth(), nodes: engine.nodes() };
    appendFileSync(timeLog, JSON.stringify(line) + "\n");
  }
  if (nodesTime && ownMs !== undefined) {
    const inc = (sideToMove === 0 ? limits.winc : limits.binc) ?? 0;
    ownMs = Math.max(1, ownMs - engine.nodes() / nodesTime + inc);
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
  }
});

engine.setPosition(START_FEN, []);
port.postMessage("ready");
