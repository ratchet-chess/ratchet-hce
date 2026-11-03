/**
 * The own engine's eval gate:
 * - mirror: the eval of a position equals the eval of its color mirror (ranks
 *   flipped, colors and the side to move swapped), in the engine's own unit;
 * - incremental: the material and PSQT sum and the correction keys that
 *   the search keeps equal their from-scratch values at every node of a walk,
 *   after make and after unmake, and so does the eval through the king-pawn
 *   table.
 *
 * Positions: the search bench's set and the perft suite, each with every
 * position one legal move away.
 *
 *   bun test/eval-mirror.ts
 */
import { readFileSync } from "node:fs";
import { Engine, moveToUci } from "../host/wasm.ts";
import { PERFT_SUITE } from "./boards/suite.ts";

const ENGINE = "ratchet";

/** a FEN's color mirror */
function mirror(fen: string): string {
  const [placement, stm, castling, ep, ...rest] = fen.split(" ");
  const swapCase = (s: string) => s.replace(/[a-zA-Z]/g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()));
  const board = swapCase(placement.split("/").reverse().join("/"));
  const rights = castling === "-" ? "-" : [...swapCase(castling)].sort((a, b) => "KQkq".indexOf(a) - "KQkq".indexOf(b)).join("");
  const square = ep === "-" ? "-" : ep[0] + (9 - Number(ep[1]));
  return [board, stm === "w" ? "b" : "w", rights, square, ...rest].join(" ");
}

const engine = await Engine.load(ENGINE);
const bench = readFileSync(new URL("../bench/positions.txt", import.meta.url), "utf8")
  .trim()
  .split("\n")
  .map((l) => l.slice(l.indexOf("|") + 1));
const roots = [...bench, ...PERFT_SUITE.map((c) => c.fen)];

let checked = 0;
let bad = 0;
for (const fen of roots) {
  engine.setPosition(fen, []);
  const lines: string[][] = [[], ...engine.legalMoves().map((m) => [moveToUci(m)])];
  for (const moves of lines) {
    engine.setPosition(fen, moves);
    const a = engine.evaluateUnits();
    // the mirror of a position after moves is the mirrored root after the mirrored moves
    const flip = (u: string) => u.replace(/[1-8]/g, (r) => String(9 - Number(r)));
    engine.setPosition(mirror(fen), moves.map(flip));
    const b = engine.evaluateUnits();
    checked++;
    if (a !== b) {
      bad++;
      if (bad <= 10) console.log(`FAIL mirror ${fen} ${moves.join(" ")}: ${a} against ${b}`);
    }
  }
}

let walkBad = 0;
for (const c of PERFT_SUITE) {
  engine.setPosition(c.fen, []);
  const n = engine.evalWalk(3);
  if (n) console.log(`FAIL incremental ${c.name}: ${n} mismatches`);
  walkBad += n;
}

if (bad || walkBad) process.exit(1);
console.log(`${ENGINE}: eval mirrors over ${checked} positions; the incremental sum and keys match at every node`);
