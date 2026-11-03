/**
 * Search benchmark: an engine's node signature and search speed over a fixed
 * position set, on whichever runtime executes this file. Each search is a fresh
 * go(depth) from the position, as a fidelity reference runs one, so the node
 * signature is the build's own and must be equal on every runtime.
 *
 *   bun bench/search.ts | node bench/search.ts | deno run --allow-read bench/search.ts
 *   --engine <name>        one engine under engines/ (default: every engine built in build/)
 *   --depth <n>            the depth of every search (default: the engine's entry in DEPTH)
 *   --repeat <n>           timed passes after the warm-up pass (default 3); each pass prints a line
 *   --positions <file>     `name|fen` lines (default bench/positions.txt, the set of the releases' references)
 *
 * The warm-up pass is untimed and also checks that every pass returns the same nodes,
 * so a build that is not deterministic as driven fails instead of reporting a number.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { Engine } from "../host/wasm.ts";

/** depth per engine, chosen by hand so one pass takes seconds, not minutes, under Bun on `local` */
const DEPTH: Record<string, number> = {
  "sargon-1978": 3,
  "chess-4.6": 5,
  "gnuchess-1987": 5,
  "phalanx-xii": 6,
  "fruit-2.1": 7,
  ratchet: 12,
};

const args = process.argv.slice(2);
const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const repeat = Number(opt("--repeat") ?? 3);
const positionsPath = opt("--positions") ?? new URL("./positions.txt", import.meta.url).pathname;
const positions = readFileSync(positionsPath, "utf8")
  .trim()
  .split("\n")
  .map((l) => l.slice(l.indexOf("|") + 1));

const engines = opt("--engine")
  ? [opt("--engine")!]
  : readdirSync(new URL("../engines/", import.meta.url))
      .filter((d) => existsSync(new URL(`../build/${d}.wasm`, import.meta.url)))
      .sort();

/** a variant's depth is its release's: the longest DEPTH key that prefixes its name */
function depthOf(name: string): number {
  const given = opt("--depth");
  if (given) return Number(given);
  const key = Object.keys(DEPTH)
    .filter((k) => name === k || name.startsWith(`${k}-`))
    .sort((a, b) => b.length - a.length)[0];
  if (!key) throw new Error(`no default depth for ${name}: pass --depth`);
  return DEPTH[key];
}

function runtime(): string {
  const g = globalThis as { Bun?: { version: string }; Deno?: { version: { deno: string } } };
  if (g.Bun) return `bun ${g.Bun.version}`;
  if (g.Deno) return `deno ${g.Deno.version.deno}`;
  return `node ${process.versions.node}`;
}

/** one pass over every position: total nodes and milliseconds */
function pass(engine: Engine, depth: number): { nodes: number; ms: number } {
  let nodes = 0;
  let ms = 0;
  for (const fen of positions) {
    engine.setPosition(fen, []);
    const t0 = performance.now();
    engine.go(depth);
    ms += performance.now() - t0;
    nodes += engine.nodes();
  }
  return { nodes, ms };
}

console.log(`${runtime()}, ${positions.length} positions`);

for (const name of engines) {
  const engine = await Engine.load(name);
  const depth = depthOf(name);
  const signature = pass(engine, depth).nodes;
  const times: number[] = [];
  for (let i = 0; i < repeat; i++) {
    const r = pass(engine, depth);
    if (r.nodes !== signature) {
      console.log(`${name} depth ${depth}: NODES DIFFER BETWEEN PASSES, ${r.nodes} after ${signature}`);
      process.exit(1);
    }
    times.push(r.ms);
    console.log(`${name.padEnd(26)} d${depth}  ${String(signature).padStart(11)} nodes  ${(signature / r.ms).toFixed(0).padStart(6)} knps  (${(r.ms / 1000).toFixed(2)}s)`);
  }
  const median = [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)];
  console.log(`${name.padEnd(26)} d${depth}  signature ${signature}, median ${(signature / median).toFixed(0)} knps`);
}
