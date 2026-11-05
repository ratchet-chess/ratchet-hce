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
export const MAT_MG: StaticArray<i32> = [0, 328, 1746, 1813, 2294, 5032, 0];
export const MAT_EG: StaticArray<i32> = [0, 485, 1768, 1917, 3561, 6441, 0];

/** the side to move's bonus, added as a (middlegame, endgame) pair before the blend (Stash, Clockwork) */
export const TEMPO_MG = 151;
export const TEMPO_EG = 283;

/** KXK mop-up, CPW "Mop-up Evaluation": per step of the bare king's center distance, and per step the kings close */
export const MOPUP_EDGE = 80;
export const MOPUP_CLOSE = 32;

// Piece-square tables from White's side, indexed by square: a1 = 0, so rank 1 is the
// first row. Hand-seeded, then Texel-tuned on the zurichess quiet set (results/tuning.md).
export const PAWN_MG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     1,   117,   25, 52, 64,  229,  257,  8,
     6,   28,   61,   66,   107,   88,   177,   -10,
    -13,  46,  110,  153,  191,  111,  74,  -45,
    70,  142,  167,  167,  141,  130,  155,  25,
    181,  165,  165,  326,  305,  388,  308,  61,
   586, 576, 451, 555, 115, 231, 252, 211,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,    0,    0,    0,    0,    0,    0,    0,
     336,  271,  360,  316,  391,  304,  264, 271,
   273,  268, 258,  284,  297, 311, 245, 272,
     343,  322,  227, 199, 214, 278,  315,  314,
    399,   286,  230,  182, 245,  309,  364,    400,
   455,  373,  294,  190,  319,  362,  461,  507,
   237,  170,  194,  85,  551,  340,  350,  461,
     0,    0,    0,    0,    0,    0,    0,    0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  47,  149, 100, 69,  225,  117,  107,  89,
  83, 116,   147,   180,   191,  222,   207,  120,
   217,   151,  219,  201,  272,  256,  251,  150,
   254,  244,  274,  233,  298,  310,  303,   201,
    294,  288,  263,  289,  276,  325,  292,  261,
  -165,  177,  142,  185,  215,  363,  310,  235,
  59,  -160,  234,  152,   34,  250,   129,   -18,
  -614, -438, -145,  21,  432, -158, -422, -554,
];
export const KNIGHT_EG: StaticArray<i32> = [
  160, 134,  178,   370,  277,  262, 140, 73,
  211,  185,    306,   348,   347,  222,  242, 74,
   214,   342,   350,  470,   439,   322,  285,  268,
   410,   400,  545,  591,  544,  510,   528,  407,
   408,   486,  602,  674,  604,   561,   481,  404,
   458,  481,   611,   624,   602,   486,  365, 160,
   190,   511,  312,   474,   435, 253,  354, 68,
  86, 297,    416, 258, 187,  192, 263, -126,
];
export const BISHOP_MG: StaticArray<i32> = [
   -46,   129,    146,  149,   212,   79, -33,  -41,
    195,  173,  209,   147,  146,  278,  230,   126,
    161,  168,  131,  148,  176,  199,  257,  152,
    197,  209,  172,  206,  230,  164,   163,   221,
    157,   183,  144,  195,  191,  261,   125,   117,
   156,  136,  2,  159,  1,  206,  142,   204,
    15,  -100,   -38,  -200,  133,  -49,  -100, -248,
    -46,   -18, -649, -240, -264, -30,   -19,  91,
];
export const BISHOP_EG: StaticArray<i32> = [
   441,   585,  579,   641,    604,  606,    615,  467,
   511,  436,    566,   621,   631,    582,  389,  454,
   548,   621,   598,   650,   738,   499,    601,  575,
    479,   605,   704,  772,   679,   727,   643,  467,
    586,   609,   723,   807,   775,   692,   668,   628,
    543,   717,   586,   701,   762,   599,   689,   634,
   672,   591,   688,   624,  642,   766,   516,  563,
   441,  685,   786,   635,   774,  603,  626, 306,
];
export const ROOK_MG: StaticArray<i32> = [
   8,   37,   7,  53,  82,   79,  35,  130,
  -102,   44,  -28,   76,   90,   47,   11, -140,
  -95,  -10,  2,  5,   46,   110,   116,  2,
  -56,  -2,   38,   11,   83,   38,  197,  11,
   -34,   30,  30,  39,  114,  114,   20,  32,
    -80,  -8,  -13,  108,  -78,  169,  242,  -50,
   2,  1,  180,  74,  157,  207,   -93,  124,
   23,  54,  -103,  144,  142,   -94,   53,  34,
];
export const ROOK_EG: StaticArray<i32> = [
    816,   839,   874,   827,   792,   821,   804,  645,
    870,   796,   873,   844,    809,   839,    778,   826,
    902,   915,   894,   884,   838,   775,    825,   773,
    959,   1002,   972,   946,   903,   916,  877,   891,
    999,   976,  1066,   1001,   999,   1000,   1028,   971,
    1079,   1075,   1037,   958,   1018,   967,  956,   981,
    1094,   1089,   1004,   1049,  988,   1020,   1140,   1008,
    1091,   1083,  1144,   1030,   1058,   1155,   1067,   1037,
];
export const QUEEN_MG: StaticArray<i32> = [
   316,  238,  239,   337,  236, 211, 162, 192,
  146,  247,   321,   287,   328,   436,    339,   317,
  199,   313,  247,   281,  265,    264,   317,   370,
   299, 153,  238,  182,  258,  239,   306,   218,
  147, 151,  123,  85,   165,   298,  251,  236,
   213, 95,  195,   181,   119,  330,  297,  401,
   101, -72,  71,   231, -174,  256,   170,  328,
   172, 110,  45, -73,  352,  343,  618,   148,
];
export const QUEEN_EG: StaticArray<i32> = [
  865, 922, 997, 822,  1116, 992, 1003, 782,
  1096, 976, 953, 993,  998, 770, 820, 986,
   1066, 923,   1130,  1022,   1128,   1163,   1292,  1063,
  1007,  1276,   1167,  1293,  1131,  1126,  1229,   1311,
    1254,   1257,   1244,  1240,  1260,  1037,  1271,  1272,
   1106,   1319,   994,  1380,  1271,  1176,   973,  1095,
  1105,   1174,  1311,  1276,  1554,  832,   1141,  1204,
  1070,  1303,  1447,  1418,   1149,  1032, 863,  1580,
];
export const KING_MG: StaticArray<i32> = [
   -80,  -146,   -112, -326,   20, -69,  141,  184,
    -8,  -114,  -166, -290, -80,  -53,  95,  227,
    157,  4, -72, -252, -47, 34,  132, 104,
  -89,   60, -18, -427, -205, -57, 53, -59,
    144,  -39,  249, -325, -36, 67,  273, 68,
    527,  1,  417,   -330,  232,  421,  593,  35,
   546,   -35,   -144,  48,   -216,  -153, 63, -433,
   -633,  -77,  134,  -3, -368, -393,  40,  -214,
];
export const KING_EG: StaticArray<i32> = [
  -706, -456, 213,  -209, -154,  -18, -168, -291,
  -360,  -315,   377,   -3,   54,   91,  -51, -64,
  -347,  -259,   438,  70,  129,  101,   7,  0,
   -241,  -224,  509,  152,  201,  216,   -12,   -35,
   -229,  -41,  458,  130,  176,  224,  42,   32,
    -182,   34,   409,   131,   100,  278,  134,   146,
  -394,   49,   674,   -15,   220,  454,  180,  299,
  -712, -284, 196, -280,    -52,   335,   65,  -347,
];

// ---------------------------------------------------------------- pawns
// Stash 37 kp_eval.c, converted by its middlegame pawn 103; each pair is (middlegame, endgame).

/** a backward pawn on a file no enemy pawn closes: its stop square attacked by an enemy pawn and out of reach of its own */
export const PAWN_BACKWARD_MG = -76;
export const PAWN_BACKWARD_EG = -64;
/** a file holding two or more of one side's pawns, once per file */
export const PAWN_DOUBLED_MG = -14;
export const PAWN_DOUBLED_EG = -189;
/** a file whose pawns have no friendly pawn on a neighboring file, once per file */
export const PAWN_ISOLATED_MG = -26;
export const PAWN_ISOLATED_EG = -49;
/** a passed pawn by relative rank: no enemy pawn ahead on its file, and every square of its path an enemy pawn attacks is attacked as often by its own */
export const PAWN_PASSED_MG: StaticArray<i32> = [0, -148, -125, 213, 218, 218, 423, 0];
export const PAWN_PASSED_EG: StaticArray<i32> = [0, -39, 101, -166, -62, 358, 1348, 0];
/** a pawn with a friendly pawn beside it on the next file, by relative rank */
export const PAWN_PHALANX_MG: StaticArray<i32> = [0, 42, 81, 91, 131, 162, -395, 0];
export const PAWN_PHALANX_EG: StaticArray<i32> = [0, -12, 24, 67, 249, 1714, 3059, 0];
/** a pawn defending a friendly pawn, by the defender's relative rank */
export const PAWN_DEFENDER_MG: StaticArray<i32> = [0, 75, 81, 71, 71, 706, 0, 0];
export const PAWN_DEFENDER_EG: StaticArray<i32> = [0, 88, 77, 135, 449, 605, 0, 0];
/** a passed pawn at most 4 steps from queening, by (steps - 1) * 6 + min(steps + 2, own king's distance) - 1 */
export const PASSED_OUR_KING_MG: StaticArray<i32> = [136, 37, -175, 0, 0, 0, 525, 162, -105, -82, 0, 0, 187, -140, -88, -178, -9, 0, -58, -32, -94, -25, -98, -1];
export const PASSED_OUR_KING_EG: StaticArray<i32> = [582, 136, -372, 0, 0, 0, 203, -110, -266, -425, 0, 0, -11, -114, -364, -403, -535, 0, 1, -112, -243, -326, -331, -335];
/** the same by the enemy king's distance */
export const PASSED_THEIR_KING_MG: StaticArray<i32> = [179, 97, -72, 0, 0, 0, -135, 206, -84, -87, 0, 0, -86, 165, 10, -125, -175, 0, -386, -63, -49, -152, -154, -142];
export const PASSED_THEIR_KING_EG: StaticArray<i32> = [-1051, -707, 271, 0, 0, 0, 133, -202, 526, 869, 0, 0, 588, 384, 567, 940, 1115, 0, 522, 295, 334, 426, 608, 651];

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
  -155, -102, -54, -38, 26, 56, 84, 128,
  158,
];
export const MOB_KNIGHT_EG: StaticArray<i32> = [
  -162, 398, 548, 640, 638, 697, 713, 703,
  684,
];
export const MOB_BISHOP_MG: StaticArray<i32> = [
  -187, -122, -42, -40, -3, 38, 50, 67,
  67, 76, 128, 147, 225, -82,
];
export const MOB_BISHOP_EG: StaticArray<i32> = [
  -38, 143, 251, 381, 422, 438, 484, 504,
  540, 537, 474, 512, 492, 574,
];
export const MOB_ROOK_MG: StaticArray<i32> = [
  -246, -35, 18, 34, 50, 53, 70, 89,
  114, 159, 143, 198, 206, 183, 293,
];
export const MOB_ROOK_EG: StaticArray<i32> = [
  61, 227, 430, 470, 549, 598, 616, 642,
  681, 690, 730, 769, 783, 814, 770,
];
export const MOB_QUEEN_MG: StaticArray<i32> = [
  -194, -98, -130, -132, -111, -114, -79, -76,
  -74, -64, -57, -52, -42, -27, -12, -12,
  -13, -23, -35, 81, 100, 183, 278, 260,
  365, 160, -457, 81,
];
export const MOB_QUEEN_EG: StaticArray<i32> = [
  -536, 578, 736, 1434, 1475, 1569, 1590, 1694,
  1814, 1876, 1912, 1937, 1997, 1993, 2017, 2057,
  2069, 2144, 2166, 2062, 1993, 1975, 1854, 1836,
  1719, 1857, 2469, 1852,
];
/** outposts by [outside file][pawn-defended], Ethereal 12.75 */
export const OUTPOST_KNIGHT_MG: StaticArray<i32> = [
  32, 129, 82, 91,
];
export const OUTPOST_KNIGHT_EG: StaticArray<i32> = [
  -133, 3, -119, -43,
];
export const OUTPOST_BISHOP_MG: StaticArray<i32> = [
  22, 127, -63, 164,
];
export const OUTPOST_BISHOP_EG: StaticArray<i32> = [
  -34, 63, 100, -167,
];
/** a minor directly behind any pawn, Ethereal 12.75 */
export const BEHIND_KNIGHT_MG = 24;
export const BEHIND_KNIGHT_EG = 91;
export const BEHIND_BISHOP_MG = 31;
export const BEHIND_BISHOP_EG = 60;
/** a knight four to seven squares from both kings, Ethereal 12.75 */
export const FAR_KNIGHT_MG: StaticArray<i32> = [
  -83, -59, -128, -136,
];
export const FAR_KNIGHT_EG: StaticArray<i32> = [
  26, -37, 12, -373,
];
/** the bishop pair, Ethereal 12.75 */
export const BISHOP_PAIR_MG = 171;
export const BISHOP_PAIR_EG = 356;
/** a bishop that sees both center squares from a long diagonal, Ethereal 12.75 */
export const BISHOP_LONG_MG = 86;
export const BISHOP_LONG_EG = 123;
/** per own pawn on the bishop's color, Laser 1.7 */
export const BISHOP_PAWNS_MG = -3;
export const BISHOP_PAWNS_EG = -24;
/** per rammed own pawn on the bishop's color, Laser 1.7 */
export const BISHOP_RAMMED_MG = -8;
export const BISHOP_RAMMED_EG = -66;
/** a rook on a semi-open and an open file, Ethereal 12.75 */
export const ROOK_FILE_MG: StaticArray<i32> = [
  57, 196,
];
export const ROOK_FILE_EG: StaticArray<i32> = [
  86, 19,
];
/** a rook on the enemy queen's file, Stash 37 */
export const ROOK_QUEEN_FILE_MG = 41;
export const ROOK_QUEEN_FILE_EG = 108;
/** a rook hemmed in by its own king, with and without castling rights, Stash 37 */
export const ROOK_TRAPPED_MG = 52;
export const ROOK_TRAPPED_EG = 11;
export const ROOK_BURIED_MG = -205;
export const ROOK_BURIED_EG = 45;

// King safety, Ethereal 12.75: the safety sum's terms, in the units its square reads (pieces.ts KS_DIV_MG).
/** the pawn shield by [king's file][file][own pawn's distance, 7 for none] */
export const SHELTER_MG: StaticArray<i32> = [
  278, 528, 531, 509, 336, 691, -78, 268,
  199, 200, 199, -145, -207, 179, 395, -129,
  246, 325, 240, 156, 212, -182, 54, 113,
  55, 68, 44, 55, 40, -248, -295, -46,
  -24, 39, -76, -46, -135, -507, -1331, -99,
  105, 48, -10, 18, 52, 47, -469, -114,
  171, 122, 12, 52, 99, -47, 38, -78,
  -103, -4, 26, 4, -24, -162, -357, -192,
  0, 92, 158, -354, 46, -39, -820, -452,
  0, -426, -466, -694, -270, -590, -907, -819,
  0, 40, -146, -156, -51, -578, -429, -284,
  0, -104, -101, -84, -165, -534, -34, -211,
  0, -91, -105, -145, -101, -445, -493, -245,
  0, 21, -96, -144, 104, -734, 254, -251,
  0, 103, 77, 24, 8, -522, -122, -212,
  0, -61, -76, -242, -180, -249, -1098, -454,
];
export const SHELTER_EG: StaticArray<i32> = [
  313, 201, 314, 342, 405, 479, -161, 328,
  -370, -400, -360, -258, -81, 138, 400, -374,
  78, -45, 41, 143, 115, 513, 356, -15,
  141, 26, 29, 32, 57, 252, 227, 64,
  49, -87, -3, 19, 68, 228, 694, 7,
  -29, -88, -68, -116, -72, -129, 525, -3,
  14, -41, -6, 1, 23, 322, 649, 46,
  -12, -53, -7, 33, 119, 259, -906, 90,
  0, 417, 465, 788, 479, 244, -15, 641,
  0, -79, -68, 83, -286, 389, 20, -39,
  0, 8, 66, 13, 214, 209, -361, 5,
  0, 282, 261, 231, 285, 692, -220, 201,
  0, 127, 64, 124, 74, 484, -254, 109,
  0, -91, -37, -88, -183, 30, 190, -24,
  0, -72, -73, -103, -125, 213, 307, 63,
  0, -276, -168, -57, 9, -271, -239, -16,
];
/** the pawn storm by [blocked][file from the edge][enemy pawn's distance, 7 for none] */
export const STORM_MG: StaticArray<i32> = [
  -74, 117, 49, -125, -65, -14, -36, -84,
  -120, 72, -27, 26, 18, 74, 25, -82,
  163, 199, -70, -47, -34, 21, 78, -57,
  7, -169, 68, -142, -51, -10, -47, -75,
  0, -88, -95, 55, 87, -24, 295, -272,
  0, -73, -88, 155, 129, 35, 425, -781,
  0, -166, 10, 27, 10, -3, 316, 494,
  0, -5, 2, -106, -49, 27, 282, 479,
];
export const STORM_EG: StaticArray<i32> = [
  145, 148, -17, -11, -30, -46, -30, -79,
  286, 257, 109, 66, 67, 34, 36, 31,
  195, 199, 92, 53, 46, 10, -53, 14,
  97, 216, -84, 8, -29, -53, -108, -44,
  0, -78, -19, -99, -143, -80, -163, 1055,
  0, -205, -11, -39, -43, -94, -455, 289,
  0, -302, -108, -27, -28, -195, -316, -187,
  0, -127, -161, -37, -64, -244, -538, 154,
];
/** shelter's and storm's share of the safety sum */
export const SAFETY_SHELTER_MG: StaticArray<i32> = [
  -223, -54, -35, 101, 166, 231, -1474, -104,
  0, 38, 58, 132, 389, 126, -517, -44,
];
export const SAFETY_SHELTER_EG: StaticArray<i32> = [
  134, 205, 32, 731, 353, -3488, 2397, -371,
  0, 414, 1173, 560, -285, -1638, -2309, -812,
];
export const SAFETY_STORM_MG: StaticArray<i32> = [
  316, 367, 244, 11, 85, 47, 40, 9,
  0, 5, 204, -71, -90, -52, 526, 1679,
];
export const SAFETY_STORM_EG: StaticArray<i32> = [
  593, 844, 1093, -242, -339, -170, -121, -468,
  0, 0, 166, -565, 675, -575, 3176, 2416,
];
/** per attacker reaching the king's area */
export const SAFETY_KNIGHT_MG = 167;
export const SAFETY_KNIGHT_EG = 1353;
export const SAFETY_BISHOP_MG = 221;
export const SAFETY_BISHOP_EG = 801;
export const SAFETY_ROOK_MG = 211;
export const SAFETY_ROOK_EG = 729;
export const SAFETY_QUEEN_MG = 95;
export const SAFETY_QUEEN_EG = 539;
/** per attack on the area; Ethereal's value times 9/12, its rescale of the count to a 9-square area, left out */
export const SAFETY_ATTACK_MG = 113;
export const SAFETY_ATTACK_EG = 376;
/** per weak square of the area */
export const SAFETY_WEAK_MG = 96;
export const SAFETY_WEAK_EG = -190;
/** the attacker has no queen */
export const SAFETY_NO_QUEEN_MG = -1386;
export const SAFETY_NO_QUEEN_EG = -1330;
/** per safe check */
export const SAFETY_CHECK_QUEEN_MG = 243;
export const SAFETY_CHECK_QUEEN_EG = 2985;
export const SAFETY_CHECK_ROOK_MG = 685;
export const SAFETY_CHECK_ROOK_EG = 2680;
export const SAFETY_CHECK_BISHOP_MG = 367;
export const SAFETY_CHECK_BISHOP_EG = 3472;
export const SAFETY_CHECK_KNIGHT_MG = 529;
export const SAFETY_CHECK_KNIGHT_EG = 2481;
/** per unsafe check, Stash 37; its S(18, 85) restated for Ethereal's divisors, then converted */
export const SAFETY_UNSAFE_MG = 55;
export const SAFETY_UNSAFE_EG = -24;
/** the sum's offset */
export const SAFETY_OFFSET_MG = -347;
export const SAFETY_OFFSET_EG = -389;

// Passed pawns outside the king-pawn table, Ethereal 12.75 and Weiss c735b8f.
/** by [can advance][safe to advance][rank]; each cell is Ethereal's less its blocked and unsafe cell, since pawns.ts has the rank's base value */
export const PASSED_ADVANCE_MG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 86, 102, -73, -56, -21, -224, 0,
  0, 74, 68, -82, 30, 36, 182, 0,
  0, 130, 144, -67, -54, -156, -500, 0,
];
export const PASSED_ADVANCE_EG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 71, -44, 97, -16, 65, 172, 0,
  0, 128, -41, 148, 11, 189, 367, 0,
  0, 71, -83, 155, 203, 887, 1792, 0,
];
/** no enemy piece or attack on the pawn or its path, Ethereal 12.75 */
export const PASSED_SAFE_PATH_MG = -244;
export const PASSED_SAFE_PATH_EG = 324;
/** an own rook behind the pawn on its file, Weiss c735b8f */
export const PASSED_ROOK_BEHIND_MG = 84;
export const PASSED_ROOK_BEHIND_EG = 94;

// Threats, Ethereal 12.75: against the side named, except the push.
export const THREAT_WEAK_PAWN_MG = -42;
export const THREAT_WEAK_PAWN_EG = -241;
export const THREAT_MINOR_BY_PAWN_MG = -345;
export const THREAT_MINOR_BY_PAWN_EG = -332;
export const THREAT_MINOR_BY_MINOR_MG = -108;
export const THREAT_MINOR_BY_MINOR_EG = -186;
export const THREAT_MINOR_BY_MAJOR_MG = -107;
export const THREAT_MINOR_BY_MAJOR_EG = -381;
export const THREAT_ROOK_BY_LESSER_MG = -324;
export const THREAT_ROOK_BY_LESSER_EG = -183;
export const THREAT_MINOR_BY_KING_MG = -133;
export const THREAT_MINOR_BY_KING_EG = -306;
export const THREAT_ROOK_BY_KING_MG = -212;
export const THREAT_ROOK_BY_KING_EG = -297;
export const THREAT_QUEEN_MG = -335;
export const THREAT_QUEEN_EG = -186;
export const THREAT_OVERLOADED_MG = -14;
export const THREAT_OVERLOADED_EG = -103;
export const THREAT_PUSH_MG = 83;
export const THREAT_PUSH_EG = 124;

// Complexity, Xiphos 0.6 and Ethereal 12.75: the endgame half's adjustment, seeded from Ethereal.
export const COMPLEXITY_PAWNS = 29;
export const COMPLEXITY_FLANKS = 383;
export const COMPLEXITY_ENDGAME = 377;
export const COMPLEXITY_OFFSET = -687;
