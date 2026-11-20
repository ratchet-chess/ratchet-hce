/**
 * The main search's staged move picker (Fruit 2.1 sort.cpp sort_init and sort_next for
 * the stages, Weiss c735b8f NextMove for the order): the TT move, captures that pass SEE,
 * the killer, quiets by history, then the captures that failed SEE. A queen promotion without a capture is
 * picked among the captures. The core generates legal moves only, so a
 * stage's moves need no legality test; the TT move and the killer, which come
 * from elsewhere in the tree, are tested before they are picked.
 *
 * Each ply owns a slice of MOVES and SCORES and a row of picker state, so a node
 * keeps its picker while its children run theirs.
 */
import { FLAG_EP, MAX_MOVES, MAX_PLY, PAWN, QUEEN, moveFrom, movePromo, moveTo } from "../../core/constants";
import { generateCaptures, generateQuiets, isLegal } from "../../core/movegen";
import { bb, board, side } from "../../core/position";
import { butterfly, butterflyIndex, captureHist, contHist, pawnHist, pawnHistIndex, pawnHistRow, threatsAt } from "./history";
import { GOOD_CAPTURE_DIV, MVV, PAWN_HISTORY, PROMO_NOISY } from "./params";
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
/** the ranks a pawn promotes from, White's then Black's */
const RANK_7: u64 = 0xff000000000000;
const RANK_2: u64 = 0xff00;

export const MOVES = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY * MAX_MOVES));
export const SCORES = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY * MAX_MOVES));
const stage = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const cur = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const end = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const badEnd = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const ttOf = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const killerOf = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const cmOf = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const fmOf = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const f4Of = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));
const f6Of = changetype<StaticArray<i32>>(memory.data(sizeof<i32>() * MAX_PLY));

/** the stage that gave the last move picked, by any ply: a caller reads it before it searches the move */
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
@inline export function captureScore(m: i32): i32 {
  let s = MVV[victimOf(m)] + <i32>captureHist[captureIndex(m)];
  const promo = movePromo(m);
  if (promo == QUEEN) s += MVV[QUEEN];
  else if (promo) s -= PROMO_SCORE;
  return s;
}

/**
 * a quiet's order: butterfly plus 1-, 2- and 4-ply continuation history (Stockfish
 * 10 MovePicker::score<QUIETS>) plus the 6-ply (Clockwork 3dd022c History::get_conthist) plus pawn
 * history (Stockfish b0658f09 MovePicker::score<QUIETS>, Weiss 20c95ce GetQuietHistory); `cm`, `fm`, `f4` and `f6` are -1 when there is no such move, and `threats` is
 * the node's attacked squares
 */
@inline export function quietScore(m: i32, cm: i32, fm: i32, f4: i32, f6: i32, threats: u64): i32 {
  const promo = movePromo(m);
  if (promo) return promo == QUEEN ? PROMO_SCORE : -PROMO_SCORE;
  const pt = pieceTo(m);
  let s = <i32>butterfly[butterflyIndex(m, threats)];
  if (PAWN_HISTORY != 0) s += <i32>pawnHist[pawnHistIndex(pt)];
  if (cm >= 0) s += <i32>contHist[cm + pt];
  if (fm >= 0) s += <i32>contHist[fm + pt];
  if (f4 >= 0) s += <i32>contHist[f4 + pt];
  if (f6 >= 0) s += <i32>contHist[f6 + pt];
  return s;
}

export function initPicker(ply: i32, ttMove: i32, killer: i32, cm: i32, fm: i32, f4: i32, f6: i32): void {
  stage[ply] = ttMove ? STAGE_TT : STAGE_GEN_NOISY;
  ttOf[ply] = ttMove;
  killerOf[ply] = killer != ttMove ? killer : 0;
  cmOf[ply] = cm;
  fmOf[ply] = fm;
  f4Of[ply] = f4;
  f6Of[ply] = f6;
}

/**
 * puts a ply's picker back to just after its TT move: the singular search reruns
 * the node at the same ply, and it starts while the TT move is the only move the
 * ply's picker has given, before it has generated any
 */
export function resumeAfterTT(ply: i32, ttMove: i32, killer: i32, cm: i32, fm: i32, f4: i32, f6: i32): void {
  initPicker(ply, ttMove, killer, cm, fm, f4, f6);
  stage[ply] = STAGE_GEN_NOISY;
}

/** first index of the maximum score in [from, to), where to - from >= 8, using wasm simd128 */
function bestIndexSimd(from: i32, to: i32): i32 {
  const base = changetype<usize>(SCORES);
  let i = from;
  let vmax = v128.load(base + (<usize>i << 2));
  i += 4;
  const limit = to - 4;
  while (i <= limit) {
    vmax = i32x4.max_s(vmax, v128.load(base + (<usize>i << 2)));
    i += 4;
  }
  const vmax2 = i32x4.max_s(vmax, v128.shuffle<i32>(vmax, vmax, 2, 3, 0, 1));
  const vmax4 = i32x4.max_s(vmax2, v128.shuffle<i32>(vmax2, vmax2, 1, 0, 3, 2));
  let bs = i32x4.extract_lane(vmax4, 0);
  let best = -1;
  while (i < to) {
    const s = unchecked(SCORES[i]);
    if (s > bs) {
      bs = s;
      best = i;
    }
    i++;
  }
  if (best >= 0) return best;
  const vbs = i32x4.splat(bs);
  let j = from;
  while (true) {
    const mask = i32x4.bitmask(i32x4.eq(v128.load(base + (<usize>j << 2)), vbs));
    if (mask) return j + <i32>ctz(mask);
    j += 4;
  }
}

/** moves the best-scored move of [from, to) to `from` */
@inline export function selectBest(from: i32, to: i32): void {
  let best: i32;
  let bs: i32;
  if (to - from >= 8) {
    best = bestIndexSimd(from, to);
    bs = unchecked(SCORES[best]);
  } else {
    best = from;
    bs = unchecked(SCORES[from]);
    for (let i = from + 1; i < to; i++) {
      const s = unchecked(SCORES[i]);
      if (s > bs) {
        bs = s;
        best = i;
      }
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
        let e = generateCaptures(MOVES, base);
        // the core lists a queen promotion without a capture among the quiets; check unblocked 7th-rank pawns directly
        // in square order so noisy generation avoids a full quiet pass (Stockfish 10 make_promotions, Stash 37 extmove_generate_pawn_noisy)
        if (PROMO_NOISY != 0) {
          let pawns = unchecked(bb[(side << 3) | PAWN]) & (side == 0 ? RANK_7 : RANK_2);
          if (pawns) {
            const occ = unchecked(bb[0] | bb[8]);
            pawns &= side == 0 ? ~(occ >> 8) : ~(occ << 8);
            const fwd = side == 0 ? 8 : -8;
            while (pawns) {
              const from = <i32>ctz(pawns);
              pawns &= pawns - 1;
              const m = from | ((from + fwd) << 6) | (QUEEN << 12);
              if (isLegal(m)) unchecked((MOVES[e++] = m));
            }
          }
        }
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
          // Clockwork 26eccaa MovePicker::next: the bar for a good capture falls as its score rises, by a divisor
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
        const f6 = f6Of[ply];
        const threats = threatsAt(ply);
        const ph = pawnHistRow();
        const sb = side << 12;
        for (let i = from; i < e; i++) {
          const m = unchecked(MOVES[i]);
          const promo = movePromo(m);
          if (promo) {
            unchecked((SCORES[i] = promo == QUEEN ? PROMO_SCORE : -PROMO_SCORE));
            continue;
          }
          const pt = pieceTo(m);
          const bits = (<i32>((threats >> <u64>moveFrom(m)) & 1) << 1) | <i32>((threats >> <u64>moveTo(m)) & 1);
          let s = <i32>unchecked(butterfly[(bits << 13) | sb | (m & 4095)]);
          if (PAWN_HISTORY != 0) s += <i32>unchecked(pawnHist[ph | pt]);
          if (cm >= 0) s += <i32>unchecked(contHist[cm + pt]);
          if (fm >= 0) s += <i32>unchecked(contHist[fm + pt]);
          if (f4 >= 0) s += <i32>unchecked(contHist[f4 + pt]);
          if (f6 >= 0) s += <i32>unchecked(contHist[f6 + pt]);
          unchecked((SCORES[i] = s));
        }
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
            if (m == tt || m == k || (PROMO_NOISY != 0 && movePromo(m) == QUEEN)) continue;
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
