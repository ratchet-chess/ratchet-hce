/**
 * Games from PGN files, replayed into UCI moves for tools that read positions
 * from match records. A game starts from its [FEN] tag or the start position, and
 * each SAN move is matched against the engine's legal moves. The comment after a
 * move ({+0.25/8 0.123s} in fastchess's PGNs) is kept beside it.
 */
import { readFileSync } from "node:fs";
import { parseFen } from "../host/fen.ts";

export interface Game {
  white: string;
  black: string;
  fen: string;
  /** the moves in UCI notation */
  moves: string[];
  /** the comment after each move, "" if none */
  comments: string[];
}

/** what replaying needs from an engine: positions and their legal moves in UCI notation */
export interface Replayer {
  setPosition(fen: string, moves: string[]): void;
  legalUci(): string[];
}

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PIECES = " PNBRQK";
const square = (s: string) => s.charCodeAt(0) - 97 + 8 * (s.charCodeAt(1) - 49);

/** the UCI move that `san` names in the position, with `board` the piece code per square */
function fromSan(san: string, board: Uint8Array, side: number, legal: string[]): string {
  const s = san.replace(/[+#!?]/g, "");
  if (s === "O-O" || s === "O-O-O") {
    const r = side ? "8" : "1";
    return `e${r}${s === "O-O" ? "g" : "c"}${r}`;
  }
  const m = /^([KQRBN])?([a-h])?([1-8])?x?([a-h][1-8])=?([QRBN])?$/.exec(s);
  if (!m) throw new Error(`bad SAN ${san}`);
  const piece = (side << 3) | PIECES.indexOf(m[1] ?? "P");
  const found = legal.filter((u) =>
    u.slice(2, 4) === m[4] && board[square(u)] === piece && (!m[2] || u[0] === m[2]) && (!m[3] || u[1] === m[3])
    && (m[5] ? u[4] === m[5].toLowerCase() : u.length === 4));
  if (found.length !== 1) throw new Error(`SAN ${san} matches ${found.length} legal moves`);
  return found[0];
}

/** applies a legal UCI move to `board`, with castling, en passant and promotion */
function apply(board: Uint8Array, uci: string, side: number): void {
  const f = square(uci);
  const t = square(uci.slice(2));
  const p = board[f];
  if ((p & 7) === 1 && f % 8 !== t % 8 && !board[t]) board[t + (side ? 8 : -8)] = 0;
  if ((p & 7) === 6 && Math.abs(t - f) === 2) {
    const rf = t > f ? f + 3 : f - 4;
    board[t > f ? f + 1 : f - 1] = board[rf];
    board[rf] = 0;
  }
  board[t] = uci[4] ? (side << 3) | PIECES.indexOf(uci[4].toUpperCase()) : p;
  board[f] = 0;
}

/** every game in the PGN file at `path` */
export function readGames(path: string, engine: Replayer): Game[] {
  return parseGames(splitGames(readFileSync(path, "utf8")), engine);
}

/** the text of each game in a PGN file's contents, tags included */
export function splitGames(pgn: string): string[] {
  return pgn.split(/\n\s*\n(?=\[)/);
}

/** each game whose text is in `texts`, as splitGames gives them */
export function parseGames(texts: string[], engine: Replayer): Game[] {
  const out: Game[] = [];
  for (const text of texts) {
    const tag = (t: string) => new RegExp(`^\\[${t} "([^"]*)"\\]`, "m").exec(text)?.[1];
    const fen = tag("FEN") ?? START_FEN;
    const body = text.replace(/^\[.*\]\s*$/gm, "");
    const tokens = [...body.matchAll(/\{([^}]*)\}|(\S+)/g)];
    const f = parseFen(fen);
    const board = f.board;
    let side = f.side;
    const game: Game = { white: tag("White") ?? "", black: tag("Black") ?? "", fen, moves: [], comments: [] };
    for (const [, comment, word] of tokens) {
      if (comment !== undefined) {
        if (game.moves.length) game.comments[game.moves.length - 1] = comment.trim();
        continue;
      }
      if (/^\d+\.+$/.test(word) || /^(1-0|0-1|1\/2-1\/2|\*)$/.test(word)) continue;
      const san = word.replace(/^\d+\.+/, "");
      engine.setPosition(fen, game.moves);
      const uci = fromSan(san, board, side, engine.legalUci());
      apply(board, uci, side);
      game.moves.push(uci);
      game.comments.push("");
      side ^= 1;
    }
    if (game.moves.length || tag("FEN")) out.push(game);
  }
  return out;
}
