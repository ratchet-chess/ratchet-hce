/**
 * The own engine's search: iterative deepening with aspiration windows, a
 * principal variation search, and a quiescence search. Scores are for the side
 * to move, in the engine's unit; a mate in n plies is MATE - n.
 *
 * Every node starts with a TT probe; non-PV nodes cut on a TT bound of enough
 * depth. The static eval is the raw eval plus the correction history
 * (correction.ts); the TT stores the raw one. Before the move loop: reverse
 * futility, razoring, null move and IIR.
 * In it: late move pruning, futility on the reduced depth, history pruning and
 * SEE pruning, then a check extension on the move and late move reductions.
 * Each form's origin is named where it is applied.
 */
import { KING, MAX_MOVES, MAX_PLY, PAWN, movePromo } from "../../core/constants";
import { generateMoves } from "../../core/movegen";
import { bb, halfmove, hash, inCheck, isRepetition, ply, side } from "../../core/position";
import { correction, updateCorrection } from "./correction";
import { UNITS_PER_CP, evalWith } from "./eval";
import { bonusAt, butterfly, captureHist, contHist, gravity, gravityFrom, killers, malusAt } from "./history";
import {
  MOVES, SCORES, STAGE_GOOD_NOISY, STAGE_QUIET, captureIndex, captureScore, initPicker, isNoisy, nextMove, pickedStage, pieceTo,
  quietScore, selectBest, victimOf,
} from "./movepick";
import {
  ASP_DELTA, ASP_DEPTH, FUT_BASE, FUT_DEPTH, FUT_HISTORY, FUT_PER_DEPTH, HP_DEPTH, HP_LIMIT, IIR_DEPTH, LMP_COUNT, LMP_DEPTH, LMR_BASE,
  LMR_DIV, LMR_HISTORY_DIV, LMR_HISTORY_MAX, NMP_BASE, NMP_DEPTH, NMP_DEPTH_DIV, NMP_EVAL_DIV, NMP_EVAL_MAX, QS_DELTA, RAZOR_DEPTH,
  RAZOR_MARGIN, RFP_DEPTH, RFP_IMPROVING, RFP_MARGIN, SEE_DEPTH, SEE_NOISY, SEE_QUIET, SEE_VALUE,
} from "./params";
import { seeGe } from "./see";
import { doMove, doNull, psq, undoMove, undoNull } from "./state";
import { mayContinue, mustStop } from "./time";
import { BOUND_EXACT, BOUND_LOWER, BOUND_UPPER, fullMove, ttBound, ttDepth, ttEval, ttMove, ttNewSearch, ttProbe, ttPv, ttScore, ttStore } from "./tt";

@external("env", "onIteration") declare function hostIteration(depth: i32, score: i32, nodes: f64): i32;

export const MATE = 32000;
/** scores beyond this are mates */
export const MATE_IN_MAX = MATE - 256;
const INF = 32001;
/** no static eval: the node is in check; it fits the TT's i16 */
const EVAL_NONE = -32767;
/** the deepest iteration; the core's ply stack holds MAX_PLY */
export const MAX_DEPTH = 100;
/** the search stops descending this many plies short of the core's stack */
const PLY_GUARD = MAX_PLY - 8;

// ---------------------------------------------------------------- search stack

/** the stack is indexed by ply + SS, so a node reads the four plies above the root */
const SS = 4;
/** the move made at a ply, NULL_MOVE for a null move, 0 above the root */
const ssMove = new StaticArray<i32>(MAX_PLY + SS + 1);
/** the continuation-history row of the move made at a ply, -1 for none */
const ssCont = new StaticArray<i32>(MAX_PLY + SS + 1);
/** the corrected static eval, EVAL_NONE in check */
const ssStatic = new StaticArray<i32>(MAX_PLY + SS + 1);
/** the raw static eval, the one the TT stores */
const ssRaw = new StaticArray<i32>(MAX_PLY + SS + 1);
const NULL_MOVE = 1 << 30;

/** the triangular PV: row p holds the line from ply p, to pvLen[p] */
const pvTable = new StaticArray<i32>(MAX_PLY * MAX_PLY);
const pvLen = new StaticArray<i32>(MAX_PLY + 1);

/** the moves each ply has searched, for the history malus */
const QUIETS_MAX = 64;
const CAPTURES_MAX = 32;
const quietsTried = new StaticArray<i32>(MAX_PLY * QUIETS_MAX);
const capturesTried = new StaticArray<i32>(MAX_PLY * CAPTURES_MAX);

/** late move reductions by depth and move count, Ethereal v12.75 InitializeSearch: 0.75 + ln d ln m / 2.25 */
const LMR = new StaticArray<u8>(64 * 64);

/** the root's legal moves and the nodes spent under each, for the time rule */
const rootMoves = new StaticArray<i32>(MAX_MOVES);
const rootNodes = new StaticArray<f64>(MAX_MOVES);
let rootCount = 0;

let nodeCount: u64 = 0;
let stopped = false;
let completed = 0;

/** the last finished iteration's line, move and score */
const rootPv = new StaticArray<i32>(MAX_PLY);
export let rootPvLen = 0;
export let bestScore = 0;

export function initSearch(): void {
  for (let d = 1; d < 64; d++) {
    for (let m = 1; m < 64; m++) {
      LMR[d * 64 + m] = <u8>(<f64>LMR_BASE / 100 + (Math.log(<f64>d) * Math.log(<f64>m)) / (<f64>LMR_DIV / 100));
    }
  }
}

export function nodesSearched(): f64 {
  return <f64>nodeCount;
}

export function completedDepth(): i32 {
  return completed;
}

export function pvAt(i: i32): i32 {
  return i < rootPvLen ? rootPv[i] : 0;
}

/** a score in the host's terms: centipawns, or a mate score unchanged */
export function hostScore(s: i32): i32 {
  return abs(s) >= MATE_IN_MAX ? s : s / UNITS_PER_CP;
}

@inline function evaluate(): i32 {
  return evalWith(psq);
}

// ---------------------------------------------------------------- helpers

/** a mate score made relative to this node, for the TT */
@inline function scoreToTT(s: i32, p: i32): i32 {
  return s >= MATE_IN_MAX ? s + p : s <= -MATE_IN_MAX ? s - p : s;
}

/**
 * A TT score made relative to the root. A mate further away than the fifty-move
 * count allows is returned as the best non-mate score (Stockfish 5ae195ee).
 */
@inline function scoreFromTT(s: i32, p: i32): i32 {
  if (s >= MATE_IN_MAX) return MATE - s > 100 - halfmove ? MATE_IN_MAX - 1 : s - p;
  if (s <= -MATE_IN_MAX) return MATE + s > 100 - halfmove ? -MATE_IN_MAX + 1 : s + p;
  return s;
}

/** whether a TT bound settles a score against alpha and beta */
@inline function boundCuts(bound: i32, s: i32, alpha: i32, beta: i32): bool {
  return bound == BOUND_EXACT || (bound == BOUND_LOWER ? s >= beta : s <= alpha);
}

/** whether the side to move has a piece besides pawns and its king */
@inline function hasPieces(): bool {
  const c = side << 3;
  return (bb[c] & ~(bb[c | PAWN] | bb[c | KING])) != 0;
}

@inline function checkStop(): void {
  if ((nodeCount & 1023) == 0 && completed >= 1 && mustStop(<f64>nodeCount)) stopped = true;
}

/**
 * moves a quiet's butterfly and 1-, 2- and 4-ply continuation history by `bonus`
 * (Stash 660df34 adds the 4-ply); each continuation entry decays against the
 * average of the three, a missing one counted as 0 (Stash 93a6d5f)
 */
function rewardQuiet(m: i32, bonus: i32, p: i32): void {
  const pt = pieceTo(m);
  const cm = ssCont[p + SS - 1];
  const fm = ssCont[p + SS - 2];
  const f4 = ssCont[p + SS - 4];
  gravity(butterfly, (side << 12) | (m & 4095), bonus);
  let base = 0;
  if (cm >= 0) base += <i32>contHist[cm + pt];
  if (fm >= 0) base += <i32>contHist[fm + pt];
  if (f4 >= 0) base += <i32>contHist[f4 + pt];
  base /= 3;
  if (cm >= 0) gravityFrom(contHist, cm + pt, base, bonus);
  if (fm >= 0) gravityFrom(contHist, fm + pt, base, bonus);
  if (f4 >= 0) gravityFrom(contHist, f4 + pt, base, bonus);
}

/**
 * The history update after a cut by `best` at `depth` (Weiss UpdateHistory): a
 * bonus to it and a malus to each move of its kind tried before it; captures
 * tried before it lose either way. A quiet that cut as the only quiet tried at
 * depth 3 or less leaves the quiet histories alone (Ethereal update_quiet_histories).
 */
function updateHistories(best: i32, depth: i32, p: i32, quiets: i32, captures: i32): void {
  const bonus = bonusAt(depth);
  const malus = -malusAt(depth);
  if (!isNoisy(best)) {
    killers[p] = best;
    if (depth > 3 || quiets > 1) {
      rewardQuiet(best, bonus, p);
      for (let i = 0; i < quiets; i++) {
        const q = quietsTried[p * QUIETS_MAX + i];
        if (q != best) rewardQuiet(q, malus, p);
      }
    }
  } else {
    gravity(captureHist, captureIndex(best), bonus);
  }
  for (let i = 0; i < captures; i++) {
    const c = capturesTried[p * CAPTURES_MAX + i];
    if (c != best) gravity(captureHist, captureIndex(c), malus);
  }
}

// ---------------------------------------------------------------- search

function search(alpha: i32, beta: i32, depth: i32, cutNode: bool): i32 {
  const p = ply;
  pvLen[p] = p;
  if (depth <= 0) return qsearch(alpha, beta);
  const pvNode = beta - alpha > 1;
  const root = p == 0;
  nodeCount++;
  checkStop();
  if (stopped) return 0;

  if (!root) {
    // Ratchet's guard: a fifty-move draw is returned before a mate on the hundredth ply is found
    if (halfmove >= 100 || isRepetition()) return 0;
    if (p >= PLY_GUARD) return inCheck() ? 0 : evaluate();
    // mate distance pruning (Fruit 1.0)
    alpha = max(alpha, -MATE + p);
    beta = min(beta, MATE - p - 1);
    if (alpha >= beta) return alpha;
  }

  const check = inCheck();
  const key = hash;
  const hit = ttProbe(key);
  let tMove = 0;
  let tScore = 0;
  let tBound = 0;
  let tPv = false;
  if (hit) {
    tMove = fullMove(ttMove);
    tScore = scoreFromTT(ttScore, p);
    tBound = ttBound;
    tPv = ttPv;
    // no cut at PV nodes (Stockfish 4739037f), nor late in the fifty-move count (Stockfish bae019b5, Alexandria)
    if (!pvNode && ttDepth >= depth && halfmove < 90 && boundCuts(tBound, tScore, alpha, beta)) {
      // Weiss 5168a50: a quiet TT move that cuts earns its bonus
      if (tMove && tScore >= beta && !isNoisy(tMove)) {
        rewardQuiet(tMove, bonusAt(depth), p);
        killers[p] = tMove;
      }
      return tScore;
    }
  }

  // the static eval, and the eval the pruning reads: the TT score where its bound says it is better (Weiss, Clockwork 6bf993b)
  let staticEval = EVAL_NONE;
  let raw = EVAL_NONE;
  let eval = EVAL_NONE;
  let improving = false;
  if (!check) {
    raw = hit && ttEval != EVAL_NONE ? ttEval : evaluate();
    staticEval = raw + correction(side);
    eval = staticEval;
    if (hit && (tBound == BOUND_EXACT || (tBound == BOUND_LOWER ? tScore > eval : tScore < eval))) eval = tScore;
    // improving, Alexandria 829daf4: against two plies up, else four, else true
    const s2 = ssStatic[p + SS - 2];
    const s4 = ssStatic[p + SS - 4];
    improving = s2 != EVAL_NONE ? staticEval > s2 : s4 != EVAL_NONE ? staticEval > s4 : true;
  }
  ssStatic[p + SS] = staticEval;
  ssRaw[p + SS] = raw;
  killers[p + 1] = 0;

  if (!pvNode && !check) {
    // reverse futility, Stash f91e750
    if (depth <= RFP_DEPTH && eval < MATE_IN_MAX && eval - (RFP_MARGIN * depth - (improving ? RFP_IMPROVING : 0)) >= beta) return eval;

    // razoring, Stash f91e750: to qsearch at depth 2 or less, a null-window qsearch below alpha at depth 3
    if (depth <= RAZOR_DEPTH && staticEval + RAZOR_MARGIN * depth <= alpha) {
      if (depth <= 2) return qsearch(alpha, beta);
      const ra = alpha - RAZOR_MARGIN * depth;
      const v = qsearch(ra, ra + 1);
      if (v <= ra) return v;
    }

    // null move, Ethereal v12.75, with Weiss's eval >= static eval guard; Ethereal 94e78e3's TT guard
    if (
      depth >= NMP_DEPTH &&
      eval >= beta &&
      eval >= staticEval &&
      ssMove[p + SS - 1] != NULL_MOVE &&
      ssMove[p + SS - 2] != NULL_MOVE &&
      hasPieces() &&
      !(hit && tBound == BOUND_UPPER && tScore < beta)
    ) {
      const r = NMP_BASE + depth / NMP_DEPTH_DIV + min(NMP_EVAL_MAX, (eval - beta) / NMP_EVAL_DIV);
      ssMove[p + SS] = NULL_MOVE;
      ssCont[p + SS] = -1;
      doNull();
      const v = -search(-beta, -beta + 1, depth - r, !cutNode);
      undoNull();
      if (stopped) return 0;
      if (v >= beta) return v >= MATE_IN_MAX ? beta : v;
    }
  }

  // internal iterative reduction, Berserk 03cebd6
  if ((pvNode || cutNode) && depth >= IIR_DEPTH && !tMove) depth--;

  const cm = ssCont[p + SS - 1];
  const fm = ssCont[p + SS - 2];
  const f4 = ssCont[p + SS - 4];
  initPicker(p, tMove, killers[p], cm, fm, f4);
  let best = -INF;
  let bestMove = 0;
  let played = 0;
  let quiets = 0;
  let captures = 0;
  let skipQuiets = false;
  let m = 0;
  while ((m = nextMove(p, skipQuiets)) != 0) {
    const noisy = isNoisy(m);
    const pt = pieceTo(m);
    let cmh = 0;
    let fmh = 0;
    let hist = 0;
    if (noisy) hist = <i32>captureHist[captureIndex(m)];
    else {
      if (cm >= 0) cmh = <i32>contHist[cm + pt];
      if (fm >= 0) fmh = <i32>contHist[fm + pt];
      hist = <i32>butterfly[(side << 12) | (m & 4095)] + cmh + fmh;
      if (f4 >= 0) hist += <i32>contHist[f4 + pt];
    }

    // pruning, once a move has kept the node from a mated score
    if (!root && best > -MATE_IN_MAX) {
      const lmrDepth = max(0, depth - <i32>LMR[min(depth, 63) * 64 + min(played, 63)]);
      if (!noisy) {
        // late move pruning, Ethereal v12.75
        if (depth <= LMP_DEPTH && played >= LMP_COUNT[(improving ? 9 : 0) + depth]) {
          skipQuiets = true;
          continue;
        }
        // futility on the reduced depth, Ethereal 0e47e9b
        if (!check && lmrDepth <= FUT_DEPTH && eval + FUT_BASE + FUT_PER_DEPTH * lmrDepth <= alpha && hist < FUT_HISTORY[improving ? 1 : 0]) {
          skipQuiets = true;
          continue;
        }
        // history pruning, Ethereal v12.75: counter-move and follow-up history
        const imp = improving ? 1 : 0;
        if (lmrDepth <= HP_DEPTH[imp] && (cmh < HP_LIMIT[imp] || fmh < HP_LIMIT[imp])) continue;
      }
      // SEE pruning, Ethereal v12.75: past the good captures
      if (depth <= SEE_DEPTH && pickedStage > STAGE_GOOD_NOISY && !seeGe(m, noisy ? -SEE_NOISY * depth * depth : -SEE_QUIET * depth)) continue;
    }

    ssMove[p + SS] = m;
    ssCont[p + SS] = pt << 10;
    const before = nodeCount;
    doMove(m);
    played++;
    // the check extension, on the move in the parent
    const newDepth = depth - 1 + (inCheck() ? 1 : 0);
    let v = 0;
    if (played == 1) {
      v = -search(-beta, -alpha, newDepth, pvNode ? false : !cutNode);
    } else {
      let full = true;
      // late move reductions on quiets, Ethereal v12.75: R = 1 is no reduction
      if (!noisy && depth > 2) {
        let r = <i32>LMR[min(depth, 63) * 64 + min(played, 63)];
        if (!pvNode) r++;
        if (!improving) r++;
        if (pickedStage < STAGE_QUIET) r--;
        r -= max(-LMR_HISTORY_MAX, min(LMR_HISTORY_MAX, hist / LMR_HISTORY_DIV));
        r = min(depth - 1, max(r, 1));
        if (r > 1) {
          v = -search(-alpha - 1, -alpha, newDepth - r + 1, true);
          full = v > alpha;
        }
      }
      if (full) v = -search(-alpha - 1, -alpha, newDepth, !cutNode);
      if (pvNode && v > alpha && v < beta) v = -search(-beta, -alpha, newDepth, false);
    }
    undoMove(m);
    if (stopped) return 0;

    if (root) {
      for (let i = 0; i < rootCount; i++) {
        if (rootMoves[i] == m) {
          rootNodes[i] += <f64>(nodeCount - before);
          break;
        }
      }
    }
    if (noisy) {
      if (captures < CAPTURES_MAX && !movePromo(m)) capturesTried[p * CAPTURES_MAX + captures++] = m;
    } else if (quiets < QUIETS_MAX) quietsTried[p * QUIETS_MAX + quiets++] = m;

    if (v > best) {
      best = v;
      if (v > alpha) {
        bestMove = m;
        if (pvNode) {
          const row = p * MAX_PLY;
          const child = (p + 1) * MAX_PLY;
          pvTable[row + p] = m;
          const n = pvLen[p + 1];
          for (let i = p + 1; i < n; i++) pvTable[row + i] = pvTable[child + i];
          pvLen[p] = max(n, p + 1);
        }
        if (v >= beta) break;
        alpha = v;
      }
    }
  }

  if (played == 0) return check ? -MATE + p : 0;
  if (best >= beta) updateHistories(bestMove, depth, p, quiets, captures);
  const bound = best >= beta ? BOUND_LOWER : bestMove ? BOUND_EXACT : BOUND_UPPER;
  // correction history, Stash 302136d: not in check, no noisy best move, and the bound says the eval was wrong in that direction
  if (
    !check &&
    !(bestMove && isNoisy(bestMove)) &&
    !(bound == BOUND_LOWER && best <= staticEval) &&
    !(bound == BOUND_UPPER && best >= staticEval)
  ) updateCorrection(side, depth, best - staticEval);
  ttStore(key, bestMove, scoreToTT(best, p), raw, depth, bound, pvNode || tPv);
  return best;
}

/**
 * The quiescence search: stand pat, then captures and queen promotions that pass
 * SEE >= 0 (Weiss 2568fb7), each skipped if its victim cannot lift stand pat to
 * alpha; in check, every evasion. It probes and stores the TT at depth 0, never
 * as an exact bound (Stockfish 45e5e65a).
 */
function qsearch(alpha: i32, beta: i32): i32 {
  const p = ply;
  pvLen[p] = p;
  nodeCount++;
  checkStop();
  if (stopped) return 0;
  const pvNode = beta - alpha > 1;
  if (halfmove >= 100 || isRepetition()) return 0;
  const check = inCheck();
  if (p >= PLY_GUARD) return check ? 0 : evaluate();

  const key = hash;
  const hit = ttProbe(key);
  let tMove = 0;
  let tScore = 0;
  let tBound = 0;
  if (hit) {
    tMove = fullMove(ttMove);
    tScore = scoreFromTT(ttScore, p);
    tBound = ttBound;
    if (!pvNode && halfmove < 90 && boundCuts(tBound, tScore, alpha, beta)) return tScore;
  }

  let best = -MATE + p;
  let raw = EVAL_NONE;
  if (!check) {
    raw = hit && ttEval != EVAL_NONE ? ttEval : evaluate();
    best = raw + correction(side);
    if (hit && (tBound == BOUND_EXACT || (tBound == BOUND_LOWER ? tScore > best : tScore < best))) best = tScore;
    if (best >= beta) return best;
    if (best > alpha) alpha = best;
  }

  const base = p * MAX_MOVES;
  const end = generateMoves(MOVES, base, check);
  if (check && end == base) return -MATE + p;
  for (let i = base; i < end; i++) {
    const m = MOVES[i];
    SCORES[i] = m == tMove ? 1 << 30 : isNoisy(m) ? captureScore(m) + (1 << 18) : quietScore(m, -1, -1, -1);
  }
  let bestMove = 0;
  for (let i = base; i < end; i++) {
    selectBest(i, end);
    const m = MOVES[i];
    if (!check) {
      if (!seeGe(m, 0)) continue;
      if (!movePromo(m) && best + SEE_VALUE[victimOf(m)] + QS_DELTA <= alpha) continue;
    }
    doMove(m);
    const v = -qsearch(-beta, -alpha);
    undoMove(m);
    if (stopped) return 0;
    if (v > best) {
      best = v;
      if (v > alpha) {
        bestMove = m;
        if (v >= beta) break;
        alpha = v;
      }
    }
  }
  ttStore(key, bestMove, scoreToTT(best, p), raw, 0, best >= beta ? BOUND_LOWER : BOUND_UPPER, pvNode);
  return best;
}

// ---------------------------------------------------------------- iterative deepening

/**
 * Searches the core's position by iterative deepening to `maxDepth`, or until the
 * time rules or the host stop it once an iteration has finished. Returns the best
 * move, or 0 when the position has no legal move.
 */
export function think(maxDepth: i32): i32 {
  stopped = false;
  nodeCount = 0;
  completed = 0;
  rootPvLen = 0;
  bestScore = 0;
  ttNewSearch();
  for (let i = 0; i < ssMove.length; i++) {
    ssMove[i] = 0;
    ssCont[i] = -1;
    ssStatic[i] = EVAL_NONE;
    ssRaw[i] = EVAL_NONE;
  }
  rootCount = generateMoves(rootMoves, 0, true);
  for (let i = 0; i < rootCount; i++) rootNodes[i] = 0;
  if (rootCount == 0) return 0;

  let score = 0;
  let previous = 0;
  for (let depth = 1; depth <= maxDepth; depth++) {
    // aspiration, Ethereal aspirationWindow: fail low halves beta down, fail high searches one ply less
    let delta = ASP_DELTA;
    let alpha = -INF;
    let beta = INF;
    if (depth >= ASP_DEPTH) {
      alpha = max(score - delta, -INF);
      beta = min(score + delta, INF);
    }
    let d = depth;
    let v = 0;
    while (true) {
      v = search(alpha, beta, d, false);
      if (stopped) break;
      if (v <= alpha) {
        beta = (alpha + beta) / 2;
        alpha = max(v - delta, -INF);
        d = depth;
      } else if (v >= beta) {
        beta = min(v + delta, INF);
        if (abs(v) < MATE_IN_MAX) d = max(1, d - 1);
      } else break;
      delta += delta / 2;
    }
    if (stopped) break;

    score = v;
    completed = depth;
    rootPvLen = pvLen[0];
    for (let i = 0; i < rootPvLen; i++) rootPv[i] = pvTable[i];
    bestScore = v;
    hostIteration(depth, hostScore(v), <f64>nodeCount);

    const best = rootPv[0];
    let share: f64 = 0;
    for (let i = 0; i < rootCount; i++) if (rootMoves[i] == best) share = rootNodes[i] / max<f64>(1, <f64>nodeCount);
    const uncertain = depth > 1 && best != previous;
    previous = best;
    if (!mayContinue(<f64>nodeCount, share, uncertain, best, v)) break;
  }
  return rootPvLen ? rootPv[0] : rootMoves[0];
}

