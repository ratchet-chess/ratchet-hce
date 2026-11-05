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
export const MAT_MG: StaticArray<i32> = [0, 320, 1863, 1672, 2284, 5036, 0];
export const MAT_EG: StaticArray<i32> = [0, 431, 1912, 1946, 3564, 6448, 0];

/** the side to move's bonus, added as a (middlegame, endgame) pair before the blend (Stash, Clockwork) */
export const TEMPO_MG = 152;
export const TEMPO_EG = 277;

/** KXK mop-up, CPW "Mop-up Evaluation": per step of the bare king's center distance, and per step the kings close */
export const MOPUP_EDGE = 80;
export const MOPUP_CLOSE = 32;

// Piece-square tables from White's side, indexed by square: a1 = 0, so rank 1 is the
// first row. Hand-seeded, then Texel-tuned on the zurichess quiet set (results/tuning.md).
export const PAWN_MG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     20,   113,   30, 56, 70,  231,  251,  29,
     26,   30,   71,   76,   118,   98,   179,   12,
    2,  46,  116,  158,  199,  107,  66,  -32,
    82,  147,  158,  165,  141,  123,  151,  34,
    186,  132,  157,  246,  291,  351,  289,  58,
   712, 514, 477, 655, 168, 163, 32, 121,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,    0,    0,    0,    0,    0,    0,    0,
     385,  310,  377,  307,  392,  312,  278, 300,
   338,  321, 289,  283,  307, 339, 274, 310,
     408,  354,  249, 200, 236, 293,  343,  352,
    452,   315,  246,  156, 228,  307,  369,    416,
   521,  443,  354,  218,  246,  320,  435,  507,
   207,  313,  321,  176,  487,  300,  410,  484,
     0,    0,    0,    0,    0,    0,    0,    0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  91,  185, 141, 94,  259,  155,  145,  139,
  131, 134,   186,   218,   227,  264,   253,  158,
   252,   187,  257,  242,  312,  295,  290,  188,
   289,  275,  311,  272,  333,  349,  333,   238,
    335,  326,  301,  330,  315,  367,  331,  303,
  -126,  211,  178,  220,  260,  430,  372,  279,
  110,  -95,  295,  221,   78,  256,   197,   19,
  -582, -421, -99,  15,  449, -157, -273, -502,
];
export const KNIGHT_EG: StaticArray<i32> = [
  115, 116,  157,   367,  261,  229, 109, -6,
  151,  199,    282,   328,   330,  175,  206, 48,
   203,   332,   314,  448,   412,   302,  263,  227,
   384,   396,  518,  571,  530,  480,   530,  379,
   376,   455,  580,  650,  588,   547,   462,  375,
   422,  468,   602,   619,   576,   432,  304, 152,
   146,   458,  255,   437,   426, 278,  322, 46,
  80, 297,    382, 268, 198,  242, 208, -162,
];
export const BISHOP_MG: StaticArray<i32> = [
   -30,   135,    151,  163,   209,   85, -10,  -39,
    202,  176,  220,   153,  153,  279,  232,   130,
    164,  173,  132,  156,  180,  206,  263,  158,
    206,  211,  172,  212,  230,  169,   169,   222,
    165,   192,  146,  206,  202,  252,   134,   126,
   158,  164,  22,  170,  10,  210,  132,   204,
    28,  -84,   -39,  -243,  154,  -37,  -86, -243,
    -44,   15, -568, -308, -343, -24,   79,  100,
];
export const BISHOP_EG: StaticArray<i32> = [
   385,   548,  546,   596,    579,  576,    560,  438,
   457,  400,    518,   582,   586,    553,  360,  418,
   508,   581,   575,   614,   703,   462,    562,  545,
    440,   563,   685,  740,   651,   696,   613,  460,
    549,   557,   690,   759,   735,   679,   617,   586,
    507,   656,   536,   656,   724,   579,   668,   605,
   614,   549,   672,   636,  591,   739,   500,  540,
   434,  600,   680,   638,   811,  594,  557, 294,
];
export const ROOK_MG: StaticArray<i32> = [
   9,   43,   7,  57,  82,   79,  35,  130,
  -101,   40,  -22,   82,   88,   48,   11, -133,
  -98,  -16,  2,  10,   38,   113,   99,  -5,
  -50,  -7,   34,   -1,   73,   46,  192,  22,
   -47,   27,  28,  60,  119,  113,   -6,  30,
    -65,  5,  -12,  115,  -78,  181,  219,  -38,
   16,  20,  200,  67,  142,  187,   -115,  97,
   43,  78,  -103,  124,  129,   -102,   63,  0,
];
export const ROOK_EG: StaticArray<i32> = [
    808,   825,   876,   820,   790,   818,   806,  649,
    872,   803,   869,   837,    818,   841,    782,   817,
    907,   925,   895,   881,   848,   780,    846,   785,
    950,   1005,   977,   955,   918,   913,  882,   884,
    1016,   979,  1070,   984,   995,   1007,   1051,   978,
    1068,   1065,   1041,   962,   1027,   965,  974,   974,
    1081,   1074,   993,   1055,  999,   1031,   1163,   1040,
    1078,   1064,  1146,   1042,   1069,   1155,   1071,   1058,
];
export const QUEEN_MG: StaticArray<i32> = [
   311,  232,  237,   333,  234, 215, 151, 168,
  145,  248,   315,   286,   322,   428,    318,   311,
  182,   305,  237,   276,  258,    258,   312,   366,
   297, 127,  235,  180,  241,  241,   298,   217,
  129, 150,  118,  76,   185,   278,  256,  228,
   224, 114,  181,   186,   153,  372,  308,  403,
   96, -76,  100,   220, -257,  240,   187,  358,
   233, 108,  52, -131,  435,  316,  713,   203,
];
export const QUEEN_EG: StaticArray<i32> = [
  849, 914, 958, 802,  1088, 955, 1010, 778,
  1060, 945, 949, 960,  996, 774, 841, 932,
   1080, 918,   1134,  1022,   1115,   1149,   1260,  1026,
  960,  1328,   1138,  1284,  1160,  1106,  1221,   1278,
    1279,   1228,   1215,  1232,  1189,  1100,  1244,  1276,
   1075,   1268,   1031,  1351,  1193,  1102,   926,  1058,
  1096,   1158,  1228,  1270,  1676,  883,   1064,  1115,
  939,  1289,  1404,  1490,   1021,  1030, 733,  1477,
];
export const KING_MG: StaticArray<i32> = [
   -139,  -149,   -132, -328,   -1, -82,  140,  188,
    -59,  -135,  -169, -291, -89,  -64,  94,  225,
    9,  16, -28, -253, -61, 34,  142, 118,
  -184,   111, 14, -373, -176, -17, 123, -21,
    167,  -4,  265, -321, 1, 123,  331, 155,
    449,  49,  406,   -308,  282,  420,  676,  62,
   324,   63,   -112,  -33,   -241,  -148, 126, -431,
   -792,  -145,  25,  -250, -435, -311,  141,  -348,
];
export const KING_EG: StaticArray<i32> = [
  -677, -455, 256,  -168, -120,  17, -147, -274,
  -378,  -333,   371,   5,   41,   85,  -54, -71,
  -312,  -314,   407,  62,  115,  80,   -11,  -22,
   -245,  -294,  479,  135,  169,  179,   -50,   -60,
   -236,  -74,  459,  150,  166,  216,  45,   -1,
    -151,   -2,   440,   148,   54,  283,  131,   177,
  -250,   -20,   663,   35,   222,  501,  184,  369,
  -615, -321, 286, -124,    -23,   345,   31,  -243,
];

// ---------------------------------------------------------------- pawns
// Stash 37 kp_eval.c, converted by its middlegame pawn 103; each pair is (middlegame, endgame).

/** a backward pawn that is not isolated, on a file an enemy pawn closes: its stop square attacked by an enemy pawn and out of reach of its own */
export const PAWN_BACKWARD_MG = -8;
export const PAWN_BACKWARD_EG = -56;
/** the same on a file no enemy pawn closes */
export const PAWN_BACKWARD_OPEN_MG = -82;
export const PAWN_BACKWARD_OPEN_EG = -88;
/** a pawn with a friendly pawn directly behind it */
export const PAWN_DOUBLED_MG = -20;
export const PAWN_DOUBLED_EG = -163;
/** a pawn with no friendly pawn on a neighboring file */
export const PAWN_ISOLATED_MG = -40;
export const PAWN_ISOLATED_EG = -70;
/** a passed pawn by relative rank: no enemy pawn ahead on its file or the next */
export const PAWN_PASSED_MG: StaticArray<i32> = [0, -53, -56, -187, 111, 741, 1054, 0];
export const PAWN_PASSED_EG: StaticArray<i32> = [0, -13, 175, 219, 295, 184, 654, 0];
/** a candidate by relative rank: not passed, no enemy pawn ahead on its file, and every square of its path an enemy pawn attacks is attacked as often by its own; seeded from Ethereal 12.75 PawnCandidatePasser at its pawn 82 */
export const PAWN_CANDIDATE_MG: StaticArray<i32> = [0, -63, -53, -55, 11, 172, 0, 0];
export const PAWN_CANDIDATE_EG: StaticArray<i32> = [0, 37, 40, 167, 327, 380, 0, 0];
/** a pawn with a friendly pawn beside it on the next file, by relative rank */
export const PAWN_PHALANX_MG: StaticArray<i32> = [0, 40, 74, 88, 162, 252, -356, 0];
export const PAWN_PHALANX_EG: StaticArray<i32> = [0, -22, 4, 73, 254, 1502, 2521, 0];
/** a pawn defending a friendly pawn, by the defender's relative rank */
export const PAWN_DEFENDER_MG: StaticArray<i32> = [0, 70, 79, 71, 64, 848, 0, 0];
export const PAWN_DEFENDER_EG: StaticArray<i32> = [0, 74, 67, 141, 454, 377, 0, 0];
/** a passed pawn, per step of its distance from its own king, by relative rank; seeded by lines through the earlier table, ranks 1 and 2 from Ethereal 12.75 at its pawn 82 */
export const PASSED_OUR_KING_MG: StaticArray<i32> = [0, -6, -12, 24, 9, -68, 0, 0];
export const PASSED_OUR_KING_EG: StaticArray<i32> = [0, -5, -20, -84, -124, -144, -237, 0];
/** the same from the enemy king */
export const PASSED_THEIR_KING_MG: StaticArray<i32> = [0, -5, -4, 16, -26, -39, -187, 0];
export const PASSED_THEIR_KING_EG: StaticArray<i32> = [0, 3, 11, 65, 162, 244, 373, 0];

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
/** any other ending: 177 + 13 per pawn of the strong side, at most 256 */
export const SCALE_BASE = 177;
export const SCALE_PER_PAWN = 13;

// ---------------------------------------------------------------- search

/*
 * The margins in the eval's unit start from the seeds their comments cite, then all
 * move by one factor, 1.30, chosen by a race of games at the eval's wider scale. So
 * a value here is its cited seed times that factor. SEE's margins read SEE_VALUE,
 * which did not move, so they keep their seeds.
 */

/** SEE values by piece type (none, P, N, B, R, Q, K); the king is never captured */
export const SEE_VALUE: StaticArray<i32> = [0, 400, 1200, 1200, 2000, 3600, 0];

/** aspiration windows, Ethereal 0e47e9b aspirationWindow: from depth 4, delta 10 at its pawn 82, widened by half; search.ts think names where the form differs */
export const ASP_DEPTH = 4;
export const ASP_DELTA = 64;

/** reverse futility, Stash f91e750: depth <= 7, 86 per ply less 79 when improving, at its pawn 103 */
export const RFP_DEPTH = 7;
export const RFP_MARGIN = 434;
export const RFP_IMPROVING = 399;

/** razoring, Stash f91e750: depth <= 3, static eval + 120 per ply <= alpha, at its pawn 103 */
export const RAZOR_DEPTH = 3;
export const RAZOR_MARGIN = 606;

/** null move, Ethereal v12.75: R = 4 + depth / 6 + min(3, (eval - beta) / 200), at its pawn 82 */
export const NMP_DEPTH = 2;
export const NMP_BASE = 4;
export const NMP_DEPTH_DIV = 6;
export const NMP_EVAL_DIV = 1268;
export const NMP_EVAL_MAX = 3;

/** ProbCut, Stash f91e750: depth >= 6, beta + 152 at its pawn 103, a capture's reduced search at depth - 4 */
export const PC_DEPTH = 6;
export const PC_MARGIN = 767;
export const PC_REDUCTION = 4;

/** singular extensions, Stash f91e750: depth >= 7, TT depth >= depth - 3; singular beta = TT score - 10 d / 16 at its pawn 103, searched at d / 2 + 1 */
export const SE_DEPTH = 7;
export const SE_TT_DEPTH = 3;
export const SE_MARGIN = 51;
export const SE_MARGIN_DIV = 16;
/** a double extension at a non-PV node whose singular search fails low by more than 14 at its pawn 103, while the line has at most 10 */
export const SE_DOUBLE_MARGIN = 70;
export const SE_DOUBLE_MAX = 10;

/** internal iterative reduction, Berserk 03cebd6: PV or cut node, depth >= 4, no TT move */
export const IIR_DEPTH = 4;

/** late move pruning, Ethereal v12.75 LateMovePruningCounts: by depth, not improving then improving; search.ts counts moves played against it, where Ethereal counts quiets seen */
export const LMP_DEPTH = 8;
export const LMP_COUNT: StaticArray<i32> = [0, 3, 4, 6, 10, 14, 19, 25, 31, 0, 5, 7, 11, 17, 26, 36, 48, 63];

/** futility on the reduced depth, Ethereal 0e47e9b: eval + 77 + 52 per ply <= alpha at its pawn 82; history limits by improving, v12.75 */
export const FUT_DEPTH = 8;
export const FUT_BASE = 489;
export const FUT_PER_DEPTH = 330;
export const FUT_HISTORY: StaticArray<i32> = [12000, 6000];

/** history pruning, Ethereal v12.75 as the dig note reads it: 1- and 2-ply continuation history below a limit, by improving; one pair where Ethereal keeps a limit and a depth per table */
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

/** qsearch delta pruning, Weiss 2.0's per-capture shape: a capture is skipped if stand pat + its victim + this cannot reach alpha; CPW "Delta Pruning"'s 200 centipawns */
export const QS_DELTA = 1040;

/** history bonus and malus, Weiss c735b8f: min(2418, 251 d - 267) and min(693, 532 d - 163) */
export const HIST_BONUS_MUL = 251;
export const HIST_BONUS_SUB = 267;
export const HIST_BONUS_MAX = 2418;
export const HIST_MALUS_MUL = 532;
export const HIST_MALUS_SUB = 163;
export const HIST_MALUS_MAX = 693;

/** correction history, Stash 302136d, dcc25ed, ba73642 and ea9fd72: each table's entry within 32 at its pawn 103; an update weighs 1 + depth, at most 16, of 256 */
export const CORR_MAX = 161;
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
  -311, -259, -212, -195, -132, -104, -75, -31,
  2,
];
export const MOB_KNIGHT_EG: StaticArray<i32> = [
  -257, 280, 421, 509, 507, 569, 582, 574,
  546,
];
export const MOB_BISHOP_MG: StaticArray<i32> = [
  -56, 8, 89, 91, 128, 169, 182, 198,
  199, 208, 260, 271, 384, 19,
];
export const MOB_BISHOP_EG: StaticArray<i32> = [
  -26, 138, 242, 374, 418, 437, 480, 505,
  540, 533, 476, 519, 461, 600,
];
export const MOB_ROOK_MG: StaticArray<i32> = [
  -229, -31, 25, 42, 61, 61, 78, 101,
  124, 169, 150, 207, 217, 188, 296,
];
export const MOB_ROOK_EG: StaticArray<i32> = [
  10, 221, 412, 452, 523, 582, 601, 618,
  658, 672, 711, 748, 764, 795, 760,
];
export const MOB_QUEEN_MG: StaticArray<i32> = [
  -194, -98, -134, -135, -111, -115, -84, -78,
  -77, -67, -61, -54, -49, -30, -20, -14,
  -26, -27, -36, 58, 62, 205, 303, 276,
  302, 202, -290, 127,
];
export const MOB_QUEEN_EG: StaticArray<i32> = [
  -536, 583, 926, 1486, 1421, 1524, 1595, 1667,
  1796, 1848, 1895, 1906, 1985, 1967, 2008, 2018,
  2058, 2112, 2133, 2062, 2009, 1908, 1767, 1769,
  1718, 1786, 2151, 1636,
];
/** outposts by [outside file][pawn-defended], Ethereal 12.75 */
export const OUTPOST_KNIGHT_MG: StaticArray<i32> = [
  31, 134, 79, 109,
];
export const OUTPOST_KNIGHT_EG: StaticArray<i32> = [
  -133, -2, -108, -71,
];
export const OUTPOST_BISHOP_MG: StaticArray<i32> = [
  17, 120, -54, 146,
];
export const OUTPOST_BISHOP_EG: StaticArray<i32> = [
  -32, 72, 83, -121,
];
/** a minor directly behind any pawn, Ethereal 12.75 */
export const BEHIND_KNIGHT_MG = 24;
export const BEHIND_KNIGHT_EG = 97;
export const BEHIND_BISHOP_MG = 31;
export const BEHIND_BISHOP_EG = 67;
/** a knight four to seven squares from both kings, Ethereal 12.75 */
export const FAR_KNIGHT_MG: StaticArray<i32> = [
  -83, -58, -130, -143,
];
export const FAR_KNIGHT_EG: StaticArray<i32> = [
  26, -39, 17, -354,
];
/** the bishop pair, Ethereal 12.75 */
export const BISHOP_PAIR_MG = 173;
export const BISHOP_PAIR_EG = 359;
/** a bishop that sees both center squares from a long diagonal, Ethereal 12.75 */
export const BISHOP_LONG_MG = 88;
export const BISHOP_LONG_EG = 115;
/** per own pawn on the bishop's color, Laser 1.7 */
export const BISHOP_PAWNS_MG = -2;
export const BISHOP_PAWNS_EG = -23;
/** per rammed own pawn on the bishop's color, Laser 1.7 */
export const BISHOP_RAMMED_MG = -7;
export const BISHOP_RAMMED_EG = -70;
/** a rook on a semi-open and an open file, Ethereal 12.75 */
export const ROOK_FILE_MG: StaticArray<i32> = [
  56, 195,
];
export const ROOK_FILE_EG: StaticArray<i32> = [
  84, 18,
];
/** a rook on the enemy queen's file, Stash 37 */
export const ROOK_QUEEN_FILE_MG = 40;
export const ROOK_QUEEN_FILE_EG = 116;
/** a rook hemmed in by its own king, with and without castling rights, Stash 37 */
export const ROOK_TRAPPED_MG = 46;
export const ROOK_TRAPPED_EG = 2;
export const ROOK_BURIED_MG = -209;
export const ROOK_BURIED_EG = 54;

// King safety, Ethereal 12.75: the safety sum's terms, in the units its square reads (pieces.ts KS_DIV_MG).
/** the pawn shield by [king's file][file][own pawn's distance, 7 for none] */
export const SHELTER_MG: StaticArray<i32> = [
  331, 605, 609, 594, 385, 806, -78, 379,
  169, 174, 189, -169, -234, 128, 395, -149,
  283, 346, 261, 188, 268, -146, 54, 144,
  44, 47, 23, 42, 28, -169, -485, -64,
  -34, 27, -79, -47, -127, -499, -1318, -101,
  64, 21, -36, 8, 51, 118, -372, -139,
  170, 121, 12, 65, 98, 8, 166, -74,
  -82, 12, 39, 29, -6, -127, -398, -167,
  0, 140, 169, -246, -398, -39, -820, -315,
  0, -538, -570, -803, -369, -501, -907, -923,
  0, 37, -134, -148, 1, -368, -429, -269,
  0, -256, -213, -199, -259, -530, -34, -341,
  0, -130, -143, -178, -131, -393, -493, -279,
  0, -14, -130, -136, 110, -939, 254, -290,
  0, 110, 83, 38, 16, -440, -93, -197,
  0, -84, -97, -238, -226, -360, -1098, -463,
];
export const SHELTER_EG: StaticArray<i32> = [
  351, 211, 313, 295, 345, 412, -161, 315,
  -397, -413, -409, -317, -165, 238, 400, -407,
  74, -28, 46, 101, 70, 642, 222, -30,
  141, 45, 40, -26, -7, 179, 545, 27,
  56, -66, 2, -14, 20, 297, 808, -12,
  -20, -87, -70, -135, -99, -163, 540, -14,
  13, -37, -9, -36, 30, 426, 480, 35,
  -28, -67, -20, -10, 58, 221, -783, 68,
  0, 433, 524, 701, 696, 244, -15, 601,
  0, -94, -90, 33, -353, 111, 20, -60,
  0, 30, 64, -9, 134, -15, -361, -3,
  0, 334, 264, 181, 256, 659, -220, 175,
  0, 158, 91, 116, 55, 471, -254, 109,
  0, -114, -57, -166, -260, 242, 190, -54,
  0, -92, -96, -148, -143, 240, 427, 31,
  0, -282, -182, -119, -46, -81, -239, -25,
];
/** the pawn storm by [blocked][file from the edge][enemy pawn's distance, 7 for none] */
export const STORM_MG: StaticArray<i32> = [
  -45, 162, -15, -141, -66, -21, -41, -97,
  -6, 113, -81, 6, 6, 55, 8, -107,
  182, 205, -130, -58, -41, 6, 59, -66,
  148, 22, 46, -105, -5, 30, -10, -33,
  0, -88, -139, 62, 70, -25, 271, -269,
  0, -73, -92, 158, 98, 26, 294, -711,
  0, -166, -37, 30, -7, -21, 231, 621,
  0, -5, 20, -65, -14, 59, 244, 442,
];
export const STORM_EG: StaticArray<i32> = [
  71, 51, 23, -3, -38, -56, -45, -89,
  214, 230, 155, 73, 68, 34, 30, 39,
  143, 152, 136, 49, 34, -5, -60, 16,
  -25, 46, -56, -13, -72, -100, -127, -60,
  0, -78, 7, -118, -108, -30, -128, 1284,
  0, -205, -16, -38, 3, -82, -334, 267,
  0, -302, -102, -35, 9, -156, -239, -176,
  0, -127, -203, -82, -53, -215, -327, 361,
];
/** shelter's and storm's share of the safety sum */
export const SAFETY_SHELTER_MG: StaticArray<i32> = [
  -296, -93, -93, 62, 145, 288, -1212, -114,
  0, -193, -203, -107, 158, -24, -704, -283,
];
export const SAFETY_SHELTER_EG: StaticArray<i32> = [
  -56, -253, -16, 711, 277, -2818, 2271, -729,
  0, 270, 1395, 756, -423, -2290, -2309, -867,
];
export const SAFETY_STORM_MG: StaticArray<i32> = [
  354, 389, 288, 88, 129, 99, 81, 59,
  0, 5, 258, 25, -47, -35, 419, 1774,
];
export const SAFETY_STORM_EG: StaticArray<i32> = [
  949, 839, 1777, -70, -244, -501, -153, -547,
  0, 0, 541, -873, 800, 39, 3768, 2040,
];
/** per attacker reaching the king's area */
export const SAFETY_KNIGHT_MG = 176;
export const SAFETY_KNIGHT_EG = 1735;
export const SAFETY_BISHOP_MG = 243;
export const SAFETY_BISHOP_EG = 1159;
export const SAFETY_ROOK_MG = 251;
export const SAFETY_ROOK_EG = 779;
export const SAFETY_QUEEN_MG = 139;
export const SAFETY_QUEEN_EG = 699;
/** per attack on the area; Ethereal's value times 9/12, its rescale of the count to a 9-square area, left out */
export const SAFETY_ATTACK_MG = 91;
export const SAFETY_ATTACK_EG = 23;
/** per weak square of the area */
export const SAFETY_WEAK_MG = 118;
export const SAFETY_WEAK_EG = -44;
/** the attacker has no queen */
export const SAFETY_NO_QUEEN_MG = -1413;
export const SAFETY_NO_QUEEN_EG = -1458;
/** per safe check */
export const SAFETY_CHECK_QUEEN_MG = 218;
export const SAFETY_CHECK_QUEEN_EG = 3332;
export const SAFETY_CHECK_ROOK_MG = 675;
export const SAFETY_CHECK_ROOK_EG = 3356;
export const SAFETY_CHECK_BISHOP_MG = 353;
export const SAFETY_CHECK_BISHOP_EG = 4163;
export const SAFETY_CHECK_KNIGHT_MG = 510;
export const SAFETY_CHECK_KNIGHT_EG = 2951;
/** per unsafe check, Stash 37; its S(18, 85) restated for Ethereal's divisors, then converted */
export const SAFETY_UNSAFE_MG = 60;
export const SAFETY_UNSAFE_EG = 92;
/** the sum's offset */
export const SAFETY_OFFSET_MG = -160;
export const SAFETY_OFFSET_EG = -266;

// Passed pawns outside the king-pawn table, Ethereal 12.75 and Weiss c735b8f.
/** by [can advance][safe to advance][rank]; each cell is Ethereal's less its blocked and unsafe cell, since pawns.ts has the rank's base value */
export const PASSED_ADVANCE_MG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 100, 100, -32, -87, -130, -175, 0,
  0, 37, 76, -45, 35, -2, 204, 0,
  0, 97, 156, -13, -25, -192, -531, 0,
];
export const PASSED_ADVANCE_EG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 33, -71, 40, -15, 182, 184, 0,
  0, 164, -63, 85, -32, 199, 386, 0,
  0, 62, -139, 55, 133, 919, 1859, 0,
];
/** no enemy piece or attack on the pawn or its path, Ethereal 12.75 */
export const PASSED_SAFE_PATH_MG = -214;
export const PASSED_SAFE_PATH_EG = 311;
/** an own rook behind the pawn on its file, Weiss c735b8f */
export const PASSED_ROOK_BEHIND_MG = 72;
export const PASSED_ROOK_BEHIND_EG = 123;

// Threats, Ethereal 12.75: against the side named, except the push.
export const THREAT_WEAK_PAWN_MG = -46;
export const THREAT_WEAK_PAWN_EG = -230;
export const THREAT_MINOR_BY_PAWN_MG = -345;
export const THREAT_MINOR_BY_PAWN_EG = -316;
export const THREAT_MINOR_BY_MINOR_MG = -108;
export const THREAT_MINOR_BY_MINOR_EG = -182;
export const THREAT_MINOR_BY_MAJOR_MG = -111;
export const THREAT_MINOR_BY_MAJOR_EG = -368;
export const THREAT_ROOK_BY_LESSER_MG = -316;
export const THREAT_ROOK_BY_LESSER_EG = -190;
export const THREAT_MINOR_BY_KING_MG = -130;
export const THREAT_MINOR_BY_KING_EG = -304;
export const THREAT_ROOK_BY_KING_MG = -225;
export const THREAT_ROOK_BY_KING_EG = -274;
export const THREAT_QUEEN_MG = -335;
export const THREAT_QUEEN_EG = -175;
export const THREAT_OVERLOADED_MG = -13;
export const THREAT_OVERLOADED_EG = -102;
export const THREAT_PUSH_MG = 81;
export const THREAT_PUSH_EG = 124;

// Complexity, Xiphos 0.6 and Ethereal 12.75: the endgame half's adjustment, seeded from Ethereal.
export const COMPLEXITY_PAWNS = 29;
export const COMPLEXITY_FLANKS = 376;
export const COMPLEXITY_ENDGAME = 374;
export const COMPLEXITY_OFFSET = -682;
