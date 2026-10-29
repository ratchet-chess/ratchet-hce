/**
 * Incremental-state gate: the hash that make() updates must equal a from-scratch
 * recomputation at every node, after make and after unmake, including positions
 * reached through playMove() game history.
 */
import { Engine, START_FEN } from "../host/wasm.ts";
import { PERFT_SUITE } from "./boards/suite.ts";

const engine = await Engine.load("core");
let bad = 0;
for (const c of PERFT_SUITE) {
  engine.setPosition(c.fen, []);
  const n = engine.checkedWalk(4);
  if (n) console.log(`FAIL ${c.name}: ${n} mismatches`);
  bad += n;
}
// a line with en passant and castling played as game moves
engine.setPosition(START_FEN, "e2e4 g8f6 e4e5 d7d5 e5d6 e7d6 g1f3 b8c6 f1c4 c8e6 e1g1 d8d7".split(" "));
const n = engine.checkedWalk(3);
if (n) console.log(`FAIL game line: ${n} mismatches`);
bad += n;
if (bad) process.exit(1);
console.log("incremental state matches");
