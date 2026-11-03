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

/** material by piece type (none, P, N, B, R, Q, K), middlegame and endgame; hand-seeded, Texel-tuned */
export const MAT_MG: StaticArray<i32> = [0, 372, 1539, 1642, 2088, 4579, 0];
export const MAT_EG: StaticArray<i32> = [0, 517, 1216, 1301, 2337, 4363, 0];

/** the side to move's bonus, added as a (middlegame, endgame) pair before the blend (Stash, Clockwork) */
export const TEMPO_MG = 81;
export const TEMPO_EG = 86;

/** KXK mop-up, CPW "Mop-up Evaluation": per step of the bare king's center distance, and per step the kings close */
export const MOPUP_EDGE = 80;
export const MOPUP_CLOSE = 32;

// Piece-square tables from White's side, indexed by square: a1 = 0, so rank 1 is the
// first row. Hand-seeded, then Texel-tuned on the zurichess quiet set (results/tuning.md).
export const PAWN_MG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     -206,   -8,   -100, -111, -68,  116,  174,  -115,
     -150,   -19,   -11,   -39,   28,   32,   164,   -63,
    -165,  -15,  -11,  70,  99,  48,  53,  -129,
    -102,  69,  41,  122,  137,  78,  110,  -105,
    -52,  35,  136,  156,  361,  274,  105,  -99,
   562, 589, 428, 475, 459, 266, 225, 288,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,    0,    0,    0,    0,    0,    0,    0,
     8,  -43,  -31,  -34,  -29,  -95,  -90, -108,
   -45,  -46, -115,  -75,  -88, -116, -109, -118,
     1,  -34,  -99, -129, -134, -132,  -79,  -82,
    85,   25,  -23,  -73, -110,  -75,  -21,    1,
   374,  396,  311,  223,  146,  135,  310,  322,
   698,  691,  597,  545,  563,  584,  684,  728,
     0,    0,    0,    0,    0,    0,    0,    0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  -391,  -52, -195, -117,  -42,  -75,  -36,  -49,
  -104, -229,   -1,   34,   49,  139,   22,  -34,
   -51,   12,  107,  106,  154,  135,  164,  -22,
   -11,  100,  121,  123,  192,  150,  163,   13,
    46,  130,  188,  308,  230,  385,  137,  167,
  -142,  350,  228,  361,  467,  477,  404,  233,
  -115,  -64,  278,  285,   -4,  358,   24,   13,
  -605, -228, -114,  -16,  470, -403, -104, -484,
];
export const KNIGHT_EG: StaticArray<i32> = [
  -111, -203,  -59,   -5,  -39,  -47, -198, -259,
  -117,  -27,    6,   28,   30,  -57,  -58, -195,
   -53,   41,   35,  114,   90,   22,  -46,  -55,
   -31,   23,  141,  164,  112,  129,   86,  -52,
   -14,   65,  139,  133,  136,   83,   70,  -43,
   -54,  -52,   86,   75,   -6,   -2,  -97, -165,
   -95,   30,  -65,   13,   36, -104,  -39, -214,
  -235, -132,    3, -101, -163,  -84, -234, -382,
];
export const BISHOP_MG: StaticArray<i32> = [
   -93,   34,    7,  -34,   14,   17, -107,  -41,
    95,  153,  140,   72,  116,  142,  223,   85,
    67,  136,  132,  139,  123,  198,  149,  110,
    40,  162,  130,  194,  217,  126,   97,   96,
    71,   91,  144,  278,  254,  257,   91,   59,
   -23,  254,  170,  273,  176,  347,  182,   57,
    33,  220,   35,  -17,  293,  142,  199, -165,
    14,   49, -414, -143, -243, -120,   -9,  120,
];
export const BISHOP_EG: StaticArray<i32> = [
   -50,   -1,  -78,   31,    5,  -39,    8,  -48,
   -24,  -65,    3,   32,   44,    2,  -37,  -93,
   -13,   23,   80,   72,   98,   38,    9,  -37,
    13,   27,   89,  114,   68,   72,   27,  -12,
    21,   79,   90,   78,   88,   71,   55,   39,
    48,   -7,   60,   13,   18,   28,   42,   55,
   -23,   -7,   64,   -8,  -13,   23,   -5,  -20,
   -65,  -65,   38,   19,   60,  -10,  -51, -105,
];
export const ROOK_MG: StaticArray<i32> = [
   -35,   -7,   67,  105,  119,   51,  -86,  -39,
  -169,   15,  -29,   13,   56,   83,   -8, -278,
  -174,  -36,  -15,  -31,   50,   45,   42,  -91,
  -112,  -46,   21,   53,   85,   21,  125,  -38,
   -21,   10,  110,  202,  162,  188,   78,  -71,
    45,  142,  207,  227,  148,  333,  392,  137,
   258,  238,  417,  406,  506,  489,   80,  275,
   259,  280,  169,  352,  298,   87,   92,  173,
];
export const ROOK_EG: StaticArray<i32> = [
    29,   71,   67,   57,   33,   16,   64,  -56,
    56,   18,   57,   65,    8,   14,    2,   80,
    64,   58,   27,   58,   13,   -7,    4,   -5,
    85,   78,   92,   69,   25,   25,  -11,   15,
    82,   83,  110,   44,   55,   35,   35,   77,
    85,   82,   60,   51,   44,   -1,  -16,   29,
    62,   82,   43,   46,  -33,   -8,   86,   40,
    81,   64,  113,   56,   68,   99,   82,   69,
];
export const QUEEN_MG: StaticArray<i32> = [
   -42,  -66,  -46,   53,  -85, -130, -183, -207,
  -154,  -31,   67,   17,   40,   81,    0,   63,
  -100,   32,  -42,   -5,  -21,    9,   68,   58,
   -37, -139,  -44,  -40,  -28,  -18,   15,   -1,
  -148, -127,  -72,  -87,   -9,   42,  -14,  -36,
   -41, -103,  -15,   88,   -4,  256,  136,  249,
   -84, -162,  -36,   66, -182,  252,   67,  193,
   -68, -159,  -95, -121,  242,  307,  410,   -5,
];
export const QUEEN_EG: StaticArray<i32> = [
  -146, -179, -127, -297,  -34, -147, -116, -210,
  -136, -114, -188, -105,  -91, -158, -200, -275,
   -47, -206,   37,  -18,   36,   62,   16,  -59,
  -132,  148,   75,  205,  112,  127,  140,   48,
    73,   97,   98,  210,  234,  170,  195,  172,
   -89,   92,   26,  192,  247,  117,   65,  -51,
  -101,   62,  162,  126,  352,  -11,   51,  -34,
  -132,  152,  205,  175,   48,  -76, -188,  149,
];
export const KING_MG: StaticArray<i32> = [
   -34,  256,   99, -297,   55, -133,  198,  175,
    77,  113,  -49, -327, -235,  -89,  105,  137,
    62,  -38, -144, -317, -289, -267,  -48, -122,
  -256,   44, -232, -428, -439, -313, -283, -364,
    -8,  -61,  -38, -271, -232, -163,  -75, -396,
    82,  138,  199,   80,  160,  155,  190,  -11,
   337,   91,   65,  249,   10,  -79, -159, -514,
   -96,  355,  297,  259, -478, -241,  -73,  -96,
];
export const KING_EG: StaticArray<i32> = [
  -284, -241, -139,  -42, -167,  -59, -184, -300,
  -161,  -83,   24,   89,   89,   33,  -52, -140,
  -113,  -19,   63,  136,  148,  119,   35,  -37,
   -81,  -27,  121,  178,  188,  153,   93,   -9,
   -51,  106,  109,  164,  155,  172,  140,   71,
    41,   75,   79,   39,   50,  178,  168,   38,
  -110,   75,   45,   15,   70,  202,  140,  133,
  -377, -201, -175, -123,    1,   84,   49,  -53,
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

/** correction history, Stash 302136d, dcc25ed, ba73642 and ea9fd72: each table's entry within 32 at its pawn 103; an update weighs 1 + depth, at most 16, of 256 */
export const CORR_MAX = 124;
export const CORR_WEIGHT_MAX = 16;

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
