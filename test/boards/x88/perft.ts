import type { PerftEngine } from "../suite.ts";
import { generateMoves } from "./movegen.ts";
import { MAX_PLY, Position } from "./position.ts";

const MAX_MOVES = 256;
const moves = new Int32Array(MAX_PLY * MAX_MOVES);

function perftRec(pos: Position, depth: number): number {
  const start = pos.ply * MAX_MOVES;
  const end = generateMoves(pos, moves, start);
  let nodes = 0;
  for (let i = start; i < end; i++) {
    const m = moves[i];
    pos.make(m);
    // after make, pos.side is the opponent; reject if the mover's king hangs
    if (!pos.attacked(pos.kingSq[pos.side ^ 1], pos.side)) {
      nodes += depth === 1 ? 1 : perftRec(pos, depth - 1);
    }
    pos.unmake(m);
  }
  return nodes;
}

export const x88: PerftEngine = {
  name: "x88-pseudolegal",
  // pseudo-legal generation must make every move to test it, so both modes cost the same
  perft(fen, depth, _mode) {
    return depth === 0 ? 1 : perftRec(Position.fromFen(fen), depth);
  },
};
