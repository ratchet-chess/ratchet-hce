/**
 * Every tunable constant of the own engine, the one file the Texel and SPSA maps
 * point at. Scores are in the engine's unit, a quarter centipawn (eval.ts
 * UNITS_PER_CP), so the hand-seeded middlegame pawn is 400.
 *
 * A constant taken from another engine is converted by that engine's middlegame
 * pawn and labeled with it, as a seed: SPSA retunes the search margins after each
 * eval retune. A constant with no engine named is Ratchet's own seed.
 */

// ---------------------------------------------------------------- eval

/** material by piece type (none, P, N, B, R, Q, K), middlegame and endgame; hand values */
export const MAT_MG: StaticArray<i32> = [0, 400, 1240, 1320, 1980, 3960, 0];
export const MAT_EG: StaticArray<i32> = [0, 500, 1160, 1240, 2120, 4000, 0];

/** the side to move's bonus, added as a (middlegame, endgame) pair before the blend (Stash, Clockwork) */
export const TEMPO_MG = 60;
export const TEMPO_EG = 20;

/** KXK mop-up, CPW "Mop-up Evaluation": per step of the bare king's center distance, and per step the kings close */
export const MOPUP_EDGE = 80;
export const MOPUP_CLOSE = 32;

// Piece-square tables from White's side, indexed by square: a1 = 0, so rank 1 is the
// first row. Hand values, before the Texel tune.
export const PAWN_MG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0, -20, -20,  20,  20,  20,
     0,   0,   0,   0,   0,   0,   0,   0,
    20,  20,  40,  60,  60,  40,  20,  20,
    40,  40,  60,  80,  80,  60,  40,  40,
    80,  80,  80,  80,  80,  80,  80,  80,
   160, 160, 160, 160, 160, 160, 160, 160,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0,   0,   0,   0,   0,   0,
    20,  20,  20,  20,  20,  20,  20,  20,
    40,  40,  40,  40,  40,  40,  40,  40,
    80,  80,  80,  80,  80,  80,  80,  80,
   140, 140, 140, 140, 140, 140, 140, 140,
   240, 240, 240, 240, 240, 240, 240, 240,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  -100,-100,-100,-100,-100,-100,-100,-100,
  -100, -20, -20, -20, -20, -20, -20,-100,
  -100, -20,  40,  40,  40,  40, -20,-100,
  -100, -20,  40,  80,  80,  40, -20,-100,
  -100, -20,  40,  80,  80,  40, -20,-100,
  -100, -20,  40,  40,  40,  40, -20,-100,
  -100, -20, -20, -20, -20, -20, -20,-100,
  -100,-100,-100,-100,-100,-100,-100,-100,
];
export const KNIGHT_EG: StaticArray<i32> = [
   -80, -80, -80, -80, -80, -80, -80, -80,
   -80, -20, -20, -20, -20, -20, -20, -80,
   -80, -20,  32,  32,  32,  32, -20, -80,
   -80, -20,  32,  60,  60,  32, -20, -80,
   -80, -20,  32,  60,  60,  32, -20, -80,
   -80, -20,  32,  32,  32,  32, -20, -80,
   -80, -20, -20, -20, -20, -20, -20, -80,
   -80, -80, -80, -80, -80, -80, -80, -80,
];
export const BISHOP_MG: StaticArray<i32> = [
   -40, -40, -40, -40, -40, -40, -40, -40,
   -40,   0,   0,   0,   0,   0,   0, -40,
   -40,   0,  32,  32,  32,  32,   0, -40,
   -40,   0,  32,  40,  40,  32,   0, -40,
   -40,   0,  32,  40,  40,  32,   0, -40,
   -40,   0,  32,  32,  32,  32,   0, -40,
   -40,   0,   0,   0,   0,   0,   0, -40,
   -40, -40, -40, -40, -40, -40, -40, -40,
];
export const BISHOP_EG: StaticArray<i32> = [
   -32, -32, -32, -32, -32, -32, -32, -32,
   -32,   0,   0,   0,   0,   0,   0, -32,
   -32,   0,  20,  20,  20,  20,   0, -32,
   -32,   0,  20,  32,  32,  20,   0, -32,
   -32,   0,  20,  32,  32,  20,   0, -32,
   -32,   0,  20,  20,  20,  20,   0, -32,
   -32,   0,   0,   0,   0,   0,   0, -32,
   -32, -32, -32, -32, -32, -32, -32, -32,
];
export const ROOK_MG: StaticArray<i32> = [
     0,   0,   0,  20,  20,   0,   0,   0,
     0,   0,   0,  20,  20,   0,   0,   0,
     0,   0,   0,  20,  20,   0,   0,   0,
     0,   0,   0,  20,  20,   0,   0,   0,
     0,   0,   0,  20,  20,   0,   0,   0,
     0,   0,   0,  20,  20,   0,   0,   0,
    60,  60,  60,  80,  80,  60,  60,  60,
     0,   0,   0,  20,  20,   0,   0,   0,
];
export const ROOK_EG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0,   0,   0,   0,   0,   0,
    40,  40,  40,  40,  40,  40,  40,  40,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const QUEEN_MG: StaticArray<i32> = [
   -20, -20, -20, -20, -20, -20, -20, -20,
   -20,   0,   0,   0,   0,   0,   0, -20,
   -20,   0,  12,  12,  12,  12,   0, -20,
   -20,   0,  12,  20,  20,  12,   0, -20,
   -20,   0,  12,  20,  20,  12,   0, -20,
   -20,   0,  12,  12,  12,  12,   0, -20,
   -20,   0,   0,   0,   0,   0,   0, -20,
   -20, -20, -20, -20, -20, -20, -20, -20,
];
export const QUEEN_EG: StaticArray<i32> = [
   -48, -48, -48, -48, -48, -48, -48, -48,
   -48,   0,   0,   0,   0,   0,   0, -48,
   -48,   0,  32,  32,  32,  32,   0, -48,
   -48,   0,  32,  60,  60,  32,   0, -48,
   -48,   0,  32,  60,  60,  32,   0, -48,
   -48,   0,  32,  32,  32,  32,   0, -48,
   -48,   0,   0,   0,   0,   0,   0, -48,
   -48, -48, -48, -48, -48, -48, -48, -48,
];
export const KING_MG: StaticArray<i32> = [
    40, 100,  20, -20,   0,  20, 100,  40,
     0,   0, -40, -80, -80, -40,   0,   0,
  -120,-120,-120,-120,-120,-120,-120,-120,
  -160,-160,-160,-160,-160,-160,-160,-160,
  -200,-200,-200,-200,-200,-200,-200,-200,
  -240,-240,-240,-240,-240,-240,-240,-240,
  -280,-280,-280,-280,-280,-280,-280,-280,
  -280,-280,-280,-280,-280,-280,-280,-280,
];
export const KING_EG: StaticArray<i32> = [
  -100,-100,-100,-100,-100,-100,-100,-100,
  -100,   0,   0,   0,   0,   0,   0,-100,
  -100,   0,  60,  60,  60,  60,   0,-100,
  -100,   0,  60, 120, 120,  60,   0,-100,
  -100,   0,  60, 120, 120,  60,   0,-100,
  -100,   0,  60,  60,  60,  60,   0,-100,
  -100,   0,   0,   0,   0,   0,   0,-100,
  -100,-100,-100,-100,-100,-100,-100,-100,
];

// ---------------------------------------------------------------- search

/** SEE values by piece type (none, P, N, B, R, Q, K); the king is never captured */
export const SEE_VALUE: StaticArray<i32> = [0, 400, 1200, 1200, 2000, 3600, 0];

/** aspiration windows, Ethereal 0e47e9b aspirationWindow: from depth 4, delta 10 at its pawn 82, widened by half */
export const ASP_DEPTH = 4;
export const ASP_DELTA = 49;

/** reverse futility, Stash f91e750: depth <= 7, 86 per ply less 79 when improving, at its pawn 103 */
export const RFP_DEPTH = 7;
export const RFP_MARGIN = 334;
export const RFP_IMPROVING = 307;

/** razoring, Stash f91e750: depth <= 3, static eval + 120 per ply <= alpha, at its pawn 103 */
export const RAZOR_DEPTH = 3;
export const RAZOR_MARGIN = 466;

/** null move, Ethereal v12.75: R = 4 + depth / 6 + min(3, (eval - beta) / 200), at its pawn 82 */
export const NMP_DEPTH = 2;
export const NMP_BASE = 4;
export const NMP_DEPTH_DIV = 6;
export const NMP_EVAL_DIV = 975;
export const NMP_EVAL_MAX = 3;

/** internal iterative reduction, Berserk 03cebd6: PV or cut node, depth >= 4, no TT move */
export const IIR_DEPTH = 4;

/** late move pruning, Ethereal v12.75 LateMovePruningCounts: quiets tried by depth, not improving then improving */
export const LMP_DEPTH = 8;
export const LMP_COUNT: StaticArray<i32> = [0, 3, 4, 6, 10, 14, 19, 25, 31, 0, 5, 7, 11, 17, 26, 36, 48, 63];

/** futility on the reduced depth, Ethereal 0e47e9b: eval + 77 + 52 per ply <= alpha at its pawn 82; history limits by improving, v12.75 */
export const FUT_DEPTH = 8;
export const FUT_BASE = 376;
export const FUT_PER_DEPTH = 254;
export const FUT_HISTORY: StaticArray<i32> = [12000, 6000];

/** history pruning, Ethereal v12.75 as the dig note reads it: 1- and 2-ply continuation history below a limit, by improving */
export const HP_DEPTH: StaticArray<i32> = [3, 2];
export const HP_LIMIT: StaticArray<i32> = [-1000, -2500];

/** SEE pruning, Ethereal v12.75: depth <= 9, quiets below -64 per ply, noisy below -19 per ply squared, at its pawn 82 */
export const SEE_DEPTH = 9;
export const SEE_QUIET = 312;
export const SEE_NOISY = 93;

/** late move reductions, Ethereal v12.75: 0.75 + ln(depth) ln(moves) / 2.25, both in hundredths; history per step, capped */
export const LMR_BASE = 75;
export const LMR_DIV = 225;
export const LMR_HISTORY_DIV = 5000;
export const LMR_HISTORY_MAX = 2;

/** a capture is tried among the good ones if SEE >= -score / this, Clockwork 641d9f5's divisor 51 at its pawn 112 */
export const GOOD_CAPTURE_DIV = 14;

/** most valuable victim by piece type, Clockwork 641d9f5 score_move */
export const MVV: StaticArray<i32> = [0, 800, 2400, 2400, 4800, 7200, 0];

/** qsearch: a capture is skipped if stand pat + its victim + this cannot reach alpha */
export const QS_DELTA = 800;

/** history bonus and malus, Weiss c735b8f: min(2418, 251 d - 267) and min(693, 532 d - 163) */
export const HIST_BONUS_MUL = 251;
export const HIST_BONUS_SUB = 267;
export const HIST_BONUS_MAX = 2418;
export const HIST_MALUS_MUL = 532;
export const HIST_MALUS_SUB = 163;
export const HIST_MALUS_MAX = 693;

// ---------------------------------------------------------------- time

/** Weiss c735b8f InitTimeManagement: sudden death uses 0.022 of the time left, at most 0.2 of the clock */
export const TM_SHARE = 0.022;
export const TM_SHARE_CAP = 0.2;
/** with moves to go, 0.7 over min(moves to go, 50) (Weiss) */
export const TM_MTG_SHARE = 0.7;
export const TM_MTG_CAP = 50;
/** the increments counted ahead (Weiss's 50) */
export const TM_INC_MOVES = 50.0;
/** hard limit: 5 times the soft one, at most 0.8 of the clock (Weiss) */
export const TM_HARD_MUL = 5.0;
export const TM_HARD_CAP = 0.8;
/** clock milliseconds held back per move for the host and the match runner */
export const TM_OVERHEAD = 10.0;
/** node share of the best move, Weiss 1401211: stop past soft * (0.52 + 3.73 * (1 - share)) */
export const TM_NODE_BASE = 0.52;
export const TM_NODE_MUL = 3.73;
/** the soft limit with one legal move, Weiss d7d1334's cap */
export const TM_ONE_MOVE = 500.0;
