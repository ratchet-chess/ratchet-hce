/**
 * Reference perft positions with known leaf counts, from the chessprogramming wiki
 * "Perft Results" page. Every board representation must reproduce these exactly
 * before any of its speed numbers count.
 */
export interface PerftCase {
  name: string;
  fen: string;
  /** counts[d - 1] is the leaf count at depth d */
  counts: number[];
}

export const PERFT_SUITE: PerftCase[] = [
  {
    name: "startpos",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    counts: [20, 400, 8902, 197281, 4865609, 119060324],
  },
  {
    name: "kiwipete",
    fen: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    counts: [48, 2039, 97862, 4085603, 193690690],
  },
  {
    name: "pos3-endgame-ep",
    fen: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
    counts: [14, 191, 2812, 43238, 674624, 11030083],
  },
  {
    name: "pos4-promotions",
    fen: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    counts: [6, 264, 9467, 422333, 15833292],
  },
  {
    name: "pos5",
    fen: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
    counts: [44, 1486, 62379, 2103487, 89941194],
  },
  {
    name: "pos6-middlegame",
    fen: "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
    counts: [46, 2079, 89890, 3894594, 164075551],
  },
];

/**
 * How the last ply is counted.
 * - "make": every leaf move is made and unmade, which is the cost a search pays.
 * - "bulk": the last ply counts legal moves without making them, which isolates
 *   move generation. A pseudo-legal generator still has to make each move to test it.
 */
export type PerftMode = "make" | "bulk";

/**
 * A board representation under test. The whole perft recursion lives inside the
 * implementation, so the harness never calls through this interface on the hot path.
 */
export interface PerftEngine {
  name: string;
  /** leaf count of `fen` searched to `depth` */
  perft(fen: string, depth: number, mode: PerftMode): number;
}
