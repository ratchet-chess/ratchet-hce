/**
 * Move-generator gate for releases with a board of their own: each one's leaf
 * counts must equal the core's over the perft suite, after the core's moves are
 * filtered by the release's rules. Sargon (1978) promotes to a queen only; Chess
 * 4.6 refuses O-O-O while b1 or b8 is attacked (its Q1).
 *
 *   bun test/release-perft.ts [--depth <n>]
 */
import { Engine, moveToUci } from "../host/wasm.ts";
import { PERFT_SUITE } from "./boards/suite.ts";

const args = process.argv.slice(2);
const maxDepth = args.includes("--depth") ? Number(args[args.indexOf("--depth") + 1]) : 4;

const QUEEN = 5;
const FLAG_CASTLE = 1 << 16;

/** each release with its own generator, and the core moves its rules allow in the core's current position */
const RELEASES: { name: string; allows: (move: number, core: Engine) => boolean }[] = [
  { name: "sargon-1978", allows: (m) => ((m >>> 12) & 7) === 0 || ((m >>> 12) & 7) === QUEEN },
  // Phalanx XII promotes to every piece; its perftRelease takes the core's castling rights
  { name: "phalanx-xii", allows: () => true },
  // O-O-O, the king's move to the c-file, needs the b-file square unattacked too
  {
    name: "chess-4.6",
    allows: (m, core) => !(m & FLAG_CASTLE) || ((m >>> 6) & 7) !== 2 || !core.attacked(((m >>> 6) & 63) - 1, ((m >>> 6) & 63) < 8 ? 1 : 0),
  },
];

const core = await Engine.load("core");
function coreCount(fen: string, moves: string[], depth: number, allows: (move: number, core: Engine) => boolean): number {
  core.setPosition(fen, moves);
  const legal = core.legalMoves().filter((m) => allows(m, core)).map(moveToUci);
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
