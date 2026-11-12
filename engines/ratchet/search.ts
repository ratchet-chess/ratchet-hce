/**
 * The own engine's search: iterative deepening with aspiration windows, a
 * principal variation search, and a quiescence search. Scores are for the side
 * to move, in the engine's unit; a mate in n plies is MATE - n.
 *
 * Every node starts with a TT probe; non-PV nodes cut on a TT bound of enough
 * depth, and on nothing less (boundCuts). The static eval is the raw eval plus the correction history
 * (correction.ts); the TT stores the raw one. Before the move loop: reverse
 * futility, razoring, null move and IIR.
 * In it: late move pruning, futility on the reduced depth, history pruning and
 * SEE pruning, then a check extension on the move and late move reductions on
 * quiet and noisy moves, whose re-search goes a ply deeper or shallower by how far
 * the reduced search beat the best.
 * Each form's origin is named where it is applied. The window gate (test/window.ts)
 * reads the search's exact layer through searchWindow.
 */
import { KING, MAX_MOVES, MAX_PLY, PAWN, movePromo } from "../../core/constants";
import { generateCaptures, generateMoves } from "../../core/movegen";
import { bb, halfmove, hash, inCheck, isRepetition, make, ply, side, unmake } from "../../core/position";
import { contSlot, correction, updateCorrection } from "./correction";
import { UNITS_PER_CP, evalCached } from "./eval";
import { bonusAt, butterfly, butterflyIndex, captureHist, contHist, gravity, gravityFrom, killers, malusAt, rewardPawn, threatsAt } from "./history";
import {
  MOVES, SCORES, STAGE_BAD_NOISY, STAGE_GOOD_NOISY, STAGE_QUIET, captureIndex, captureScore, initPicker, isNoisy, nextMove, pickedStage, pieceTo,
  quietScore, resumeAfterTT, selectBest, victimOf,
} from "./movepick";
import {
  ASP_DELTA, ASP_DEPTH, CHECK_EXT, CONT6, CORR_CONT, DRAW_JITTER, FUT_BASE, FUT_DEPTH, FUT_HISTORY, FUT_PER_DEPTH, HIST_DEEP_MARGIN, HIST_PRIOR_BONUS_DEPTH, HIST_PRIOR_MALUS, HP_DEPTH, HP_LIMIT, IIR_DEPTH, LMP_COUNT, LMP_DEPTH, LMR_ALPHA_RAISE,
  LMR_BASE, LMR_CONT_UPDATE, LMR_CUT_NODE, LMR_DEEPER, LMR_DIV, LMR_EARLY_STAGE, LMR_FAIL_HIGH, LMR_FAIL_HIGH_COUNT, LMR_HISTORY_DIV, LMR_HISTORY_MAX,
  LMR_HISTORY_STEP, LMR_MIN_DEPTH, LMR_NOISY_BASE, LMR_NOISY_DIV, LMR_NOISY_HISTORY_DIV, LMR_NOISY_MIN_DEPTH, LMR_NON_PV, LMR_NOT_IMPROVING,
  LMR_SHALLOWER, LMR_TT_NOISY, LMR_TT_PV, MAT_EG, NF_DEPTH, NF_MARGIN, NMP_BASE, NMP_CUT_NODE, NMP_EVAL_MARGIN, NMP_STATIC, NMP_STATIC_BASE, NMP_STATIC_PER, PAWN_HISTORY, PC_DEPTH, PC_MARGIN, PC_REDUCTION, PRUNE_BASE, PRUNE_DIV, SE_DEPTH, SE_DOUBLE_MARGIN,
  SE_DOUBLE_MAX, SE_MARGIN, SE_MARGIN_DIV, SE_NEG_ALPHA, SE_NEG_CUT, SE_SEARCH_ADD, SE_TRIPLE_MARGIN, SE_TT_DEPTH, NMP_DEPTH, NMP_DEPTH_DIV, NMP_EVAL_DIV, NMP_EVAL_MAX, QS_DELTA,
  QS_EVASIONS, QS_SEE, RAZOR_DEPTH, RAZOR_DROP, RAZOR_MARGIN, RAZOR_QS_DEPTH, RFP_DEPTH, RFP_IMPROVING, RFP_MARGIN, SEE_DEPTH, SEE_NOISY, SEE_QUIET, TT_CUT_NODE,
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

/** the stack is indexed by ply + SS, so a node reads the six plies above the root */
const SS = 6;
/** the move made at a ply, NULL_MOVE for a null move, 0 above the root */
const ssMove = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/** the continuation-history row of the move made at a ply, -1 for none */
const ssCont = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/** the corrected static eval, EVAL_NONE in check */
const ssStatic = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/** the raw static eval, the one the TT stores */
const ssRaw = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/** double extensions on the line to a ply, Stash f91e750 double_extensions */
const ssDouble = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/** per ply, the count of moves played at the node when its current move is quiet, else 0: what the child reads of its parent's move */
const ssQuietCount = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/** how many of a ply's nodes have failed high since their parent's move loop began; a node reads its children's count (Clockwork 641d9f5 fail_high_count) */
const ssFailHigh = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + 2)));
/** the move a ply's singular search leaves out, 0 for none */
const excludedAt = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + 1)));
/** the iteration's depth, which bounds extensions (Stash f91e750) */
let rootDepth = 0;
/**
 * mixed into the key of a node searched with a move left out, so its TT entries
 * are its own; Ratchet's multiplier, since the TT checks the key's top 16 bits,
 * which Stash's excluded << 16 leaves alone
 */
const EXCLUDED_MIX: u64 = 0x9e3779b97f4a7c15;
const NULL_MOVE = 1 << 30;

/** the triangular PV: row p holds the line from ply p, to pvLen[p] */
const pvTable = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY * MAX_PLY));
const pvLen = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + 1)));

/** the moves each ply has searched, for the history malus */
const QUIETS_MAX = 64;
const CAPTURES_MAX = 32;
const quietsTried = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY * QUIETS_MAX));
const capturesTried = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY * CAPTURES_MAX));

/** ln(i) * 1024, rounded: late move reductions and the pruning's reduced depth read it */
const LN = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 64));

/** the root's legal moves and the nodes spent under each, for the time rule */
const rootMoves = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_MOVES));
const rootNodes = changetype<StaticArray<f64>>(memory.data(sizeof<f64>() * MAX_MOVES));
let rootCount = 0;

let nodeCount: u64 = 0;
let stopped = false;
let completed = 0;

/** the last finished iteration's line, move and score */
const rootPv = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
export let rootPvLen = 0;
export let bestScore = 0;

export function initSearch(): void {
  for (let i = 1; i < 64; i++) LN[i] = <i32>Math.round(Math.log(<f64>i) * 1024);
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
  return evalCached(psq);
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

/**
 * Whether a TT bound settles a score against alpha and beta: an exact bound, a lower
 * bound at or above beta, or an upper bound at or below alpha. A hit either cuts at
 * once or is left alone; the window is never tightened from a stored bound. That is
 * the form Huizing and van de Wetering verified (Formal Verification of Minimax
 * Algorithms, 2025): the result is an alpha-beta result of some expansion of the
 * tree, and the table stays valid. Marsland's form, raising alpha from a stored lower
 * bound, is rejected: with an entry from a deeper search it returns a value no
 * expansion of the tree has.
 */
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
 * moves a quiet's butterfly and 1-, 2-, 4- and 6-ply continuation history by `bonus`
 * (Stash 660df34 adds the 4-ply, Clockwork 3dd022c the 6-ply); each continuation entry decays
 * against the average of the first three, a missing one counted as 0 (Stash 93a6d5f)
 */
function rewardQuiet(m: i32, bonus: i32, p: i32): void {
  const pt = pieceTo(m);
  gravity(butterfly, butterflyIndex(m, threatsAt(p)), bonus);
  // pawn history takes what the butterfly table takes, Weiss 20c95ce
  if (PAWN_HISTORY != 0) rewardPawn(pt, bonus);
  rewardCont(pt, ssCont[p + SS - 1], ssCont[p + SS - 2], ssCont[p + SS - 4], CONT6 != 0 ? ssCont[p + SS - 6] : -1, bonus);
}

/** the continuation part of rewardQuiet, for a piece and square after the moves 1, 2, 4 and 6 plies back */
function rewardCont(pt: i32, cm: i32, fm: i32, f4: i32, f6: i32, bonus: i32): void {
  let base = 0;
  if (cm >= 0) base += <i32>contHist[cm + pt];
  if (fm >= 0) base += <i32>contHist[fm + pt];
  if (f4 >= 0) base += <i32>contHist[f4 + pt];
  base /= 3;
  if (cm >= 0) gravityFrom(contHist, cm + pt, base, bonus);
  if (fm >= 0) gravityFrom(contHist, fm + pt, base, bonus);
  if (f4 >= 0) gravityFrom(contHist, f4 + pt, base, bonus);
  if (f6 >= 0) gravityFrom(contHist, f6 + pt, base, bonus);
}

/**
 * moves the continuation entries of the parent's move by `bonus`: the rows are the moves 1, 2, 4 and 6 plies before
 * that move (Stockfish 11 update_continuation_histories on ss-1). The caller has checked that the parent's move is quiet.
 */
function rewardPrior(p: i32, bonus: i32): void {
  rewardCont(ssCont[p + SS - 1] >> 10, ssCont[p + SS - 2], ssCont[p + SS - 3], ssCont[p + SS - 5], CONT6 != 0 ? ssCont[p + SS - 7] : -1, bonus);
}

/** a draw's score, DRAW_JITTER above or below zero by a bit of the node count (Stash worker_draw_score) */
@inline function drawScore(): i32 {
  return DRAW_JITTER == 0 ? 0 : (nodeCount & 2) != 0 ? DRAW_JITTER : -DRAW_JITTER;
}

/** the last check test made after a move, keyed by the position, so the child need not repeat it */
let knownCheckKey: u64 = 0;
let knownCheck = false;

/**
 * The history update after a cut by `best` at `depth` (Weiss UpdateHistory): a
 * bonus to it and a malus to each move of its kind tried before it; captures
 * tried before it lose either way. A quiet that cut as the only quiet tried at
 * depth 3 or less leaves the quiet histories alone (Ethereal update_quiet_histories).
 */
function updateHistories(best: i32, depth: i32, bonusDepth: i32, p: i32, quiets: i32, captures: i32): void {
  const bonus = bonusAt(bonusDepth);
  const malus = -malusAt(bonusDepth);
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
    if (halfmove >= 100 || isRepetition()) return drawScore();
    if (p >= PLY_GUARD) return inCheck() ? 0 : evaluate();
    // mate distance pruning (Fruit 1.0)
    alpha = max(alpha, -MATE + p);
    beta = min(beta, MATE - p - 1);
    if (alpha >= beta) return alpha;
  }

  const check = hash == knownCheckKey ? knownCheck : inCheck();
  const excl = excludedAt[p];
  const key = excl ? hash ^ (<u64>excl * EXCLUDED_MIX) : hash;
  const hit = ttProbe(key);
  let tMove = 0;
  let tScore = 0;
  let tBound = 0;
  let tDepth = 0;
  let tPv = false;
  if (hit) {
    tScore = scoreFromTT(ttScore, p);
    tBound = ttBound;
    tDepth = ttDepth;
    tPv = ttPv;
    // no cut at PV nodes (Stockfish 4739037f), nor late in the fifty-move count (Stockfish bae019b5, Alexandria);
    // a node not expected to cut takes a fail low only (Ethereal 311d110)
    if (!pvNode && ttDepth >= depth && halfmove < 90 && boundCuts(tBound, tScore, alpha, beta) && (TT_CUT_NODE == 0 || cutNode || tScore <= alpha)) {
      // Weiss 5168a50: a quiet TT move that cuts earns its bonus; the killer is Ratchet's addition, as in Xiphos and Stockfish 11
      if (tScore >= beta) {
        const cutMove = fullMove(ttMove);
        if (cutMove && !isNoisy(cutMove)) {
          rewardQuiet(cutMove, bonusAt(depth), p);
          killers[p] = cutMove;
        }
        // the parent's early quiet move is refuted from the table, Stockfish 11
        const prior = ssQuietCount[p + SS - 1];
        if (HIST_PRIOR_MALUS != 0 && prior >= 1 && prior <= 2) rewardPrior(p, -malusAt(depth + 1));
      }
      return tScore;
    }
    tMove = fullMove(ttMove);
  }

  // the static eval, and the eval the pruning reads: the TT score where its bound says it is better (Weiss, Clockwork 6bf993b)
  let staticEval = EVAL_NONE;
  let raw = EVAL_NONE;
  let eval = EVAL_NONE;
  let improving = false;
  const corrCont = contSlot(ssCont[p + SS - 2], ssCont[p + SS - 1]);
  if (!check) {
    raw = hit && ttEval != EVAL_NONE ? ttEval : evaluate();
    staticEval = raw + correction(side, corrCont);
    eval = staticEval;
    if (hit && (tBound == BOUND_EXACT || (tBound == BOUND_LOWER ? tScore > eval : tScore < eval))) eval = tScore;
    // improving, Alexandria 829daf4: against two plies up, else four, else true
    const s2 = ssStatic[p + SS - 2];
    const s4 = ssStatic[p + SS - 4];
    improving = s2 != EVAL_NONE ? staticEval > s2 : s4 != EVAL_NONE ? staticEval > s4 : true;
  }
  ssStatic[p + SS] = staticEval;
  ssRaw[p + SS] = raw;
  ssDouble[p + SS] = ssDouble[p + SS - 1];
  killers[p + 1] = 0;

  if (!pvNode && !check) {
    // reverse futility, Stash f91e750
    if (depth <= RFP_DEPTH && eval < MATE_IN_MAX && eval - (RFP_MARGIN * depth - (improving ? RFP_IMPROVING : 0)) >= beta) return eval;

    // razoring, Stash 13ac9e7: to qsearch at depth 2 or less, a null-window qsearch below alpha at depth 3, and a ply
    // less for the node when that qsearch beats beta by a ply's margin
    if (excl == 0 && depth <= RAZOR_DEPTH && staticEval + RAZOR_MARGIN * depth <= alpha) {
      if (depth <= RAZOR_QS_DEPTH) return qsearch(alpha, beta);
      const ra = alpha - RAZOR_MARGIN * depth;
      const v = qsearch(ra, ra + 1);
      if (v <= ra) return v;
      if (RAZOR_DROP != 0 && v >= beta + RAZOR_MARGIN) depth = max(1, depth - 1);
    }

    // null move, Ethereal v12.75's R and guards, with the eval >= static eval gate of Stash f91e750 and Stockfish 11,
    // at an expected cut node only, as Stash and Clockwork ca21224 do;
    // it returns the search's score, as Weiss 2.0, Xiphos and Stash do, where Ethereal returns beta
    if (
      excl == 0 &&
      (NMP_CUT_NODE == 0 || cutNode) &&
      depth >= NMP_DEPTH &&
      eval >= beta + NMP_EVAL_MARGIN &&
      eval >= staticEval &&
      (NMP_STATIC == 0 || staticEval >= beta + NMP_STATIC_BASE - NMP_STATIC_PER * depth) &&
      ssMove[p + SS - 1] != NULL_MOVE &&
      ssMove[p + SS - 2] != NULL_MOVE &&
      hasPieces()
    ) {
      const r = NMP_BASE + depth / NMP_DEPTH_DIV + min(NMP_EVAL_MAX, (eval - beta) / NMP_EVAL_DIV);
      ssMove[p + SS] = NULL_MOVE;
      ssCont[p + SS] = -1;
      ssQuietCount[p + SS] = 0;
      doNull();
      const v = -search(-beta, -beta + 1, depth - r, !cutNode);
      undoNull();
      if (stopped) return 0;
      if (v >= beta) return v >= MATE_IN_MAX ? beta : v;
    }
  }

  // ProbCut, Stash f91e750: a capture that passes SEE by the margin, and whose qsearch and
  // reduced search both clear beta + PC_MARGIN, cuts the node; PV nodes too, as in Stash.
  // The bar's gap is in the eval's unit, and SEE_VALUE is about half that scale, so the bar is stricter than its
  // source's. It stands because easing it showed no gain in games
  const pcBeta = beta + PC_MARGIN;
  if (!root && !check && depth >= PC_DEPTH && abs(beta) < MATE_IN_MAX && !(hit && tDepth >= depth - PC_REDUCTION && tScore < pcBeta)) {
    const bar = pcBeta - staticEval;
    const base = p * MAX_MOVES;
    const e = generateCaptures(MOVES, base);
    for (let i = base; i < e; i++) SCORES[i] = MOVES[i] == tMove ? 1 << 30 : captureScore(MOVES[i]);
    for (let i = base; i < e; i++) {
      selectBest(i, e);
      const m = MOVES[i];
      if (m == excl || !seeGe(m, bar)) continue;
      ssMove[p + SS] = m;
      ssCont[p + SS] = pieceTo(m) << 10;
      ssQuietCount[p + SS] = 0;
      doMove(m);
      let v = -qsearch(-pcBeta, -pcBeta + 1);
      if (v >= pcBeta) v = -search(-pcBeta, -pcBeta + 1, depth - PC_REDUCTION, !cutNode);
      undoMove(m);
      if (stopped) return 0;
      if (v >= pcBeta) {
        ttStore(key, m, scoreToTT(v, p), raw, depth - PC_REDUCTION + 1, BOUND_LOWER, pvNode || tPv);
        return v;
      }
    }
  }

  // internal iterative reduction, Berserk 03cebd6
  if ((pvNode || cutNode) && depth >= IIR_DEPTH && !tMove) depth--;

  const cm = ssCont[p + SS - 1];
  const fm = ssCont[p + SS - 2];
  const f4 = ssCont[p + SS - 4];
  const f6 = CONT6 != 0 ? ssCont[p + SS - 6] : -1;
  const killer = killers[p];
  initPicker(p, tMove, killer, cm, fm, f4, f6);
  const tNoisy = tMove != 0 && isNoisy(tMove);
  ssFailHigh[p + 1] = 0;
  let best = -INF;
  let bestMove = 0;
  let played = 0;
  let raises = 0;
  let quiets = 0;
  let captures = 0;
  let skipQuiets = false;
  let m = 0;
  while ((m = nextMove(p, skipQuiets)) != 0) {
    if (m == excl) continue;
    const noisy = isNoisy(m);
    const pt = pieceTo(m);
    let cmh = 0;
    let fmh = 0;
    let hist = 0;
    // a node's first move is neither pruned nor reduced, so it reads no history; a node that it cuts needs no attacked squares here
    if (played != 0) {
      if (noisy) hist = <i32>captureHist[captureIndex(m)];
      else {
        if (cm >= 0) cmh = <i32>contHist[cm + pt];
        if (fm >= 0) fmh = <i32>contHist[fm + pt];
        // three tables, the sum Ethereal's limits and divisor are written for; the 4-ply table orders moves (movepick.ts)
        hist = <i32>butterfly[butterflyIndex(m, threatsAt(p))] + cmh + fmh;
      }
    }

    // pruning, once a move has kept the node from a mated score; the root is spared, Ratchet's guard, as in Xiphos, Weiss 2.0 and Koivisto
    if (!root && best > -MATE_IN_MAX) {
      const lmrDepth = max(0, depth - ((PRUNE_BASE + (LN[min(depth, 63)] * LN[min(played, 63)]) / PRUNE_DIV) >> 10));
      if (!noisy) {
        // late move pruning, Ethereal v12.75's table: it counts moves played and drops the move that triggers it,
        // as Xiphos and Weiss 2.0 do, where Ethereal counts quiets seen and searches that move
        if (depth <= LMP_DEPTH && played >= LMP_COUNT[(improving ? 9 : 0) + depth]) {
          skipQuiets = true;
          continue;
        }
        // futility on the reduced depth, Ethereal 0e47e9b
        if (!check && lmrDepth <= FUT_DEPTH && eval + FUT_BASE + FUT_PER_DEPTH * lmrDepth <= alpha && hist < FUT_HISTORY[improving ? 1 : 0]) {
          skipQuiets = true;
          continue;
        }
        // history pruning, after Ethereal v12.75 Step 11D and 11E: counter-move and follow-up history, with one limit and
        // depth for both, and with the killer not exempt, where Ethereal exempts it and the counter move
        const imp = improving ? 1 : 0;
        if (lmrDepth <= HP_DEPTH[imp] && (cmh < HP_LIMIT[imp] || fmh < HP_LIMIT[imp])) continue;
      }
      // SEE pruning, Ethereal v12.75: past the good captures
      if (depth <= SEE_DEPTH && pickedStage > STAGE_GOOD_NOISY && !seeGe(m, noisy ? -SEE_NOISY * depth * depth : -SEE_QUIET * depth)) continue;
      // futility for the bad captures, Clockwork 662c568: they are the picker's last stage, so the loop ends, and the
      // score rises to the test's estimate
      if (!check && depth <= NF_DEPTH && pickedStage == STAGE_BAD_NOISY && staticEval + NF_MARGIN * depth <= alpha) {
        const estimate = staticEval + NF_MARGIN * depth;
        if (abs(beta) < MATE_IN_MAX && best < estimate) best = estimate;
        break;
      }
    }

    // extensions, Stash f91e750: none at the root, and none once the line is twice the
    // iteration's depth or has double-extended for half of it
    let ext = 0;
    const mayExtend = !root && p < 2 * rootDepth && 2 * ssDouble[p + SS] < rootDepth;
    let singular = false;
    if (mayExtend && depth >= SE_DEPTH && m == tMove && excl == 0 && (tBound & BOUND_LOWER) != 0 && abs(tScore) < MATE_IN_MAX && tDepth >= depth - SE_TT_DEPTH) {
      // singular extension: the node without its TT move, searched shallow below the TT score
      singular = true;
      const sBeta = tScore - (SE_MARGIN * depth) / SE_MARGIN_DIV;
      excludedAt[p] = m;
      const sv = search(sBeta - 1, sBeta, depth / 2 + SE_SEARCH_ADD, cutNode);
      excludedAt[p] = 0;
      if (stopped) return 0;
      // the singular search reran this ply: put back its picker and its stack entries
      resumeAfterTT(p, tMove, killer, cm, fm, f4, f6);
      ssStatic[p + SS] = staticEval;
      ssRaw[p + SS] = raw;
      // Ratchet's guard: the count is of this move loop's children, not of the singular search's, which Clockwork keeps
      ssFailHigh[p + 1] = 0;
      if (sv < sBeta) {
        // double extension, Stash f91e750, and its triple for a quiet TT move (Stash 4f1ccc1), which counts once against the line's limit
        if (!pvNode && sBeta - sv > SE_DOUBLE_MARGIN && ssDouble[p + SS] <= SE_DOUBLE_MAX) {
          ext = !tNoisy && sBeta - sv > SE_TRIPLE_MARGIN ? 3 : 2;
          ssDouble[p + SS]++;
        } else ext = 1;
      } else if (sBeta >= beta) {
        // multicut: another move also clears beta
        return sBeta;
      } else if (tScore >= beta) {
        // negative extension
        ext = -1;
      } else if (cutNode) {
        // another move does as well at a node expected to cut, Weiss c735b8f
        ext = -SE_NEG_CUT;
      } else if (tScore <= alpha) {
        // another move does as well and the TT move is not expected to raise alpha, Ethereal f71ac47
        ext = -SE_NEG_ALPHA;
      }
    }

    ssMove[p + SS] = m;
    ssCont[p + SS] = pt << 10;
    const before = nodeCount;
    doMove(m);
    played++;
    ssQuietCount[p + SS] = noisy ? 0 : played;
    // the check extension, on the move in the parent, under the same limits
    if (mayExtend && !singular) {
      knownCheck = inCheck();
      knownCheckKey = hash;
      if (knownCheck) ext = CHECK_EXT;
    }
    let newDepth = depth - 1 + ext;
    let v = 0;
    if (played == 1) {
      v = -search(-beta, -alpha, newDepth, pvNode ? false : !cutNode);
    } else {
      let full = true;
      let reSearch = false;
      // late move reductions, Ethereal v12.75 Step 15A: R = 1 is no reduction. Its extension and king-evasion terms are left
      // out, so an extension stays in the reduced search, as in Weiss 2.0 and Xiphos. A move that gives check gets no term of
      // its own (Clockwork, Ethereal fcb6f77), because the check extension already searches it a ply deeper here
      if (depth >= (noisy ? LMR_NOISY_MIN_DEPTH : LMR_MIN_DEPTH)) {
        const logs = LN[min(depth, 63)] * LN[min(played, 63)];
        let sum = 0;
        if (noisy) {
          // noisy moves, Weiss 95b0951's table with the quiets' node terms; Ethereal's Step 15B reads capture history alone
          sum = LMR_NOISY_BASE + logs / LMR_NOISY_DIV;
          sum -= LMR_HISTORY_STEP * max(-LMR_HISTORY_MAX, min(LMR_HISTORY_MAX, hist / LMR_NOISY_HISTORY_DIV));
        } else {
          sum = LMR_BASE + logs / LMR_DIV;
          if (pickedStage < STAGE_QUIET) sum -= LMR_EARLY_STAGE;
          // a noisy TT move, Stockfish 11's ttCapture
          if (tNoisy) sum += LMR_TT_NOISY;
          sum -= LMR_HISTORY_STEP * max(-LMR_HISTORY_MAX, min(LMR_HISTORY_MAX, hist / LMR_HISTORY_DIV));
        }
        // a node that is or was on a PV is spared the non-PV term, Berserk f05f9dc
        if (!pvNode && !(LMR_TT_PV != 0 && tPv)) sum += LMR_NON_PV;
        if (!improving) sum += LMR_NOT_IMPROVING;
        if (cutNode) sum += LMR_CUT_NODE;
        // this node's children keep failing high, Clockwork 641d9f5; Stockfish a32d2086 counts over the parent's whole subtree
        if (ssFailHigh[p + 1] > LMR_FAIL_HIGH_COUNT) sum += LMR_FAIL_HIGH;
        // each raise of alpha here, Clockwork 641d9f5; Stockfish 15 and Berserk 5 lower the node's depth instead
        sum += raises * LMR_ALPHA_RAISE;
        const r = min(depth - 1, max(sum >> 10, 1));
        if (r > 1) {
          const reduced = newDepth - r + 1;
          v = -search(-alpha - 1, -alpha, reduced, true);
          full = v > alpha;
          if (full) {
            // the re-search's depth follows how far the reduced search beat the best, Stockfish c228f319 in Clockwork 641d9f5's
            // form: a fixed margin. Weiss 95b0951's margin grows with the reduction, and it has no shallower step
            if (v > best + LMR_DEEPER) newDepth++;
            else if (newDepth > 1 && v < best + LMR_SHALLOWER * newDepth) newDepth--;
            full = reduced < newDepth;
            reSearch = full;
          }
        }
      }
      if (full) {
        v = -search(-alpha - 1, -alpha, newDepth, !cutNode);
        // a quiet's continuation history takes a re-search that failed low or high, Clockwork 641d9f5 and Weiss 95b0951
        if (reSearch && !noisy && LMR_CONT_UPDATE != 0 && !stopped) {
          if (v <= alpha) rewardCont(pt, cm, fm, f4, f6, -malusAt(newDepth));
          else if (v >= beta) rewardCont(pt, cm, fm, f4, f6, bonusAt(newDepth));
        }
      }
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
        if (v >= beta) {
          ssFailHigh[p]++;
          break;
        }
        alpha = v;
        raises++;
      }
    }
  }

  // with its one move left out, a node with no other move fails low (Stash f91e750)
  if (played == 0) return excl ? alpha : check ? -MATE + p : 0;
  // a cut far above beta counts as one from a ply deeper, Clockwork 641d9f5; Stockfish 11 raises the bonus alone
  if (best >= beta) {
    updateHistories(bestMove, depth, depth + (best - beta >= HIST_DEEP_MARGIN ? 1 : 0), p, quiets, captures);
    // the parent's first move, a quiet, is refuted here, Stockfish 11
    if (HIST_PRIOR_MALUS != 0 && ssQuietCount[p + SS - 1] == 1) rewardPrior(p, -malusAt(depth + 1));
  } else if (!bestMove && HIST_PRIOR_BONUS_DEPTH != 0 && (depth >= HIST_PRIOR_BONUS_DEPTH || pvNode) && ssQuietCount[p + SS - 1] != 0) {
    // no move raised alpha: the parent's quiet move caused the fail low, Stockfish 8fd34d77
    rewardPrior(p, bonusAt(depth));
  }
  const bound = best >= beta ? BOUND_LOWER : bestMove ? BOUND_EXACT : BOUND_UPPER;
  // correction history, Stash 302136d: not in check, no noisy best move, and the bound says the eval was wrong in that direction
  if (
    !check &&
    !(bestMove && isNoisy(bestMove)) &&
    !(bound == BOUND_LOWER && best <= staticEval) &&
    !(bound == BOUND_UPPER && best >= staticEval)
  ) updateCorrection(side, depth, best - staticEval, corrCont);
  ttStore(key, bestMove, scoreToTT(best, p), raw, depth, bound, pvNode || tPv);
  return best;
}

/**
 * The quiescence search: stand pat, then captures and queen promotions that pass
 * SEE >= 0 (Weiss 2568fb7); in check, every evasion. Delta pruning skips a capture
 * that gives no check and whose victim cannot lift stand pat to alpha, and the
 * skip raises the score to that estimate, so the upper bound holds for the skipped
 * capture too (Stockfish 15 and Stash f91e750 qsearch). It probes and stores the TT
 * at depth 0, never as an exact bound (Stockfish 45e5e65a).
 */
/** whether a move gives check: the core's make and unmake alone, since no eval state is read */
@inline function givesCheck(m: i32): bool {
  make(m);
  const given = inCheck();
  unmake(m);
  return given;
}

function qsearch(alpha: i32, beta: i32): i32 {
  const p = ply;
  pvLen[p] = p;
  nodeCount++;
  checkStop();
  if (stopped) return 0;
  const pvNode = beta - alpha > 1;
  if (halfmove >= 100 || isRepetition()) return drawScore();
  const check = hash == knownCheckKey ? knownCheck : inCheck();
  if (p >= PLY_GUARD) return check ? 0 : evaluate();

  const key = hash;
  const hit = ttProbe(key);
  let tMove = 0;
  let tScore = 0;
  let tBound = 0;
  let tPv = false;
  if (hit) {
    tScore = scoreFromTT(ttScore, p);
    tBound = ttBound;
    tPv = LMR_TT_PV != 0 && ttPv;
    if (!pvNode && halfmove < 90 && boundCuts(tBound, tScore, alpha, beta)) return tScore;
    tMove = fullMove(ttMove);
  }

  let best = -MATE + p;
  let raw = EVAL_NONE;
  if (!check) {
    raw = hit && ttEval != EVAL_NONE ? ttEval : evaluate();
    best = raw + correction(side, contSlot(ssCont[p + SS - 2], ssCont[p + SS - 1]));
    if (hit && (tBound == BOUND_EXACT || (tBound == BOUND_LOWER ? tScore > best : tScore < best))) best = tScore;
    if (best >= beta) return best;
    if (best > alpha) alpha = best;
  }

  // fixed before the loop, as both sources do: a skip raises best, and a running base would read that raise
  const deltaBase = best;
  const base = p * MAX_MOVES;
  const end = generateMoves(MOVES, base, check);
  if (check && end == base) return -MATE + p;
  // only a node in check lists quiets, so only it needs the attacked squares
  const threats = check ? threatsAt(p) : 0;
  for (let i = base; i < end; i++) {
    const m = MOVES[i];
    SCORES[i] = m == tMove ? 1 << 30 : isNoisy(m) ? captureScore(m) + (1 << 18) : quietScore(m, -1, -1, -1, -1, threats);
  }
  let bestMove = 0;
  for (let i = base; i < end; i++) {
    selectBest(i, end);
    const m = MOVES[i];
    if (!check) {
      if (!seeGe(m, 0)) continue;
      if (!movePromo(m) && deltaBase > -MATE_IN_MAX) {
        // Stash 007850d's second test: when stand pat is that far below alpha without a victim, only a capture that wins material is searched
        const low = deltaBase + QS_DELTA;
        let estimate = low + MAT_EG[victimOf(m)];
        if (estimate > alpha && QS_SEE != 0 && low <= alpha && !seeGe(m, 1)) estimate = low;
        if (estimate <= alpha && !givesCheck(m)) {
          if (estimate > best) best = estimate;
          continue;
        }
      }
    } else if (QS_EVASIONS != 0 && best > -MATE_IN_MAX && (!isNoisy(m) || !seeGe(m, 0))) {
      // Weiss 95b0951, Clockwork d17b3cf: one evasion that is not mated answers the check, and the rest are held to qsearch's moves
      continue;
    }
    // the main search's rows end at the horizon; the sixth correction table reads on through qsearch
    if (CORR_CONT != 0) ssCont[p + SS] = pieceTo(m) << 10;
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
  ttStore(key, bestMove, scoreToTT(best, p), raw, 0, best >= beta ? BOUND_LOWER : BOUND_UPPER, pvNode || tPv);
  return best;
}

// ---------------------------------------------------------------- iterative deepening

/** the state a search starts from: the counters at zero, the stack empty, the root's moves listed with no nodes spent */
function startSearch(): void {
  stopped = false;
  nodeCount = 0;
  completed = 0;
  rootPvLen = 0;
  bestScore = 0;
  ttNewSearch();
  for (let i = 0; i < MAX_PLY + SS + 1; i++) {
    ssMove[i] = 0;
    ssCont[i] = -1;
    ssStatic[i] = EVAL_NONE;
    ssRaw[i] = EVAL_NONE;
    ssDouble[i] = 0;
    ssQuietCount[i] = 0;
  }
  for (let i = 0; i < MAX_PLY + 1; i++) excludedAt[i] = 0;
  for (let i = 0; i < MAX_PLY + 2; i++) ssFailHigh[i] = 0;
  rootCount = generateMoves(rootMoves, 0, true);
  for (let i = 0; i < rootCount; i++) rootNodes[i] = 0;
}

/**
 * One search of the root at `depth` with the window (alpha, beta), for the window
 * gate: no deepening, no aspiration and no clock. Returns the fail-soft score in
 * the engine's unit; a root with no legal move scores as any such node does.
 */
export function searchWindow(alpha: i32, beta: i32, depth: i32): i32 {
  startSearch();
  rootDepth = depth;
  return search(alpha, beta, depth, false);
}

/**
 * Searches the core's position by iterative deepening to `maxDepth`, or until the
 * time rules or the host stop it once an iteration has finished. Returns the best
 * move, or 0 when the position has no legal move.
 */
export function think(maxDepth: i32): i32 {
  startSearch();
  if (rootCount == 0) return 0;

  let score = 0;
  let previous = 0;
  for (let depth = 1; depth <= maxDepth; depth++) {
    rootDepth = depth;
    // aspiration, Ethereal aspirationWindow: fail low halves beta down, fail high searches one ply less; the failed
    // bound widens from the score, as in Stash, Stockfish 11 and Xiphos, where Ethereal widens from the old bound
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
    if (!mayContinue(<f64>nodeCount, share, uncertain, v)) break;
  }
  return rootPvLen ? rootPv[0] : rootMoves[0];
}

