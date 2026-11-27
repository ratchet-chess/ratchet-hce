/**
 * Eval benchmark: the own engine's static eval alone, in nanoseconds per call, on
 * whichever runtime executes this file. It reads a speed edit in seconds, where
 * bench/search.ts takes minutes. bench/search.ts's SPEED stays the result that counts,
 * because a faster eval can still cost the search through the cache.
 *
 *   bun bench/eval.ts | node bench/eval.ts | deno run --allow-read bench/eval.ts
 *   --repeat <n>        timed passes (default 7), or with --against the rounds (default 6)
 *   --reps <n>          passes over the set in one timing (default 400)
 *   --positions <file>  `name|fen` lines (default bench/eval-positions.txt)
 *   --wasm <file>       bench this build instead of build/ratchet.wasm
 *   --against <ref>     compare build/ratchet.wasm, the candidate, with the build of a git
 *                       ref, the base, which must have the eval bench's exports
 *
 * The checksum covers every eval in order. Two builds with one checksum gave one eval
 * over the set, which a speed edit must. Its node signature is still the gate.
 *
 * The set is sampled from where the search calls its eval, over bench/search.ts's
 * positions, so it weighs positions as that bench does. Each timing subtracts a pass
 * that only restores the positions. It does not read a table's size, since its set
 * repeats where a search moves on. Under Deno, --against needs
 * `--allow-read --allow-run --allow-env`.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Engine } from "../host/wasm.ts";
import { baseBuild, median, root, runtime } from "./common.ts";

const args = process.argv.slice(2);
const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const against = opt("--against");
const repeat = Number(opt("--repeat") ?? (against ? 6 : 7));
const reps = Number(opt("--reps") ?? 400);
const positionsPath = opt("--positions") ?? join(root, "bench/eval-positions.txt");
const fens = readFileSync(positionsPath, "utf8")
  .trim()
  .split("\n")
  .map((l) => l.slice(l.indexOf("|") + 1));

/** one timing: the checksum, and nanoseconds per eval */
function timing(engine: Engine): { checksum: number; ns: number } {
  const t0 = performance.now();
  const checksum = engine.evalBenchRun(reps, true);
  const t1 = performance.now();
  engine.evalBenchRun(reps, false);
  const t2 = performance.now();
  return { checksum, ns: ((t1 - t0 - (t2 - t1)) * 1e6) / (reps * fens.length) };
}

/** the median timing of `wasm`, in a fresh process on this runtime */
function child(wasm: string): { checksum: number; ns: number } {
  const script = join(root, "bench/eval.ts");
  const own = ["--wasm", wasm, "--repeat", "3", "--reps", String(reps), "--positions", positionsPath];
  const argv = runtime().startsWith("deno") ? ["run", "--allow-read", script, ...own] : [script, ...own];
  const r = spawnSync(process.execPath, argv, { encoding: "utf8" });
  const m = /checksum (-?\d+), median ([\d.]+) ns/.exec(r.stdout);
  if (r.status !== 0 || !m) throw new Error(`bench of ${wasm} failed:\n${r.stdout}${r.stderr}`);
  return { checksum: Number(m[1]), ns: Number(m[2]) };
}

console.log(`${runtime()}, ${fens.length} positions, ${reps} passes per timing`);

if (against) {
  const { sha, wasm } = baseBuild("ratchet", against);
  const sides = [
    { wasm, checksum: 0, ns: [] as number[] },
    { wasm: join(root, "build/ratchet.wasm"), checksum: 0, ns: [] as number[] },
  ];
  const ratios: number[] = [];
  for (let i = 0; i < repeat; i++) {
    for (const side of i % 2 === 0 ? sides : [...sides].reverse()) {
      const r = child(side.wasm);
      side.checksum = r.checksum;
      side.ns.push(r.ns);
    }
    const [base, cand] = [sides[0].ns[i], sides[1].ns[i]];
    ratios.push(base / cand);
    console.log(
      `round ${i + 1}  base ${base.toFixed(1).padStart(7)} ns` +
        `  candidate ${cand.toFixed(1).padStart(7)} ns  speed ${(base / cand).toFixed(3)}`,
    );
  }
  const same = sides[0].checksum === sides[1].checksum ? "equal" : "DIFFERENT";
  console.log(`base ${sha} checksum ${sides[0].checksum}, candidate checksum ${sides[1].checksum} (${same})`);
  console.log(
    `eval speed ${median(ratios).toFixed(3)}, median of ${repeat} rounds,` +
      ` from ${Math.min(...ratios).toFixed(3)} to ${Math.max(...ratios).toFixed(3)}`,
  );
} else {
  const engine = await Engine.load(opt("--wasm") ?? "ratchet");
  engine.evalBenchSet(fens);
  // runtimes optimize a wasm function after it has run a while
  timing(engine);
  timing(engine);
  const runs: number[] = [];
  let checksum = 0;
  for (let i = 0; i < repeat; i++) {
    const r = timing(engine);
    if (i && r.checksum !== checksum) {
      console.log(`CHECKSUM DIFFERS BETWEEN PASSES, ${r.checksum} after ${checksum}`);
      process.exit(1);
    }
    checksum = r.checksum;
    runs.push(r.ns);
    console.log(`pass ${i + 1}  ${r.ns.toFixed(1).padStart(7)} ns per eval`);
  }
  console.log(`checksum ${checksum}, median ${median(runs).toFixed(1)} ns per eval`);
}
