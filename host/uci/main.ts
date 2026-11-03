/**
 * UCI front end. Reads commands from stdin and forwards engine work to the search
 * worker, so isready and stop are answered while a search runs.
 *
 *   bun host/uci/main.ts --release <name> [--nodestime N] [--level N] [--tunables <path>]   (or node, deno run -A)
 *
 * --release names the release to play: build/<name>.wasm, from engines/<name>/,
 * or a path to a .wasm file, such as a Texel tuning build.
 *
 * --tunables <path> names a tuning build's options file, tunables.json beside its
 * wasm (tools/texel/write.ts): each element becomes a spin option, which sets it
 * through the build's tuneSet.
 *
 * `eval` (not UCI; Stockfish has one) prints `eval cp <n>`: the release's static
 * eval of the current position for the side to move, as the host reports it.
 *
 * --level N sets the level of every game, for a release whose original has
 * levels and no clock, such as Sargon (1978): one level per match, as its
 * operator chose one, so its time controls are ignored.
 *
 * --nodestime N times the engine in nodes, N per millisecond of its own clock
 * (worker.ts). It is for test matches, so it is a launcher argument, not a UCI
 * option.
 */
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Worker } from "node:worker_threads";
import { START_FEN } from "../wasm.ts";
import type { GoLimits } from "./limits.ts";
import type { WorkerCommand } from "./worker.ts";

const args = process.argv.slice(2);
const release = args.includes("--release") ? args[args.indexOf("--release") + 1] : "";
if (!release) throw new Error("--release needs a release name");
const nodesTime = args.includes("--nodestime") ? Number(args[args.indexOf("--nodestime") + 1]) : 0;
if (!(nodesTime >= 0)) throw new Error("--nodestime needs nodes per millisecond");
const level = args.includes("--level") ? Number(args[args.indexOf("--level") + 1]) : 0;
if (!Number.isInteger(level)) throw new Error("--level needs a whole number");
const stop = new Int32Array(new SharedArrayBuffer(4));
const worker = new Worker(new URL("./worker.ts", import.meta.url), { workerData: { stop, nodesTime, release, level } });
let markReady: () => void;
/** the `id name` the worker sends before it is ready: the own engine's carries its version */
let idName = "Ratchet";
const ready = new Promise<void>((r) => (markReady = r));

worker.on("message", (line: string) => {
  if (line === "ready") markReady();
  else if (line.startsWith("name ")) idName = line.slice(5);
  else process.stdout.write(line + "\n");
});
worker.on("error", (e: Error) => {
  process.stderr.write(`worker error: ${e.stack ?? e}\n`);
  process.exit(1);
});

const send = (c: WorkerCommand) => worker.postMessage(c);

/** the elements a tuning build exposes as UCI options, from --tunables; a release build offers none */
interface Tunable { name: string; id: number; value: number; min: number; max: number }
const tuneFile = args.includes("--tunables") ? args[args.indexOf("--tunables") + 1] : "";
if (tuneFile && !existsSync(tuneFile)) throw new Error(`no tunables file ${tuneFile}`);
const tunables: Tunable[] = tuneFile ? JSON.parse(readFileSync(tuneFile, "utf8")) : [];
const out = (s: string) => process.stdout.write(s + "\n");

function parsePosition(tokens: string[]): WorkerCommand {
  const mi = tokens.indexOf("moves");
  const moves = mi >= 0 ? tokens.slice(mi + 1) : [];
  const head = mi >= 0 ? tokens.slice(0, mi) : tokens;
  const fen = head[0] === "fen" ? head.slice(1).join(" ") : START_FEN;
  return { cmd: "position", fen, moves };
}

function parseGo(tokens: string[]): GoLimits {
  const l: GoLimits = {};
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const v = Number(tokens[i + 1]);
    switch (t) {
      case "wtime": case "btime": case "winc": case "binc":
      case "movestogo": case "movetime": case "depth": case "nodes":
        l[t] = v;
        i++;
        break;
      case "infinite":
        l.infinite = true;
        break;
    }
  }
  return l;
}

function quit(): never {
  Atomics.store(stop, 0, 1);
  Atomics.notify(stop, 0);
  void worker.terminate();
  process.exit(0);
}

const rl = createInterface({ input: process.stdin });
rl.on("close", quit);
for await (const raw of rl) {
  const tokens = raw.trim().split(/\s+/);
  switch (tokens[0]) {
    case "uci":
      await ready;
      out(`id name ${idName}`);
      out("id author the Ratchet contributors");
      out("option name Hash type spin default 16 min 1 max 1024");
      out("option name Threads type spin default 1 min 1 max 1");
      for (const t of tunables) out(`option name ${t.name} type spin default ${t.value} min ${t.min} max ${t.max}`);
      out("uciok");
      break;
    case "isready":
      await ready;
      out("readyok");
      break;
    case "ucinewgame":
      send({ cmd: "newgame" });
      break;
    case "setoption": {
      const name = tokens.slice(tokens.indexOf("name") + 1, tokens.indexOf("value")).join(" ").toLowerCase();
      const value = tokens[tokens.indexOf("value") + 1];
      if (name === "hash") send({ cmd: "hash", mb: Number(value) });
      const t = tunables.find((x) => x.name.toLowerCase() === name);
      if (t) send({ cmd: "tune", id: t.id, value: Number(value) });
      break;
    }
    case "position":
      send(parsePosition(tokens.slice(1)));
      break;
    case "go":
      Atomics.store(stop, 0, 0);
      send({ cmd: "go", limits: parseGo(tokens.slice(1)) });
      break;
    case "eval":
      send({ cmd: "eval" });
      break;
    case "stop":
      Atomics.store(stop, 0, 1);
      Atomics.notify(stop, 0);
      break;
    case "quit":
      quit();
  }
}
