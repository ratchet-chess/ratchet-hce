/**
 * The main search's staged move picker (Fruit 2.0's stages; Weiss and Clockwork's
 * order): the TT move, captures that pass SEE, the killer, quiets by history,
 * then the captures that failed SEE. The core generates legal moves only, so a
 * stage's moves need no legality test; the TT move and the killer, which come
 * from elsewhere in the tree, are tested before they are picked.
 *
 * Each ply owns a slice of MOVES and SCORES and a row of picker state, so a node
 * keeps its picker while its children run theirs.
 */
import { FLAG_EP, MAX_MOVES, MAX_PLY, PAWN, QUEEN, moveFrom, movePromo, moveTo } from "../../core/constants";
import { generateCaptures, generateQuiets, isLegal } from "../../core/movegen";
import { board, side } from "../../core/position";
import { butterfly, captureHist, contHist } from "./history";
import { GOOD_CAPTURE_DIV, MVV } from "./params";
import { seeGe } from "./see";

export const STAGE_TT = 0;
export const STAGE_GEN_NOISY = 1;
export const STAGE_GOOD_NOISY = 2;
export const STAGE_KILLER = 3;
export const STAGE_GEN_QUIET = 4;
export const STAGE_QUIET = 5;
export const STAGE_BAD_NOISY = 6;
export const STAGE_DONE = 7;

/** a quiet promotion sorts first among quiets, an underpromotion last */
const PROMO_SCORE = 1 << 20;

export const MOVES = new StaticArray<i32>(MAX_PLY * MAX_MOVES);
export const SCORES = new StaticArray<i32>(MAX_PLY * MAX_MOVES);
const stage = new StaticArray<i32>(MAX_PLY);
const cur = new StaticArray<i32>(MAX_PLY);
const end = new StaticArray<i32>(MAX_PLY);
const badEnd = new StaticArray<i32>(MAX_PLY);
const ttOf = new StaticArray<i32>(MAX_PLY);
const killerOf = new StaticArray<i32>(MAX_PLY);
const cmOf = new StaticArray<i32>(MAX_PLY);
const fmOf = new StaticArray<i32>(MAX_PLY);
const f4Of = new StaticArray<i32>(MAX_PLY);

/** the stage that gave the last move picked */
export let pickedStage = 0;

/** the piece type a capture takes */
@inline export function victimOf(m: i32): i32 {
  return m & FLAG_EP ? PAWN : <i32>board[moveTo(m)] & 7;
}

/** whether a move captures or promotes */
@inline export function isNoisy(m: i32): bool {
  return (m & FLAG_EP) != 0 || board[moveTo(m)] != 0 || movePromo(m) != 0;
}

/** a capture's index in captureHist */
@inline export function captureIndex(m: i32): i32 {
  return ((((<i32>board[moveFrom(m)]) << 6) | moveTo(m)) << 3) | victimOf(m);
}

/** a move's piece and square, the low half of a continuation-history index */
@inline export function pieceTo(m: i32): i32 {
  return ((<i32>board[moveFrom(m)]) << 6) | moveTo(m);
}

/** a capture's order: the victim's value plus capture history; a queen promotion adds a queen */
export function captureScore(m: i32): i32 {
  let s = MVV[victimOf(m)] + <i32>captureHist[captureIndex(m)];
  const promo = movePromo(m);
  if (promo == QUEEN) s += MVV[QUEEN];
  else if (promo) s -= PROMO_SCORE;
  return s;
}

/**
 * a quiet's order: butterfly plus 1-, 2- and 4-ply continuation history (Stash
 * 660df34 adds the 4-ply); `cm`, `fm` and `f4` are -1 when there is no such move
 */
export function quietScore(m: i32, cm: i32, fm: i32, f4: i32): i32 {
  const promo = movePromo(m);
  if (promo) return promo == QUEEN ? PROMO_SCORE : -PROMO_SCORE;
  const pt = pieceTo(m);
  let s = <i32>butterfly[(side << 12) | (m & 4095)];
  if (cm >= 0) s += <i32>contHist[cm + pt];
  if (fm >= 0) s += <i32>contHist[fm + pt];
  if (f4 >= 0) s += <i32>contHist[f4 + pt];
  return s;
}

export function initPicker(ply: i32, ttMove: i32, killer: i32, cm: i32, fm: i32, f4: i32): void {
  stage[ply] = ttMove ? STAGE_TT : STAGE_GEN_NOISY;
  ttOf[ply] = ttMove;
  killerOf[ply] = killer != ttMove ? killer : 0;
  cmOf[ply] = cm;
  fmOf[ply] = fm;
  f4Of[ply] = f4;
}

/** moves the best-scored move of [from, to) to `from` */
/**
 * puts a ply's picker back to just after its TT move: the singular search reruns
 * the node at the same ply, and it starts while the TT move is the only move the
 * ply's picker has given, before it has generated any
 */
export function resumeAfterTT(ply: i32, ttMove: i32, killer: i32, cm: i32, fm: i32, f4: i32): void {
  initPicker(ply, ttMove, killer, cm, fm, f4);
  stage[ply] = STAGE_GEN_NOISY;
  pickedStage = STAGE_TT;
}

@inline export function selectBest(from: i32, to: i32): void {
  let best = from;
  let bs = unchecked(SCORES[from]);
  for (let i = from + 1; i < to; i++) {
    const s = unchecked(SCORES[i]);
    if (s > bs) {
      bs = s;
      best = i;
    }
  }
  if (best != from) {
    const m = unchecked(MOVES[best]);
    unchecked((MOVES[best] = MOVES[from]));
    unchecked((MOVES[from] = m));
    unchecked((SCORES[best] = SCORES[from]));
    unchecked((SCORES[from] = bs));
  }
}

/** the next move of the node at `ply`, or 0 when none is left; with `skipQuiets`, quiets are passed over */
export function nextMove(ply: i32, skipQuiets: bool): i32 {
  const base = ply * MAX_MOVES;
  const tt = ttOf[ply];
  while (true) {
    switch (stage[ply]) {
      case STAGE_TT: {
        stage[ply] = STAGE_GEN_NOISY;
        pickedStage = STAGE_TT;
        return tt;
      }
      case STAGE_GEN_NOISY: {
        const e = generateCaptures(MOVES, base);
        for (let i = base; i < e; i++) unchecked((SCORES[i] = captureScore(MOVES[i])));
        cur[ply] = base;
        end[ply] = e;
        badEnd[ply] = base;
        stage[ply] = STAGE_GOOD_NOISY;
        break;
      }
      case STAGE_GOOD_NOISY: {
        const e = end[ply];
        let c = cur[ply];
        while (c < e) {
          selectBest(c, e);
          const m = unchecked(MOVES[c]);
          const s = unchecked(SCORES[c]);
          c++;
          if (m == tt) continue;
          // Stockfish d64ffd96, Clockwork: the bar for a good capture falls as its score rises
          if (!seeGe(m, -s / GOOD_CAPTURE_DIV)) {
            const b = badEnd[ply];
            unchecked((MOVES[b] = m));
            badEnd[ply] = b + 1;
            continue;
          }
          cur[ply] = c;
          pickedStage = STAGE_GOOD_NOISY;
          return m;
        }
        cur[ply] = c;
        stage[ply] = STAGE_KILLER;
        break;
      }
      case STAGE_KILLER: {
        stage[ply] = STAGE_GEN_QUIET;
        const k = killerOf[ply];
        if (k && !skipQuiets && !isNoisy(k) && isLegal(k)) {
          pickedStage = STAGE_KILLER;
          return k;
        }
        break;
      }
      case STAGE_GEN_QUIET: {
        if (skipQuiets) {
          stage[ply] = STAGE_BAD_NOISY;
          cur[ply] = base;
          break;
        }
        const from = end[ply];
        const e = generateQuiets(MOVES, from);
        const cm = cmOf[ply];
        const fm = fmOf[ply];
        const f4 = f4Of[ply];
        for (let i = from; i < e; i++) unchecked((SCORES[i] = quietScore(MOVES[i], cm, fm, f4)));
        cur[ply] = from;
        end[ply] = e;
        stage[ply] = STAGE_QUIET;
        break;
      }
      case STAGE_QUIET: {
        const e = end[ply];
        let c = cur[ply];
        if (!skipQuiets) {
          const k = killerOf[ply];
          while (c < e) {
            selectBest(c, e);
            const m = unchecked(MOVES[c]);
            c++;
            if (m == tt || m == k) continue;
            cur[ply] = c;
            pickedStage = STAGE_QUIET;
            return m;
          }
        }
        stage[ply] = STAGE_BAD_NOISY;
        cur[ply] = base;
        break;
      }
      case STAGE_BAD_NOISY: {
        const e = badEnd[ply];
        let c = cur[ply];
        while (c < e) {
          const m = unchecked(MOVES[c]);
          c++;
          if (m == tt) continue;
          cur[ply] = c;
          pickedStage = STAGE_BAD_NOISY;
          return m;
        }
        cur[ply] = c;
        stage[ply] = STAGE_DONE;
        break;
      }
      default:
        return 0;
    }
  }
  return 0;
}
