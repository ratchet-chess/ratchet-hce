/**
 * Host wrapper around a WASM build: build/core.wasm (core/, `bun run
 * build:wasm`) or a release's build/<release>.wasm, which re-exports the core
 * beside its search. Loading, position setup and UCI move strings.
 */
import { type ParsedFen, castleRooks, parseFen } from "./fen.ts";

interface Exports {
  /** a release's init, which also sets up the core */
  init?(): void;
  initCore(): void;
  clear(): void;
  put(s: number, p: number): void;
  setState(side: number, castling: number, ep: number, halfmove: number, fullmove: number): void;
  playMove(m: number): void;
  /** the own engine only: each right's rook square and both kings' squares, for Chess960 (core/position.ts setCastleRooks) */
  setCastleRooks?(whiteKing: number, blackKing: number, r1: number, r2: number, r4: number, r8: number): void;
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

/** a position as the core holds it: a piece code per square, the side to move, castling rights, en passant square (64 for none), halfmove clock */
export interface CorePosition {
  board: Uint8Array;
  side: number;
  castling: number;
  ep: number;
  halfmove: number;
}

/** The exports a release adds to the core's; build/core.wasm has none of them. */
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
  /** the own engine's version, major << 16 | minor << 8 | patch; a release has none */
  version?(): number;
  /** the own engine's static eval in its own unit, finer than the centipawn */
  evaluateUnits?(): number;
  /** the own engine's units per centipawn */
  unitsPerCp?(): number;
  /** one field of the own engine's record of its last timed search */
  timeTrace?(field: number): number;
  /** the own engine's incremental-eval mismatches, walking the tree to a depth */
  evalWalk?(depth: number): number;
  /** the own engine's windowed search for the window gate: one search to a depth with (alpha, beta), fresh, with or without its table */
  goWindow?(alpha: number, beta: number, depth: number, table: number): number;
  /** the own engine's eval bench: a set of positions, and passes of its eval over them in wasm */
  evalBenchInit?(n: number): void;
  evalBenchAdd?(): void;
  evalBenchRun?(reps: number, withEval: number): number;
}

/** A game played inside a release that keeps its own game state, as its original did; optional. */
interface Game {
  gameStart(level: number, black: number): void;
  gamePlayer(from: number, to: number): number;
  /** from | to << 6, or -1 for no move */
  gameMove(): number;
  gameNextMove(): void;
}

/**
 * A release that times itself, as its original did, from the host's limits and
 * clock; optional. A limit not given is -1.
 */
interface Clocked {
  goClock(timeMs: number, incMs: number, movesToGo: number, moveTimeMs: number, depth: number): number;
  /** the level of every later game, for a release whose original has levels and no clock */
  setGameLevel?(level: number): void;
}

/** a release's leaf count of its own move generator, when its board is not the core's; optional */
interface ReleasePerft {
  perftRelease(depth: number): number;
}

/** Called by a release where its original read its input; non-zero means input is waiting, so the search stops. */
export type Poll = () => number;

/** The own engine's record of one timed search. `veto` counts iterations that ran on past the soft limit because the best move had just changed. */
export interface TimeTrace {
  rule: "none" | "soft" | "hard-between" | "hard-inside" | "host";
  elapsed: number; soft: number; hard: number;
  score: number; node: number; veto: number;
}

/** Called after each finished iteration with its score and the nodes so far; a report only. */
export type OnIteration = (depth: number, score: number, nodes: number) => number;

/** The clock a clocked release reads, in milliseconds; `nodes` is its count in this search. */
export type Clock = (nodes: number) => number;

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const MATE = 32000;

const FILES = "abcdefgh";
const PROMO = " pnbrqk";
/** core/constants.ts FLAG_CASTLE */
const FLAG_CASTLE = 1 << 16;
const STANDARD_ROOKS = [7, 0, 63, 56];

/** move m in UCI's notation; a castle as the king's move to its destination, as standard chess writes it */
export function moveToUci(m: number): string {
  const from = m & 63;
  const to = (m >>> 6) & 63;
  const promo = (m >>> 12) & 7;
  return FILES[from & 7] + ((from >> 3) + 1) + FILES[to & 7] + ((to >> 3) + 1) + (promo ? PROMO[promo] : "");
}

export class Engine {
  /**
   * UCI_Chess960: a castle is written and read as the king taking its own rook. Only a build that sets its rook
   * squares (canChess960) plays Chess960; its moves keep the king's destination inside.
   */
  chess960 = false;
  /** the loaded position's rook square per right, as the core holds them */
  private rooks = STANDARD_ROOKS;
  poll: Poll = () => 0;
  onIteration: OnIteration = () => 0;
  clock: Clock = () => performance.now();
  private wasm: Exports & Partial<Search> & Partial<Game> & Partial<ReleasePerft> & Partial<Clocked>;

  private constructor(wasm: Exports & Partial<Search> & Partial<Game> & Partial<ReleasePerft> & Partial<Clocked>) {
    this.wasm = wasm;
  }

  /** the search exports, which only a release has */
  private get search(): Search {
    if (!this.wasm.go) throw new Error("this build has no search: load a release, not the core");
    return this.wasm as Search;
  }

  /** loads build/<name>.wasm: "core", or a release's directory name under engines/; or a path ending in .wasm, such as a tuning build */
  static async load(name: string): Promise<Engine> {
    // imported here, so that a browser bundle, which loads through fromBytes, needs no node:fs
    const { readFileSync } = await import("node:fs");
    return Engine.fromBytes(readFileSync(name.endsWith(".wasm") ? name : new URL(`../build/${name}.wasm`, import.meta.url)), name);
  }

  /** instantiates a WASM build from its bytes; `name` labels its aborts */
  static async fromBytes(bytes: BufferSource, name: string): Promise<Engine> {
    let engine: Engine | undefined;
    let memory: WebAssembly.Memory | undefined;
    // an AssemblyScript string: UTF-16 at `ptr`, its byte length in the word before it
    const text = (ptr: number) => {
      if (!ptr || !memory) return "";
      const bytes = new DataView(memory.buffer).getUint32(ptr - 4, true);
      return String.fromCharCode(...new Uint16Array(memory.buffer, ptr, bytes >>> 1));
    };
    const { instance } = await WebAssembly.instantiate(bytes, {
      env: {
        abort(msg: number, _file: number, line: number, col: number) {
          const why = text(msg);
          throw new Error(`${name}.wasm abort${why ? `: ${why}` : ""} at ${line}:${col}`);
        },
        poll: () => engine!.poll(),
        onIteration: (depth: number, score: number, nodes: number) => engine!.onIteration(depth, score, nodes),
        clock: (nodes: number) => engine!.clock(nodes),
      },
    });
    memory = instance.exports.memory as WebAssembly.Memory | undefined;
    engine = new Engine(instance.exports as unknown as Exports & Partial<Search> & Partial<Game> & Partial<ReleasePerft> & Partial<Clocked>);
    if (engine.wasm.init) engine.wasm.init();
    else engine.wasm.initCore();
    engine.setPosition(START_FEN, []);
    return engine;
  }

  /** whether the build plays Chess960: the own engine, not a release */
  get canChess960(): boolean {
    return this.wasm.setCastleRooks !== undefined;
  }

  /** loads `fen` and plays the UCI `moves`; throws on an illegal move */
  setPosition(fen: string, moves: string[]): void {
    const f = parseFen(fen);
    const w = this.wasm;
    w.clear();
    for (let s = 0; s < 64; s++) if (f.board[s]) w.put(s, f.board[s]);
    w.setState(f.side, f.castling, f.ep, f.halfmove, f.fullmove);
    this.setRooks(f);
    for (const uci of moves) {
      const m = this.legalMoves().find((x) => this.uci(x) === uci);
      if (m === undefined) throw new Error(`illegal move ${uci}`);
      w.playMove(m);
    }
  }

  /** loads a position from its fields, as setPosition does from a FEN: a piece code per square, en passant -1 for none */
  setBoard(board: Uint8Array, side: number, castling: number, ep: number, halfmove: number, fullmove: number): void {
    const w = this.wasm;
    w.clear();
    for (let s = 0; s < 64; s++) if (board[s]) w.put(s, board[s]);
    w.setState(side, castling, ep, halfmove, fullmove);
    this.setRooks({ board, side, castling, ep, halfmove, fullmove });
  }

  /** hands the core each right's rook square, for a build that plays Chess960; a release's stay the corners */
  private setRooks(f: ParsedFen): void {
    const set = this.wasm.setCastleRooks;
    if (!set) return;
    const present = castleRooks(f);
    const king = (color: number) => {
      const s = f.board.indexOf((color << 3) | 6);
      return s < 0 ? (color ? 60 : 4) : s;
    };
    set(king(0), king(1), ...(present.map((r) => (r < 0 ? 64 : r)) as [number, number, number, number]));
    this.rooks = present.map((r, i) => (r < 0 ? STANDARD_ROOKS[i] : r));
  }

  /**
   * move m in UCI's notation for this engine's mode: under chess960 a castle is the king taking its own rook, as
   * UCI_Chess960 asks; otherwise moveToUci
   */
  uci(m: number): string {
    if (!this.chess960 || !(m & FLAG_CASTLE)) return moveToUci(m);
    const to = (m >>> 6) & 63;
    const rook = this.rooks[(to >> 4 & 2) | ((to & 7) === 2 ? 1 : 0)];
    return moveToUci((m & 63) | (rook << 6));
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

  /** whether the release times itself: goClock, not go */
  get clocked(): boolean {
    return this.wasm.goClock !== undefined;
  }

  /** whether the release keeps a game of its own, played through gameStart, gamePlayer and gameMove */
  get ownsGame(): boolean {
    return this.wasm.gameStart !== undefined;
  }

  /**
   * One move of a game, timed by the release from `limits` and `clock`: the side
   * to move's time and increment, moves to go, a fixed time, or a depth.
   */
  goClock(limits: { timeMs?: number; incMs?: number; movesToGo?: number; moveTimeMs?: number; depth?: number }): number {
    if (!this.wasm.goClock) throw new Error("this release does not time itself");
    return this.wasm.goClock(limits.timeMs ?? -1, limits.incMs ?? -1, limits.movesToGo ?? -1, limits.moveTimeMs ?? -1, limits.depth ?? -1);
  }

  /** whether the release has game levels in place of a clock */
  get leveled(): boolean {
    return this.wasm.setGameLevel !== undefined;
  }

  /** sets the level of every later game; throws if the release has no levels */
  setGameLevel(level: number): void {
    if (!this.wasm.setGameLevel) throw new Error("this release has no game level");
    this.wasm.setGameLevel(level);
  }

  /** sizes the transposition table in megabytes */
  setHash(mb: number): void {
    this.search.setHash(mb);
  }

  /** empties the transposition table */
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
   * time it took against its two limits, and the soft limit's factors. engines/ratchet/time.ts timeTrace names the fields.
   */
  timeTrace(): TimeTrace | undefined {
    const t = this.search.timeTrace;
    if (!t) return undefined;
    const rule = (["none", "soft", "hard-between", "hard-inside", "host"] as const)[t(0)] ?? "none";
    return { rule, elapsed: t(1), soft: t(2), hard: t(3), score: t(4), node: t(5), veto: t(6) };
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

  /** one fresh search of the own engine to `depth` with the window (alpha, beta), with or without its table; the fail-soft score in its own unit */
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

  /** `reps` passes over the eval bench's set, with the eval or only restoring each position; returns their checksum. Set a position before searching again. */
  evalBenchRun(reps: number, withEval: boolean): number {
    if (!this.search.evalBenchRun) throw new Error("this build has no eval bench");
    return this.search.evalBenchRun(reps, withEval ? 1 : 0);
  }

  /** the own engine's version as "major.minor.patch"; undefined for a release */
  get version(): string | undefined {
    const v = this.wasm.version?.();
    return v === undefined ? undefined : `${v >> 16}.${(v >> 8) & 255}.${v & 255}`;
  }

  /** sets tuning-build constant `id` to `value`; a release build has none */
  tune(id: number, value: number): void {
    this.search.tuneSet?.(id, value);
  }

  /** the core's position, read back; build/core.wasm only */
  corePosition(): CorePosition {
    const w = this.wasm;
    if (!w.pieceAt) throw new Error("this build cannot read its position back: load the core");
    const board = new Uint8Array(64);
    for (let s = 0; s < 64; s++) board[s] = w.pieceAt(s);
    return { board, side: w.sideToMove!(), castling: w.castlingRights!(), ep: w.epSquare!(), halfmove: w.halfmoveClock!() };
  }

  /** whether the side to move is in check; build/core.wasm only */
  inCheck(): boolean {
    if (!this.wasm.inCheckNow) throw new Error("this build has no check test: load the core");
    return this.wasm.inCheckNow() !== 0;
  }

  /** plays the neutral resolver's capture line (core/resolve.ts) on the position; returns its length; build/core.wasm only */
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

  /** the leaf count of the release's own move generator from `fen`; throws if the release uses the core's */
  perftRelease(fen: string, depth: number): number {
    if (!this.wasm.perftRelease) throw new Error("this build has no generator of its own");
    this.setPosition(fen, []);
    return this.wasm.perftRelease(depth);
  }

  /** the game exports, which only a release that keeps its own game state has */
  private get game(): Game {
    if (!this.wasm.gameStart) throw new Error("this build plays no game of its own");
    return this.wasm as Game;
  }

  /** a new game inside the release from the start position, the release playing black or white at `level` */
  gameStart(level: number, black: boolean): void {
    this.game.gameStart(level, black ? 1 : 0);
  }

  /** the opponent's move in UCI notation; false if the release finds it illegal */
  gamePlayer(uci: string): boolean {
    const sq = (s: string) => s.charCodeAt(0) - 97 + 8 * (s.charCodeAt(1) - 49);
    return this.game.gamePlayer(sq(uci), sq(uci.slice(2, 4))) !== 0;
  }

  /** the release's move, made on its own board, in UCI notation without a promotion letter; "" for none */
  gameMove(): string {
    const m = this.game.gameMove();
    return m < 0 ? "" : moveToUci(m & 4095);
  }

  /** the release's step after both sides have moved */
  gameNextMove(): void {
    this.game.gameNextMove();
  }
}
