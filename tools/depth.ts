/**
 * Mean search depth and time per move, per engine, from the move comments of
 * fastchess PGNs ({+0.25/8 0.123s}: score/depth time). It shows how deep a test
 * condition searches.
 *
 *   bun tools/depth.ts <pgn>...
 */
import { Engine, moveToUci } from "../host/wasm.ts";
import { parseFen } from "../host/fen.ts";
import { readGames } from "./pgn.ts";

const COMMENT = /^[+-]?(?:\d+(?:\.\d+)?|M\d+)\/(\d+) ([\d.]+)s/;
const engine = await Engine.load("core");
const replayer = {
  setPosition: (f: string, m: string[]) => engine.setPosition(f, m),
  legalUci: () => engine.legalMoves().map(moveToUci),
};
for (const path of process.argv.slice(2)) {
  const per = new Map<string, { moves: number; depth: number; secs: number }>();
  for (const g of readGames(path, replayer)) {
    const first = parseFen(g.fen).side;
    g.comments.forEach((c, i) => {
      const m = COMMENT.exec(c);
      if (!m) return;
      const name = (first + i) % 2 === 0 ? g.white : g.black;
      const e = per.get(name) ?? { moves: 0, depth: 0, secs: 0 };
      e.moves++;
      e.depth += Number(m[1]);
      e.secs += Number(m[2]);
      per.set(name, e);
    });
  }
  console.log(path);
  for (const [name, e] of [...per].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(
      `  ${name}: ${e.moves} moves, mean depth ${(e.depth / e.moves).toFixed(2)},` +
        ` mean time ${(e.secs / e.moves).toFixed(3)}s`,
    );
  }
}
