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
export const MAT_MG: StaticArray<i32> = [0, 335, 1570, 1690, 2171, 5053, 0];
export const MAT_EG: StaticArray<i32> = [0, 427, 1456, 1545, 2722, 4918, 0];

/** the side to move's bonus, added as a (middlegame, endgame) pair before the blend (Stash, Clockwork) */
export const TEMPO_MG = 65;
export const TEMPO_EG = 116;

/** KXK mop-up, CPW "Mop-up Evaluation": per step of the bare king's center distance, and per step the kings close */
export const MOPUP_EDGE = 80;
export const MOPUP_CLOSE = 32;

// Piece-square tables from White's side, indexed by square: a1 = 0, so rank 1 is the
// first row. Hand-seeded, then Texel-tuned on the zurichess quiet set (results/tuning.md).
export const PAWN_MG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     -146,   -26,   -61, -102, -43,  125,  167,  -57,
     -131,   -102,   -46,   -63,   -25,   -18,   70,   -53,
    -126,  -47,  -4,  65,  89,  49,  19,  -76,
    -53,  59,  75,  144,  159,  119,  97,  -35,
    12,  44,  71,  108,  205,  333,  159,  20,
   454, 537, 361, 450, 338, 321, 301, 95,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,    0,    0,    0,    0,    0,    0,    0,
     106,  62,  123,  91,  128,  58,  21, 10,
   58,  68, 40,  77,  73, 54, 3, 9,
     109,  80,  30, -15, -1, 1,  27,  44,
    132,   51,  17,  -47, -10,  2,  48,    106,
   193,  164,  106,  46,  66,  52,  177,  214,
   404,  420,  367,  329,  505,  463,  557,  610,
     0,    0,    0,    0,    0,    0,    0,    0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  -321,  -23, -158, -106,  11,  19,  -15,  -96,
  -113, -122,   33,   72,   71,  151,   29,  -20,
   -17,   55,  129,  137,  203,  162,  170,  2,
   36,  98,  149,  139,  210,  167,  201,   54,
    108,  160,  222,  320,  250,  377,  175,  235,
  -159,  296,  254,  374,  496,  541,  470,  296,
  -75,  -66,  336,  307,   89,  371,   21,   36,
  -878, -460, -126,  -54,  499, -448, -264, -613,
];
export const KNIGHT_EG: StaticArray<i32> = [
  52, -75,  112,   176,  132,  93, -55, -199,
  81,  123,    206,   226,   234,  125,  123, -42,
   123,   227,   241,  334,   295,   221,  160,  99,
   188,   247,  381,  401,  337,  355,   291,  128,
   144,   269,  373,  379,  378,   309,   284,  132,
   150,  170,   303,   308,   227,   186,  87, -61,
   29,   233,  125,   246,   223, 71,  139, -90,
  -14, 81,    198, 110, 14,  90, -18, -255,
];
export const BISHOP_MG: StaticArray<i32> = [
   -100,   32,    43,  15,   42,   31, -101,  -100,
    148,  177,  188,   108,  132,  173,  224,   90,
    128,  132,  158,  151,  142,  204,  185,  117,
    142,  208,  146,  218,  230,  155,   119,   133,
    117,   131,  209,  300,  297,  280,   130,   83,
   -16,  207,  205,  289,  169,  357,  196,   107,
    22,  198,   52,  -19,  280,  163,  232, -116,
    -54,   18, -473, -148, -239, -45,   48,  115,
];
export const BISHOP_EG: StaticArray<i32> = [
   144,   229,  103,   251,    210,  165,    239,  194,
   144,  150,    205,   257,   270,    225,  150,  109,
   196,   259,   314,   305,   354,   266,    216,  205,
    205,   244,   348,  388,   313,   320,   262,  178,
    236,   296,   320,   348,   348,   306,   297,   268,
    276,   266,   270,   259,   294,   275,   276,   283,
   213,   226,   286,   234,  212,   268,   178,  140,
   152,  163,   335,   241,   329,  177,  136, 62,
];
export const ROOK_MG: StaticArray<i32> = [
   1,   49,   75,  114,  123,   70,  -34,  1,
  -134,   55,  -15,   46,   56,   96,   5, -243,
  -121,  5,  16,  4,   45,   96,   93,  -47,
  -44,  33,   96,   75,   81,   68,  137,  -9,
   56,   129,  161,  240,  210,  250,   132,  53,
    138,  213,  257,  322,  236,  467,  447,  225,
   279,  258,  463,  437,  491,  552,   141,  383,
   354,  379,  264,  456,  420,   254,   228,  264,
];
export const ROOK_EG: StaticArray<i32> = [
    384,   430,   459,   440,   407,   385,   444,  282,
    430,   382,   443,   435,    389,   386,    372,   442,
    439,   431,   427,   445,   398,   345,    366,   370,
    472,   473,   477,   483,   435,   395,  365,   413,
    468,   447,  508,   446,   441,   400,   416,   433,
    472,   487,   464,   429,   414,   348,  348,   375,
    471,   487,   438,   450,  371,   367,   481,   398,
    454,   439,  502,   432,   450,   465,   475,   444,
];
export const QUEEN_MG: StaticArray<i32> = [
   234,  177,  213,   315,  171, 91, 26, 26,
  58,  233,   304,   268,   297,   359,    267,   277,
  155,   291,  232,   259,  240,    265,   314,   332,
   233, 138,  222,  213,  217,  234,   278,   254,
  170, 139,  173,  175,   266,   317,  270,  239,
   194, 201,  234,   339,   290,  584,  443,  518,
   144, 47,  201,   373, 165,  510,   304,  438,
   144, 115,  240, 172,  561,  635,  619,   262,
];
export const QUEEN_EG: StaticArray<i32> = [
  260, 266, 343, 113,  425, 322, 365, 219,
  384, 316, 276, 336,  343, 214, 228, 173,
   426, 258,   541,  438,   494,   535,   540,  383,
  354,  643,   554,  734,  636,  637,  628,   564,
    516,   611,   647,  751,  752,  731,  745,  697,
   421,   569,   541,  740,  806,  617,   534,  447,
  410,   587,  712,  642,  867,  476,   534,  429,
  385,  690,  703,  716,   528,  381, 339,  704,
];
export const KING_MG: StaticArray<i32> = [
   32,  172,   74, -298,   101, -98,  265,  214,
    38,  47,  -64, -305, -195,  -54,  189,  183,
    -24,  -106, -158, -343, -298, -207,  -41, -117,
  -291,   -85, -252, -482, -496, -314, -291, -395,
    -38,  -206,  -117, -340, -272, -205,  -143, -302,
    213,  31,  219,   -138,  29,  117,  232,  -217,
   495,   132,   -53,  191,   -122,  -136, -86, -557,
   -512,  215,  146,  131, -453, -406,  -31,  -218,
];
export const KING_EG: StaticArray<i32> = [
  -364, -195, -125,  -59, -225,  -72, -213, -329,
  -136,  -46,   30,   88,   79,   35,  -64, -145,
  -90,  3,   63,  134,  145,  109,   47,  -30,
   -49,  5,  139,  182,  203,  175,   102,   1,
   -80,  146,  111,  166,  152,  188,  166,   65,
    1,   95,   48,   97,   83,  242,  185,   97,
  -230,   75,   116,   27,   138,  288,  132,  177,
  -433, -190, -108, -111,    34,   159,   -10,  -232,
];

// ---------------------------------------------------------------- pawns
// Stash 37 kp_eval.c, converted by its middlegame pawn 103; each pair is (middlegame, endgame).

/** a backward pawn on a file no enemy pawn closes: its stop square attacked by an enemy pawn and out of reach of its own */
export const PAWN_BACKWARD_MG = -75;
export const PAWN_BACKWARD_EG = -54;
/** a file holding two or more of one side's pawns, once per file */
export const PAWN_DOUBLED_MG = 10;
export const PAWN_DOUBLED_EG = -108;
/** a file whose pawns have no friendly pawn on a neighboring file, once per file */
export const PAWN_ISOLATED_MG = -47;
export const PAWN_ISOLATED_EG = -22;
/** a passed pawn by relative rank: no enemy pawn ahead on its file, and every square of its path an enemy pawn attacks is attacked as often by its own */
export const PAWN_PASSED_MG: StaticArray<i32> = [0, 13, 4, -62, 42, 181, 228, 0];
export const PAWN_PASSED_EG: StaticArray<i32> = [0, 15, 34, 142, 362, 718, 1125, 0];
/** a pawn with a friendly pawn beside it on the next file, by relative rank */
export const PAWN_PHALANX_MG: StaticArray<i32> = [0, 9, 71, 93, 150, 655, 621, 0];
export const PAWN_PHALANX_EG: StaticArray<i32> = [0, 3, 8, 57, 147, 786, 1646, 0];
/** a pawn defending a friendly pawn, by the defender's relative rank */
export const PAWN_DEFENDER_MG: StaticArray<i32> = [0, 68, 79, 52, 118, 537, 0, 0];
export const PAWN_DEFENDER_EG: StaticArray<i32> = [0, 66, 56, 100, 230, 275, 0, 0];
/** a passed pawn at most 4 steps from queening, by (steps - 1) * 6 + min(steps + 2, own king's distance) - 1 */
export const PASSED_OUR_KING_MG: StaticArray<i32> = [-241, -157, -163, 0, 0, 0, 42, -112, -126, -89, 0, 0, 172, -113, -86, -58, 145, 0, 104, -40, -102, -45, -18, 102];
export const PASSED_OUR_KING_EG: StaticArray<i32> = [81, -222, -572, 0, 0, 0, 203, -37, -180, -278, 0, 0, 133, 84, -70, -112, -209, 0, 113, 84, 23, -29, -55, -60];
/** the same by the enemy king's distance */
export const PASSED_THEIR_KING_MG: StaticArray<i32> = [104, 8, -124, 0, 0, 0, 63, 221, -94, -60, 0, 0, 39, 191, 53, -55, -153, 0, -306, 83, 145, 101, -19, -1];
export const PASSED_THEIR_KING_EG: StaticArray<i32> = [-929, -88, 457, 0, 0, 0, -478, -293, 267, 469, 0, 0, -320, -203, -73, 184, 312, 0, -107, -92, -84, -40, 128, 135];

// ---------------------------------------------------------------- endgame scaling
// Stash 37 eval_scale_endgame: the endgame half times a factor of 256, set by hand
// there as here, so the tuner leaves it alone.

/** opposite bishops with other pieces: 71 + 9 per piece and pawn of the strong side */
export const SCALE_OCB_PIECES = 71;
export const SCALE_OCB_PIECES_PER = 9;
/** opposite bishops alone: 33 + 21 per passed pawn of the strong side */
export const SCALE_OCB = 33;
export const SCALE_OCB_PASSED = 21;
/** rook against rook, the strong side's pawns on one wing and not two ahead, the weak king beside its pawns */
export const SCALE_ROOK_WING = 130;
/** any other ending: 177 + 13 per pawn of the strong side, at most 256 */
export const SCALE_BASE = 177;
export const SCALE_PER_PAWN = 13;

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

/** ProbCut, Stash f91e750: depth >= 6, beta + 152 at its pawn 103, a capture's reduced search at depth - 4 */
export const PC_DEPTH = 6;
export const PC_MARGIN = 590;
export const PC_REDUCTION = 4;

/** singular extensions, Stash f91e750: depth >= 7, TT depth >= depth - 3; singular beta = TT score - 10 d / 16 at its pawn 103, searched at d / 2 + 1 */
export const SE_DEPTH = 7;
export const SE_TT_DEPTH = 3;
export const SE_MARGIN = 39;
export const SE_MARGIN_DIV = 16;
/** a double extension at a non-PV node whose singular search fails low by more than 14 at its pawn 103, while the line has at most 10 */
export const SE_DOUBLE_MARGIN = 54;
export const SE_DOUBLE_MAX = 10;

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
/** the soft limit's scale by how many iterations in a row the best move held, 0 to 4 (Stash f91e750 BestmoveStabilityScale) */
export const TM_STABILITY: StaticArray<f64> = [2.5, 1.2, 0.9, 0.8, 0.75];
/** score drop, Stash f91e750 timeman_scale_score_diff: the soft limit times TM_SCORE_BASE ^ (fall / range), the fall clamped to +-range; 100 at its pawn 103 */
export const TM_SCORE_BASE = 2.0;
export const TM_SCORE_RANGE = 388;
/** the soft limit with one legal move, Weiss d7d1334's cap */
export const TM_ONE_MOVE = 500.0;
