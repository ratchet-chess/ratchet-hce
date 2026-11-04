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

// ---------------------------------------------------------------- pieces and attack maps (pieces.ts)

// Seeds: each term's source engine, converted by its middlegame pawn (Stash 103, Ethereal 82, Weiss 104, Laser 100).

/** mobility by count, Stash 37 */
export const MOB_KNIGHT_MG: StaticArray<i32> = [
  -214, -171, -132, -97, -70, -47, -23, 4,
  23,
];
export const MOB_KNIGHT_EG: StaticArray<i32> = [
  70, -117, 136, 225, 299, 377, 416, 435,
  419,
];
export const MOB_BISHOP_MG: StaticArray<i32> = [
  -221, -171, -105, -97, -62, -50, -35, -31,
  -27, -19, -4, 35, 43, 101,
];
export const MOB_BISHOP_EG: StaticArray<i32> = [
  -186, -159, -70, 54, 120, 179, 221, 245,
  256, 272, 245, 233, 229, 198,
];
export const MOB_ROOK_MG: StaticArray<i32> = [
  -365, -144, -97, -117, -105, -120, -124, -105,
  -93, -58, -50, -31, -4, 35, 97,
];
export const MOB_ROOK_EG: StaticArray<i32> = [
  -132, 163, 307, 369, 412, 458, 493, 509,
  544, 579, 602, 625, 637, 645, 621,
];
export const MOB_QUEEN_MG: StaticArray<i32> = [
  -194, 89, 12, -12, 16, 4, -4, 0,
  4, 4, 8, 19, 23, 31, 31, 35,
  43, 50, 78, 74, 159, 163, 171, 109,
  194, -4, 54, 167,
];
export const MOB_QUEEN_EG: StaticArray<i32> = [
  -536, 746, 594, 443, 283, 462, 586, 683,
  722, 800, 835, 850, 889, 905, 924, 948,
  948, 936, 901, 905, 800, 781, 742, 660,
  614, 649, 691, 598,
];
/** outposts by [outside file][pawn-defended], Ethereal 12.75 */
export const OUTPOST_KNIGHT_MG: StaticArray<i32> = [
  59, 195, 34, 102,
];
export const OUTPOST_KNIGHT_EG: StaticArray<i32> = [
  -156, 0, -117, -15,
];
export const OUTPOST_BISHOP_MG: StaticArray<i32> = [
  78, 244, 44, -20,
];
export const OUTPOST_BISHOP_EG: StaticArray<i32> = [
  -78, -15, -44, -20,
];
/** a minor directly behind any pawn, Ethereal 12.75 */
export const BEHIND_KNIGHT_MG = 15;
export const BEHIND_KNIGHT_EG = 137;
export const BEHIND_BISHOP_MG = 20;
export const BEHIND_BISHOP_EG = 117;
/** a knight four to seven squares from both kings, Ethereal 12.75 */
export const FAR_KNIGHT_MG: StaticArray<i32> = [
  -44, -59, -132, -229,
];
export const FAR_KNIGHT_EG: StaticArray<i32> = [
  -29, -98, -98, -93,
];
/** the bishop pair, Ethereal 12.75 */
export const BISHOP_PAIR_MG = 107;
export const BISHOP_PAIR_EG = 429;
/** a bishop that sees both center squares from a long diagonal, Ethereal 12.75 */
export const BISHOP_LONG_MG = 127;
export const BISHOP_LONG_EG = 98;
/** per own pawn on the bishop's color, Laser 1.7 */
export const BISHOP_PAWNS_MG = -20;
export const BISHOP_PAWNS_EG = -20;
/** per rammed own pawn on the bishop's color, Laser 1.7 */
export const BISHOP_RAMMED_MG = -16;
export const BISHOP_RAMMED_EG = -32;
/** a rook on a semi-open and an open file, Ethereal 12.75 */
export const ROOK_FILE_MG: StaticArray<i32> = [
  49, 166,
];
export const ROOK_FILE_EG: StaticArray<i32> = [
  44, 39,
];
/** a rook on the enemy queen's file, Stash 37 */
export const ROOK_QUEEN_FILE_MG = 58;
export const ROOK_QUEEN_FILE_EG = 16;
/** a rook hemmed in by its own king, with and without castling rights, Stash 37 */
export const ROOK_TRAPPED_MG = -31;
export const ROOK_TRAPPED_EG = -74;
export const ROOK_BURIED_MG = -268;
export const ROOK_BURIED_EG = -136;

// King safety, Ethereal 12.75: the safety sum's terms, in the units its square reads (pieces.ts KS_DIV_MG).
/** the pawn shield by [king's file][file][own pawn's distance, 7 for none] */
export const SHELTER_MG: StaticArray<i32> = [
  -24, 83, 127, 117, 20, -59, -78, -288,
  54, 15, -24, 24, -54, -259, 395, -93,
  185, 24, -166, -83, -44, -127, 54, -78,
  88, 122, 0, 49, 107, -234, -683, -24,
  -54, 5, -215, -137, -117, -171, 195, -63,
  249, 73, -117, -49, 49, 166, 234, -102,
  195, 10, -151, -117, -151, -98, 20, -78,
  49, 20, 49, 10, -49, -49, -898, -83,
  0, -73, 44, -239, -176, -39, -820, -288,
  0, 83, 44, -54, -5, 127, -907, -156,
  0, 93, 5, 44, 137, -449, -429, -39,
  0, 0, -29, -171, -224, -478, -34, -171,
  0, 59, 83, 83, -24, -176, -493, -88,
  0, -39, -107, -78, 122, -132, 254, -68,
  0, 156, 93, -44, -141, -34, -244, -132,
  0, 78, 83, -88, -151, -54, -1098, -146,
];
export const SHELTER_EG: StaticArray<i32> = [
  -24, -151, -15, 39, 5, 20, -161, 117,
  -29, -73, -10, -20, 34, 341, 400, 5,
  -15, -29, 24, -73, -24, 59, 356, -5,
  54, -88, -68, -102, -166, 44, 239, -24,
  73, -15, 29, 49, -10, -24, -117, 15,
  -68, -68, 24, -98, -166, -98, -185, 5,
  -83, -117, -5, -39, 10, 141, 239, 15,
  -98, -117, 10, 78, 117, 215, 395, 83,
  0, -190, -141, 68, 29, 244, -15, 93,
  0, -88, -54, -24, -117, 356, 20, 54,
  0, -44, -54, -127, -24, 273, -361, 5,
  0, 15, -29, 49, 63, 161, -220, -24,
  0, -15, -73, -73, -68, 24, -254, -5,
  0, -24, 5, -29, -107, 49, 190, -10,
  0, -107, -73, -29, 63, 112, -190, 88,
  0, -278, -156, -34, 117, 117, -239, 24,
];
/** the pawn storm by [blocked][file from the edge][enemy pawn's distance, 7 for none] */
export const STORM_MG: StaticArray<i32> = [
  -29, 702, -63, -34, -59, -39, -93, -137,
  -83, 312, -44, 39, 15, 29, -24, -78,
  10, 73, -83, -63, -5, 34, 39, 34,
  -5, 73, -151, -107, -73, 63, 15, -98,
  0, -88, -88, 132, 49, 73, -29, 44,
  0, -73, -15, 259, 73, 98, -59, -166,
  0, -166, -73, 44, 29, -10, -24, -15,
  0, -5, -132, -102, -49, 34, 322, 54,
];
export const STORM_EG: StaticArray<i32> = [
  176, -20, 127, 5, -15, -34, 39, -10,
  293, 83, 102, 59, 44, -10, 10, 39,
  234, 146, 98, 49, 29, 15, -34, 39,
  122, 107, 49, 5, 20, -49, -24, 39,
  0, -78, -10, -117, -29, -117, 44, 146,
  0, -205, -73, -83, -24, -137, -83, 24,
  0, -302, -63, -29, -10, -83, -102, 15,
  0, -127, -93, 20, -29, -171, -141, 122,
];
/** shelter's and storm's share of the safety sum */
export const SAFETY_SHELTER_MG: StaticArray<i32> = [
  -10, -5, 0, 20, 29, -5, 10, 0,
  0, -10, -10, 20, 15, -15, -10, -5,
];
export const SAFETY_SHELTER_EG: StaticArray<i32> = [
  34, 63, 39, 34, 10, 0, 0, -63,
  0, 63, 44, 24, 5, 0, 0, -44,
];
export const SAFETY_STORM_MG: StaticArray<i32> = [
  -20, -39, 0, 5, 15, -10, -10, 10,
  0, 5, -5, 0, 0, -5, 5, 5,
];
export const SAFETY_STORM_EG: StaticArray<i32> = [
  -5, 15, 24, -5, 29, 98, 88, -59,
  0, 0, 20, 0, 24, 5, 0, 0,
];
/** per attacker reaching the king's area */
export const SAFETY_KNIGHT_MG = 234;
export const SAFETY_KNIGHT_EG = 200;
export const SAFETY_BISHOP_MG = 117;
export const SAFETY_BISHOP_EG = 171;
export const SAFETY_ROOK_MG = 176;
export const SAFETY_ROOK_EG = 39;
export const SAFETY_QUEEN_MG = 146;
export const SAFETY_QUEEN_EG = 29;
/** per attack on the area; Ethereal's value times 9/12, its rescale of the count to a 9-square area, left out */
export const SAFETY_ATTACK_MG = 165;
export const SAFETY_ATTACK_EG = 124;
/** per weak square of the area */
export const SAFETY_WEAK_MG = 205;
export const SAFETY_WEAK_EG = 200;
/** the attacker has no queen */
export const SAFETY_NO_QUEEN_MG = -1156;
export const SAFETY_NO_QUEEN_EG = -1263;
/** per safe check */
export const SAFETY_CHECK_QUEEN_MG = 454;
export const SAFETY_CHECK_QUEEN_EG = 405;
export const SAFETY_CHECK_ROOK_MG = 439;
export const SAFETY_CHECK_ROOK_EG = 478;
export const SAFETY_CHECK_BISHOP_MG = 288;
export const SAFETY_CHECK_BISHOP_EG = 288;
export const SAFETY_CHECK_KNIGHT_MG = 546;
export const SAFETY_CHECK_KNIGHT_EG = 571;
/** per unsafe check, Stash 37; its S(18, 85) restated for Ethereal's divisors, then converted */
export const SAFETY_UNSAFE_MG = 147;
export const SAFETY_UNSAFE_EG = 518;
/** the sum's offset */
export const SAFETY_OFFSET_MG = -361;
export const SAFETY_OFFSET_EG = -127;

// Passed pawns outside the king-pawn table, Ethereal 12.75 and Weiss c735b8f.
/** by [can advance][safe to advance][rank]; each cell is Ethereal's less its blocked and unsafe cell, since pawns.ts has the rank's base value */
export const PASSED_ADVANCE_MG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 54, 15, 29, -49, 83, 151, 0,
  0, 54, -20, 10, 0, 44, 468, 0,
  0, 54, 15, 34, 0, -10, -185, 0,
];
export const PASSED_ADVANCE_EG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 83, 83, 78, 180, 283, 234, 0,
  0, 161, 54, 127, 224, 390, 380, 0,
  0, 132, 49, 156, 341, 829, 1205, 0,
];
/** no enemy piece or attack on the pawn or its path, Ethereal 12.75 */
export const PASSED_SAFE_PATH_MG = -239;
export const PASSED_SAFE_PATH_EG = 278;
/** an own rook behind the pawn on its file, Weiss c735b8f */
export const PASSED_ROOK_BEHIND_MG = 81;
export const PASSED_ROOK_BEHIND_EG = 177;

// Threats, Ethereal 12.75: against the side named, except the push.
export const THREAT_WEAK_PAWN_MG = -54;
export const THREAT_WEAK_PAWN_EG = -185;
export const THREAT_MINOR_BY_PAWN_MG = -268;
export const THREAT_MINOR_BY_PAWN_EG = -405;
export const THREAT_MINOR_BY_MINOR_MG = -122;
export const THREAT_MINOR_BY_MINOR_EG = -220;
export const THREAT_MINOR_BY_MAJOR_MG = -146;
export const THREAT_MINOR_BY_MAJOR_EG = -268;
export const THREAT_ROOK_BY_LESSER_MG = -234;
export const THREAT_ROOK_BY_LESSER_EG = -137;
export const THREAT_MINOR_BY_KING_MG = -210;
export const THREAT_MINOR_BY_KING_EG = -102;
export const THREAT_ROOK_BY_KING_MG = -161;
export const THREAT_ROOK_BY_KING_EG = -88;
export const THREAT_QUEEN_MG = -244;
export const THREAT_QUEEN_EG = -34;
export const THREAT_OVERLOADED_MG = -34;
export const THREAT_OVERLOADED_EG = -78;
export const THREAT_PUSH_MG = 73;
export const THREAT_PUSH_EG = 156;

// Complexity, Xiphos 0.6 and Ethereal 12.75: the endgame half's adjustment, seeded from Ethereal.
export const COMPLEXITY_PAWNS = 39;
export const COMPLEXITY_FLANKS = 400;
export const COMPLEXITY_ENDGAME = 371;
export const COMPLEXITY_OFFSET = -766;
