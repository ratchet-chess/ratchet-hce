/**
 * Perft throughput benchmark: leaf nodes per second over a fixed workload, per
 * engine and mode, on whichever runtime executes this file. Counts are checked, so
 * a fast wrong answer fails instead of reporting a number.
 *
 *   bun bench/perft.ts | node bench/perft.ts | deno run --allow-read bench/perft.ts
 *   --engine <substring>   only matching engines
 *   --mode make|bulk       only one mode
 *   --verbose              per-position lines
 */
import { ENGINES } from "../test/boards/engines.ts";
import { PERFT_SUITE, type PerftMode } from "../test/boards/suite.ts";
import { WORKLOAD } from "./workload.ts";

const args = process.argv.slice(2);
const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : "");
const filter = opt("--engine");
const modes: PerftMode[] = opt("--mode") ? [opt("--mode") as PerftMode] : ["make", "bulk"];
const verbose = args.includes("--verbose");

function runtime(): string {
  const g = globalThis as { Bun?: { version: string }; Deno?: { version: { deno: string } } };
  if (g.Bun) return `bun ${g.Bun.version}`;
  if (g.Deno) return `deno ${g.Deno.version.deno}`;
  return `node ${process.versions.node}`;
}

console.log(runtime());

for (const engine of ENGINES.filter((e) => e.name.includes(filter))) {
  for (const mode of modes) {
    // warm up the JIT on shallow trees so tiering is not part of the measurement
    for (const c of PERFT_SUITE) engine.perft(c.fen, 3, mode);

    let totalNodes = 0;
    let totalMs = 0;
    for (const c of PERFT_SUITE) {
      const depth = WORKLOAD[c.name];
      const t0 = performance.now();
      const nodes = engine.perft(c.fen, depth, mode);
      const ms = performance.now() - t0;
      if (nodes !== c.counts[depth - 1]) {
        console.log(
          `${engine.name} ${mode} ${c.name} d${depth}: WRONG COUNT ${nodes}, expected ${c.counts[depth - 1]}`,
        );
        process.exit(1);
      }
      totalNodes += nodes;
      totalMs += ms;
      if (verbose) {
        const mnps = (nodes / ms / 1000).toFixed(2).padStart(7);
        console.log(`  ${c.name.padEnd(16)} d${depth} ${nodes.toString().padStart(10)}  ${mnps} Mnps`);
      }
    }
    const mnps = (totalNodes / totalMs / 1000).toFixed(2).padStart(7);
    console.log(`${engine.name.padEnd(18)} ${mode}  ${mnps} Mnps  (${(totalMs / 1000).toFixed(2)}s)`);
  }
}
