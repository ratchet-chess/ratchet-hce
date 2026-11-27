/**
 * The own engine's search: iterative deepening with aspiration windows, a
 * principal variation search, and a quiescence search. Scores are for the side
 * to move, in the engine's unit; a mate in n plies is MATE - n.
 *
 * Non-PV nodes cut on a TT bound of enough depth, and on nothing less (boundCuts).
 * The static eval is the raw eval plus the correction history (correction.ts); the
 * TT stores the raw one. Each pruning, reduction and extension names its origin
 * where it is applied. The window gate (test/window.ts) reads the search's exact
 * layer through searchWindow.
 */
import { KING, MAX_MOVES, MAX_PLY, PAWN, movePromo } from "../../core/constants";
import { generateCaptures, generateMoves } from "../../core/movegen";
import { bb, halfmove, hash, inCheck, isRepetition, make, ply, side, unmake } from "../../core/position";
import { contSlot, correction, updateCorrection } from "./correction";
import { upcomingRepetition } from "./cycle";
import { UNITS_PER_CP, evalCached } from "./eval";
import {
  bonusAt,
  butterfly,
  butterflyIndex,
  captureHist,
  captureThreatsAt,
  contHist,
  gravity,
  gravityFrom,
  killers,
  malusAt,
  rewardPawn,
  threatsAt,
} from "./history";
import {
  MOVES,
  SCORES,
  STAGE_BAD_NOISY,
  STAGE_GOOD_NOISY,
  STAGE_QUIET,
  captureIndex,
  captureScore,
  initPicker,
  isNoisy,
  nextMove,
  pickedStage,
  pieceTo,
  quietScore,
  resumeAfterTT,
  selectBest,
  victimOf,
} from "./movepick";
import {
  ASP_DELTA,
  ASP_DEPTH,
  BAD_NOISY_FUT_DEPTH,
  BAD_NOISY_FUT_MARGIN,
  CHECK_EXT,
  CONT6,
  CORR_CONT,
  DRAW_JITTER,
  FUT_BASE,
  FUT_DEPTH,
  FUT_HISTORY,
  FUT_PER_DEPTH,
  HIST_DEEP_MARGIN,
  HIST_PRIOR_BONUS_DEPTH,
  HIST_PRIOR_MALUS,
  HIST_PRUNE_DEPTH,
  HIST_PRUNE_LIMIT,
  IIR_DEPTH,
  LMP_BASE,
  LMP_DEPTH,
  LMP_IMPROVING_BASE,
  LMP_IMPROVING_PER_DEPTH,
  LMP_IMPROVING_PER_DEPTH_SQ,
  LMP_PER_DEPTH,
  LMP_PER_DEPTH_SQ,
  LMR_ALPHA_RAISE,
  LMR_BASE,
  LMR_CONT_UPDATE,
  LMR_CUT_NODE,
  LMR_DEEPER,
  LMR_DIV,
  LMR_EARLY_STAGE,
  LMR_FAIL_HIGH,
  LMR_FAIL_HIGH_COUNT,
  LMR_HISTORY_DIV,
  LMR_HISTORY_MAX,
  LMR_HISTORY_STEP,
  LMR_MIN_DEPTH,
  LMR_NOISY_BASE,
  LMR_NOISY_DIV,
  LMR_NOISY_HISTORY_DIV,
  LMR_NOISY_MIN_DEPTH,
  LMR_NON_PV,
  LMR_NOT_IMPROVING,
  LMR_SHALLOWER,
  LMR_TT_NOISY,
  LMR_TT_PV,
  MAT_EG,
  NMP_BASE,
  NMP_CUT_NODE,
  NMP_DEPTH,
  NMP_DEPTH_DIV,
  NMP_EVAL_DIV,
  NMP_EVAL_MARGIN,
  NMP_EVAL_MAX,
  NMP_STATIC,
  NMP_STATIC_BASE,
  NMP_STATIC_PER,
  PAWN_HISTORY,
  PROBCUT_DEPTH,
  PROBCUT_MARGIN,
  PROBCUT_REDUCTION,
  PRUNE_BASE,
  PRUNE_DIV,
  QS_DELTA,
  QS_EVASIONS,
  QS_SEE,
  RAZOR_DEPTH,
  RAZOR_DROP,
  RAZOR_MARGIN,
  RAZOR_QS_DEPTH,
  RFP_DEPTH,
  RFP_IMPROVING,
  RFP_MARGIN,
  RFP_QUAD,
  SEE_DEPTH,
  SEE_HISTORY,
  SEE_NOISY,
  SEE_QUIET,
  SE_DEPTH,
  SE_DOUBLE_MARGIN,
  SE_DOUBLE_MAX,
  SE_MARGIN,
  SE_MARGIN_DIV,
  SE_NEG_ALPHA,
  SE_NEG_CUT,
  SE_SEARCH_ADD,
  SE_TRIPLE_MARGIN,
  SE_TT_DEPTH,
  TT_CUT_NODE,
  UPCOMING_REP,
} from "./params";
import { seeGe } from "./see";
import { doMove, doNull, psq, undoMove, undoNull } from "./state";
import { mayContinue, mustStop } from "./time";
import {
  BOUND_EXACT,
  BOUND_LOWER,
  BOUND_UPPER,
  ttBound,
  ttDepth,
  ttEval,
  ttMove,
  ttMoveOf,
  ttNewSearch,
  ttProbe,
  ttPv,
  ttScore,
  ttStore,
} from "./tt";
import { hostIteration } from "../../core/host";

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
/** double extensions on the line to a ply, Stash f91e750 double_extensions. Feature: Singular_Extensions. */
const ssDouble = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/**
 * Per ply, the number of the move made there when it is quiet, 1 for the node's
 * first move, else 0: what the child reads of its parent's move.
 */
const ssQuietNumber = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + SS + 1)));
/**
 * How many of a ply's nodes have failed high since their parent's move loop
 * began; a node reads its children's count (Clockwork 641d9f5 fail_high_count).
 * Feature: Late_Move_Reductions.
 */
const ssFailHigh = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + 2)));
/** the move a ply's singular search leaves out, 0 for none */
const excludedAt = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * (MAX_PLY + 1)));
/** the iteration's depth, which bounds extensions (Stash f91e750 root_depth). Feature: Extensions. */
let rootDepth = 0;
/**
 * mixed into the key of a node searched with a move left out, so its TT entries
 * are its own; Ratchet's multiplier, since the TT checks the key's top bits (tt.ts
 * fragmentOf), which Stash f91e750 search's excluded_move << 16 leaves alone.
 * Feature: Singular_Extensions.
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

/**
 * late move pruning's move count by depth, not improving then improving, from the LMP_ values in params.ts. A row has
 * a fixed size and is filled whole, because a tuning build makes LMP_DEPTH a runtime value; LMP_DEPTH stays below
 * LMP_ROW. Depth 0 is never read.
 */
const LMP_ROW = 64;
const LMP = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * 2 * LMP_ROW));

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
/** the score of the root move that last raised alpha in the root search in progress */
let rootRaise = 0;
/** the line of a root move that failed high in the iteration in progress, for think */
const highPv = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));

export function initSearch(): void {
  for (let i = 1; i < 64; i++) LN[i] = <i32>Math.round(Math.log(<f64>i) * 1024);
  for (let d = 1; d < LMP_ROW; d++) {
    LMP[d] = max(1, (LMP_BASE + LMP_PER_DEPTH * d + LMP_PER_DEPTH_SQ * d * d) >> 10);
    LMP[LMP_ROW + d] = max(
      1,
      (LMP_IMPROVING_BASE + LMP_IMPROVING_PER_DEPTH * d + LMP_IMPROVING_PER_DEPTH_SQ * d * d) >> 10,
    );
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

// ---------------------------------------------------------------- helpers

/** a mate score made relative to this node, for the TT */
@inline function scoreToTT(s: i32, p: i32): i32 {
  return s >= MATE_IN_MAX ? s + p : s <= -MATE_IN_MAX ? s - p : s;
}

/**
 * A TT score made relative to the root. A mate further away than the fifty-move
 * count allows is returned as the best non-mate score (Stockfish 5ae195ee value_from_tt). Feature: Score#Mate_Scores.
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
 * expansion of the tree has. The table score that replaces the static eval the
 * pruning reads, and the stand pat in qsearch, is a heuristic outside this rule.
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
 * (Stash 660df34 update_cont_histories adds the 4-ply, Clockwork 3dd022c History::update_quiet_stats the 6-ply); each
 * continuation entry decays against the average of the first three, a missing one counted as 0 (Stash 93a6d5f
 * update_continuation_histories). Features: History_Heuristic, Threat_History, History_Heuristic#Continuation_History.
 */
function rewardQuiet(m: i32, bonus: i32, p: i32): void {
  const pt = pieceTo(m);
  gravity(butterfly, butterflyIndex(m, threatsAt(p)), bonus);
  // pawn history takes what the butterfly table takes, Weiss 20c95ce UpdateQuietHistory. Feature: Pawn_History.
  if (PAWN_HISTORY != 0) rewardPawn(pt, bonus);
  rewardCont(
    pt,
    ssCont[p + SS - 1],
    ssCont[p + SS - 2],
    ssCont[p + SS - 4],
    CONT6 != 0 ? ssCont[p + SS - 6] : -1,
    bonus,
  );
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
 * Moves the continuation entries of the parent's move by `bonus`: the rows are the moves 1, 2, 4 and 6 plies before
 * that move (Stockfish 11 update_continuation_histories on ss-1). The caller has checked that the parent's move is
 * quiet. Feature: History_Heuristic#Continuation_History.
 */
function rewardPrior(p: i32, bonus: i32): void {
  rewardCont(
    ssCont[p + SS - 1] >> 10,
    ssCont[p + SS - 2],
    ssCont[p + SS - 3],
    ssCont[p + SS - 5],
    CONT6 != 0 ? ssCont[p + SS - 7] : -1,
    bonus,
  );
}

/**
 * A draw's score, DRAW_JITTER above or below zero by a bit of the node count
 * (Stash f91e750 worker_draw_score). Feature: Draw_Score_Randomization.
 */
@inline function drawScore(): i32 {
  return DRAW_JITTER == 0 ? 0 : (nodeCount & 2) != 0 ? DRAW_JITTER : -DRAW_JITTER;
}

/** the last check test made after a move, keyed by the position, so the child need not repeat it */
let knownCheckKey: u64 = 0;
let knownCheck = false;

/**
 * The history update after a cut by `best` at `depth` (Weiss 95b0951 UpdateHistory): a
 * bonus to it and a malus to each move of its kind tried before it; captures
 * tried before it lose either way. A quiet that cut as the only quiet tried at
 * depth 3 or less leaves the quiet histories alone (Ethereal 0e47e9b update_quiet_histories).
 * Features: Killer_Heuristic, History_Heuristic, History_Heuristic#History_Maluses, History_Heuristic#Capture_History.
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
  } else if (!movePromo(best)) {
    gravity(captureHist, captureIndex(best, captureThreatsAt(p)), bonus);
  }
  if (captures != 0) {
    const ct = captureThreatsAt(p);
    for (let i = 0; i < captures; i++) {
      const c = capturesTried[p * CAPTURES_MAX + i];
      if (c != best) gravity(captureHist, captureIndex(c, ct), malus);
    }
  }
}

/**
 * Replaces `evalScore` with the TT score when TT cutoffs are allowed and the
 * stored bound says the TT score is tighter (Clockwork 6bf993b tt_adjusted_eval).
 * The halfmove < 90 guard is Ratchet's own, matching the TT cutoff rule.
 * Feature: TT_Adjusted_Eval.
 */
@inline function ttAdjustedEval(evalScore: i32, hit: bool, tBound: i32, tScore: i32): i32 {
  if (
    hit &&
    halfmove < 90 &&
    (tBound == BOUND_EXACT || (tBound == BOUND_LOWER ? tScore > evalScore : tScore < evalScore))
  ) {
    return tScore;
  }
  return evalScore;
}

/** copies `m` and the child PV at `p + 1` into the PV row at `p` */
@inline function updatePv(p: i32, m: i32): void {
  const row = p * MAX_PLY;
  const child = (p + 1) * MAX_PLY;
  pvTable[row + p] = m;
  const n = pvLen[p + 1];
  for (let i = p + 1; i < n; i++) pvTable[row + i] = pvTable[child + i];
  pvLen[p] = max(n, p + 1);
}

// ---------------------------------------------------------------- search

function search(alpha: i32, beta: i32, depth: i32, cutNode: bool): i32 {
  const p = ply;
  pvLen[p] = p;
  if (depth <= 0) {
    // UPCOMING_REP 2: the horizon node takes the raise too, before its quiescence search (Stockfish e4f8a4fa search).
    // Feature: Upcoming_Repetition_Detection.
    if (UPCOMING_REP == 2 && p != 0 && halfmove >= 3) {
      const draw = drawScore();
      if (alpha < draw && upcomingRepetition(excludedAt[p])) {
        alpha = draw;
        if (alpha >= beta) return alpha;
      }
    }
    return qsearch(alpha, beta);
  }
  const pvNode = beta - alpha > 1;
  const root = p == 0;
  nodeCount++;
  checkStop();
  if (stopped) return 0;

  if (!root) {
    // Ratchet's guard: a fifty-move draw is returned before a mate on the hundredth ply is found
    if (halfmove >= 100 || isRepetition()) return drawScore();
    if (p >= PLY_GUARD) return inCheck() ? 0 : evalCached(psq);
    // mate distance pruning, Stockfish 11 search's Step 3; Fruit 2.1 full_search bounds by a mate test instead.
    // Feature: Mate_Distance_Pruning.
    alpha = max(alpha, -MATE + p);
    beta = min(beta, MATE - p - 1);
    if (alpha >= beta) return alpha;
    // a move into an earlier position makes this node worth a draw at least (Stockfish 91a76331 search's Step 3);
    // a singular search does not count the move it excludes: Ratchet's guard. Feature: Upcoming_Repetition_Detection.
    if (UPCOMING_REP != 0 && halfmove >= 3) {
      const draw = drawScore();
      if (alpha < draw && upcomingRepetition(excludedAt[p])) {
        alpha = draw;
        if (alpha >= beta) return alpha;
      }
    }
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
    // no cut at PV nodes (Stockfish 4739037f search), nor late in the fifty-move count (Stockfish bae019b5 search);
    // a node not expected to cut takes a fail low only (Ethereal 311d110 search).
    // Feature: Transposition_Table#Transposition_Table_Cutoffs.
    if (
      !pvNode &&
      ttDepth >= depth &&
      halfmove < 90 &&
      boundCuts(tBound, tScore, alpha, beta) &&
      (TT_CUT_NODE == 0 || cutNode || tScore <= alpha)
    ) {
      // Weiss 5168a50 AlphaBeta: a quiet TT move that cuts earns its bonus; the killer is Ratchet's addition, after
      // Stockfish 11 update_quiet_stats. Features: History_Heuristic, Killer_Heuristic.
      if (tScore >= beta) {
        const cutMove = ttMoveOf(ttMove);
        if (cutMove && !isNoisy(cutMove)) {
          rewardQuiet(cutMove, bonusAt(depth), p);
          killers[p] = cutMove;
        }
        // the parent's early quiet move is refuted from the table, Stockfish 11 search.
        // Feature: History_Heuristic#Continuation_History.
        const prior = ssQuietNumber[p + SS - 1];
        if (HIST_PRIOR_MALUS != 0 && prior >= 1 && prior <= 2) rewardPrior(p, -malusAt(depth + 1));
      }
      return tScore;
    }
    tMove = ttMoveOf(ttMove);
  }

  // the static eval and the pruning eval (correction.ts + ttAdjustedEval).
  // Feature: Static_Evaluation_Correction_History.
  let staticEval = EVAL_NONE;
  let raw = EVAL_NONE;
  let pruneEval = EVAL_NONE;
  let improving = false;
  const corrCont = contSlot(ssCont[p + SS - 1], ssCont[p + SS - 2]);
  if (!check) {
    raw = hit && ttEval != EVAL_NONE ? ttEval : evalCached(psq);
    staticEval = raw + correction(side, corrCont);
    // fifty-move damping outside evalCached and ttEval, Weiss a7d7783 CorrectEval (Stockfish 3af083a7).
    // Feature: Fifty-move_Eval_Scaling.
    if (halfmove > 12) staticEval = (staticEval * (256 - halfmove)) / 256;
    pruneEval = ttAdjustedEval(staticEval, hit, tBound, tScore);
    // improving, Alexandria 829daf4 Negamax: against two plies up, else four, else true. Feature: Improving.
    const s2 = ssStatic[p + SS - 2];
    const s4 = ssStatic[p + SS - 4];
    improving = s2 != EVAL_NONE ? staticEval > s2 : s4 != EVAL_NONE ? staticEval > s4 : true;
  }
  ssStatic[p + SS] = staticEval;
  ssRaw[p + SS] = raw;
  const parentDouble = ssDouble[p + SS - 1];
  ssDouble[p + SS] = parentDouble;
  killers[p + 1] = 0;

  if (!pvNode && !check) {
    // reverse futility, Stash f91e750 search, skipped inside a singular search as Weiss c735b8f AlphaBeta skips its
    // pruning there; Stash f91e750 runs it there too. The margin per ply grows with depth, Lynx f87f5d5f NegaMax; not
    // taken: Stockfish 7da31a1f search, whose margin per ply stops growing at a cap. Feature: Reverse_Futility_Pruning.
    if (
      excl == 0 &&
      depth <= RFP_DEPTH &&
      pruneEval < MATE_IN_MAX &&
      pruneEval - ((RFP_MARGIN + RFP_QUAD * depth) * depth - (improving ? RFP_IMPROVING : 0)) >= beta
    ) {
      return pruneEval;
    }

    // razoring, Stash 13ac9e7 search: to qsearch at depth 2 or less, a null-window qsearch below alpha at depth 3,
    // and a ply less for the node when that qsearch beats beta by a ply's margin. Feature: Razoring.
    if (excl == 0 && depth <= RAZOR_DEPTH && staticEval + RAZOR_MARGIN * depth <= alpha) {
      if (depth <= RAZOR_QS_DEPTH) return qsearch(alpha, beta);
      const ra = alpha - RAZOR_MARGIN * depth;
      const v = qsearch(ra, ra + 1);
      if (v <= ra) return v;
      if (RAZOR_DROP != 0 && v >= beta + RAZOR_MARGIN) depth = max(1, depth - 1);
    }

    // null move, Ethereal 12.75 search's R and guards, with the eval >= static eval gate of Stash f91e750 search,
    // at an expected cut node only, as Stash does; it returns the search's score, as Stash does, where Ethereal
    // returns beta. Features: Null_Move_Pruning, Depth_Reduction_R.
    if (
      excl == 0 &&
      (NMP_CUT_NODE == 0 || cutNode) &&
      depth >= NMP_DEPTH &&
      pruneEval >= beta + NMP_EVAL_MARGIN &&
      pruneEval >= staticEval &&
      (NMP_STATIC == 0 || staticEval >= beta + NMP_STATIC_BASE - NMP_STATIC_PER * depth) &&
      ssMove[p + SS - 1] != NULL_MOVE &&
      ssMove[p + SS - 2] != NULL_MOVE &&
      hasPieces()
    ) {
      const r = NMP_BASE + depth / NMP_DEPTH_DIV + min(NMP_EVAL_MAX, (pruneEval - beta) / NMP_EVAL_DIV);
      ssMove[p + SS] = NULL_MOVE;
      ssCont[p + SS] = -1;
      ssQuietNumber[p + SS] = 0;
      doNull();
      const v = -search(-beta, -beta + 1, depth - r, !cutNode);
      undoNull();
      if (stopped) return 0;
      if (v >= beta) return v >= MATE_IN_MAX ? beta : v;
    }
  }

  // ProbCut, Stash f91e750 search: a capture that passes SEE by the margin, and whose qsearch and
  // reduced search both clear beta + PROBCUT_MARGIN, cuts the node; PV nodes too, as in Stash.
  // The bar's gap is in the eval's unit, and SEE_VALUE is about half that scale, so the bar is stricter than its
  // source's. It stands because easing it showed no gain in games. Feature: ProbCut.
  const probcutBeta = beta + PROBCUT_MARGIN;
  if (
    !root &&
    !check &&
    depth >= PROBCUT_DEPTH &&
    abs(beta) < MATE_IN_MAX &&
    !(hit && tDepth >= depth - PROBCUT_REDUCTION && tScore < probcutBeta)
  ) {
    const bar = probcutBeta - staticEval;
    const base = p * MAX_MOVES;
    const e = generateCaptures(MOVES, base);
    const ct = e > base ? captureThreatsAt(p) : 0;
    for (let i = base; i < e; i++) SCORES[i] = MOVES[i] == tMove ? 1 << 30 : captureScore(MOVES[i], ct);
    for (let i = base; i < e; i++) {
      selectBest(i, e);
      const m = MOVES[i];
      if (m == excl || !seeGe(m, bar)) continue;
      ssMove[p + SS] = m;
      ssCont[p + SS] = pieceTo(m) << 10;
      ssQuietNumber[p + SS] = 0;
      doMove(m);
      let v = -qsearch(-probcutBeta, -probcutBeta + 1);
      if (v >= probcutBeta) v = -search(-probcutBeta, -probcutBeta + 1, depth - PROBCUT_REDUCTION, !cutNode);
      undoMove(m);
      if (stopped) return 0;
      if (v >= probcutBeta) {
        ttStore(key, m, scoreToTT(v, p), raw, depth - PROBCUT_REDUCTION + 1, BOUND_LOWER, pvNode || tPv);
        return v;
      }
    }
  }

  // internal iterative reduction, Berserk 03cebd6 Negamax; skipped in an excluded search as Clockwork 641d9f5
  // Worker::search does, where Stockfish 15 search and Weiss 95b0951 AlphaBeta reduce excluded cut nodes too.
  // Feature: Internal_Iterative_Reductions.
  if ((pvNode || cutNode) && depth >= IIR_DEPTH && !tMove && excl == 0) depth--;

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
    // the picker's stage for this move, read now: the singular search and every child run the picker again
    const picked = pickedStage;
    const noisy = isNoisy(m);
    const pt = pieceTo(m);
    let cmh = 0;
    let fmh = 0;
    let hist = 0;
    // a node's first move is neither pruned nor reduced, so it reads no history; a node that it cuts needs no
    // attacked squares here
    if (played != 0) {
      if (noisy) hist = <i32>captureHist[captureIndex(m, captureThreatsAt(p))];
      else {
        if (cm >= 0) cmh = <i32>contHist[cm + pt];
        if (fm >= 0) fmh = <i32>contHist[fm + pt];
        // three tables, the sum of Ethereal 12.75 getHistory, which Ethereal's limits and divisor are written for; the
        // 4-ply table orders moves (movepick.ts).
        // Features: History_Heuristic, Threat_History, History_Heuristic#Continuation_History.
        hist = <i32>butterfly[butterflyIndex(m, threatsAt(p))] + cmh + fmh;
      }
    }

    // pruning, once a move has kept the node from a mated score; the root is spared, Ratchet's guard
    if (!root && best > -MATE_IN_MAX) {
      const lmrDepth = max(
        0,
        depth - 1 - ((PRUNE_BASE + (LN[min(depth, 63)] * LN[min(played, 63)]) / PRUNE_DIV) >> 10),
      );
      if (!noisy) {
        // late move pruning, Ethereal 12.75 LateMovePruningCounts: it counts moves played and drops the move that
        // triggers it, as Weiss 2.0 AlphaBeta does, where Ethereal counts quiets seen and searches that move.
        // Feature: Futility_Pruning#Move_Count_Based_Pruning.
        if (depth <= LMP_DEPTH && played >= LMP[(improving ? LMP_ROW : 0) + depth]) {
          skipQuiets = true;
          continue;
        }
        // futility on the reduced depth, Ethereal 0e47e9b fmpMargin. Feature: Futility_Pruning.
        if (
          !check &&
          lmrDepth <= FUT_DEPTH &&
          pruneEval + FUT_BASE + FUT_PER_DEPTH * lmrDepth <= alpha &&
          hist < FUT_HISTORY[improving ? 1 : 0]
        ) {
          skipQuiets = true;
          continue;
        }
        // history pruning, Ethereal 0e47e9b search's continuation pruning (params.ts HIST_PRUNE_DEPTH): counter-move
        // and follow-up history under one limit and depth for both, and with the killer not exempt, where Ethereal
        // exempts it and the counter move. Feature: History_Leaf_Pruning.
        const imp = improving ? 1 : 0;
        if (lmrDepth <= HIST_PRUNE_DEPTH[imp] && (cmh < HIST_PRUNE_LIMIT[imp] || fmh < HIST_PRUNE_LIMIT[imp])) continue;
      }
      // SEE pruning, Ethereal 12.75 SEEPruningDepth: past the good captures; a quiet's bar moves by its history,
      // Clockwork f236181 Worker::search. Feature: Static_Exchange_Evaluation#Pruning.
      if (
        depth <= SEE_DEPTH &&
        picked > STAGE_GOOD_NOISY &&
        !seeGe(m, noisy ? -SEE_NOISY * depth * depth : -SEE_QUIET * depth - ((hist * SEE_HISTORY) >> 10))
      ) {
        continue;
      }
      // futility for the bad captures, Clockwork 662c568 Worker::search: they are the picker's last stage, so the loop
      // ends, and the score rises to the test's estimate. Feature: Futility_Pruning.
      if (
        !check &&
        depth <= BAD_NOISY_FUT_DEPTH &&
        picked == STAGE_BAD_NOISY &&
        staticEval + BAD_NOISY_FUT_MARGIN * depth <= alpha
      ) {
        const estimate = staticEval + BAD_NOISY_FUT_MARGIN * depth;
        if (abs(beta) < MATE_IN_MAX && best < estimate) best = estimate;
        break;
      }
    }

    // extensions, Stash f91e750 search: none at the root, and none once the line is twice the
    // iteration's depth or has double-extended for half of it. Feature: Extensions.
    let ext = 0;
    const mayExtend = !root && p < 2 * rootDepth && 2 * ssDouble[p + SS] < rootDepth;
    let singular = false;
    if (
      mayExtend &&
      depth >= SE_DEPTH &&
      m == tMove &&
      excl == 0 &&
      (tBound & BOUND_LOWER) != 0 &&
      abs(tScore) < MATE_IN_MAX &&
      tDepth >= depth - SE_TT_DEPTH
    ) {
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
      // Ratchet's guard: the count is of this move loop's children, not of the singular search's, which
      // Clockwork 641d9f5 Worker::search keeps. Feature: Late_Move_Reductions.
      ssFailHigh[p + 1] = 0;
      if (sv < sBeta) {
        // double extension, Stash f91e750 search, and its triple for a quiet TT move, which counts once against the
        // line's limit. Feature: Singular_Extensions.
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
        // another move does as well at a node expected to cut, Weiss c735b8f AlphaBeta. Feature: Singular_Extensions.
        ext = -SE_NEG_CUT;
      } else if (tScore <= alpha) {
        // another move does as well and the TT move is not expected to raise alpha, Ethereal f71ac47 singularity.
        // Feature: Singular_Extensions.
        ext = -SE_NEG_ALPHA;
      }
    }

    ssMove[p + SS] = m;
    ssCont[p + SS] = pt << 10;
    const before = nodeCount;
    doMove(m);
    played++;
    ssQuietNumber[p + SS] = noisy ? 0 : played;
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
      // late move reductions, Ethereal 12.75 search's Step 15A, with r counted past the move's own ply, so 0 is no
      // reduction where Ethereal's R = 1 is. Its extension and king-evasion terms are left out, so an extension stays
      // in the reduced search, as in Weiss 2.0 AlphaBeta. A move that gives check gets no term of its own, where
      // Ethereal fcb6f77 search reduces it less, because the check extension already searches it a ply deeper here.
      // Feature: Late_Move_Reductions.
      if (depth >= (noisy ? LMR_NOISY_MIN_DEPTH : LMR_MIN_DEPTH)) {
        const logs = LN[min(depth, 63)] * LN[min(played, 63)];
        let sum = 0;
        if (noisy) {
          // noisy moves, Weiss 95b0951 InitReductions's table with the quiets' node terms; Ethereal 12.75 search's
          // Step 15B reads capture history alone. Feature: Late_Move_Reductions.
          sum = LMR_NOISY_BASE + logs / LMR_NOISY_DIV;
          sum -= LMR_HISTORY_STEP * max(-LMR_HISTORY_MAX, min(LMR_HISTORY_MAX, hist / LMR_NOISY_HISTORY_DIV));
        } else {
          sum = LMR_BASE + logs / LMR_DIV;
          if (picked < STAGE_QUIET) sum -= LMR_EARLY_STAGE;
          // a noisy TT move, Stockfish 11 ttCapture. Feature: Late_Move_Reductions.
          if (tNoisy) sum += LMR_TT_NOISY;
          sum -= LMR_HISTORY_STEP * max(-LMR_HISTORY_MAX, min(LMR_HISTORY_MAX, hist / LMR_HISTORY_DIV));
        }
        // a node that is or was on a PV is spared the non-PV term, Berserk f05f9dc Negamax.
        // Feature: Late_Move_Reductions.
        if (!pvNode && !(LMR_TT_PV != 0 && tPv)) sum += LMR_NON_PV;
        if (!improving) sum += LMR_NOT_IMPROVING;
        if (cutNode) sum += LMR_CUT_NODE;
        // this node's children keep failing high, Clockwork 641d9f5 fail_high_count; Stockfish a32d2086 cutoffCnt
        // counts over the parent's whole subtree. Feature: Late_Move_Reductions.
        if (ssFailHigh[p + 1] > LMR_FAIL_HIGH_COUNT) sum += LMR_FAIL_HIGH;
        // each raise of alpha here, Clockwork 641d9f5 alpha_raises; Stockfish 9eb7b607 search lowers the node's depth
        // instead. Feature: Late_Move_Reductions.
        sum += raises * LMR_ALPHA_RAISE;
        const r = min(depth - 2, max(sum >> 10, 0));
        if (r > 0) {
          const reduced = newDepth - r;
          v = -search(-alpha - 1, -alpha, reduced, true);
          full = v > alpha;
          if (full) {
            // the re-search's depth follows how far the reduced search beat the best, Stockfish c228f319
            // doDeeperSearch in Clockwork 641d9f5 Worker::search's form: a fixed margin. Weiss 95b0951 AlphaBeta's
            // margin grows with the reduction, and it has no shallower step.
            // Feature: Late_Move_Reductions#Re-searches.
            if (v > best + LMR_DEEPER) newDepth++;
            else if (newDepth > 1 && v < best + LMR_SHALLOWER * newDepth) newDepth--;
            full = reduced < newDepth;
            reSearch = full;
          }
        }
      }
      if (full) {
        v = -search(-alpha - 1, -alpha, newDepth, !cutNode);
        // a quiet's continuation history takes a re-search that failed low or high, Clockwork 641d9f5 Worker::search.
        // Feature: History_Heuristic#Continuation_History.
        if (reSearch && !noisy && LMR_CONT_UPDATE != 0 && !stopped) {
          if (v <= alpha) rewardCont(pt, cm, fm, f4, f6, -malusAt(newDepth));
          else if (v >= beta) rewardCont(pt, cm, fm, f4, f6, bonusAt(newDepth));
        }
      }
      if (pvNode && v > alpha && v < beta) v = -search(-beta, -alpha, newDepth, false);
    }
    undoMove(m);
    if (ext >= 2) ssDouble[p + SS] = parentDouble;
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
          updatePv(p, m);
          if (root) rootRaise = v;
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

  // with its one move left out, a node with no other move fails low (Stash f91e750 search).
  // Feature: Singular_Extensions.
  if (played == 0) return excl ? alpha : check ? -MATE + p : 0;
  // a cut far above beta counts as one from a ply deeper, for the bonus and the malus, Clockwork 641d9f5 bonus_depth.
  // Feature: History_Heuristic.
  if (best >= beta) {
    updateHistories(bestMove, depth, depth + (best - beta >= HIST_DEEP_MARGIN ? 1 : 0), p, quiets, captures);
    // the parent's first move, a quiet, is refuted here, Stockfish 11 update_all_stats.
    // Feature: History_Heuristic#Continuation_History.
    if (HIST_PRIOR_MALUS != 0 && ssQuietNumber[p + SS - 1] == 1) rewardPrior(p, -malusAt(depth + 1));
  } else if (
    !bestMove &&
    HIST_PRIOR_BONUS_DEPTH != 0 &&
    (depth >= HIST_PRIOR_BONUS_DEPTH || pvNode) &&
    ssQuietNumber[p + SS - 1] != 0
  ) {
    // no move raised alpha: the parent's quiet move caused the fail low, Stockfish 8fd34d77 search.
    // Feature: History_Heuristic#Continuation_History.
    rewardPrior(p, bonusAt(depth));
  }
  const bound = best >= beta ? BOUND_LOWER : bestMove ? BOUND_EXACT : BOUND_UPPER;
  // correction history, Stash 302136d search: not in check, not an excluded search (Clockwork 641d9f5 Worker::search;
  // Stash f91e750 search updates there too), non-mate score (Ratchet's own guard: Stockfish 17 search and Stash
  // 302136d have none), no noisy best move, and the bound says the eval was wrong in that direction.
  // Feature: Static_Evaluation_Correction_History.
  if (
    !check &&
    excl == 0 &&
    abs(best) < MATE_IN_MAX &&
    !(bestMove && isNoisy(bestMove)) &&
    !(bound == BOUND_LOWER && best <= staticEval) &&
    !(bound == BOUND_UPPER && best >= staticEval)
  ) updateCorrection(side, depth, best - staticEval, corrCont);
  ttStore(key, bestMove, scoreToTT(best, p), raw, depth, bound, pvNode || tPv);
  return best;
}

/** whether a move gives check: the core's make and unmake alone, since no eval state is read */
@inline function givesCheck(m: i32): bool {
  make(m);
  const given = inCheck();
  unmake(m);
  return given;
}

/**
 * The quiescence search: stand pat, then captures and queen promotions that pass
 * SEE >= 0 (Weiss 2568fb7 Quiescence); in check, every evasion until one scores
 * above a mate, then only those (QS_EVASIONS). Delta pruning skips a capture
 * that gives no check and whose victim cannot lift stand pat to alpha, and the
 * skip raises the score to that estimate, so the upper bound holds for the skipped
 * capture too (Stash f91e750 qsearch). It probes and stores the TT at depth 0, never
 * as an exact bound (Stockfish 45e5e65a qsearch).
 * Features: Quiescence_Search, Delta_Pruning, Static_Exchange_Evaluation#Pruning, Transposition_Table.
 */
function qsearch(alpha: i32, beta: i32): i32 {
  const p = ply;
  pvLen[p] = p;
  nodeCount++;
  checkStop();
  if (stopped) return 0;
  const pvNode = beta - alpha > 1;
  if (halfmove >= 100 || isRepetition()) return drawScore();
  const check = hash == knownCheckKey ? knownCheck : inCheck();
  if (p >= PLY_GUARD) return check ? 0 : evalCached(psq);

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
    tMove = ttMoveOf(ttMove);
  }

  let best = -MATE + p;
  let raw = EVAL_NONE;
  if (!check) {
    raw = hit && ttEval != EVAL_NONE ? ttEval : evalCached(psq);
    best = raw + correction(side, contSlot(ssCont[p + SS - 1], ssCont[p + SS - 2]));
    if (halfmove > 12) best = (best * (256 - halfmove)) / 256;
    best = ttAdjustedEval(best, hit, tBound, tScore);
    if (best >= beta) return best;
    if (best > alpha) alpha = best;
  }

  // fixed before the loop, as Stash f91e750 qsearch does: a skip raises best, and a running base would read that raise.
  // Feature: Delta_Pruning.
  const deltaBase = best;
  const base = p * MAX_MOVES;
  const end = generateMoves(MOVES, base, check);
  if (check && end == base) return -MATE + p;
  // only a node in check lists quiets, so only it needs the attacked squares
  const threats = check ? threatsAt(p) : 0;
  const ct = end > base ? captureThreatsAt(p) : 0;
  for (let i = base; i < end; i++) {
    const m = MOVES[i];
    SCORES[i] =
      m == tMove ? 1 << 30 : isNoisy(m) ? captureScore(m, ct) + (1 << 18) : quietScore(m, -1, -1, -1, -1, threats);
  }
  let bestMove = 0;
  for (let i = base; i < end; i++) {
    selectBest(i, end);
    const m = MOVES[i];
    if (!check) {
      if (!seeGe(m, 0)) continue;
      if (!movePromo(m) && deltaBase > -MATE_IN_MAX) {
        // Stash 007850d qsearch's second test: when stand pat is that far below alpha without a victim, only a
        // capture that wins material is searched. Feature: Delta_Pruning.
        const low = deltaBase + QS_DELTA;
        let estimate = low + MAT_EG[victimOf(m)];
        if (estimate > alpha && QS_SEE != 0 && low <= alpha && !seeGe(m, 1)) estimate = low;
        if (estimate <= alpha && !givesCheck(m)) {
          if (estimate > best) best = estimate;
          continue;
        }
      }
    } else if (QS_EVASIONS != 0 && best > -MATE_IN_MAX && (!isNoisy(m) || !seeGe(m, 0))) {
      // Weiss 95b0951 Quiescence: one evasion that is not mated answers the check, and the rest are held to
      // qsearch's moves. Feature: Quiescence_Search.
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

/**
 * The state a search starts from: the counters at zero, the stack empty, the
 * root's moves listed with no nodes spent.
 */
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
    ssQuietNumber[i] = 0;
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
 *
 * A stop inside an iteration keeps what that iteration found, Stockfish 11 Thread::search, where a root move that
 * finishes as the new best takes its score at once and a stop keeps the sorted root moves: the line of a root move
 * that the cut search finished above its alpha is returned and reported, at the cut iteration's depth. Rejected:
 * Ethereal 12.75 iterativeDeepening, which takes an iteration's move only when the iteration finishes, so the nodes
 * after the last finished iteration change no move. A cut search in which no root move finished above alpha changes
 * nothing, and `completed` stays the last finished depth.
 * Feature: Iterative_Deepening.
 */
export function think(maxDepth: i32): i32 {
  startSearch();
  if (rootCount == 0) return 0;

  let score = 0;
  let previous = 0;
  for (let depth = 1; depth <= maxDepth; depth++) {
    rootDepth = depth;
    // aspiration, Ethereal 12.75 aspirationWindow: fail low halves beta down, fail high searches one ply less; the
    // failed bound widens from the score, as in Stockfish 11 Thread::search, where Ethereal widens from the old bound.
    // Feature: Aspiration_Windows.
    let delta = ASP_DELTA;
    let alpha = -INF;
    let beta = INF;
    if (depth >= ASP_DEPTH) {
      alpha = max(score - delta, -INF);
      beta = min(score + delta, INF);
    }
    let d = depth;
    let v = 0;
    // a root move that failed high in this iteration: its line stands if the wider search is cut before any root move
    // finishes, and a fail low after it drops it
    let highLen = 0;
    let highScore = 0;
    while (true) {
      v = search(alpha, beta, d, false);
      if (stopped) break;
      if (v <= alpha) {
        beta = (alpha + beta) / 2;
        alpha = max(v - delta, -INF);
        d = depth;
        highLen = 0;
      } else if (v >= beta) {
        beta = min(v + delta, INF);
        if (abs(v) < MATE_IN_MAX) d = max(1, d - 1);
        highLen = pvLen[0];
        for (let i = 0; i < highLen; i++) highPv[i] = pvTable[i];
        highScore = v;
      } else break;
      delta += delta / 2;
    }
    if (stopped) {
      // the root's row of the PV table is written only after a root move's search has finished above alpha, so at a
      // stop it holds a finished move's line or nothing
      if (pvLen[0] > 0) {
        rootPvLen = pvLen[0];
        for (let i = 0; i < rootPvLen; i++) rootPv[i] = pvTable[i];
        bestScore = rootRaise;
        hostIteration(depth, hostScore(bestScore), <f64>nodeCount);
      } else if (highLen > 0) {
        rootPvLen = highLen;
        for (let i = 0; i < rootPvLen; i++) rootPv[i] = highPv[i];
        bestScore = highScore;
        hostIteration(depth, hostScore(bestScore), <f64>nodeCount);
      }
      break;
    }

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

