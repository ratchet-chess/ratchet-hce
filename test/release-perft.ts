/**
 * Move-generator gate for releases with a board of their own: each one's leaf
 * counts must equal the core's over the perft suite, after the core's moves are
 * filtered by the release's rules. Sargon (1978) promotes to a queen only.
 *
 *   bun test/release-perft.ts [--depth <n>]
 */
import { Engine, moveToUci } from "../host/wasm.ts";
import { PERFT_SUITE } from "./boards/suite.ts";

const args = process.argv.slice(2);
const maxDepth = args.includes("--depth") ? Number(args[args.indexOf("--depth") + 1]) : 4;

/** each release with its own generator, and the core moves its rules allow */
const RELEASES: { name: string; allows: (uci: string) => boolean }[] = [
  { name: "sargon-1978", allows: (uci) => uci.length === 4 || uci[4] === "q" },
];

const core = await Engine.load("core");
function coreCount(fen: string, moves: string[], depth: number, allows: (uci: string) => boolean): number {
  core.setPosition(fen, moves);
  const legal = core.legalMoves().map(moveToUci).filter(allows);
  if (depth === 1) return legal.length;
  let n = 0;
  for (const uci of legal) n += coreCount(fen, [...moves, uci], depth - 1, allows);
  return n;
}

let failures = 0;
for (const r of RELEASES) {
  const engine = await Engine.load(r.name);
  for (const c of PERFT_SUITE) {
    for (let d = 1; d <= maxDepth; d++) {
      const want = coreCount(c.fen, [], d, r.allows);
      const got = engine.perftRelease(c.fen, d);
      if (got !== want) {
        failures++;
        console.log(`FAIL ${r.name} ${c.name} d${d}: got ${got}, core ${want}`);
      }
    }
  }
  console.log(`${r.name}: ${failures ? "FAIL" : "ok"} to depth ${maxDepth}`);
}
process.exit(failures ? 1 : 0);
