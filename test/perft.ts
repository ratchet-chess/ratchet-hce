/**
 * Perft correctness gate. Runs every engine in both modes over the reference suite
 * and exits non-zero on any mismatch.
 *
 *   bun test/perft.ts                  depths whose expected count is at most 5M
 *   bun test/perft.ts --full           every depth in the suite
 *   bun test/perft.ts --engine x88     only engines whose name contains "x88"
 */
import { ENGINES } from "./boards/engines.ts";
import { PERFT_SUITE, type PerftMode } from "./boards/suite.ts";

const args = process.argv.slice(2);
const full = args.includes("--full");
const filter = args.includes("--engine") ? args[args.indexOf("--engine") + 1] : "";
const limit = full ? Infinity : 5_000_000;
const modes: PerftMode[] = ["make", "bulk"];
let failures = 0;

for (const engine of ENGINES.filter((e) => e.name.includes(filter))) {
  for (const mode of modes) {
    for (const c of PERFT_SUITE) {
      for (let d = 1; d <= c.counts.length; d++) {
        const expected = c.counts[d - 1];
        if (expected > limit) break;
        const got = engine.perft(c.fen, d, mode);
        if (got !== expected) {
          failures++;
          console.log(`FAIL ${engine.name} ${mode} ${c.name} d${d}: got ${got}, expected ${expected}`);
        }
      }
    }
    console.log(`${engine.name} ${mode}: done`);
  }
}

if (failures) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log("all perft counts match");
