/**
 * The own engine's window gate. On the plain configuration with the table off,
 * the search is fail-soft alpha-beta over one fixed tree, the form Nipkow verified
 * (Alpha-Beta Pruning, Archive of Formal Proofs, 2024). So a windowed search must
 * be in Fishburn's relation to the full-window value at the same depth: a result
 * at or below alpha is an upper bound on the value, one at or above beta a lower
 * bound, and one inside the window is the value. The plain configuration is every
 * block of tools/texel/maps/ratchet-flags.json at its off value, set in the map's
 * tuning build, so no pruning, reduction, extension, correction or delta cut runs.
 *
 * Positions: the search bench's set, the perft suite, and the mate band: the
 * positions along the engine's own conversions of the conversion suite's starts
 * from the first with a mate score. Windows per position and depth: null windows
 * at the value and beside it, the value with a margin on one or both sides, each
 * bound alone, and random windows over the score range. The gate stops at the
 * first mismatch.
 *
 *   bun test/window.ts [--depth <n>] [--random <n>] [--seed <n>] [--all] [--on <blocks>] [--table]
 *
 * --depth: the deepest depth, each from 1 (default 4). --random: random windows per
 * position and depth (default 2). --seed: the random windows' seed. --all: report
 * every mismatch, not only the first. --on: map blocks left at their defaults,
 * comma-separated, to see the gate fail on a heuristic: a positive control. --table:
 * searches keep their table, which the relation does not cover; a reading of its effect.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Engine, MATE, moveToUci } from "../host/wasm.ts";
import { loadMap } from "../tools/texel/map.ts";
import { buildTuning } from "../tools/texel/write.ts";
import { PERFT_SUITE } from "./boards/suite.ts";

const args = process.argv.slice(2);
const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const maxDepth = Number(opt("--depth") ?? 4);
const randomWindows = Number(opt("--random") ?? 2);
const all = args.includes("--all");
const on = new Set((opt("--on") ?? "").split(",").filter(Boolean));
const table = args.includes("--table");
const root = join(import.meta.dirname, "..");

/** the search's full window, engines/ratchet/search.ts INF */
const INF = MATE + 1;
/** scores beyond this are mates, engines/ratchet/search.ts MATE_IN_MAX */
const MATE_IN_MAX = MATE - 256;
/** the depth of the conversions that give the mate band, and the plies one may run */
const CONVERSION_DEPTH = 8;
const CONVERSION_PLIES = 120;
/** margins around the value, in the engine's unit: a pawn is 400 */
const MARGINS = [4, 64, 1024];

/** mulberry32: a small seeded generator, so a run repeats */
let seed = Number(opt("--seed") ?? 0x5eed);
function random(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (lo: number, hi: number) => lo + Math.floor(random() * (hi - lo + 1));

/** Fishburn's relation: a fail-soft result `y` of the window (a, b) against the tree value `v` */
function fishburn(y: number, v: number, a: number, b: number): boolean {
  return y <= a ? v <= y : y >= b ? v >= y : v === y;
}

/** the windows to search at a position whose value is `v` */
function windowsAt(v: number): [number, number][] {
  const out: [number, number][] = [];
  const push = (a: number, b: number) => {
    a = Math.max(-INF, a);
    b = Math.min(INF, b);
    if (a < b) out.push([a, b]);
  };
  push(v - 1, v);
  push(v, v + 1);
  push(v - 1, v + 1);
  push(v - 8, v - 7);
  push(v + 7, v + 8);
  for (const m of MARGINS) {
    push(v - m, v + m);
    push(v - m, v);
    push(v, v + m);
  }
  push(-INF, v);
  push(v, INF);
  for (let i = 0; i < randomWindows; i++) {
    const a = between(-INF, INF - 1);
    push(a, between(a + 1, INF));
  }
  return out;
}

interface Position {
  name: string;
  fen: string;
  moves: string[];
}

const map = loadMap(join(root, "tools/texel/maps/ratchet-flags.json"));
const engine = await Engine.load(buildTuning(map));
for (const name of on)
  if (!map.elements.some((e) => e.block === name)) throw new Error(`--on ${name}: no such block in the map`);
const flags = map.elements.filter((e) => e.off !== undefined && !on.has(e.block));
for (const e of flags) engine.tune(e.id, e.off!);

/** the mate band: each conversion start played out by the engine, kept from its first mate score */
function mateBand(): Position[] {
  const r = spawnSync("bun", [join(root, "tools/mate-suite.ts"), "positions", "3"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`mate-suite positions failed:\n${r.stderr}`);
  const out: Position[] = [];
  for (const line of r.stdout.trim().split("\n")) {
    const fen = `${line.split(" id ")[0]} 0 1`;
    const name = /id "([^"]+)"/.exec(line)?.[1] ?? fen;
    const moves: string[] = [];
    for (let ply = 0; ply < CONVERSION_PLIES; ply++) {
      engine.setPosition(fen, moves);
      const m = engine.go(CONVERSION_DEPTH);
      if (!m) break;
      if (Math.abs(engine.score()) >= MATE_IN_MAX) out.push({ name: `${name} ply ${ply}`, fen, moves: [...moves] });
      moves.push(moveToUci(m));
    }
  }
  return out;
}

const bench: Position[] = readFileSync(join(root, "bench/positions.txt"), "utf8")
  .trim()
  .split("\n")
  .map((l) => ({ name: l.slice(0, l.indexOf("|")), fen: l.slice(l.indexOf("|") + 1), moves: [] }));
const perft: Position[] = PERFT_SUITE.map((c) => ({ name: c.name, fen: c.fen, moves: [] }));
const mates = mateBand();
if (mates.length === 0) {
  console.log("FAIL no mate-band position: the conversions reached no mate score");
  process.exit(1);
}

const sets: [string, Position[]][] = [
  ["bench", bench],
  ["perft", perft],
  ["mate band", mates],
];
let searches = 0;
let bad = 0;
const started = performance.now();
for (const [label, positions] of sets) {
  for (const p of positions) {
    for (let depth = 1; depth <= maxDepth; depth++) {
      engine.setPosition(p.fen, p.moves);
      const v = engine.goWindow(-INF, INF, depth, table);
      searches++;
      for (const [a, b] of windowsAt(v)) {
        engine.setPosition(p.fen, p.moves);
        const y = engine.goWindow(a, b, depth, table);
        searches++;
        if (fishburn(y, v, a, b)) continue;
        bad++;
        const pos = p.moves.length ? `${p.fen} moves ${p.moves.join(" ")}` : p.fen;
        console.log(`FAIL ${p.name} d${depth} (${a}, ${b}): got ${y}, value ${v}; ${pos}`);
        if (!all) process.exit(1);
      }
    }
  }
  console.log(`${label}: ${positions.length} positions done`);
}
const seconds = ((performance.now() - started) / 1000).toFixed(0);
if (bad) {
  console.log(`${bad} mismatch(es) in ${searches} searches`);
  process.exit(1);
}
const totalPositions = sets.reduce((n, [, p]) => n + p.length, 0);
const enabled = on.size ? ` (${[...on].join(", ")} on)` : "";
console.log(
  `window gate: ${searches} searches over ${totalPositions} positions at depths 1 to ${maxDepth},` +
    ` ${flags.length} flags off${enabled}, table ${table ? "on" : "off"},` +
    ` all in Fishburn's relation (${seconds} s)`,
);
