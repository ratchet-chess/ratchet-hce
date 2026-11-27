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
 *   --hash <mb>            size the transposition table first (default: the engine's own)
 *   --keep                 play the set as one game: newGame once per pass, then goClock to the depth,
 *                          so the tables fill as they do in play, and its signature is the kept pass's
 *   --positions <file>     `name|fen` lines (default bench/positions.txt, the set of the releases' references)
 *   --warmup <n>           positions in the warm-up pass (default: the whole set). A slice warms the runtime's
 *                          compiler in a fraction of the time, for a quiet host; the whole set also rides out a
 *                          load that comes and goes on this host
 *   --wasm <file>          with --engine: bench this build of the engine instead of build/<engine>.wasm
 *   --against <ref>        compare --engine's build/<engine>.wasm, the candidate, with the same engine
 *                          built from a git ref, the base, and print the candidate's SPEED for ratchet-bench's
 *                          tools/pool.ts
 *
 * The warm-up pass is untimed. Every pass over the whole set must return the same
 * nodes, the warm-up included when it is the whole set, so a build that is not
 * deterministic as driven fails instead of reporting a number.
 *
 * With --against, the base is the ref's tree, built once into tmp/bench/ (bench/common.ts), and reused
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
import { fileURLToPath } from "node:url";
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
const hash = opt("--hash");
const keep = args.includes("--keep");
if (against && (hash || keep))
  throw new Error("--hash and --keep do not apply to --against, whose child passes use the defaults");
const repeat = Number(opt("--repeat") ?? (against ? 6 : 3));
const positionsPath = opt("--positions") ?? fileURLToPath(new URL("./positions.txt", import.meta.url));
const positions = readFileSync(positionsPath, "utf8")
  .trim()
  .split("\n")
  .map((l) => l.slice(l.indexOf("|") + 1));
const warmup = Math.min(positions.length, Math.max(1, Number(opt("--warmup") ?? positions.length)));

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

/** one pass over `set`, every position by default: total nodes and milliseconds */
function pass(engine: Engine, depth: number, set: string[] = positions): { nodes: number; ms: number } {
  let nodes = 0;
  let ms = 0;
  if (keep) engine.newGame();
  for (const fen of set) {
    engine.setPosition(fen, []);
    const t0 = performance.now();
    if (keep) engine.goClock({ depth });
    else engine.go(depth);
    ms += performance.now() - t0;
    nodes += engine.nodes();
  }
  return { nodes, ms };
}

/** one warm-up and one timed pass of `wasm` in a fresh process on this runtime */
function childPass(name: string, wasm: string, depth: number): { signature: number; knps: number } {
  const script = join(root, "bench/search.ts");
  const own = [
    "--engine",
    name,
    "--wasm",
    wasm,
    "--depth",
    String(depth),
    "--repeat",
    "1",
    "--positions",
    positionsPath,
    "--warmup",
    String(warmup),
  ];
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
    for (const side of i % 2 === 0 ? sides : [...sides].reverse()) {
      const r = childPass(name, side.wasm, depth);
      if (side.signature && r.signature !== side.signature) {
        console.log(
          `${side.label} depth ${depth}: NODES DIFFER BETWEEN PROCESSES, ${r.signature} after ${side.signature}`,
        );
        process.exit(1);
      }
      side.signature = r.signature;
      side.knps.push(r.knps);
    }
    const [base, cand] = [sides[0].knps[i], sides[1].knps[i]];
    ratios.push(cand / base);
    console.log(
      `round ${i + 1}  base ${base.toFixed(0).padStart(6)} knps` +
        `  candidate ${cand.toFixed(0).padStart(6)} knps  ratio ${(cand / base).toFixed(3)}`,
    );
  }
  const same = sides[0].signature === sides[1].signature ? "equal" : "different";
  console.log(
    `${name} d${depth}  base ${sha} signature ${sides[0].signature},` +
      ` candidate signature ${sides[1].signature} (${same})`,
  );
  console.log(
    `SPEED ${median(ratios).toFixed(3)}, median of ${repeat} rounds,` +
      ` from ${Math.min(...ratios).toFixed(3)} to ${Math.max(...ratios).toFixed(3)}`,
  );
} else {
  for (const name of engines) {
    const engine = await Engine.load(wasmPath ?? name);
    if (hash) engine.setHash(Number(hash));
    const depth = depthOf(name);
    // the warm-up: its nodes are the signature when it covers the set, else the first timed pass's
    const warm = pass(engine, depth, positions.slice(0, warmup)).nodes;
    let signature = warmup === positions.length ? warm : 0;
    const times: number[] = [];
    for (let i = 0; i < repeat; i++) {
      const r = pass(engine, depth);
      if (signature && r.nodes !== signature) {
        console.log(`${name} depth ${depth}: NODES DIFFER BETWEEN PASSES, ${r.nodes} after ${signature}`);
        process.exit(1);
      }
      signature = r.nodes;
      times.push(r.ms);
      const knps = (signature / r.ms).toFixed(0).padStart(6);
      console.log(
        `${name.padEnd(26)} d${depth}  ${String(signature).padStart(11)} nodes` +
          `  ${knps} knps  (${(r.ms / 1000).toFixed(2)}s)`,
      );
    }
    console.log(
      `${name.padEnd(26)} d${depth}  signature ${signature}, median ${(signature / median(times)).toFixed(0)} knps`,
    );
  }
}
