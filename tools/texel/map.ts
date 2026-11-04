/**
 * A subject's parameter map (tools/texel/maps/<subject>.json): the language the
 * tuner works in, and the only file a subject needs. A map lists blocks; a block is
 * one named constant or table with its home in the subject's source and options. A
 * block expands to elements, and a tuned element is one free value after ties.
 *
 *   {
 *     "subject": "chess-4.6",
 *     "release": "chess-4.6",            // engines/<release>/, for a source subject
 *     "eval": { "form": "search", "depth": 2 },   // or { "form": "static" }
 *     "quirks": ["reads-search-state"],
 *     "defaults": { "type": "i32", "step": 8 },
 *     "blocks": [
 *       { "name": "FPNISO", "sources": [{ "file": "eval.ts", "symbol": "FPNISO" }] },
 *       { "name": "VALUE", "size": 7, "layout": "count", "fixed": [0, 6],
 *         "sources": [{ "file": "eval.ts", "symbol": "VALUE" }] }
 *     ]
 *   }
 *
 * A block without `size` is a scalar. A table of `size` elements reads its source
 * array from `offset`. A source's `transform` maps an element to its slot: "negate"
 * stores its negative, "flip" stores square s at s ^ 56 (the other color's table).
 * `ties: "files"` makes file f and 7 - f one element (index i and i ^ 7 on 64
 * squares); `ties` may instead list index groups. A middlegame and endgame pair is
 * two blocks. `type` is the storage type (i32, i16, i8, u16, u8, f64), whose range
 * bounds the element unless `min` and `max` narrow it. `step` is the local search's
 * step and the probe's unit.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { findDeclaration, type Declaration } from "./source.ts";

export type Transform = "identity" | "negate" | "flip" | "flip-negate";

export interface SourceRef {
  file: string;
  symbol: string;
  offset?: number;
  transform?: Transform;
}

export interface Block {
  name: string;
  size?: number;
  layout?: "count" | "square" | "file" | "rank";
  sources: SourceRef[];
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  /** element indices held at their defaults, or true for the whole block */
  fixed?: number[] | true;
  ties?: "files" | number[][];
}

export interface EvalForm {
  form: "static" | "search";
  depth?: number;
}

export interface ParameterMap {
  subject: string;
  /** the K every tune holds, instead of fitting one */
  k?: number;
  release?: string;
  eval: EvalForm;
  quirks?: string[];
  defaults?: { type?: string; step?: number };
  blocks: Block[];
}

/** one place an element's value is stored */
export interface Slot {
  file: string;
  symbol: string;
  /** the array index, or -1 for a scalar */
  index: number;
  transform: Transform;
}

export interface Element {
  /** its position in the map's element list, which tuneSet takes */
  id: number;
  /** "FPNISO", or "FPDCOL[2]" for a table: the block and its first index */
  name: string;
  block: string;
  /** the block indices that share this value */
  indices: number[];
  default: number;
  min: number;
  max: number;
  step: number;
  type: string;
  fixed: boolean;
  slots: Slot[];
}

export interface LoadedMap {
  path: string;
  map: ParameterMap;
  /** engines/<release>/, when the subject is a source subject */
  releaseDir?: string;
  elements: Element[];
  /** each source file's declarations that the map reads, by file */
  declarations: Map<string, Map<string, Declaration>>;
  /** sha256 of the map, the release's and the core's sources and the writer, which names its builds */
  hash: string;
}

const RANGES: Record<string, [number, number]> = {
  i32: [-(2 ** 31), 2 ** 31 - 1],
  i16: [-(2 ** 15), 2 ** 15 - 1],
  i8: [-128, 127],
  u16: [0, 2 ** 16 - 1],
  u8: [0, 255],
  f64: [-Infinity, Infinity],
};

const REPO = new URL("../../", import.meta.url).pathname;

/** the value stored in a slot for element value `v` */
export function stored(v: number, t: Transform): number {
  return t === "negate" || t === "flip-negate" ? -v : v;
}

function slotIndex(i: number, src: SourceRef): number {
  const flip = src.transform === "flip" || src.transform === "flip-negate";
  return (src.offset ?? 0) + (flip ? i ^ 56 : i);
}

/** reads and checks a map: every source resolves, and every tie and source agrees on its default */
export function loadMap(path: string): LoadedMap {
  const text = readFileSync(path, "utf8");
  const map = JSON.parse(text) as ParameterMap;
  if (!map.subject || !map.eval || !Array.isArray(map.blocks)) throw new Error(`${path}: needs subject, eval and blocks`);
  const releaseDir = map.release ? join(REPO, "engines", map.release) : undefined;
  const sources = new Map<string, string>();
  const declarations = new Map<string, Map<string, Declaration>>();
  const declOf = (src: SourceRef): Declaration => {
    if (!releaseDir) throw new Error(`${path}: block sources need "release"`);
    if (!sources.has(src.file)) sources.set(src.file, readFileSync(join(releaseDir, src.file), "utf8"));
    const byFile = declarations.get(src.file) ?? new Map<string, Declaration>();
    declarations.set(src.file, byFile);
    if (!byFile.has(src.symbol)) byFile.set(src.symbol, findDeclaration(sources.get(src.file)!, src.symbol, src.file));
    return byFile.get(src.symbol)!;
  };

  const elements: Element[] = [];
  const names = new Set<string>();
  for (const block of map.blocks) {
    if (names.has(block.name)) throw new Error(`${path}: block ${block.name} twice`);
    names.add(block.name);
    const type = block.type ?? map.defaults?.type ?? "i32";
    const range = RANGES[type];
    if (!range) throw new Error(`${path}: ${block.name} has unknown type ${type}`);
    const size = block.size ?? 1;
    const scalar = block.size === undefined;
    // the tie groups: each index's group, the lowest index first
    const groups: number[][] = [];
    const seen = new Set<number>();
    const tied = (i: number): number[] => {
      if (block.ties === "files") return [...new Set([i, size === 8 ? 7 - i : i ^ 7])].sort((a, b) => a - b);
      if (Array.isArray(block.ties)) return block.ties.find((g) => g.includes(i)) ?? [i];
      return [i];
    };
    for (let i = 0; i < size; i++) {
      if (seen.has(i)) continue;
      const g = tied(i);
      for (const j of g) seen.add(j);
      groups.push(g);
    }
    const fixedSet = block.fixed === true ? null : new Set(block.fixed ?? []);
    for (const g of groups) {
      const slots: Slot[] = [];
      let value: number | undefined;
      for (const i of g) {
        for (const src of block.sources) {
          const decl = declOf(src);
          if (scalar !== (decl.kind === "scalar")) throw new Error(`${path}: ${block.name} is ${scalar ? "a scalar" : "a table"}, ${src.file} ${src.symbol} is not`);
          const index = scalar ? -1 : slotIndex(i, src);
          const lit = decl.literals[scalar ? 0 : index];
          if (!lit) throw new Error(`${path}: ${block.name}[${i}] is past the end of ${src.symbol}`);
          const v = stored(lit.value, src.transform ?? "identity");
          if (value === undefined) value = v;
          else if (v !== value) throw new Error(`${path}: ${block.name}[${i}] reads ${v} in ${src.file} ${src.symbol}, ${value} elsewhere in its tie or sources`);
          slots.push({ file: src.file, symbol: src.symbol, index, transform: src.transform ?? "identity" });
        }
      }
      const fixed = fixedSet === null || g.some((i) => fixedSet.has(i));
      elements.push({
        id: elements.length,
        name: scalar ? block.name : `${block.name}[${g[0]}]`,
        block: block.name,
        indices: g,
        default: value!,
        min: block.min ?? range[0],
        max: block.max ?? range[1],
        step: block.step ?? map.defaults?.step ?? 1,
        type,
        fixed,
        slots,
      });
    }
  }

  // A build depends on the map, the release, the core it imports and the writer that made it.
  const hash = createHash("sha256").update(text);
  const files = [
    ...(releaseDir ? readdirSync(releaseDir).filter((f) => f.endsWith(".ts")).sort().map((f) => join(releaseDir, f)) : []),
    ...readdirSync(join(REPO, "core")).filter((f) => f.endsWith(".ts")).sort().map((f) => join(REPO, "core", f)),
    ...["map.ts", "source.ts", "write.ts"].map((f) => join(REPO, "tools", "texel", f)),
  ];
  for (const f of files) hash.update(f.slice(REPO.length)).update(readFileSync(f));
  return { path, map, releaseDir, elements, declarations, hash: hash.digest("hex").slice(0, 12) };
}
