/**
 * The conversion suite: won basic endings the engine must mate from, and the
 * score of a suite run. Used by ratchet-bench's tools/mate-suite.sh.
 *
 *   bun tools/mate-suite.ts positions <per-ending>   EPD on stdout
 *   bun tools/mate-suite.ts score <pgn> <engine>     mate rate per ending
 *
 * Every position has White to move with the extra piece, so with fastchess
 * -noswap the engine listed first is always the side that must mate. A fixed
 * seed keeps the set identical between runs, so rates are comparable.
 */
import { readFileSync } from "node:fs";

/** share of positions that must end in mate for one run to pass */
const PASS_RATE = 1;
const SEED = 0x5eed;

const ENDINGS = [
  { name: "KQK", piece: "Q", dirs: [-9, -8, -7, -1, 1, 7, 8, 9] },
  { name: "KRK", piece: "R", dirs: [-8, -1, 1, 8] },
];

/** mulberry32: a small seeded PRNG, so the suite needs no stored position file */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const file = (s: number) => s & 7;
const rank = (s: number) => s >> 3;
const adjacent = (a: number, b: number) => Math.max(Math.abs(file(a) - file(b)), Math.abs(rank(a) - rank(b))) <= 1;

/** true if a slider on `from` attacks `target` along `dirs`, with `blocker` the only other piece in the way */
function slides(from: number, target: number, blocker: number, dirs: number[]): boolean {
  for (const d of dirs) {
    let s = from;
    for (;;) {
      const next = s + d;
      if (next < 0 || next > 63 || Math.abs(file(next) - file(s)) > 1) break;
      if (next === target) return true;
      if (next === blocker) break;
      s = next;
    }
  }
  return false;
}

function fen(wk: number, piece: string, ps: number, bk: number): string {
  const board: string[] = Array(64).fill("");
  board[wk] = "K";
  board[ps] = piece;
  board[bk] = "k";
  const ranks: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = "";
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[r * 8 + f];
      if (!p) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      row += p;
      empty = 0;
    }
    ranks.push(row + (empty || ""));
  }
  return `${ranks.join("/")} w - - 0 1`;
}

function positions(perEnding: number): string[] {
  const next = rng(SEED);
  const sq = () => Math.floor(next() * 64);
  const out: string[] = [];
  for (const e of ENDINGS) {
    const seen = new Set<string>();
    while (seen.size < perEnding) {
      const wk = sq();
      const ps = sq();
      const bk = sq();
      if (wk === ps || wk === bk || ps === bk || adjacent(wk, bk)) continue;
      // White is to move, so Black must not be in check
      if (slides(ps, bk, wk, e.dirs)) continue;
      const f = fen(wk, e.piece, ps, bk);
      if (seen.has(f)) continue;
      seen.add(f);
      out.push(`${f.split(" ").slice(0, 4).join(" ")} id "${e.name}-${seen.size}";`);
    }
  }
  return out;
}

function score(pgnPath: string, engine: string): void {
  const pgn = readFileSync(pgnPath, "utf8");
  const tally = new Map<string, { games: number; mates: number; other: Map<string, number> }>();
  for (const game of pgn.split(/\n(?=\[Event )/)) {
    const tag = (t: string) => game.match(new RegExp(`\\[${t} "([^"]*)"\\]`))?.[1];
    const start = tag("FEN");
    if (!start || tag("White") !== engine) continue;
    const ending = ENDINGS.find((e) => start.split(" ")[0].includes(e.piece))!.name;
    const t = tally.get(ending) ?? { games: 0, mates: 0, other: new Map() };
    t.games++;
    // fastchess appends how the game ended to the last move's comment: "{+M1/126 0.011s, White mates}"
    const end = [...game.matchAll(/\{([^{}]*)\}/g)].at(-1)?.[1].split(", ").at(-1)?.trim() ?? "unknown";
    if (end === "White mates") t.mates++;
    else t.other.set(end, (t.other.get(end) ?? 0) + 1);
    tally.set(ending, t);
  }
  let games = 0;
  let mates = 0;
  for (const [name, t] of tally) {
    games += t.games;
    mates += t.mates;
    const other = [...t.other].map(([k, v]) => `${v} ${k}`).join(", ");
    console.log(`${name}: ${t.mates}/${t.games} mated (${((100 * t.mates) / t.games).toFixed(1)}%)${other ? `; ${other}` : ""}`);
  }
  if (!games) throw new Error(`no games with ${engine} as White in ${pgnPath}`);
  const rate = mates / games;
  console.log(`${engine}: ${mates}/${games} mated (${(100 * rate).toFixed(1)}%), ${rate >= PASS_RATE ? "PASS" : "FAIL"} at ${100 * PASS_RATE}%`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "positions") console.log(positions(Number(args[0])).join("\n"));
else if (cmd === "score") score(args[0], args[1]);
else throw new Error("usage: bun tools/mate-suite.ts positions <per-ending> | score <pgn> <engine>");
