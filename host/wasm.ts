/**
 * Host wrapper around a WASM build: build/core.wasm (core/, `bun run
 * build:wasm`) or the own engine's build/ratchet.wasm, which re-exports the core
 * beside its search. Loading, position setup and UCI move strings.
 */
import { parseFen } from "./fen.ts";

interface Exports {
  /** the engine's init, which also sets up the core */
  init?(): void;
  initCore(): void;
  clear(): void;
  put(s: number, p: number): void;
  setState(side: number, castling: number, ep: number, halfmove: number, fullmove: number): void;
  playMove(m: number): void;
  legalMoves(): number;
  rootMove(i: number): number;
  perft(depth: number, bulk: number): number;
  checkedWalk(depth: number): number;
  /** build/core.wasm only */
  attacked?(s: number, by: number): number;
  /** build/core.wasm only: the neutral resolver and the position read back */
  resolveQuiet?(): number;
  pieceAt?(s: number): number;
  sideToMove?(): number;
  castlingRights?(): number;
  epSquare?(): number;
  halfmoveClock?(): number;
  inCheckNow?(): number;
}

/**
 * A position as the core holds it: a piece code per square, the side to move,
 * castling rights, en passant square (64 for none), and halfmove clock.
 */
export interface CorePosition {
  board: Uint8Array;
  side: number;
  castling: number;
  ep: number;
  halfmove: number;
}

/** The exports the own engine adds to the core's; build/core.wasm has none of them. */
interface Search {
  go(depth: number): number;
  setHash(mb: number): void;
  newGame(): void;
  pvLength(): number;
  pvMove(i: number): number;
  nodesSearched(): number;
  searchScore(): number;
  searchDepth(): number;
  evaluate(): number;
  /** present only in a tuning build */
  tuneSet?(id: number, value: number): void;
  /** the own engine's version, major << 16 | minor << 8 | patch */
  version?(): number;
  /** the own engine's static eval in its own unit, finer than the centipawn */
  evaluateUnits?(): number;
  /** the own engine's units per centipawn */
  unitsPerCp?(): number;
  /** one field of the own engine's record of its last timed search */
  timeTrace?(field: number): number;
  /** the own engine's table fill by this search, in permille */
  hashfull?(): number;
  /** the own engine's incremental-eval mismatches, walking the tree to a depth */
  evalWalk?(depth: number): number;
  /**
   * The own engine's windowed search for the window gate: one search to a depth
   * with (alpha, beta), fresh, with or without its table.
   */
  goWindow?(alpha: number, beta: number, depth: number, table: number): number;
  /** the own engine's eval bench: a set of positions, and passes of its eval over them in wasm */
  evalBenchInit?(n: number): void;
  evalBenchAdd?(): void;
  evalBenchRun?(reps: number, withEval: number): number;
}

/**
 * A game's search, timed by the engine from the host's limits and clock; build/core.wasm
 * has none. A limit not given is -1.
 */
interface Clocked {
  goClock(timeMs: number, incMs: number, movesToGo: number, moveTimeMs: number, depth: number): number;
  /** the node limit of the next goClock, which clears it */
  setNodeLimit?(nodes: number): void;
}

/** Called by the search to check for input; non-zero means input is waiting, so the search stops. */
export type Poll = () => number;

/**
 * The own engine's record of one timed search. `veto` counts iterations that ran
 * on past the soft limit because the best move had just changed.
 */
export interface TimeTrace {
  rule: "none" | "soft" | "hard-between" | "hard-inside" | "host" | "nodes";
  elapsed: number;
  soft: number;
  hard: number;
  score: number;
  node: number;
  veto: number;
}

/** Called after each iteration whose line is kept, finished or cut, with its score and nodes so far; a report only. */
export type OnIteration = (depth: number, score: number, nodes: number) => number;

/** The clock a timed search reads, in milliseconds; `nodes` is its count in this search. */
export type Clock = (nodes: number) => number;

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const MATE = 32000;

const FILES = "abcdefgh";
const PROMO = " pnbrqk";

export function moveToUci(m: number): string {
  const from = m & 63;
  const to = (m >>> 6) & 63;
  const promo = (m >>> 12) & 7;
  return FILES[from & 7] + ((from >> 3) + 1) + FILES[to & 7] + ((to >> 3) + 1) + (promo ? PROMO[promo] : "");
}

export class Engine {
  poll: Poll = () => 0;
  onIteration: OnIteration = () => 0;
  clock: Clock = () => performance.now();
  private wasm: Exports & Partial<Search> & Partial<Clocked>;

  private constructor(wasm: Exports & Partial<Search> & Partial<Clocked>) {
    this.wasm = wasm;
  }

  /** the search exports, which build/core.wasm lacks */
  private get search(): Search {
    if (!this.wasm.go) throw new Error("this build has no search: load the engine, not the core");
    return this.wasm as Search;
  }

  /**
   * Loads build/<name>.wasm: "core", or an engine's directory name under
   * engines/; or a path ending in .wasm, such as a tuning build.
   */
  static async load(name: string): Promise<Engine> {
    // imported here, so that a browser bundle, which loads through fromBytes, needs no node:fs
    const { readFileSync } = await import("node:fs");
    return Engine.fromBytes(
      readFileSync(name.endsWith(".wasm") ? name : new URL(`../build/${name}.wasm`, import.meta.url)),
      name,
    );
  }

  /** instantiates a WASM build from its bytes; `name` labels its aborts */
  static async fromBytes(bytes: BufferSource, name: string): Promise<Engine> {
    const state: { engine?: Engine; memory?: WebAssembly.Memory } = {};
    // an AssemblyScript string: UTF-16 at `ptr`, its byte length in the word before it
    const text = (ptr: number) => {
      if (!ptr || !state.memory) return "";
      const bytes = new DataView(state.memory.buffer).getUint32(ptr - 4, true);
      return String.fromCharCode(...new Uint16Array(state.memory.buffer, ptr, bytes >>> 1));
    };
    const { instance } = await WebAssembly.instantiate(bytes, {
      env: {
        abort(msg: number, _file: number, line: number, col: number) {
          const why = text(msg);
          throw new Error(`${name}.wasm abort${why ? `: ${why}` : ""} at ${line}:${col}`);
        },
        poll: () => state.engine!.poll(),
        onIteration: (depth: number, score: number, nodes: number) => state.engine!.onIteration(depth, score, nodes),
        clock: (nodes: number) => state.engine!.clock(nodes),
      },
    });
    state.memory = instance.exports.memory as WebAssembly.Memory | undefined;
    state.engine = new Engine(instance.exports as unknown as Exports & Partial<Search> & Partial<Clocked>);
    if (state.engine.wasm.init) state.engine.wasm.init();
    else state.engine.wasm.initCore();
    state.engine.setPosition(START_FEN, []);
    return state.engine;
  }

  /** loads `fen` and plays the UCI `moves`; throws on an illegal move */
  setPosition(fen: string, moves: string[]): void {
    const f = parseFen(fen);
    const w = this.wasm;
    w.clear();
    for (let s = 0; s < 64; s++) if (f.board[s]) w.put(s, f.board[s]);
    w.setState(f.side, f.castling, f.ep, f.halfmove, f.fullmove);
    for (const uci of moves) {
      const m = this.legalMoves().find((x) => moveToUci(x) === uci);
      if (m === undefined) throw new Error(`illegal move ${uci}`);
      w.playMove(m);
    }
  }

  /**
   * Loads a position from its fields, as setPosition does from a FEN: a piece
   * code per square, en passant -1 for none.
   */
  setBoard(board: Uint8Array, side: number, castling: number, ep: number, halfmove: number, fullmove: number): void {
    const w = this.wasm;
    w.clear();
    for (let s = 0; s < 64; s++) if (board[s]) w.put(s, board[s]);
    w.setState(side, castling, ep, halfmove, fullmove);
  }

  legalMoves(): number[] {
    const n = this.wasm.legalMoves();
    const out: number[] = [];
    for (let i = 0; i < n; i++) out.push(this.wasm.rootMove(i));
    return out;
  }

  /** best move from iterations up to `maxDepth` plies, or 0 if the position has no legal move */
  go(maxDepth: number): number {
    return this.search.go(maxDepth);
  }

  /** whether the build times itself: goClock, not go */
  get clocked(): boolean {
    return this.wasm.goClock !== undefined;
  }

  /**
   * One move of a game, timed by the engine from `limits` and `clock`: the side
   * to move's time and increment, moves to go, a fixed time, or a depth.
   */
  goClock(limits: {
    timeMs?: number;
    incMs?: number;
    movesToGo?: number;
    moveTimeMs?: number;
    depth?: number;
  }): number {
    if (!this.wasm.goClock) throw new Error("this build does not time itself");
    return this.wasm.goClock(
      limits.timeMs ?? -1,
      limits.incMs ?? -1,
      limits.movesToGo ?? -1,
      limits.moveTimeMs ?? -1,
      limits.depth ?? -1,
    );
  }

  /** whether the build takes a node limit */
  get nodeLimited(): boolean {
    return this.wasm.setNodeLimit !== undefined;
  }

  /** the node limit of the next goClock search, from a `go nodes` */
  setNodeLimit(nodes: number): void {
    if (!this.wasm.setNodeLimit) throw new Error("this build takes no node limit");
    this.wasm.setNodeLimit(nodes);
  }

  /** sizes the transposition table in megabytes */
  setHash(mb: number): void {
    this.search.setHash(mb);
  }

  /** empties every table a search fills */
  newGame(): void {
    this.search.newGame();
  }

  pv(): number[] {
    const out: number[] = [];
    const w = this.search;
    for (let i = 0, n = w.pvLength(); i < n; i++) out.push(w.pvMove(i));
    return out;
  }

  nodes(): number {
    return this.search.nodesSearched();
  }

  /** the score of the last search's move, for the side to move */
  score(): number {
    return this.search.searchScore();
  }

  /**
   * The own engine's record of its last timed search, or undefined for a build without one: which rule ended it, the
   * time it took against its two limits, and the soft limit's factors. engines/ratchet/time.ts timeTrace names them.
   */
  timeTrace(): TimeTrace | undefined {
    const s = this.search;
    if (!s.timeTrace) return undefined;
    const t = (f: number) => s.timeTrace!(f);
    const rule = (["none", "soft", "hard-between", "hard-inside", "host", "nodes"] as const)[t(0)] ?? "none";
    return { rule, elapsed: t(1), soft: t(2), hard: t(3), score: t(4), node: t(5), veto: t(6) };
  }

  /** the table's fill by the current search, in permille, or undefined for a build that does not report it */
  hashfull(): number | undefined {
    return this.search.hashfull?.();
  }

  /** the deepest iteration the last search finished */
  depth(): number {
    return this.search.searchDepth();
  }

  evaluate(): number {
    return this.search.evaluate();
  }

  /** the static eval in the engine's own unit; the own engine only */
  evaluateUnits(): number {
    if (!this.search.evaluateUnits) throw new Error("this build has no eval in its own unit");
    return this.search.evaluateUnits();
  }

  /** the static eval in centipawns, with the fraction an engine with a finer unit keeps */
  evaluateCp(): number {
    const w = this.search;
    return w.evaluateUnits && w.unitsPerCp ? w.evaluateUnits() / w.unitsPerCp() : w.evaluate();
  }

  /** incremental-eval mismatches found walking the current position's tree to `depth`; the own engine only */
  evalWalk(depth: number): number {
    if (!this.search.evalWalk) throw new Error("this build keeps no incremental eval to walk");
    return this.search.evalWalk(depth);
  }

  /**
   * One fresh search of the own engine to `depth` with the window (alpha, beta),
   * with or without its table; returns the fail-soft score in its own unit.
   */
  goWindow(alpha: number, beta: number, depth: number, table: boolean): number {
    if (!this.search.goWindow) throw new Error("this build has no windowed search");
    return this.search.goWindow(alpha, beta, depth, table ? 1 : 0);
  }

  /** fills the eval bench's set from `fens`; the own engine only */
  evalBenchSet(fens: string[]): void {
    if (!this.search.evalBenchInit || !this.search.evalBenchAdd) throw new Error("this build has no eval bench");
    this.search.evalBenchInit(fens.length);
    for (const fen of fens) {
      this.setPosition(fen, []);
      this.search.evalBenchAdd();
    }
  }

  /**
   * `reps` passes over the eval bench's set, with the eval or only restoring each
   * position; returns their checksum. Set a position before searching again.
   */
  evalBenchRun(reps: number, withEval: boolean): number {
    if (!this.search.evalBenchRun) throw new Error("this build has no eval bench");
    return this.search.evalBenchRun(reps, withEval ? 1 : 0);
  }

  /** the own engine's version as "major.minor.patch"; undefined for a build without one */
  get version(): string | undefined {
    const v = this.wasm.version?.();
    return v === undefined ? undefined : `${v >> 16}.${(v >> 8) & 255}.${v & 255}`;
  }

  /** sets tuning-build constant `id` to `value`; a build that is not a tuning build has none */
  tune(id: number, value: number): void {
    this.search.tuneSet?.(id, value);
  }

  /** the core's position, read back; build/core.wasm only */
  corePosition(): CorePosition {
    const w = this.wasm;
    if (!w.pieceAt) throw new Error("this build cannot read its position back: load the core");
    const board = new Uint8Array(64);
    for (let s = 0; s < 64; s++) board[s] = w.pieceAt(s);
    return {
      board,
      side: w.sideToMove!(),
      castling: w.castlingRights!(),
      ep: w.epSquare!(),
      halfmove: w.halfmoveClock!(),
    };
  }

  /** whether the side to move is in check; build/core.wasm only */
  inCheck(): boolean {
    if (!this.wasm.inCheckNow) throw new Error("this build has no check test: load the core");
    return this.wasm.inCheckNow() !== 0;
  }

  /**
   * Plays the neutral resolver's capture line (core/resolve.ts) on the position;
   * returns its length; build/core.wasm only.
   */
  resolveQuiet(): number {
    if (!this.wasm.resolveQuiet) throw new Error("this build has no resolver: load the core");
    return this.wasm.resolveQuiet();
  }

  /** whether color `by` (0 White) attacks square `s` in the current position; build/core.wasm only */
  attacked(s: number, by: number): boolean {
    if (!this.wasm.attacked) throw new Error("this build has no attack test: load the core");
    return this.wasm.attacked(s, by) !== 0;
  }

  /** incremental-state mismatches found walking the current position's tree to `depth` */
  checkedWalk(depth: number): number {
    return this.wasm.checkedWalk(depth);
  }

  perft(fen: string, depth: number, bulk: boolean): number {
    this.setPosition(fen, []);
    return this.wasm.perft(depth, bulk ? 1 : 0);
  }
}
