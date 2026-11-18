/**
 * Ratchet, the own engine: the WASM exports the host calls. The position is the
 * core's own, set by the host through the core's exports; the engine adds its
 * search, its eval and its version.
 *
 * - go() is a fresh search to a depth: every table empty, as a node signature
 *   needs.
 * - goClock() is one `go` of a game: the TT and the histories last until newGame.
 * - goWindow() is one windowed search from every table empty, for the window gate.
 */
export { initCore, clear, put, setState, setCastleRooks, playMove, legalMoves, rootMove, perft, checkedWalk } from "../../core/index";
export { nodesSearched } from "./search";
export { setNodeLimit, timeTrace } from "./time";
import { MAX_MOVES } from "../../core/constants";
import { initCore, legalMoves } from "../../core/index";
import { generateMoves } from "../../core/movegen";
import { bb, castling, setState, side } from "../../core/position";
import { UNITS_PER_CP, clearEvalCache, evalWith, evaluateScratch, initEval } from "./eval";
import { scratchPsq } from "./psq";
import { clearCorrection } from "./correction";
import { initCycle } from "./cycle";
import { clearPawns } from "./pawns";
import { clearHistory } from "./history";
import { MAX_DEPTH, bestScore, completedDepth, hostScore, initSearch, pvAt, rootPvLen, searchWindow, think } from "./search";
import {
  doMove, majorKey, minorKey, nonPawnKey, pawnKey, psq, refresh, scratchMajorKey, scratchMinorKey, scratchNonPawnKey, scratchPawnKey, setPawnKey, undoMove,
} from "./state";
import { noClock, setNodeLimit, startClock } from "./time";
import { ttAlloc, ttClear, ttEnable, ttHashfull } from "./tt";

/** the version `id name` reports: major << 16 | minor << 8 | patch; tools/calibrate.sh reads this line to name a rating's row */
const VERSION = (0 << 16) | (3 << 8) | 14;

const HASH_MB = 16;

export function init(): void {
  initCore();
  initCycle();
  initEval();
  initSearch();
  ttAlloc(HASH_MB);
  clearTables();
}

/** empties every table a search fills: the TT, the histories, the correction history, the king-pawn table and the eval cache */
function clearTables(): void {
  ttClear();
  clearHistory();
  clearCorrection();
  clearPawns();
  clearEvalCache();
}

export function version(): i32 {
  return VERSION;
}

/** the best move from a fresh search to `depth`, or 0 when the position has no legal move */
export function go(depth: i32): i32 {
  clearTables();
  noClock();
  refresh();
  return think(min(depth, MAX_DEPTH));
}

/**
 * One `go` of a game under the host's limits (a limit not given is negative): the
 * side to move's clock and increment, moves to go, a fixed move time, a depth, and
 * the node limit setNodeLimit gave it. With no limit the search runs until the host's
 * stop. Returns the best move, or 0.
 */
export function goClock(timeMs: f64, incMs: f64, movesToGo: i32, moveTimeMs: f64, depth: i32): i32 {
  refresh();
  startClock(timeMs, incMs, movesToGo, moveTimeMs, legalMoves());
  const best = think(depth > 0 ? min(depth, MAX_DEPTH) : MAX_DEPTH);
  setNodeLimit(-1);
  return best;
}

/**
 * One search to `depth` with the window (alpha, beta), from every table empty,
 * with or without the transposition table, for the window gate (test/window.ts).
 * Returns the fail-soft score for the side to move, in the engine's unit.
 */
export function goWindow(alpha: i32, beta: i32, depth: i32, table: i32): i32 {
  clearTables();
  noClock();
  refresh();
  ttEnable(table != 0);
  const v = searchWindow(alpha, beta, min(depth, MAX_DEPTH));
  ttEnable(true);
  return v;
}

export function setHash(mb: i32): void {
  ttAlloc(mb);
}

export function newGame(): void {
  clearTables();
}

/** the score of the line the last search returned, for the side to move, in centipawns or as a mate score */
export function searchScore(): i32 {
  return hostScore(bestScore);
}

export function searchDepth(): i32 {
  return completedDepth();
}

/** the table's fill by this search, in permille */
export function hashfull(): i32 {
  return ttHashfull();
}

export function pvLength(): i32 {
  return rootPvLen;
}

export function pvMove(i: i32): i32 {
  return pvAt(i);
}

/** the static eval of the core's position for the side to move, in centipawns, from params.ts */
export function evaluate(): i32 {
  return hostScore(evaluateScratch());
}

/** the static eval in the engine's unit, for the eval gate and the tuner */
export function evaluateUnits(): i32 {
  return evaluateScratch();
}

export function unitsPerCp(): i32 {
  return UNITS_PER_CP;
}

// ------------------------------------------------------------------ eval gate

const walkMoves = new StaticArray<i32>(64 * MAX_MOVES);

/** 1 if the incremental sum, a key or the cached king-pawn eval differs from the board's, else 0 */
function stateDiffers(): i32 {
  if (psq != scratchPsq() || pawnKey != scratchPawnKey()) return 1;
  if (evalWith(psq, true) != evaluateScratch()) return 1;
  if (nonPawnKey[0] != scratchNonPawnKey(0) || nonPawnKey[1] != scratchNonPawnKey(1)) return 1;
  return minorKey != scratchMinorKey() || majorKey != scratchMajorKey() ? 1 : 0;
}

function evalWalkRec(depth: i32, at: i32): i32 {
  let bad = stateDiffers();
  if (depth == 0) return bad;
  const end = generateMoves(walkMoves, at, true);
  for (let i = at; i < end; i++) {
    const m = walkMoves[i];
    doMove(m);
    bad += evalWalkRec(depth - 1, end);
    undoMove(m);
    bad += stateDiffers();
  }
  return bad;
}

/** walks the tree to `depth` checking the incremental sum, the correction keys and the cached eval after every make and unmake; returns mismatches */
export function evalWalk(depth: i32): i32 {
  refresh();
  return evalWalkRec(depth, 0);
}

// ------------------------------------------------------------------ eval bench

/** a position in the eval bench's set: bb, then side, castling and the packed sum, then the pawn key */
const BENCH_WORDS = 18;
/** allocated by evalBenchInit, so a build that plays never holds the set */
let benchSet = changetype<StaticArray<u64>>(0);
let benchCount = 0;

/** empties the eval bench's set, with room for `n` positions */
export function evalBenchInit(n: i32): void {
  benchSet = new StaticArray<u64>(n * BENCH_WORDS);
  benchCount = 0;
}

/** adds the current position to the set */
export function evalBenchAdd(): void {
  refresh();
  const at = benchCount++ * BENCH_WORDS;
  for (let i = 0; i < 16; i++) benchSet[at + i] = bb[i];
  benchSet[at + 16] = <u64>side | (<u64>castling << 1) | (<u64><u32>psq << 32);
  benchSet[at + 17] = pawnKey;
}

/**
 * `reps` passes over the set in wasm, so the eval's time holds no host call and
 * branches see a changing position. With `withEval` false it only restores each
 * position: the time to subtract. Returns a checksum of the evals, or of the sums
 * restored. It leaves the board unfit for play; the host sets a position after it.
 */
export function evalBenchRun(reps: i32, withEval: bool): i32 {
  const set = benchSet;
  const words = benchCount * BENCH_WORDS;
  let sum = 0;
  for (let r = 0; r < reps; r++) {
    for (let at = 0; at < words; at += BENCH_WORDS) {
      for (let i = 0; i < 16; i++) unchecked((bb[i] = set[at + i]));
      const state = unchecked(set[at + 16]);
      setState(<i32>state & 1, <i32>(state >> 1) & 15, -1, 0, 1);
      setPawnKey(unchecked(set[at + 17]));
      const packed = <i32>(state >> 32);
      sum = sum * 31 + (withEval ? evalWith(packed, true) : packed);
    }
  }
  return sum;
}
