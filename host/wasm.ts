/**
 * Host wrapper around a WASM build: build/core.wasm (core/, `bun run
 * build:wasm`) or a release's build/<release>.wasm, which re-exports the core
 * beside its search. Loading, position setup and UCI move strings.
 */
import { readFileSync } from "node:fs";
import { parseFen } from "./fen.ts";

interface Exports {
  /** a release's init, which also sets up the core */
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

/** Called after each finished iteration with its score and the nodes so far; a report only. */
export type OnIteration = (depth: number, score: number, nodes: number) => number;

/** The clock a clocked release reads, in milliseconds; `nodes` is its count in this search. */
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
  private wasm: Exports & Partial<Search> & Partial<Game> & Partial<ReleasePerft> & Partial<Clocked>;

  private constructor(wasm: Exports & Partial<Search> & Partial<Game> & Partial<ReleasePerft> & Partial<Clocked>) {
    this.wasm = wasm;
  }

  /** the search exports, which only a release has */
  private get search(): Search {
    if (!this.wasm.go) throw new Error("this build has no search: load a release, not the core");
    return this.wasm as Search;
  }

  /** loads build/<name>.wasm: "core", or a release's directory name under engines/ */
  static async load(name: string): Promise<Engine> {
    const bytes = readFileSync(new URL(`../build/${name}.wasm`, import.meta.url));
    let engine: Engine | undefined;
    const { instance } = await WebAssembly.instantiate(bytes, {
      env: {
        abort(_msg: number, _file: number, line: number, col: number) {
          throw new Error(`${name}.wasm abort at ${line}:${col}`);
        },
        poll: () => engine!.poll(),
        onIteration: (depth: number, score: number, nodes: number) => engine!.onIteration(depth, score, nodes),
        clock: (nodes: number) => engine!.clock(nodes),
      },
    });
    engine = new Engine(instance.exports as unknown as Exports & Partial<Search> & Partial<Game> & Partial<ReleasePerft> & Partial<Clocked>);
    if (engine.wasm.init) engine.wasm.init();
    else engine.wasm.initCore();
    engine.setPosition(START_FEN, []);
    return engine;
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

  /**
   * One move of a game, timed by the release from `limits` and `clock`: the side
   * to move's time and increment, moves to go, a fixed time, or a depth.
   */
  goClock(limits: { timeMs?: number; incMs?: number; movesToGo?: number; moveTimeMs?: number; depth?: number }): number {
    if (!this.wasm.goClock) throw new Error("this release does not time itself");
    return this.wasm.goClock(limits.timeMs ?? -1, limits.incMs ?? -1, limits.movesToGo ?? -1, limits.moveTimeMs ?? -1, limits.depth ?? -1);
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

  /** the deepest iteration the last search finished */
  depth(): number {
    return this.search.searchDepth();
  }

  evaluate(): number {
    return this.search.evaluate();
  }

  /** sets tuning-build constant `id` to `value`; a release build has none */
  tune(id: number, value: number): void {
    this.search.tuneSet?.(id, value);
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
