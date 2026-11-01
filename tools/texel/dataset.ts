/**
 * Datasets: labeled positions, independent of any subject. A set from the
 * allow-list (sets.json, the sets whose terms are open: decision
 * licensed-sets-only) is read by its format's reader, merged where a position
 * repeats, split into training and validation by a hash of the position, and packed
 * into one file that every later step reads.
 *
 * Packed file: "TXDS", a u32 header length, a JSON header, zero padding to 8 bytes,
 * then 48-byte records, little-endian:
 *
 *   0-31  board, one 4-bit piece code per square, square 2i in the low nibble
 *   32    side to move (0 White)      33  castling rights (host/fen.ts bits)
 *   34    en passant square, 255 none  35  flags: bit 0 = validation
 *   36    halfmove clock, at most 255  37  zero
 *   38-39 full-move number (u16)
 *   40-43 result from White's view, 0 to 1 (f32; NaN when the set has none)
 *   44-47 score in centipawns from White's view (f32; NaN when the set has none)
 *
 * Merged positions take the mean of their labels, so a result may lie between 0,
 * 1/2 and 1.
 */
import { createHash } from "node:crypto";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { formatFen, parseFen } from "../../host/fen.ts";
import type { Engine } from "../../host/wasm.ts";
import { moveToUci } from "../../host/wasm.ts";
import { parseGames, splitGames } from "../pgn.ts";

export interface Position {
  board: Uint8Array;
  side: number;
  castling: number;
  /** -1 for none */
  ep: number;
  halfmove: number;
  fullmove: number;
  result: number;
  score: number;
  valid: boolean;
}

export interface SetEntry {
  name: string;
  url: string;
  sha256: string;
  license: string;
  /** the downloaded file's name in /ws/downloads */
  archive: string;
  /** the file inside the archive, when the download is an archive */
  member?: string;
  format: Format;
  /** reader options, such as PGN sampling */
  options?: Record<string, number | string>;
}

export type Format = "epd-c9" | "fen-result" | "fen-score-result" | "lichess-eval" | "pgn";

export interface Header {
  format: "texel-dataset";
  version: 1;
  record: 48;
  count: number;
  name: string;
  source: { set: string; url: string; sha256: string; license: string; member?: string; reader: Format; options?: Record<string, number | string> };
  validPermille: number;
  resolver: "none" | "neutral";
  counts: Record<string, number>;
}

export const RECORD = 48;

/** the lines of a text file, gunzipped when its name ends in .gz */
async function* lines(path: string): AsyncGenerator<string> {
  const raw = createReadStream(path);
  const input = path.endsWith(".gz") ? raw.pipe(createGunzip()) : raw;
  for await (const line of createInterface({ input, crlfDelay: Infinity })) yield line;
}

const RESULTS: Record<string, number> = { "1-0": 1, "0-1": 0, "1/2-1/2": 0.5 };

function position(fen: string, result: number, score: number): Position {
  const f = parseFen(fen);
  return { ...f, result, score, valid: false };
}

/**
 * The positions of a set file. `core` replays PGN games and tests for check.
 * Readers:
 * - epd-c9: four FEN fields, then `c9 "1-0";` (zurichess).
 * - fen-result: a FEN, then `[1.0]`, `[0.5]` or `[0.0]`.
 * - fen-score-result: `FEN; score; [result]`, the score in centipawns; option
 *   scoreView "white" (default) or "side" for the side to move's view.
 * - lichess-eval: lichess_db_eval JSON lines; the deepest eval's first line, cp
 *   only (mates skipped), which Lichess gives from White's view.
 * - pgn: positions sampled from games, labeled with the game's result. Options:
 *   skip (plies from the start, 8), perGame (at most, 10); positions in check are
 *   left out, and the chosen plies are those with the lowest hash, so a sample is
 *   the same on every run.
 */
export async function* readSet(path: string, format: Format, options: Record<string, number | string>, core: Engine): AsyncGenerator<Position> {
  if (format === "pgn") {
    yield* readPgn(path, options, core);
    return;
  }
  for await (const line of lines(path)) {
    const t = line.trim();
    if (!t) continue;
    if (format === "epd-c9") {
      const m = /^(\S+ [wb] \S+ \S+)(?: (\d+) (\d+))?\s.*\bc9\s+"([^"]+)"/.exec(t);
      if (!m || !(m[4] in RESULTS)) continue;
      yield position(`${m[1]} ${m[2] ?? 0} ${m[3] ?? 1}`, RESULTS[m[4]], NaN);
    } else if (format === "fen-result") {
      const m = /^(.*?)\s*\[\s*([01](?:\.\d+)?)\s*\]\s*$/.exec(t);
      if (m) yield position(m[1], Number(m[2]), NaN);
    } else if (format === "fen-score-result") {
      const [fen, score, result] = t.split(";").map((x) => x.trim());
      const p = position(fen, result ? Number(result.replace(/[[\]]/g, "")) : NaN, Number(score));
      if (options.scoreView === "side" && p.side === 1) p.score = -p.score;
      yield p;
    } else if (format === "lichess-eval") {
      const j = JSON.parse(t) as { fen: string; evals: { depth: number; pvs: { cp?: number; mate?: number }[] }[] };
      const deepest = [...j.evals].sort((a, b) => b.depth - a.depth)[0];
      const cp = deepest?.pvs[0]?.cp;
      if (cp !== undefined) yield position(`${j.fen} 0 1`, NaN, cp);
    }
  }
}

async function* readPgn(path: string, options: Record<string, number | string>, core: Engine): AsyncGenerator<Position> {
  const skip = Number(options.skip ?? 8);
  const perGame = Number(options.perGame ?? 10);
  const replayer = { setPosition: (f: string, m: string[]) => core.setPosition(f, m), legalUci: () => core.legalMoves().map(moveToUci) };
  for (const text of splitGames(readFileSync(path, "utf8"))) {
    const result = RESULTS[/^\[Result "([^"]*)"\]/m.exec(text)?.[1] ?? ""];
    if (result === undefined) continue;
    let game;
    try {
      [game] = parseGames([text], replayer);
    } catch {
      continue;
    }
    if (!game) continue;
    const plies: { fen: string; key: number }[] = [];
    for (let i = skip; i <= game.moves.length; i++) {
      core.setPosition(game.fen, game.moves.slice(0, i));
      if (core.inCheck()) continue;
      const p = core.corePosition();
      const fen = formatFen({ ...p, ep: p.ep === 64 ? -1 : p.ep, fullmove: 1 });
      plies.push({ fen, key: fnv(fen) });
    }
    plies.sort((a, b) => a.key - b.key);
    for (const p of plies.slice(0, perGame)) yield position(p.fen, result, NaN);
  }
}

/** FNV-1a over a string, as an unsigned 32-bit number */
function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** the identity of a position: its board, side, castling and en passant */
function keyOf(p: Position): string {
  return `${Buffer.from(p.board).toString("latin1")}${p.side}${p.castling}${p.ep}`;
}

/**
 * Merges repeated positions (labels averaged) and marks the validation split:
 * a position is in it when its key's hash, modulo 1000, is below `validPermille`.
 * Returns the merged positions and how many were merged away.
 */
export function mergeAndSplit(positions: Iterable<Position>, validPermille: number): { positions: Position[]; merged: number } {
  const byKey = new Map<string, { p: Position; r: number; rn: number; s: number; sn: number }>();
  let n = 0;
  for (const p of positions) {
    n++;
    const k = keyOf(p);
    const e = byKey.get(k) ?? { p, r: 0, rn: 0, s: 0, sn: 0 };
    if (!Number.isNaN(p.result)) { e.r += p.result; e.rn++; }
    if (!Number.isNaN(p.score)) { e.s += p.score; e.sn++; }
    byKey.set(k, e);
  }
  const out: Position[] = [];
  for (const [k, e] of byKey) {
    out.push({ ...e.p, result: e.rn ? e.r / e.rn : NaN, score: e.sn ? e.s / e.sn : NaN, valid: fnv(k) % 1000 < validPermille });
  }
  return { positions: out, merged: n - out.length };
}

export function writeDataset(path: string, header: Omit<Header, "count" | "format" | "version" | "record">, positions: Position[]): void {
  // the written count and format come last, so a header carried over from another file cannot override them
  const full: Header = { ...header, format: "texel-dataset", version: 1, record: RECORD, count: positions.length };
  const json = Buffer.from(JSON.stringify(full));
  const start = Math.ceil((8 + json.length) / 8) * 8;
  const buf = Buffer.alloc(start + positions.length * RECORD);
  buf.write("TXDS", 0, "latin1");
  buf.writeUInt32LE(json.length, 4);
  json.copy(buf, 8);
  let o = start;
  for (const p of positions) {
    for (let i = 0; i < 32; i++) buf[o + i] = p.board[2 * i] | (p.board[2 * i + 1] << 4);
    buf[o + 32] = p.side;
    buf[o + 33] = p.castling;
    buf[o + 34] = p.ep < 0 ? 255 : p.ep;
    buf[o + 35] = p.valid ? 1 : 0;
    buf[o + 36] = Math.min(255, p.halfmove);
    buf.writeUInt16LE(Math.min(65535, p.fullmove), o + 38);
    buf.writeFloatLE(p.result, o + 40);
    buf.writeFloatLE(p.score, o + 44);
    o += RECORD;
  }
  writeFileSync(path, buf);
}

/** a dataset's header and its records as raw bytes, `count` records of RECORD bytes, copied into shared memory so workers can read them */
export function readDatasetRaw(path: string): { header: Header; records: Uint8Array } {
  const buf = readFileSync(path);
  if (buf.toString("latin1", 0, 4) !== "TXDS") throw new Error(`${path} is not a Texel dataset`);
  const len = buf.readUInt32LE(4);
  const header = JSON.parse(buf.toString("utf8", 8, 8 + len)) as Header;
  const start = Math.ceil((8 + len) / 8) * 8;
  const records = new Uint8Array(new SharedArrayBuffer(header.count * RECORD));
  records.set(buf.subarray(start, start + header.count * RECORD));
  return { header, records };
}

/** record `n` of `records`, decoded into `out` (its board reused) */
export function decodeRecord(records: Uint8Array, n: number, out: Position): Position {
  const o = n * RECORD;
  const v = new DataView(records.buffer, records.byteOffset);
  for (let i = 0; i < 32; i++) {
    out.board[2 * i] = records[o + i] & 15;
    out.board[2 * i + 1] = records[o + i] >> 4;
  }
  out.side = records[o + 32];
  out.castling = records[o + 33];
  out.ep = records[o + 34] === 255 ? -1 : records[o + 34];
  out.valid = (records[o + 35] & 1) === 1;
  out.halfmove = records[o + 36];
  out.fullmove = v.getUint16(o + 38, true);
  out.result = v.getFloat32(o + 40, true);
  out.score = v.getFloat32(o + 44, true);
  return out;
}

/** an empty position to decode into */
export function blankPosition(): Position {
  return { board: new Uint8Array(64), side: 0, castling: 0, ep: -1, halfmove: 0, fullmove: 1, result: NaN, score: NaN, valid: false };
}

export function readDataset(path: string): { header: Header; positions: Position[] } {
  const { header, records } = readDatasetRaw(path);
  const positions: Position[] = [];
  for (let n = 0; n < header.count; n++) positions.push(decodeRecord(records, n, blankPosition()));
  return { header, positions };
}

/** a position as a FEN */
export function fenOf(p: Position): string {
  return formatFen(p);
}

/**
 * The neutral resolver over a dataset (core/resolve.ts): each position is replaced
 * by the end of its capture line. A position in check, before or after, is
 * dropped. Returns the resolved positions, re-merged and re-split, with counts.
 */
export function resolveAll(positions: Position[], validPermille: number, core: Engine): { positions: Position[]; counts: Record<string, number> } {
  const out: Position[] = [];
  let checkBefore = 0;
  let checkAfter = 0;
  let changed = 0;
  for (const p of positions) {
    core.setPosition(fenOf(p), []);
    if (core.inCheck()) { checkBefore++; continue; }
    if (core.resolveQuiet() > 0) {
      changed++;
      if (core.inCheck()) { checkAfter++; continue; }
      const q = core.corePosition();
      out.push({ ...p, board: q.board, side: q.side, castling: q.castling, ep: q.ep === 64 ? -1 : q.ep, halfmove: q.halfmove });
    } else out.push(p);
  }
  const { positions: merged, merged: mergedAway } = mergeAndSplit(out, validPermille);
  return { positions: merged, counts: { input: positions.length, inCheckBefore: checkBefore, resolvedChanged: changed, inCheckAfter: checkAfter, mergedAway, output: merged.length } };
}

/** the sha256 of a file, hex */
export function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
