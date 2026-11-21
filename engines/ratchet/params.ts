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
export const MAT_MG: StaticArray<i32> = [0, 284, 1701, 1482, 2221, 4887, 0];
export const MAT_EG: StaticArray<i32> = [0, 600, 2270, 2276, 4172, 7405, 0];

/** the side to move's bonus, added as a (middlegame, endgame) pair before the blend (Stash 37 Initiative) */
export const TEMPO_MG = 152;
export const TEMPO_EG = 276;

/** KXK mop-up, vendor/cpw/pages/Mop-up_Evaluation.wiki: per step of the bare king's center distance, and per step the kings close */
export const MOPUP_EDGE = 80;
export const MOPUP_CLOSE = 32;

// Piece-square tables from White's side, indexed by square: a1 = 0, so rank 1 is the
// first row. Hand-seeded, then Texel-tuned on the zurichess quiet set (results/tuning.md).
export const PAWN_MG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     40,   75,   89, 61, 86,  162,  221,  -14,
     13,   40,   102,   162,   182,   109,   109,   -15,
    42,  64,  114,  207,  236,  148,  94,  16,
    107,  114,  180,  155,  230,  178,  104,  79,
    144,  130,  181,  219,  249,  211,  221,  191,
   261, 37, 300, 315, 518, 70, -73, -85,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,    0,    0,    0,    0,    0,    0,    0,
     433,  376,  341,  380,  448,  356,  326, 353,
   412,  351, 315,  293,  360, 405, 350, 368,
     471,  414,  290, 201, 212, 350,  412,  378,
    535,   409,  268,  188, 164,  355,  438,    461,
   605,  540,  451,  200,  255,  440,  573,  559,
   258,  478,  465,  321,  251,  441,  639,  383,
     0,    0,    0,    0,    0,    0,    0,    0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  285,  157, 112, 191,  207,  193,  111,  117,
  46, 186,   141,   144,   197,  146,   157,  224,
   175,   172,  208,  191,  219,  199,  234,  226,
   270,  294,  276,  263,  274,  329,  326,   246,
    249,  284,  355,  284,  242,  321,  328,  349,
  268,  211,  191,  266,  220,  239,  244,  209,
  327,  128,  357,  386,   297,  342,   274,   411,
  -589, -147, -21,  293,  410, -206, 54, -155,
];
export const KNIGHT_EG: StaticArray<i32> = [
  -108, 196,  277,   344,  324,  146, 305, 89,
  198,  237,    368,   457,   399,  317,  261, 280,
   250,   478,   434,  609,   562,   437,  388,  314,
   447,   439,  640,  691,  702,  597,   535,  517,
   559,   537,  636,  749,  717,   713,   587,  463,
   503,  593,   756,   758,   727,   725,  506, 374,
   295,   499,  443,   431,   520, 380,  376, 221,
  -148, 347,    580, 258, 378,  572, 516, -786,
];
export const BISHOP_MG: StaticArray<i32> = [
   170,   228,    124,  110,   200,   80, 183,  73,
    161,  139,  231,   147,  169,  299,  249,   259,
    101,  276,  133,  188,  187,  156,  285,  271,
    180,  112,  188,  216,  208,  192,   158,   226,
    49,   172,  127,  160,  107,  173,   173,   116,
   177,  102,  -32,  99,  79,  145,  293,   251,
    30,  -120,   88,  167,  8,  124,  -252, -4,
    -233,   5, -202, -197, -260, 32,   -305,  -351,
];
export const BISHOP_EG: StaticArray<i32> = [
   542,   468,  626,   753,    684,  685,    658,  537,
   604,  554,    551,   694,   718,    598,  491,  296,
   706,   707,   702,   772,   824,   655,    677,  668,
    599,   784,   843,  864,   802,   785,   855,  573,
    784,   785,   805,   918,   903,   817,   772,   735,
    728,   831,   790,   811,   917,   758,   795,   725,
   714,   758,   800,   740,  757,   843,   827,  726,
   775,  784,   897,   880,   866,  768,  815, 665,
];
export const ROOK_MG: StaticArray<i32> = [
   -59,   -39,   -68,  -37,  2,   -6,  27,  -23,
  -150,   -114,  -26,   -14,   0,   -63,   66, -111,
  -99,  -102,  -61,  -24,   75,   4,   119,  -55,
  -129,  -67,   -75,   -63,   21,   -93,  93,  -70,
   -105,   -15,  43,  21,  31,  42,   220,  108,
    -16,  39,  27,  111,  97,  247,  261,  116,
   -94,  -91,  162,  137,  136,  85,   50,  113,
   123,  134,  58,  197,  88,   36,   282,  202,
];
export const ROOK_EG: StaticArray<i32> = [
    928,   927,   1001,   936,   905,   918,   852,  814,
    983,   922,   985,   959,    987,   986,    852,   890,
    991,   1070,   1028,   980,   963,   954,    875,   876,
    1137,   1170,   1170,   1100,   1071,   1128,  1082,   1065,
    1250,   1235,  1228,   1180,   1163,   1185,   1170,   1123,
    1285,   1258,   1256,   1149,   1177,   1207,  1127,   1183,
    1330,   1333,   1228,   1253,  1244,   1312,   1259,   1258,
    1294,   1278,  1327,   1247,   1352,   1359,   1235,   1249,
];
export const QUEEN_MG: StaticArray<i32> = [
   206,  236,  239,   264,  270, 280, 178, 167,
  282,  314,   307,   297,   289,   377,    398,   254,
  254,   251,  268,   216,  238,    269,   321,   289,
   262, 80,  205,  138,  150,  179,   300,   190,
  264, 195,  87,  92,   109,   193,  170,  248,
   276, 156,  96,   138,   49,  295,  236,  340,
   60, 39,  165,   134, -12,  171,   125,  370,
   126, 46,  17, 46,  215,  129,  474,   205,
];
export const QUEEN_EG: StaticArray<i32> = [
  1136, 972, 1016, 956,  999, 876, 963, 932,
  1096, 922, 1031, 1130,  1154, 818, 699, 979,
   1128, 1247,   1320,  1339,   1306,   1262,   1189,  1147,
  1258,  1685,   1418,  1658,  1541,  1484,  1388,   1413,
    1272,   1463,   1578,  1599,  1633,  1376,  1746,  1452,
   1236,   1525,   1565,  1622,  1734,  1432,   1441,  1485,
  1477,   1390,  1507,  1679,  1806,  1348,   1479,  1431,
  1412,  1724,  1736,  1739,   1578,  1524, 1337,  1589,
];
export const KING_MG: StaticArray<i32> = [
   -230,  -171,   -153, -267,   -8, -152,  196,  203,
    -42,  -233,  -71, -225, -111,  -91,  59,  224,
    110,  -1, -93, -268, -126, -16,  144, 66,
  54,   3, -150, -409, -256, -46, 217, 49,
    148,  22,  -49, -424, -192, 5,  272, 143,
    8,  50,  98,   -243,  -264,  73,  210,  191,
   366,   75,   37,  -205,   -132,  -48, 261, 162,
   37,  256,  447,  -147, -355, 136,  389,  -678,
];
export const KING_EG: StaticArray<i32> = [
  -476, -445, 211,  -178, -236,  -50, -236, -226,
  -211,  -392,   252,   -100,   -14,   53,  -69, 55,
  -280,  -329,   372,  59,  113,  112,   -51,  102,
   -305,  -240,  458,  196,  258,  232,   -4,   64,
   -172,  -29,  544,  323,  329,  374,  160,   209,
    19,   88,   607,   264,   277,  458,  366,   336,
  -479,   170,   758,   211,   369,  539,  373,  32,
  -1291, -253, 645, 82,    282,   452,   128,  -934,
];

// ---------------------------------------------------------------- pawns
// Stash 37 kp_eval.c, converted by its PAWN_MG_SCORE 103; each pair is (middlegame, endgame).

/** a backward pawn that is not isolated, on a file an enemy pawn closes: its stop square attacked by an enemy pawn and out of reach of its own, Ethereal 12.75 PawnBackwards */
export const PAWN_BACKWARD_MG = 12;
export const PAWN_BACKWARD_EG = -92;
/** the same on a file no enemy pawn closes, Stash 37 BackwardPenalty */
export const PAWN_BACKWARD_OPEN_MG = -92;
export const PAWN_BACKWARD_OPEN_EG = -115;
/** a pawn with a friendly pawn directly behind it, Stash 37 DoubledPenalty */
export const PAWN_DOUBLED_MG = -55;
export const PAWN_DOUBLED_EG = -164;
/** a pawn with no friendly pawn on a neighboring file, Stash 37 IsolatedPenalty */
export const PAWN_ISOLATED_MG = -20;
export const PAWN_ISOLATED_EG = -101;
/** a passed pawn by relative rank: no enemy pawn ahead on its file or the next; Stash 37 PassedBonus */
export const PAWN_PASSED_MG: StaticArray<i32> = [0, -112, -206, -311, -93, 668, 786, 0];
export const PAWN_PASSED_EG: StaticArray<i32> = [0, 36, 182, 278, 353, 119, 708, 0];
/** a candidate by relative rank: not passed, no enemy pawn ahead on its file, and every square of its path an enemy pawn attacks is attacked as often by its own; seeded from Ethereal 12.75 PawnCandidatePasser at its PawnValue 82 */
export const PAWN_CANDIDATE_MG: StaticArray<i32> = [0, -55, -65, -50, 51, 189, 0, 0];
export const PAWN_CANDIDATE_EG: StaticArray<i32> = [0, -6, 49, 181, 305, 416, 0, 0];
/** a pawn with a friendly pawn beside it on the next file, by relative rank; Stash 37 PhalanxBonus */
export const PAWN_PHALANX_MG: StaticArray<i32> = [0, 50, 97, 145, 267, 655, 40, 0];
export const PAWN_PHALANX_EG: StaticArray<i32> = [0, -19, 22, 101, 344, 1374, 3410, 0];
/** a pawn defending a friendly pawn, by the defender's relative rank; Stash 37 DefenderBonus */
export const PAWN_DEFENDER_MG: StaticArray<i32> = [0, 103, 78, 112, 200, 483, 0, 0];
export const PAWN_DEFENDER_EG: StaticArray<i32> = [0, 74, 59, 133, 475, 745, 0, 0];
/** a passed pawn, per step of its distance from its own king, by relative rank; seeded by lines through the earlier table, ranks 1 and 2 from Ethereal 12.75 PassedFriendlyDistance at its PawnValue 82 */
export const PASSED_OUR_KING_MG: StaticArray<i32> = [0, -8, 10, 45, 41, -60, -81, 0];
export const PASSED_OUR_KING_EG: StaticArray<i32> = [0, -3, -29, -97, -144, -147, -179, 0];
/** the same from the enemy king */
export const PASSED_THEIR_KING_MG: StaticArray<i32> = [0, 7, 17, 25, 0, -20, 50, 0];
export const PASSED_THEIR_KING_EG: StaticArray<i32> = [0, -10, -5, 57, 162, 283, 349, 0];

// ---------------------------------------------------------------- endgame scaling
// Stash 37 eval_scale_endgame: the endgame half times a factor of 256, set by hand
// there as here, so the tuner leaves it alone.

/** opposite bishops with other pieces: 71 + 9 per piece and pawn of the strong side */
export const SCALE_OCB_PIECES = 71;
export const SCALE_OCB_PIECES_PER = 9;
/** opposite bishops alone: 33 + 21 per passed pawn of the strong side */
export const SCALE_OCB = 33;
export const SCALE_OCB_PASSED = 21;
/** any other ending: 177 + 13 per pawn of the strong side, at most 256 */
export const SCALE_BASE = 177;
export const SCALE_PER_PAWN = 13;

// ---------------------------------------------------------------- pieces and attack maps (pieces.ts)

// Seeds: each term's source engine, converted by its middlegame pawn: Stash 37's PAWN_MG_SCORE 103, Ethereal 12.75's
// PawnValue 82, Weiss c735b8f's P_MG 104, Laser 1.7's PIECE_VALUES pawn 100.

/** mobility by count, Stash 37 KnightMobility, BishopMobility, RookMobility and QueenMobility */
export const MOB_KNIGHT_MG: StaticArray<i32> = [
  -546, -374, -291, -236, -187, -144, -95, -48,
  -46,
];
export const MOB_KNIGHT_EG: StaticArray<i32> = [
  -47, 463, 672, 742, 760, 800, 784, 770,
  705,
];
export const MOB_BISHOP_MG: StaticArray<i32> = [
  -18, 50, 115, 134, 162, 187, 196, 206,
  221, 238, 269, 312, 340, 262,
];
export const MOB_BISHOP_EG: StaticArray<i32> = [
  -6, 306, 485, 607, 661, 706, 765, 793,
  805, 823, 783, 795, 746, 794,
];
export const MOB_ROOK_MG: StaticArray<i32> = [
  -340, -62, 40, 45, 53, 35, 56, 54,
  77, 110, 100, 120, 131, 155, 214,
];
export const MOB_ROOK_EG: StaticArray<i32> = [
  -55, 377, 584, 662, 722, 779, 812, 830,
  877, 890, 944, 971, 977, 956, 952,
];
export const MOB_QUEEN_MG: StaticArray<i32> = [
  -194, -368, -151, -94, -83, -101, -116, -119,
  -103, -88, -88, -74, -68, -53, -51, -75,
  -72, -46, -52, 18, 45, 114, 89, 146,
  102, -32, -701, -374,
];
export const MOB_QUEEN_EG: StaticArray<i32> = [
  -536, 475, 1273, 1349, 1677, 2052, 2241, 2404,
  2445, 2479, 2532, 2547, 2564, 2555, 2615, 2682,
  2650, 2631, 2627, 2553, 2483, 2420, 2390, 2278,
  2245, 2284, 2614, 2396,
];
/** outposts by [outside file][pawn-defended], Ethereal 12.75 KnightOutpost and BishopOutpost */
export const OUTPOST_KNIGHT_MG: StaticArray<i32> = [
  66, 143, 88, 92,
];
export const OUTPOST_KNIGHT_EG: StaticArray<i32> = [
  -140, 46, -145, -102,
];
export const OUTPOST_BISHOP_MG: StaticArray<i32> = [
  69, 172, 14, -111,
];
export const OUTPOST_BISHOP_EG: StaticArray<i32> = [
  -58, 79, 4, 98,
];
/** a minor directly behind any pawn, Ethereal 12.75 KnightBehindPawn and BishopBehindPawn */
export const BEHIND_KNIGHT_MG = 36;
export const BEHIND_KNIGHT_EG = 146;
export const BEHIND_BISHOP_MG = 36;
export const BEHIND_BISHOP_EG = 62;
/** a knight four to seven squares from both kings, Ethereal 12.75 KnightInSiberia */
export const FAR_KNIGHT_MG: StaticArray<i32> = [
  -91, -91, -130, -188,
];
export const FAR_KNIGHT_EG: StaticArray<i32> = [
  2, -81, -108, -155,
];
/** the bishop pair, Ethereal 12.75 BishopPair */
export const BISHOP_PAIR_MG = 95;
export const BISHOP_PAIR_EG = 453;
/** a bishop that sees both center squares from a long diagonal, Ethereal 12.75 BishopLongDiagonal */
export const BISHOP_LONG_MG = 113;
export const BISHOP_LONG_EG = 89;
/** per own pawn on the bishop's color, Laser 1.7 BISHOP_PAWN_COLOR_PENALTY */
export const BISHOP_PAWNS_MG = -13;
export const BISHOP_PAWNS_EG = -23;
/** per rammed own pawn on the bishop's color, Laser 1.7 BISHOP_RAMMED_PAWN_COLOR_PENALTY */
export const BISHOP_RAMMED_MG = -6;
export const BISHOP_RAMMED_EG = -87;
/** a rook on a semi-open and an open file, Ethereal 12.75 RookFile */
export const ROOK_FILE_MG: StaticArray<i32> = [
  36, 154,
];
export const ROOK_FILE_EG: StaticArray<i32> = [
  97, 58,
];
/** a rook on the enemy queen's file, Stash 37 RookXrayQueen */
export const ROOK_QUEEN_FILE_MG = 52;
export const ROOK_QUEEN_FILE_EG = 72;
/** a rook hemmed in by its own king, with and without castling rights, Stash 37 RookTrapped and RookBuried */
export const ROOK_TRAPPED_MG = 159;
export const ROOK_TRAPPED_EG = -147;
export const ROOK_BURIED_MG = -194;
export const ROOK_BURIED_EG = -19;

// King safety, Ethereal 12.75 evaluateKings and evaluateKingsPawns: the safety sum's terms, in the units its square reads (pieces.ts KS_DIV_MG).
/** the pawn shield by [king's file][file][own pawn's distance, 7 for none], Ethereal 12.75 KingShelter */
export const SHELTER_MG: StaticArray<i32> = [
  448, 630, 687, 592, 573, 703, 621, 312,
  150, 216, 157, -110, 73, 128, 108, -119,
  320, 317, 238, 252, 140, 558, -44, 139,
  80, 45, -9, 25, 59, -100, -362, -60,
  -67, -1, -110, -36, -88, -70, -736, -138,
  102, 32, -108, -25, 22, 273, -880, -161,
  149, 142, 71, -36, 57, -120, 312, -54,
  -34, 36, 29, -25, -83, -60, -690, -196,
  0, 81, 76, 13, -174, -793, -820, -292,
  0, -488, -567, -714, -764, -400, -907, -838,
  0, 42, -67, -83, -136, -773, -429, -336,
  0, -180, -197, -294, -200, -470, -34, -396,
  0, -131, -147, -171, -173, -785, -114, -303,
  0, -32, -155, -142, -61, -869, -548, -297,
  0, 127, 88, -44, -61, -460, 530, -275,
  0, -61, -115, -306, -344, -676, -1098, -471,
];
export const SHELTER_EG: StaticArray<i32> = [
  301, 223, 229, 312, 403, 472, -663, 371,
  -326, -434, -424, -219, -387, -264, 117, -334,
  132, 21, 89, 53, -22, 160, 91, 17,
  198, 58, 118, -17, 33, 227, 604, 36,
  114, 30, 130, -24, -21, -154, 187, 11,
  -37, -78, 7, -145, -230, -181, 532, -6,
  -17, -85, -48, -50, -109, 348, 41, 36,
  -64, -109, -21, 81, 99, 325, -569, 95,
  0, 343, 502, 815, 912, 1108, -15, 551,
  0, -106, -135, -102, -2, 316, 20, -89,
  0, 42, 57, 9, 2, 528, -361, 40,
  0, 302, 241, 235, 178, 554, -220, 135,
  0, 248, 177, 118, -31, 412, 242, 120,
  0, -50, -11, -194, -286, 446, 126, -37,
  0, -115, -116, -118, -47, 490, 369, 89,
  0, -445, -280, -204, -7, 242, -239, -130,
];
/** the pawn storm by [blocked][file from the edge][enemy pawn's distance, 7 for none], Ethereal 12.75 KingStorm */
export const STORM_MG: StaticArray<i32> = [
  27, 589, -40, -185, -108, -69, -98, -138,
  -118, 385, -11, -72, -9, 38, 44, -134,
  239, 191, -66, -91, -21, -1, 29, -47,
  272, 344, -40, -64, 7, 70, -35, -63,
  0, -88, -54, -30, -1, -65, 50, 308,
  0, -73, -28, 51, 181, 9, 433, -62,
  0, -166, -79, -52, -89, -158, 286, 822,
  0, -5, -15, -29, 5, 62, 407, 565,
];
export const STORM_EG: StaticArray<i32> = [
  89, -41, 30, 14, -38, -92, -31, -83,
  363, 176, 114, 57, 39, -19, -9, 53,
  199, 194, 129, 57, 23, -8, -61, 20,
  -11, 20, -16, -63, -97, -115, -44, -49,
  0, -78, -92, -150, -160, -142, -116, 1264,
  0, -205, -80, 4, -92, -40, -151, 40,
  0, -302, -90, -27, 80, 86, -463, -86,
  0, -127, -252, -143, -86, -166, -11, -142,
];
/** shelter's and storm's share of the safety sum, Ethereal 12.75 SafetyShelter and SafetyStorm */
export const SAFETY_SHELTER_MG: StaticArray<i32> = [
  -302, -104, -109, 60, 148, 229, -1306, -101,
  0, -217, -225, -124, 133, -106, -743, -297,
];
export const SAFETY_SHELTER_EG: StaticArray<i32> = [
  37, -147, 15, 802, 386, -2951, 2137, -868,
  0, 386, 1295, 619, -320, -2420, -2309, -893,
];
export const SAFETY_STORM_MG: StaticArray<i32> = [
  366, 458, 280, 88, 119, 91, 77, 55,
  0, 5, 255, 32, -50, -44, 496, 1719,
];
export const SAFETY_STORM_EG: StaticArray<i32> = [
  970, 958, 1890, 51, -138, -407, -60, -619,
  0, 0, 658, -843, 654, 156, 3635, 1909,
];
/** per attacker reaching the king's area */
export const SAFETY_KNIGHT_MG = 200;
export const SAFETY_KNIGHT_EG = 1567;
export const SAFETY_BISHOP_MG = 272;
export const SAFETY_BISHOP_EG = 1258;
export const SAFETY_ROOK_MG = 295;
export const SAFETY_ROOK_EG = 875;
export const SAFETY_QUEEN_MG = 167;
export const SAFETY_QUEEN_EG = 789;
/** per attack on the area; Ethereal 12.75 SafetyAttackValue times 9/12, its rescale of the count to a 9-square area left out */
export const SAFETY_ATTACK_MG = 77;
export const SAFETY_ATTACK_EG = 120;
/** per weak square of the area */
export const SAFETY_WEAK_MG = 123;
export const SAFETY_WEAK_EG = -22;
/** the attacker has no queen */
export const SAFETY_NO_QUEEN_MG = -1511;
export const SAFETY_NO_QUEEN_EG = -1390;
/** per safe check */
export const SAFETY_CHECK_QUEEN_MG = 219;
export const SAFETY_CHECK_QUEEN_EG = 3362;
export const SAFETY_CHECK_ROOK_MG = 696;
export const SAFETY_CHECK_ROOK_EG = 3250;
export const SAFETY_CHECK_BISHOP_MG = 364;
export const SAFETY_CHECK_BISHOP_EG = 4289;
export const SAFETY_CHECK_KNIGHT_MG = 540;
export const SAFETY_CHECK_KNIGHT_EG = 2829;
/** per unsafe check, Stash 37 UnsafeCheck; its S(18, 85) restated for Ethereal 12.75 evaluateKings' divisors, then converted */
export const SAFETY_UNSAFE_MG = 65;
export const SAFETY_UNSAFE_EG = 102;
/** the sum's offset */
export const SAFETY_OFFSET_MG = -149;
export const SAFETY_OFFSET_EG = -188;

// The king's flank: its wing, four files wide, on its side's first five ranks (pieces.ts KING_FLANK). 0 turns a value off.
// Values: fit alone with every other value fixed, results/tuning.md, 2026-11-12.
/**
 * per flank square the enemy attacks, and per one it attacks twice, in the safety sum; Clockwork bedb1e8's four
 * KS_FLANK weights in its sum. Not taken: Stockfish 11 Evaluation::king's one count, squared, inside its king danger, since
 * this sum is squared whole.
 */
export const SAFETY_FLANK_ATTACK_MG = 26;
export const SAFETY_FLANK_ATTACK_EG = -4;
export const SAFETY_FLANK_ATTACK2_MG = 34;
export const SAFETY_FLANK_ATTACK2_EG = -8;
/** per flank square the king's side defends, and per one it defends twice */
export const SAFETY_FLANK_DEFENSE_MG = -9;
export const SAFETY_FLANK_DEFENSE_EG = -4;
export const SAFETY_FLANK_DEFENSE2_MG = -25;
export const SAFETY_FLANK_DEFENSE2_EG = 32;
/**
 * a penalty outside the sum, so it counts before two attackers reach the king's area: per attacked flank square,
 * with a square attacked twice counted twice; Stockfish 11 FlankAttacks. The fit put its middlegame half at 0.
 */
export const FLANK_ATTACK_MG = 4;
export const FLANK_ATTACK_EG = -13;

// Passed pawns outside the king-pawn table, Ethereal 12.75 evaluatePassed and Weiss c735b8f EvalPassedPawns.
/** by [can advance][safe to advance][rank]; each cell is Ethereal 12.75 PassedPawn's less its blocked and unsafe cell, since pawns.ts has the rank's base value */
export const PASSED_ADVANCE_MG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 87, -16, -11, -44, -28, 155, 0,
  0, 51, 16, -22, -28, -48, 311, 0,
  0, 116, 58, 16, -5, -36, 422, 0,
];
export const PASSED_ADVANCE_EG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 81, 72, 122, 87, 216, 102, 0,
  0, 116, 78, 172, 139, 344, 572, 0,
  0, 65, -13, 192, 326, 899, 1360, 0,
];
/** no enemy piece or attack on the pawn or its path, Ethereal 12.75 PassedSafePromotionPath */
export const PASSED_SAFE_PATH_MG = -130;
export const PASSED_SAFE_PATH_EG = 338;
/** an own rook behind the pawn on its file, Weiss c735b8f PassedRookBack */
export const PASSED_ROOK_BEHIND_MG = 56;
export const PASSED_ROOK_BEHIND_EG = 107;

// Threats, Ethereal 12.75 evaluateThreats: against the side named, except the push.
export const THREAT_WEAK_PAWN_MG = -72;
export const THREAT_WEAK_PAWN_EG = -360;
export const THREAT_MINOR_BY_PAWN_MG = -308;
export const THREAT_MINOR_BY_PAWN_EG = -476;
export const THREAT_MINOR_BY_MINOR_MG = -142;
export const THREAT_MINOR_BY_MINOR_EG = -234;
export const THREAT_MINOR_BY_MAJOR_MG = -138;
export const THREAT_MINOR_BY_MAJOR_EG = -499;
export const THREAT_ROOK_BY_LESSER_MG = -299;
export const THREAT_ROOK_BY_LESSER_EG = -342;
export const THREAT_MINOR_BY_KING_MG = -52;
export const THREAT_MINOR_BY_KING_EG = -379;
export const THREAT_ROOK_BY_KING_MG = -330;
export const THREAT_ROOK_BY_KING_EG = -279;
export const THREAT_QUEEN_MG = -324;
export const THREAT_QUEEN_EG = -279;
export const THREAT_OVERLOADED_MG = -11;
export const THREAT_OVERLOADED_EG = -74;
export const THREAT_PUSH_MG = 61;
export const THREAT_PUSH_EG = 160;

// Complexity, Ethereal 12.75 evaluateComplexity: the endgame half's adjustment, seeded from its four terms.
export const COMPLEXITY_PAWNS = 17;
export const COMPLEXITY_FLANKS = 496;
export const COMPLEXITY_ENDGAME = 278;
export const COMPLEXITY_OFFSET = -794;

// ---------------------------------------------------------------- search

/*
 * A value's comment cites the seed it started from, in its source's unit. The values
 * here are tuned since, so a seed records where a value began, not what it is.
 */

// ------------------------ search: iterative deepening

/** aspiration windows, Ethereal 0e47e9b aspirationWindow: from depth 4, delta 10 at its PawnValue 82, widened by half; search.ts think names where the form differs */
export const ASP_DEPTH = 4;
export const ASP_DELTA = 61;

// ------------------------ search: table, draws and repetition

/**
 * 1: at a node not expected to cut, the table cuts on a fail low only (Ethereal 311d110 search); 0 turns it off.
 * Stockfish 43e100ae Search::Worker::search's form, the node type equal to the bound's side up to a depth, is not taken.
 */
export const TT_CUT_NODE = 1;
/**
 * 1: a result for a key the table already holds overwrites an entry left by an earlier search, however deep that entry is
 * (Berserk fe1363a TTPut). 0 keeps a deeper entry of any age against a result that is not exact. A probe does
 * not refresh an entry's age, as in Berserk: with a refresh, the entry a node stores over would always be of this search.
 */
export const TT_AGE_STORE = 1;
/**
 * A draw by repetition or the fifty-move rule scores +DRAW_JITTER or -DRAW_JITTER by a bit of the node count, so drawn
 * lines do not all look equal to the search: Stash 767fdb1 draw_score's (nodes & 2) - 1 at its PAWN_MG_SCORE 74. 0 scores
 * every draw 0. Weiss e9021fb AlphaBeta's 8 - (nodes & 7) leans every draw toward the side to move, the form not taken.
 */
export const DRAW_JITTER = 6;
/**
 * 1: a node with depth left whose side to move can repeat an earlier position raises alpha to the draw score before
 * its table probe (cycle.ts upcomingRepetition; Stockfish 91a76331 search's Step 3). The repeating move's child
 * returns the draw score, so on the plain tree the raise changes no value. 2: the horizon node raises too, before its
 * quiescence search (Stockfish e4f8a4fa search; Stash 079fcba search), where the quiet repeating move is not in the
 * tree and the raise adds it. 0 turns both off. Stockfish b7b7a3f3 qsearch raises inside the quiescence search as
 * well, the placement not taken.
 */
export const UPCOMING_REP = 2;

// ------------------------ search: pruning before the move loop

/** reverse futility, Stash f91e750 search: depth <= 7, 86 per ply less 79 when improving, at its PAWN_MG_SCORE 103 */
export const RFP_DEPTH = 7;
export const RFP_MARGIN = 377;
export const RFP_IMPROVING = 338;

/** razoring, Stash f91e750 search: depth <= 3, static eval + 120 per ply <= alpha, at its PAWN_MG_SCORE 103 */
export const RAZOR_DEPTH = 3;
/** at this depth or less, razoring returns qsearch's score without the null-window test */
export const RAZOR_QS_DEPTH = 2;
export const RAZOR_MARGIN = 673;
/**
 * 1: the last clause of Stash 13ac9e7 search's razoring. When the null-window qsearch does not fail low and beats beta by
 * one ply's margin, the node is searched a ply shallower. 0 turns it off. Clockwork 641d9f5 Worker::search tests qsearch
 * at alpha itself, down to depth 7 with a wider margin, the form not taken.
 */
export const RAZOR_DROP = 1;

/** null move, Ethereal 12.75 search: R = 4 + depth / 6 + min(3, (eval - beta) / 200), at its PawnValue 82 */
export const NMP_DEPTH = 2;
export const NMP_BASE = 4;
export const NMP_DEPTH_DIV = 6;
export const NMP_EVAL_DIV = 1144;
export const NMP_EVAL_MAX = 3;
/**
 * 1: the null move is tried at an expected cut node only (Stash f91e750 search); 0 tries it at every non-PV node, as
 * Ethereal 12.75 search does.
 */
export const NMP_CUT_NODE = 1;
/**
 * The null move needs the eval at or above beta by this much: Stash 8546bfe search's 30 at its PAWN_MG_SCORE 103. 0 gives
 * the plain test, eval >= beta.
 */
export const NMP_EVAL_MARGIN = 149;
/**
 * 1: the null move also needs the static eval at or above beta + NMP_STATIC_BASE - NMP_STATIC_PER * depth, Weiss c735b8f
 * AlphaBeta: 138 and 13 at its P_MG 104, a gate that eases with depth. 0 turns it off. Stockfish 11 search's gate also
 * eases when improving, the form not taken.
 */
export const NMP_STATIC = 1;
export const NMP_STATIC_BASE = 648;
export const NMP_STATIC_PER = 68;

/** ProbCut, Stash f91e750 search: depth >= 6, beta + 152 at its PAWN_MG_SCORE 103, a capture's reduced search at depth - 4 */
export const PROBCUT_DEPTH = 6;
export const PROBCUT_MARGIN = 833;
export const PROBCUT_REDUCTION = 4;

/** internal iterative reduction, Berserk 03cebd6 Negamax: PV or cut node, depth >= 4, no TT move */
export const IIR_DEPTH = 4;

// ------------------------ search: extensions

/**
 * singular extensions, Stash f91e750 search's gate and margin: TT depth >= depth - 3, singular beta = TT score - 10 d / 16 at its
 * PAWN_MG_SCORE 103. SE_DEPTH 6: the least depth, Stockfish 11 search's; Stash's 7 gives the play before it, and Weiss c735b8f
 * AlphaBeta's 5 is the form not taken
 */
export const SE_DEPTH = 6;
/**
 * the singular search's depth is depth / 2 plus this. 0 is Clockwork 641d9f5 Worker::search's; 1 is Stash f91e750 search's and
 * gives the play before it. Ethereal f71ac47 singularity's (depth - 1) / 2 is the form not taken
 */
export const SE_SEARCH_ADD = 0;
export const SE_TT_DEPTH = 3;
export const SE_MARGIN = 54;
export const SE_MARGIN_DIV = 16;
/** a double extension at a non-PV node whose singular search fails low by more than 14, while the line has at most 10: Stash f91e750 search at its PAWN_MG_SCORE 103 */
export const SE_DOUBLE_MARGIN = 88;
export const SE_DOUBLE_MAX = 10;
/**
 * a double extension becomes a triple when the TT move is quiet and the singular search fails low by more than this, Stash 4f1ccc1
 * search's 120 at its PAWN_MG_SCORE 103; 100000000 turns it off. Clockwork 641d9f5 Worker::search lowers the margin by the move's
 * history instead
 */
export const SE_TRIPLE_MARGIN = 615;
/**
 * plies taken off a TT move that is not singular, where the TT score itself does not reach beta; 0 turns each off.
 * SE_NEG_CUT: at a cut node, Weiss c735b8f AlphaBeta; Berserk d7e1f05 Negamax takes two.
 * SE_NEG_ALPHA: when the TT score is at or below alpha, Ethereal f71ac47 singularity
 */
export const SE_NEG_CUT = 1;
export const SE_NEG_ALPHA = 1;
/** the check extension's plies, on the move in the parent (Stash f91e750 search); 0 turns it off, for the flag screen */
export const CHECK_EXT = 1;

// ------------------------ search: pruning in the move loop

/**
 * late move pruning's move count at depth d, (BASE + PER_DEPTH * d + PER_DEPTH_SQ * d * d) >> 10, one set not improving
 * and one improving; initSearch fills a table from them up to LMP_DEPTH. The form is Ethereal 1eff740 initSearch, a
 * quadratic by depth per row. These values give Ethereal 12.75 LateMovePruningCounts exactly at depths 1 to 8, so the
 * tree is the table's; the improving row needs the linear term for that. Not taken: Stockfish 7cdd5e89 search's
 * (3 + depth * depth) / (2 - improving), and Ethereal 1eff740's own coefficients, which each play another tree.
 * search.ts counts moves played against it, where Ethereal counts quiets seen.
 */
export const LMP_DEPTH = 8;
export const LMP_BASE = 2900;
export const LMP_PER_DEPTH = 0;
export const LMP_PER_DEPTH_SQ = 465;
export const LMP_IMPROVING_BASE = 5400;
export const LMP_IMPROVING_PER_DEPTH = -960;
export const LMP_IMPROVING_PER_DEPTH_SQ = 1048;

/** futility on the reduced depth, Ethereal 0e47e9b search: eval + 77 + 52 per ply <= alpha at its PawnValue 82; history limits by improving, Ethereal 12.75 FutilityPruningHistoryLimit */
export const FUT_DEPTH = 8;
export const FUT_BASE = 514;
export const FUT_PER_DEPTH = 479;
export const FUT_HISTORY: StaticArray<i32> = [12000, 6000];

/**
 * history pruning, Ethereal 0e47e9b search's continuation pruning: 1- or 2-ply continuation history below a limit, by
 * improving, one ContinuationPruningDepth and ContinuationPruningHistoryLimit pair for both tables. Ethereal 12.75 search's
 * limit and depth per table, CounterMoveHistoryLimit and FollowUpMoveHistoryLimit, is the form not taken
 */
export const HIST_PRUNE_DEPTH: StaticArray<i32> = [3, 2];
export const HIST_PRUNE_LIMIT: StaticArray<i32> = [-1000, -2500];

/**
 * SEE pruning, Ethereal 12.75 search: depth <= 9, quiets below SEEQuietMargin -64 per ply, noisy below SEENoisyMargin -19 per
 * ply squared. As seeds, at its SEEPieceValues pawn 100, they are 256 and 76 in SEE_VALUE's unit
 */
export const SEE_DEPTH = 9;
export const SEE_QUIET = 174;
export const SEE_NOISY = 84;
/**
 * a quiet's bar moves by its history, in 1/1024 of SEE's unit per point: Clockwork f236181 Worker::search's form, at Clockwork
 * 641d9f5's see_pvs_hist_mult 17 and f236181 SEE::value's pawn 100, on a sum of tables with this limit; 0 turns it off.
 * Stockfish 17 search moves a capture's bar by its capture history, the form not taken
 */
export const SEE_HISTORY = 85;

/**
 * futility for the bad captures, Clockwork 662c568 Worker::search: at depth <= 8, not in check, once the picker reaches them,
 * static eval + 75 per ply <= alpha ends the move loop, and the score rises to that estimate; converted by Clockwork 641d9f5's
 * PAWN_MAT middlegame pawn 112. A depth of 0 turns it off. Stockfish 15 search's test per capture, with the victim and
 * capture history, is the form not taken.
 */
export const BAD_NOISY_FUT_DEPTH = 8;
export const BAD_NOISY_FUT_MARGIN = 176;

/**
 * the reduced depth futility and history pruning read: depth less one ply, less base + ln(depth) ln(moves) / div, the logs
 * scaled by 1024 and the sum in 1/1024 ply, Ethereal 0e47e9b search's lmrDepth. It has its own values, so LMR's can move
 * without moving the pruning. Its seeds are LMR's: Ethereal 12.75 initSearch's 0.75 less the ply that Ethereal counts for the
 * move itself, and 2.25, where 0e47e9b initSearch has 0.7844 and 2.4696
 */
export const PRUNE_BASE = -318;
export const PRUNE_DIV = 1527;

// ------------------------ search: reductions

/**
 * late move reductions in 1/1024 ply, the terms summed before the sum is cut to whole plies (Clockwork 641d9f5 Worker::search),
 * where Ethereal 12.75 search adds whole plies. The sum counts plies past the move's own, so 0 is no reduction, where
 * Ethereal's R = 1 is. Base + ln(depth) ln(moves) / div is Ethereal 12.75 initSearch's 0.75 + ln d ln m / 2.25 less that one
 * ply, with the logs scaled by 1024. A non-PV node, a node not improving and a move from before the quiet stage are its
 * terms, and history moves the sum by whole steps, capped
 */
export const LMR_MIN_DEPTH = 3;
export const LMR_BASE = -226;
export const LMR_DIV = 2321;
export const LMR_NON_PV = 1204;
/**
 * 1: the non-PV term skips a node whose TT entry has the PV bit, a node that is or was on a PV (Berserk f05f9dc Negamax);
 * qsearch then keeps the bit when it stores. 0 turns it off. Clockwork 04f2f0e Worker::search takes a ply off at every
 * such node and adds one when the TT score is at or below alpha, the form not taken.
 */
export const LMR_TT_PV = 1;
export const LMR_NOT_IMPROVING = 1114;
export const LMR_EARLY_STAGE = 1037;
export const LMR_HISTORY_STEP = 906;
export const LMR_HISTORY_DIV = 5327;
export const LMR_HISTORY_MAX = 2;
/**
 * terms that reduce more, in 1/1024 ply, at Clockwork 641d9f5 Worker::search's tuned values: a cut node (Weiss 95b0951
 * AlphaBeta adds two plies); a quiet when the TT move is noisy; a node whose children have failed high more than LMR_FAIL_HIGH_COUNT times;
 * and each time a move has raised alpha here. 0 turns a term off
 */
export const LMR_CUT_NODE = 1151;
export const LMR_TT_NOISY = 936;
export const LMR_FAIL_HIGH = 888;
export const LMR_FAIL_HIGH_COUNT = 3;
export const LMR_ALPHA_RAISE = 570;
/**
 * late move reductions on noisy moves: their own base and divisor, Weiss 95b0951 InitReductions' 0.38 + ln d ln m / 3.76,
 * restated for a sum where 0 is no reduction and a node neither PV nor improving adds 2. Capture history moves it by whole
 * steps, at Weiss AlphaBeta's divisor 8870 scaled from its table's limit 14387 to 16384. A depth of 200 turns them off
 */
export const LMR_NOISY_MIN_DEPTH = 3;
export const LMR_NOISY_BASE = -1567;
export const LMR_NOISY_DIV = 4063;
export const LMR_NOISY_HISTORY_DIV = 9206;
/**
 * the re-search after a reduced search beats alpha: a ply deeper if it beat the best by more than LMR_DEEPER, Clockwork 641d9f5
 * Worker::search's 94 by its PAWN_MAT middlegame pawn 112; else a ply shallower if it beat the best by less than LMR_SHALLOWER per ply of depth.
 * 100000000 and 0 turn them off
 */
export const LMR_DEEPER = 218;
export const LMR_SHALLOWER = 3;
/** 1: a quiet's continuation history takes the re-search's result; 0 turns it off */
export const LMR_CONT_UPDATE = 1;

// ------------------------ search: move ordering and history

/** SEE values by piece type (none, P, N, B, R, Q, K); the king is never captured */
export const SEE_VALUE: StaticArray<i32> = [0, 400, 1200, 1200, 2000, 3600, 0];

/** most valuable victim by piece type, Clockwork 641d9f5 score_move */
export const MVV: StaticArray<i32> = [0, 800, 2400, 2400, 4800, 7200, 0];

/** a capture is tried among the good ones if SEE >= -score / this, Clockwork 641d9f5 MovePicker::next's movepicker_see_capthist_divisor 51 at its PAWN_MAT 112 */
export const GOOD_CAPTURE_DIV = 14;

/**
 * 1: a queen promotion without a capture is picked among the captures, as Stockfish 10 make_promotions lists it, so a node
 * that skips its quiets still tries it; 0 leaves it first among the quiets
 */
export const PROMO_NOISY = 1;

/**
 * what a quiet's history knows, each part with an off value that gives the play before it.
 * THREAT_HISTORY 1: the butterfly table is also indexed by whether the move's from and to squares are attacked by the
 * opponent (Ethereal 341c43f underlying_quiet_history); 0 turns it off.
 * PAWN_HISTORY 1: a table by pawn structure, piece and square orders quiets beside the others, within HIST_PAWN_MAX
 * (Stockfish b0658f09 PawnHistory's 512 structures and limit 8192); 0 turns it off.
 * HIST_DEEP_MARGIN: a cut that beats beta by this much rewards and penalizes as from one ply deeper, Clockwork 641d9f5
 * Worker::search's 100 by its PAWN_MAT middlegame pawn 112; 100000000 turns it off
 */
export const THREAT_HISTORY = 1;
export const PAWN_HISTORY = 1;
export const HIST_PAWN_MAX = 8192;
export const HIST_DEEP_MARGIN = 234;

/**
 * 1: the move six plies back orders quiets and takes their bonus, Clockwork 3dd022c History::get_conthist and
 * update_quiet_stats; 0 turns it off. It stays out of the history sum that pruning and reductions read, as the 4-ply table
 * does. Stockfish 7cdd5e89 update_continuation_histories gives this table a smaller bonus, the form not taken
 */
export const CONT6 = 1;

/** history bonus and malus, Weiss c735b8f Bonus and Malus: min(2418, 251 d - 267) and min(693, 532 d - 163) */
export const HIST_BONUS_MUL = 283;
export const HIST_BONUS_SUB = 222;
export const HIST_BONUS_MAX = 2555;
export const HIST_MALUS_MUL = 544;
export const HIST_MALUS_SUB = 169;
export const HIST_MALUS_MAX = 644;
/**
 * 1: a fail high, or a TT cut on a lower bound, takes the malus of depth + 1 from the continuation entries of the parent's
 * move, when that move is quiet and was the first one played at its node (at a TT cut: the first or second). Stockfish 11
 * update_all_stats' and search's "extra penalty". 0 turns it off. Stockfish also counts the parent's first killer.
 */
export const HIST_PRIOR_MALUS = 1;
/**
 * From this depth, or at any depth at a PV node, a node where no move raised alpha gives the bonus to the continuation
 * entries of the parent's quiet move, which caused the fail low (Stockfish 8fd34d77 search; Stockfish 11 search's depth 3).
 * 0 turns it off.
 */
export const HIST_PRIOR_BONUS_DEPTH = 3;

// ------------------------ search: quiescence

/**
 * qsearch futility, the per-capture shape of Stash f91e750 qsearch: a capture that gives no check is skipped if stand pat + its
 * victim's MAT_EG + QS_DELTA cannot reach alpha. QS_DELTA is Stash's 98 at its PAWN_MG_SCORE 103, where
 * vendor/cpw/pages/Delta_Pruning.wiki names 200 centipawns, which is 1040 here. The victim is in the eval's unit, as stand pat
 * and alpha are, so SEE_VALUE, which is narrower, does not fit this test. Ethereal 12.75 qsearch's one test per node, on the
 * best capture, is the form rejected.
 * QS_SEE 1: when stand pat + QS_DELTA alone cannot reach alpha, a capture that wins nothing by SEE is skipped too (Stash
 * 007850d qsearch); 0 turns it off.
 * QS_EVASIONS 1: in check, once a move has a score that is not a mate, only captures and promotions that pass SEE are searched
 * (Weiss 95b0951 Quiescence); 0 searches every evasion, as Stash does. Stockfish 15 qsearch stops after two quiet evasions, the
 * form not taken.
 */
export const QS_DELTA = 665;
export const QS_SEE = 1;
export const QS_EVASIONS = 1;

// ------------------------ search: correction history

/** correction history, Stash f91e750 update_correction_histories: each table's entry within 32 at its PAWN_MG_SCORE 103 (CORRECTION_HISTORY_MAX); an update weighs 1 + depth, at most 16, of 256 */
export const CORR_MAX = 163;
/**
 * 1: a sixth table, by the last two moves, corrects the static eval with the other five's weight and update,
 * Clockwork e774be4 History::get_correction; 0 turns it off. Weiss 3f9eb09 GetCorrectionHistory gives it its own divisor,
 * the form not taken
 */
export const CORR_CONT = 1;
export const CORR_WEIGHT_MAX = 16;

// ---------------------------------------------------------------- time

/** Weiss c735b8f InitTimeManagement: sudden death uses a share of the time left, at most 0.2 of the clock; its 0.022 scaled so that the soft limit's score factor keeps mean time use */
export const TM_SHARE = 0.0296;
export const TM_SHARE_CAP = 0.2;
/** with moves to go, 0.7 over min(moves to go, 50) (Weiss c735b8f InitTimeManagement) */
export const TM_MTG_SHARE = 0.7;
export const TM_MTG_CAP = 50;
/** the increments counted ahead (Weiss c735b8f InitTimeManagement's 50) */
export const TM_INC_MOVES = 50.0;
/** with an increment under the overhead, the moves counted ahead per millisecond of clock: Stockfish 23493de0 TimeManagement::init's one per 20 ms, so the count falls under one second */
export const TM_INC_MOVES_PER_MS = 0.05;
/** hard limit: 5 times the soft one, at most 0.8 of the clock (Weiss c735b8f InitTimeManagement) */
export const TM_HARD_MUL = 5.0;
export const TM_HARD_CAP = 0.8;
/** clock milliseconds held back per move for the host and the match runner */
export const TM_OVERHEAD = 10.0;
/**
 * node share of the best move, Weiss 1401211 IterativeDeepening's form with Weiss 693b322 IterativeDeepening's values: stop past
 * soft * (0.52 + 3.73 * (1 - share)). 1401211 measured 0.5 + 2.5 beside its live `uncertain` veto; 693b322 tuned these after
 * Weiss 7608ca3 AspirationWindow left that veto always false
 */
export const TM_NODE_BASE = 0.52;
export const TM_NODE_MUL = 3.73;
/** score fall over three iterations, Berserk 787b2e1b Search: the soft limit times 0.1127 + 0.0262 per centipawn, within 0.5028 and 1.6561; an NNUE-era value, read as 4 units per centipawn */
export const TM_FALL_BASE = 0.1127;
export const TM_FALL_PER = 0.00655;
export const TM_FALL_MIN = 0.5028;
export const TM_FALL_MAX = 1.6561;
/** the soft limit with one legal move, Weiss d7d1334 IterativeDeepening's cap */
export const TM_ONE_MOVE = 500.0;
