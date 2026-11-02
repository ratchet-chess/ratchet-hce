/**
 * Move-generator gate for releases with a board of their own: each one's leaf
 * counts must equal the core's over the perft suite, after the core's moves are
 * filtered by the release's rules. Sargon (1978) promotes to a queen only; Chess
 * 4.6 refuses O-O-O while b1 or b8 is attacked (its Q1); GNU Chess (1987)
 * promotes to a queen only, and refuses castling while any square from the
 * king's to the rook's is attacked (its Q2). A variant,
 * engines/<release>-<name>/, is gated by its release's entry.
 *
 *   bun test/release-perft.ts [--depth <n>]
 */
import { readdirSync } from "node:fs";
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
  // Queen promotions only; castling needs every square from the king's to the rook's
  // unattacked (Q2: h1, or a1 and b1, count). Its rights are an unmoved king and a rook
  // of its color on the corner (Q1, Q2), loaded by placement: each suite position's
  // FEN rights equal what placement gives. Those rights part from the core's only once
  // a corner rook has left or been taken and a rook of its color stands there again,
  // or once a castled king castles again (Q1). The first needs the castling side's
  // move away and a move back before castling: ply 5 at the earliest, or ply 4 for the
  // second side after a recapture on its corner, which no suite position allows. The
  // second needs a rook of the castled side on b2 (White from g1) or g7 (Black from
  // c8) at the root, which no suite position has. So depth 4 is safe from both.
  {
    name: "gnuchess-1987",
    allows: (m, core) => {
      const promo = (m >>> 12) & 7;
      if (promo) return promo === QUEEN;
      if (!(m & FLAG_CASTLE)) return true;
      const from = m & 63;
      const [lo, hi] = ((m >>> 6) & 63) > from ? [from, from + 3] : [from - 4, from];
      for (let s = lo; s <= hi; s++) if (core.attacked(s, from < 8 ? 1 : 0)) return false;
      return true;
    },
  },
  // Fruit 2.1 generates every move; its perftRelease returns -1 where its board_is_ok
  // or its staged generators disagree
  { name: "fruit-2.1", allows: () => true },
];

// A variant, engines/<release>-<name>/, keeps its release's generator, so it takes its release's entry.
const variants = readdirSync(new URL("../engines/", import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => RELEASES.filter((r) => d.name.startsWith(`${r.name}-`)).map((r) => ({ ...r, name: d.name })));
RELEASES.push(...variants);

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
