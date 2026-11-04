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
 *   --wasm <file>          with --engine: bench this build of the engine instead of build/<engine>.wasm
 *   --against <ref>        compare --engine's build/<engine>.wasm, the candidate, with the same engine
 *                          built from a git ref, the base, and print the candidate's SPEED for tools/pool.ts
 *
 * The warm-up pass is untimed and also checks that every pass returns the same nodes,
 * so a build that is not deterministic as driven fails instead of reporting a number.
 *
 * With --against, the base is built by tools/snapshot.sh into tmp/bench/<sha>/ and reused
 * after that. Each round benches each build once, in its own fresh process on this runtime,
 * the order swapped every round, so a drift in the machine's speed falls on both alike.
 * One process never hosts both builds: under Bun the module instantiated second ran 2-4%
 * faster than the first with identical bytes (local, 2026-11-03). SPEED is the median over
 * the rounds of the candidate's knps over the base's; --repeat sets the rounds (default 6).
 * Under Deno it needs `--allow-read --allow-run --allow-env`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Engine } from "../host/wasm.ts";
import { baseBuild, median, root, runtime } from "./common.ts";

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
const against = opt("--against");
const repeat = Number(opt("--repeat") ?? (against ? 6 : 3));
const positionsPath = opt("--positions") ?? new URL("./positions.txt", import.meta.url).pathname;
const positions = readFileSync(positionsPath, "utf8")
  .trim()
  .split("\n")
  .map((l) => l.slice(l.indexOf("|") + 1));

const wasmPath = opt("--wasm");
if (wasmPath && !opt("--engine")) throw new Error("--wasm needs --engine");
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

/** one timed pass, in milliseconds; exits if its nodes differ from the signature */
function timed(engine: Engine, depth: number, signature: number, label: string): number {
  const r = pass(engine, depth);
  if (r.nodes !== signature) {
    console.log(`${label} depth ${depth}: NODES DIFFER BETWEEN PASSES, ${r.nodes} after ${signature}`);
    process.exit(1);
  }
  return r.ms;
}

/** one warm-up and one timed pass of `wasm` in a fresh process on this runtime */
function childPass(name: string, wasm: string, depth: number): { signature: number; knps: number } {
  const script = join(root, "bench/search.ts");
  const own = ["--engine", name, "--wasm", wasm, "--depth", String(depth), "--repeat", "1", "--positions", positionsPath];
  const argv = runtime().startsWith("deno") ? ["run", "--allow-read", script, ...own] : [script, ...own];
  const r = spawnSync(process.execPath, argv, { encoding: "utf8" });
  const m = /signature (\d+), median (\d+) knps/.exec(r.stdout);
  if (r.status !== 0 || !m) throw new Error(`bench of ${wasm} failed:\n${r.stdout}${r.stderr}`);
  return { signature: Number(m[1]), knps: Number(m[2]) };
}

console.log(`${runtime()}, ${positions.length} positions`);

if (against) {
  const name = opt("--engine");
  if (!name) throw new Error("--against needs --engine");
  const { sha, wasm } = baseBuild(name, against);
  const depth = depthOf(name);
  const sides = [
    { label: `${sha}:${name}`, wasm, signature: 0, knps: [] as number[] },
    { label: name, wasm: join(root, "build", `${name}.wasm`), signature: 0, knps: [] as number[] },
  ];
  const ratios: number[] = [];
  for (let i = 0; i < repeat; i++) {
    for (const side of i % 2 == 0 ? sides : [...sides].reverse()) {
      const r = childPass(name, side.wasm, depth);
      if (side.signature && r.signature !== side.signature) {
        console.log(`${side.label} depth ${depth}: NODES DIFFER BETWEEN PROCESSES, ${r.signature} after ${side.signature}`);
        process.exit(1);
      }
      side.signature = r.signature;
      side.knps.push(r.knps);
    }
    const [base, cand] = [sides[0].knps[i], sides[1].knps[i]];
    ratios.push(cand / base);
    console.log(`round ${i + 1}  base ${base.toFixed(0).padStart(6)} knps  candidate ${cand.toFixed(0).padStart(6)} knps  ratio ${(cand / base).toFixed(3)}`);
  }
  const same = sides[0].signature === sides[1].signature ? "equal" : "different";
  console.log(`${name} d${depth}  base ${sha} signature ${sides[0].signature}, candidate signature ${sides[1].signature} (${same})`);
  console.log(`SPEED ${median(ratios).toFixed(3)}, median of ${repeat} rounds, from ${Math.min(...ratios).toFixed(3)} to ${Math.max(...ratios).toFixed(3)}`);
} else {
  for (const name of engines) {
    const engine = await Engine.load(wasmPath ?? name);
    const depth = depthOf(name);
    const signature = pass(engine, depth).nodes;
    const times: number[] = [];
    for (let i = 0; i < repeat; i++) {
      const ms = timed(engine, depth, signature, name);
      times.push(ms);
      console.log(`${name.padEnd(26)} d${depth}  ${String(signature).padStart(11)} nodes  ${(signature / ms).toFixed(0).padStart(6)} knps  (${(ms / 1000).toFixed(2)}s)`);
    }
    console.log(`${name.padEnd(26)} d${depth}  signature ${signature}, median ${(signature / median(times)).toFixed(0)} knps`);
  }
}
