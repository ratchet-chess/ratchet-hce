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
export const MAT_MG: StaticArray<i32> = [0, 267, 1757, 1460, 2014, 4376, 0];
export const MAT_EG: StaticArray<i32> = [0, 700, 2463, 2508, 4596, 8075, 0];

/** the side to move's bonus, added as a (middlegame, endgame) pair before the blend (Stash 37 Initiative). Feature: Tempo. */
export const TEMPO_MG = 132;
export const TEMPO_EG = 309;

/** KXK mop-up, vendor/cpw/pages/Mop-up_Evaluation.wiki: per step of the bare king's center distance, and per step the kings close */
export const MOPUP_EDGE = 80;
export const MOPUP_CLOSE = 32;
/**
 * KBNK: per step the bare king nears a corner of the bishop's color (eval.ts cornerDistance). Twice MOPUP_EDGE, so a
 * step along an edge toward that corner gains even where the edge term falls
 */
export const MOPUP_CORNER = 160;

// Piece-square tables from White's side, indexed by square: a1 = 0, so rank 1 is the
// first row. Hand-seeded, then Texel-tuned; results/tuning.md names each fit's dataset.
export const PAWN_MG: StaticArray<i32> = [
     0,   0,   0,   0,   0,   0,   0,   0,
     35,   65,   102, 70, 106,  171,  199,  28,
     -2,   30,   90,   141,   161,   106,   85,   10,
    51,  70,  102,  173,  203,  174,  87,  54,
    163,  139,  199,  164,  232,  235,  132,  152,
    224,  185,  223,  243,  237,  292,  267,  286,
   214, -56, 202, 288, 366, -33, -232, -121,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,    0,    0,    0,    0,    0,    0,    0,
     484,  432,  352,  408,  459,  385,  376, 371,
   456,  384, 325,  299,  383, 428, 390, 381,
     518,  452,  332, 240, 256, 381,  463,  397,
    628,   497,  345,  285, 249,  403,  509,    537,
   683,  619,  523,  272,  354,  495,  639,  614,
   257,  534,  558,  317,  365,  552,  813,  415,
     0,    0,    0,    0,    0,    0,    0,    0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  217,  89, 38, 121,  129,  130,  51,  57,
  -11, 115,   76,   67,   127,  70,   92,  159,
   107,   108,  140,  115,  135,  134,  164,  156,
   200,  222,  196,  174,  188,  237,  249,   160,
    170,  207,  258,  184,  137,  223,  225,  275,
  171,  145,  122,  192,  148,  124,  169,  113,
  246,  78,  280,  312,   195,  246,   237,   328,
  -581, -227, -132,  240,  318, -241, -10, -122,
];
export const KNIGHT_EG: StaticArray<i32> = [
  -9, 277,  367,   405,  425,  194, 377, 125,
  239,  334,    438,   537,   469,  406,  324, 384,
   321,   565,   514,  702,   664,   523,  460,  392,
   515,   522,  733,  790,  811,  696,   623,  629,
   660,   618,  732,  855,  833,   833,   713,  539,
   631,  693,   847,   856,   824,   889,  618, 529,
   392,   544,  535,   499,   650, 493,  389, 321,
  -210, 414,    720, 304, 488,  610, 641, -907,
];
export const BISHOP_MG: StaticArray<i32> = [
   133,   163,    39,  40,   144,   10, 146,  17,
    114,  114,  176,   95,  118,  252,  233,   208,
    30,  228,  123,  140,  149,  151,  227,  210,
    105,  40,  146,  180,  175,  144,   94,   148,
    -16,   102,  56,  122,  58,  122,   116,   66,
   117,  67,  -77,  31,  27,  74,  245,   185,
    -42,  -135,   48,  112,  -46,  78,  -284, -78,
    -251,   -95, -284, -234, -329, -8,   -368,  -312,
];
export const BISHOP_EG: StaticArray<i32> = [
   654,   581,  751,   888,    789,  798,    750,  678,
   708,  648,    665,   809,   829,    696,  577,  366,
   825,   834,   808,   922,   960,   776,    784,  769,
    728,   911,   984,  1005,   949,   905,   997,  702,
    912,   923,   954,   1059,   1057,   939,   891,   830,
    841,   926,   938,   960,   1066,   918,   916,   870,
   829,   851,   902,   877,  882,   961,   977,  835,
   866,  939,   1058,   999,   1019,  889,  963, 680,
];
export const ROOK_MG: StaticArray<i32> = [
   -68,   -49,   -78,  -46,  -7,   -18,  -6,  -17,
  -166,   -129,  -40,   -28,   -17,   -66,   49, -123,
  -105,  -107,  -71,  -38,   54,   -7,   92,  -67,
  -144,  -86,   -104,   -87,   -1,   -125,  79,  -95,
   -143,   -52,  10,  -14,  -1,  1,   168,  100,
    -54,  4,  -17,  87,  74,  206,  213,  60,
   -127,  -120,  123,  92,  80,  46,   36,  82,
   109,  110,  6,  195,  22,   45,   274,  159,
];
export const ROOK_EG: StaticArray<i32> = [
    1024,   1024,   1103,   1032,   1004,   1021,   963,  898,
    1097,   1027,   1088,   1061,    1103,   1080,    961,   990,
    1077,   1164,   1132,   1077,   1077,   1073,    991,   968,
    1237,   1289,   1303,   1205,   1180,   1272,  1193,   1173,
    1370,   1367,  1344,   1294,   1274,   1333,   1307,   1191,
    1387,   1378,   1382,   1250,   1266,   1334,  1260,   1311,
    1434,   1452,   1348,   1378,  1396,   1444,   1354,   1359,
    1383,   1382,  1458,   1331,   1521,   1450,   1328,   1374,
];
export const QUEEN_MG: StaticArray<i32> = [
   185,  235,  234,   255,  267, 263, 177, 203,
  281,  297,   298,   288,   281,   366,    392,   232,
  244,   238,  264,   200,  231,    266,   301,   257,
   244, 53,  177,  107,  123,  150,   266,   164,
  246, 165,  41,  57,   54,   147,  132,  224,
   264, 142,  55,   110,   -8,  250,  181,  308,
   21, 33,  143,   90, -20,  106,   80,  303,
   83, 36,  20, 57,  180,  68,  361,   159,
];
export const QUEEN_EG: StaticArray<i32> = [
  1413, 1200, 1255, 1210,  1234, 1153, 1183, 1099,
  1294, 1197, 1294, 1406,  1417, 1093, 946, 1260,
   1377, 1544,   1594,  1645,   1586,   1556,   1462,  1469,
  1528,  1999,   1747,  1984,  1881,  1820,  1722,   1724,
    1492,   1746,   1920,  1903,  2002,  1724,  2098,  1724,
   1454,   1774,   1883,  1877,  2110,  1773,   1835,  1800,
  1761,   1644,  1758,  1984,  2057,  1745,   1915,  1807,
  1722,  1994,  1978,  1955,   1912,  1886, 1796,  1908,
];
export const KING_MG: StaticArray<i32> = [
   -225,  -158,   -154, -255,   16, -148,  194,  198,
    -56,  -211,  -60, -205, -195,  -91,  55,  213,
    93,  5, -105, -245, -210, -38,  87, 20,
  -25,   -29, -188, -424, -345, -143, 67, -42,
    6,  -10,  -162, -495, -364, -125,  63, 35,
    -32,  -22,  -78,   -312,  -485,  -102,  -1,  101,
   300,   0,   -72,  -260,   -312,  -138, 130, 317,
   196,  208,  230,  -219, -527, 8,  224,  50,
];
export const KING_EG: StaticArray<i32> = [
  -471, -453, 207,  -135, -298,  -82, -267, -213,
  -176,  -418,   243,   -67,   23,   28,  -87, 94,
  -268,  -353,   377,  91,  149,  108,   -44,  157,
   -276,  -257,  463,  250,  302,  260,   47,   117,
   -116,  -48,  599,  426,  427,  432,  240,   284,
    18,   112,   709,   353,   412,  561,  492,   419,
  -503,   184,   802,   278,   483,  593,  442,  -93,
  -1655, -277, 776, 135,    398,   502,   209,  -1464,
];

// ---------------------------------------------------------------- pawns
// Stash 37 kp_eval.c, converted by its PAWN_MG_SCORE 103; each pair is (middlegame, endgame). Feature: Pawn_Structure.

/** a backward pawn that is not isolated, on a file an enemy pawn closes: its stop square attacked by an enemy pawn and out of reach of its own, Ethereal 12.75 PawnBackwards. Feature: Backward_Pawn. */
export const PAWN_BACKWARD_MG = 19;
export const PAWN_BACKWARD_EG = -98;
/** the same on a file no enemy pawn closes, Stash 37 BackwardPenalty. Feature: Backward_Pawn. */
export const PAWN_BACKWARD_OPEN_MG = -87;
export const PAWN_BACKWARD_OPEN_EG = -138;
/** a pawn with a friendly pawn directly behind it, Stash 37 DoubledPenalty. Feature: Doubled_Pawn. */
export const PAWN_DOUBLED_MG = -45;
export const PAWN_DOUBLED_EG = -221;
/** a pawn with a friendly pawn two ranks behind it, Weiss 4024a5e PawnDoubled2; Lynx 8940a21e file-indexed table not taken. Feature: Doubled_Pawn. */
export const PAWN_DOUBLED2_MG = -24;
export const PAWN_DOUBLED2_EG = -121;
/** an isolated pawn on a file an enemy pawn closes, Stash 37 IsolatedPenalty. Feature: Isolated_Pawn. */
export const PAWN_ISOLATED_MG = 15;
export const PAWN_ISOLATED_EG = -60;
/** an isolated pawn on a file no enemy pawn closes, Stockfish 8c3d9d99 WeakUnopposed; flat Weiss 2.0 form not taken. Feature: Isolated_Pawn. */
export const PAWN_ISOLATED_OPEN_MG = -51;
export const PAWN_ISOLATED_OPEN_EG = -148;
/** a pawn rammed against an enemy pawn on relative ranks 5 and 6, Stockfish 7225d254 BlockedPawn. Feature: Pawn_Rams_(Bitboards). */
export const PAWN_BLOCKED_5_MG = -91;
export const PAWN_BLOCKED_5_EG = -63;
export const PAWN_BLOCKED_6_MG = -69;
export const PAWN_BLOCKED_6_EG = -31;
/** a passed pawn by relative rank: no enemy pawn ahead on its file or the next; Stash 37 PassedBonus. Feature: Passed_Pawn. */
export const PAWN_PASSED_MG: StaticArray<i32> = [0, -315, -332, -380, -185, 693, 662, 0];
export const PAWN_PASSED_EG: StaticArray<i32> = [0, 45, 240, 309, 375, 42, 877, 0];
/** a candidate by relative rank: not passed, no enemy pawn ahead on its file, and every square of its path an enemy pawn attacks is attacked as often by its own; seeded from Ethereal 12.75 PawnCandidatePasser at its PawnValue 82. Feature: Candidate_Passed_Pawn. */
export const PAWN_CANDIDATE_MG: StaticArray<i32> = [0, -62, -74, -49, 7, 32, 0, 0];
export const PAWN_CANDIDATE_EG: StaticArray<i32> = [0, -17, 51, 159, 285, 424, 0, 0];
/** a pawn with a friendly pawn beside it on the next file, by relative rank; Stash 37 PhalanxBonus. Feature: Connected_Pawns. */
export const PAWN_PHALANX_MG: StaticArray<i32> = [0, 59, 107, 115, 220, 496, -508, 0];
export const PAWN_PHALANX_EG: StaticArray<i32> = [0, -34, 29, 110, 318, 1409, 3803, 0];
/** a pawn defending a friendly pawn, by the defender's relative rank; Stash 37 DefenderBonus. Feature: Connected_Pawns. */
export const PAWN_DEFENDER_MG: StaticArray<i32> = [0, 109, 74, 76, 172, 502, 0, 0];
export const PAWN_DEFENDER_EG: StaticArray<i32> = [0, 76, 67, 171, 523, 748, 0, 0];
/** a passed pawn, per step of its distance from its own king, by relative rank; seeded by lines through the earlier table, ranks 1 and 2 from Ethereal 12.75 PassedFriendlyDistance at its PawnValue 82. Feature: King_Pawn_Tropism. */
export const PASSED_OUR_KING_MG: StaticArray<i32> = [0, -2, 15, 55, 66, -59, -43, 0];
export const PASSED_OUR_KING_EG: StaticArray<i32> = [0, 1, -26, -107, -167, -151, -201, 0];
/** the same from the enemy king */
export const PASSED_THEIR_KING_MG: StaticArray<i32> = [0, 20, 31, 24, -15, -46, 13, 0];
export const PASSED_THEIR_KING_EG: StaticArray<i32> = [0, -21, -20, 52, 173, 316, 409, 0];

// ---------------------------------------------------------------- endgame scaling
// Stash 37 eval_scale_endgame: the endgame half times a factor of 256, set by hand
// there as here, so the tuner leaves it alone. Feature: Draw_Evaluation.

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
// PawnValue 82, Weiss c735b8f's P_MG 104, Laser 1.7's PIECE_VALUES pawn 100. Feature: Material.

/** mobility by count, Stash 37 KnightMobility, BishopMobility, RookMobility and QueenMobility. Feature: Mobility. */
export const MOB_KNIGHT_MG: StaticArray<i32> = [
  -679, -510, -424, -373, -327, -283, -236, -185,
  -183,
];
export const MOB_KNIGHT_EG: StaticArray<i32> = [
  43, 578, 792, 877, 904, 948, 937, 918,
  846,
];
export const MOB_BISHOP_MG: StaticArray<i32> = [
  -59, 14, 79, 91, 109, 126, 130, 136,
  145, 153, 175, 212, 236, 153,
];
export const MOB_BISHOP_EG: StaticArray<i32> = [
  8, 351, 547, 672, 733, 788, 847, 875,
  879, 905, 857, 867, 807, 870,
];
export const MOB_ROOK_MG: StaticArray<i32> = [
  -363, -70, 38, 39, 40, 20, 40, 35,
  62, 92, 84, 102, 120, 138, 211,
];
export const MOB_ROOK_EG: StaticArray<i32> = [
  53, 475, 678, 765, 837, 891, 930, 948,
  991, 1005, 1059, 1085, 1081, 1069, 1061,
];
export const MOB_QUEEN_MG: StaticArray<i32> = [
  -194, -442, -152, -106, -95, -111, -133, -146,
  -135, -121, -123, -112, -105, -91, -88, -114,
  -114, -82, -92, -34, 3, 51, 1, 59,
  48, -164, -877, -574,
];
export const MOB_QUEEN_EG: StaticArray<i32> = [
  -536, 1285, 1539, 1817, 2095, 2423, 2657, 2895,
  2935, 2958, 3020, 3041, 3058, 3047, 3098, 3174,
  3148, 3106, 3113, 3059, 2978, 2941, 2939, 2818,
  2736, 2883, 3301, 3111,
];
/** outposts by [outside file][pawn-defended], Ethereal 12.75 KnightOutpost and BishopOutpost. Feature: Outposts. */
export const OUTPOST_KNIGHT_MG: StaticArray<i32> = [
  64, 135, 95, 87,
];
export const OUTPOST_KNIGHT_EG: StaticArray<i32> = [
  -146, 52, -164, -122,
];
export const OUTPOST_BISHOP_MG: StaticArray<i32> = [
  69, 155, 10, -155,
];
export const OUTPOST_BISHOP_EG: StaticArray<i32> = [
  -60, 100, 1, 204,
];
/** a minor directly behind any pawn, Ethereal 12.75 KnightBehindPawn and BishopBehindPawn. Feature: Minor_Behind_Pawn. */
export const BEHIND_KNIGHT_MG = 28;
export const BEHIND_KNIGHT_EG = 157;
export const BEHIND_BISHOP_MG = 32;
export const BEHIND_BISHOP_EG = 65;
/** a knight four to seven squares from both kings, Ethereal 12.75 KnightInSiberia. Feature: Knight_In_Siberia. */
export const FAR_KNIGHT_MG: StaticArray<i32> = [
  -93, -95, -129, -187,
];
export const FAR_KNIGHT_EG: StaticArray<i32> = [
  -11, -94, -135, -193,
];
/** the bishop pair, Ethereal 12.75 BishopPair. Feature: Bishop_Pair. */
export const BISHOP_PAIR_MG = 93;
export const BISHOP_PAIR_EG = 485;
/** a bishop that sees both center squares from a long diagonal, Ethereal 12.75 BishopLongDiagonal. Feature: Bishop_Long_Diagonal. */
export const BISHOP_LONG_MG = 95;
export const BISHOP_LONG_EG = 102;
/** per own pawn on the bishop's color, Laser 1.7 BISHOP_PAWN_COLOR_PENALTY. Feature: Bad_Bishop. */
export const BISHOP_PAWNS_MG = -11;
export const BISHOP_PAWNS_EG = -18;
/** per rammed own pawn on the bishop's color, Laser 1.7 BISHOP_RAMMED_PAWN_COLOR_PENALTY. Feature: Bad_Bishop. */
export const BISHOP_RAMMED_MG = 3;
export const BISHOP_RAMMED_EG = -87;
/** same-color own pawns times central blocked own pawns, Weiss 11a0f72 BishopBadP (CPW Bad_Bishop). Feature: Bad_Bishop. */
export const BISHOP_BAD_PAWNS_MG = -5;
export const BISHOP_BAD_PAWNS_EG = -9;
/** enemy pawns on a bishop's empty-board diagonals, Stockfish a91cb9fc BishopXRayPawns. Feature: Bishop_X-Ray_Pawns. */
export const BISHOP_XRAY_PAWNS_MG = -29;
export const BISHOP_XRAY_PAWNS_EG = -10;
/** a bishop aligned with the enemy king area through non-pawns when not attacking its zone, Stockfish d1ec10cd BishopOnKingRing. Feature: Bishop_on_King_Ring. */
export const BISHOP_KING_RING_MG = 65;
export const BISHOP_KING_RING_EG = 22;
/** a rook on a semi-open and an open file, Ethereal 12.75 RookFile. Feature: Rook_on_Open_File. */
export const ROOK_FILE_MG: StaticArray<i32> = [
  40, 150,
];
export const ROOK_FILE_EG: StaticArray<i32> = [
  89, 94,
];
/** a rook on the enemy queen's file, Stash 37 RookXrayQueen. Feature: Rook_on_Queen_File. */
export const ROOK_QUEEN_FILE_MG = 49;
export const ROOK_QUEEN_FILE_EG = 80;
/** a rook hemmed in by its own king, with and without castling rights, Stash 37 RookTrapped and RookBuried. Feature: Trapped_Pieces. */
export const ROOK_TRAPPED_MG = -89;
export const ROOK_TRAPPED_EG = -25;
export const ROOK_BURIED_MG = -178;
export const ROOK_BURIED_EG = -51;
/** phase-gated early-middlegame space, Clockwork 958d0d0 evaluate_sf_space and Stockfish db59696a space (CPW Space). Feature: Space. */
export const SPACE_MG = 134;
export const SPACE_EG = -187;

// King safety, Ethereal 12.75 evaluateKings and evaluateKingsPawns: the safety sum's terms, in the units its square reads (pieces.ts KS_DIV_MG).
// Every SAFETY_*_EG value is in a quarter of that unit, with a divisor to match (pieces.ts KS_DIV_EG).
// Features: King_Safety#Attacking_King_Zone, King_Safety#Pawn_Shield, King_Safety#Pawn_Storm.
/** the pawn shield by [king's file][file][own pawn's distance, 7 for none], Ethereal 12.75 KingShelter. Feature: King_Safety#Pawn_Shield. */
export const SHELTER_MG: StaticArray<i32> = [
  456, 623, 693, 612, 580, 784, 594, 316,
  129, 207, 166, -101, 48, 242, 14, -139,
  317, 314, 248, 267, 131, 703, -510, 147,
  70, 55, 13, 47, 15, -154, 14, -60,
  -103, -11, -108, -33, -112, -73, -286, -161,
  116, 50, -102, -41, -49, 144, -1298, -132,
  134, 138, 71, -44, 26, -94, 440, -68,
  -58, 21, 30, -11, -136, -57, -1050, -170,
  0, 80, 59, 2, -216, -1146, -820, -323,
  0, -518, -559, -687, -858, -338, -907, -915,
  0, -3, -79, -110, -189, -618, -429, -351,
  0, -210, -223, -348, -241, -526, -34, -441,
  0, -129, -125, -163, -199, -806, 223, -295,
  0, -53, -167, -157, -114, -979, -1166, -305,
  0, 114, 92, -38, -100, -459, 741, -294,
  0, -72, -106, -275, -375, -621, -1098, -475,
];
export const SHELTER_EG: StaticArray<i32> = [
  255, 230, 208, 257, 330, 379, -707, 379,
  -317, -416, -437, -220, -408, -515, 354, -308,
  177, 75, 134, 55, -34, 59, 739, 67,
  204, 51, 106, -47, 51, 272, 287, 48,
  169, 70, 172, -25, -57, -139, -268, 52,
  -47, -87, 17, -159, -241, -63, 1222, -12,
  -33, -99, -56, -61, -142, 306, -393, 30,
  -60, -107, -20, 73, 65, 367, -219, 94,
  0, 308, 503, 796, 870, 1566, -15, 538,
  0, -126, -209, -189, 86, 114, 20, -82,
  0, 53, 20, -2, -71, 241, -361, 34,
  0, 214, 150, 149, 12, 516, -220, 49,
  0, 256, 155, 115, -36, 443, -151, 120,
  0, -23, -12, -221, -390, 602, 770, -34,
  0, -118, -117, -131, -35, 436, -136, 102,
  0, -488, -321, -293, -91, 133, -239, -162,
];
/** the pawn storm by [blocked][file from the edge][enemy pawn's distance, 7 for none], Ethereal 12.75 KingStorm; a blocked file has an enemy pawn, at distance 1 or more, so those rows' first and last cells are never read. Feature: King_Safety#Pawn_Storm. */
export const STORM_MG: StaticArray<i32> = [
  26, 646, 132, -152, -112, -90, -124, -181,
  -54, 423, 72, -48, -5, 30, 29, -120,
  219, 208, -27, -38, -19, -16, 12, -69,
  325, 286, -16, -42, 9, 78, -26, -66,
  0, -88, -25, -79, -42, 3, 75, 0,
  0, -73, -4, 6, 180, 38, 338, 0,
  0, -166, -29, -71, -85, -162, 310, 0,
  0, -5, -16, -50, 11, 103, 360, 0,
];
export const STORM_EG: StaticArray<i32> = [
  85, -64, -46, -6, -52, -97, -27, -95,
  369, 185, 90, 52, 30, -30, -16, 52,
  236, 196, 128, 47, 23, 4, -43, 22,
  -39, 50, -17, -87, -132, -151, -34, -71,
  0, -78, -163, -141, -129, -130, -192, 0,
  0, -205, -122, 17, -92, 3, -79, 0,
  0, -302, -125, -16, 95, 251, -450, 0,
  0, -127, -286, -167, -109, -129, -59, 0,
];
/** shelter's and storm's share of the safety sum, Ethereal 12.75 SafetyShelter and SafetyStorm. Features: King_Safety#Pawn_Shield, King_Safety#Pawn_Storm. */
export const SAFETY_SHELTER_MG: StaticArray<i32> = [
  -302, -104, -109, 60, 148, 229, -1306, -101,
  0, -217, -225, -124, 133, -106, -743, -297,
];
export const SAFETY_SHELTER_EG: StaticArray<i32> = [
  9, -37, 4, 200, 96, -738, 534, -217,
  0, 96, 324, 155, -80, -605, -577, -223,
];
export const SAFETY_STORM_MG: StaticArray<i32> = [
  366, 458, 280, 88, 119, 91, 77, 55,
  0, 5, 255, 32, -50, -44, 496, 0,
];
export const SAFETY_STORM_EG: StaticArray<i32> = [
  242, 240, 472, 13, -34, -102, -15, -155,
  0, 0, 164, -211, 164, 39, 909, 0,
];
/** per attacker reaching the king's area */
export const SAFETY_KNIGHT_MG = 194;
export const SAFETY_KNIGHT_EG = 392;
export const SAFETY_BISHOP_MG = 271;
export const SAFETY_BISHOP_EG = 314;
export const SAFETY_ROOK_MG = 311;
export const SAFETY_ROOK_EG = 219;
export const SAFETY_QUEEN_MG = 197;
export const SAFETY_QUEEN_EG = 197;
/** per attack on the area; Ethereal 12.75 SafetyAttackValue times 9/12, its rescale of the count to a 9-square area left out. Feature: King_Safety#Attacking_King_Zone. */
export const SAFETY_ATTACK_MG = 85;
export const SAFETY_ATTACK_EG = 30;
/** per weak square of the area */
export const SAFETY_WEAK_MG = 173;
export const SAFETY_WEAK_EG = -6;
/** the attacker has no queen */
export const SAFETY_NO_QUEEN_MG = -1391;
export const SAFETY_NO_QUEEN_EG = -348;
/** per safe check */
export const SAFETY_CHECK_QUEEN_MG = 219;
export const SAFETY_CHECK_QUEEN_EG = 840;
export const SAFETY_CHECK_ROOK_MG = 696;
export const SAFETY_CHECK_ROOK_EG = 812;
export const SAFETY_CHECK_BISHOP_MG = 364;
export const SAFETY_CHECK_BISHOP_EG = 1072;
export const SAFETY_CHECK_KNIGHT_MG = 540;
export const SAFETY_CHECK_KNIGHT_EG = 707;
/** per unsafe check, Stash 37 UnsafeCheck; its S(18, 85) restated for Ethereal 12.75 evaluateKings' divisors, then converted. Feature: King_Safety#Attacking_King_Zone. */
export const SAFETY_UNSAFE_MG = 65;
export const SAFETY_UNSAFE_EG = 26;
/** the sum's offset */
export const SAFETY_OFFSET_MG = -112;
export const SAFETY_OFFSET_EG = -47;

// The king's flank: its wing, four files wide, on its side's first five ranks (pieces.ts KING_FLANK). 0 turns a value off.
// The SAFETY_FLANK_ values were fit alone with every other value fixed: results/tuning.md, the local-search row.
/**
 * per flank square the enemy attacks, and per one it attacks twice, in the safety sum; Clockwork bedb1e8's four
 * KS_FLANK weights in its sum. Not taken: Stockfish 11 Evaluation::king's one count, squared, inside its king danger, since
 * this sum is squared whole. Feature: King_Safety#Square_Control.
 */
export const SAFETY_FLANK_ATTACK_MG = 26;
export const SAFETY_FLANK_ATTACK_EG = -1;
export const SAFETY_FLANK_ATTACK2_MG = 34;
export const SAFETY_FLANK_ATTACK2_EG = -2;
/** per flank square the king's side defends, and per one it defends twice */
export const SAFETY_FLANK_DEFENSE_MG = -9;
export const SAFETY_FLANK_DEFENSE_EG = -1;
export const SAFETY_FLANK_DEFENSE2_MG = -25;
export const SAFETY_FLANK_DEFENSE2_EG = 8;
/**
 * a penalty outside the sum, so it counts before two attackers reach the king's area: per attacked flank square,
 * with a square attacked twice counted twice; Stockfish 11 FlankAttacks. Feature: King_Safety#Square_Control.
 */
export const FLANK_ATTACK_MG = 6;
export const FLANK_ATTACK_EG = -18;

// Passed pawns outside the king-pawn table, Ethereal 12.75 evaluatePassed and Weiss c735b8f EvalPassedPawns.
// Feature: Passed_Pawn.
/** by [can advance][safe to advance][rank]; each cell is Ethereal 12.75 PassedPawn's less its blocked and unsafe cell, since pawns.ts has the rank's base value. Feature: Passed_Pawn. */
export const PASSED_ADVANCE_MG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 118, -25, 5, -29, -33, 235, 0,
  0, 77, 2, -25, -40, -68, 357, 0,
  0, 128, 24, -11, -25, -32, 800, 0,
];
export const PASSED_ADVANCE_EG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 123, 114, 166, 109, 261, -31, 0,
  0, 65, 39, 144, 122, 368, 488, 0,
  0, 44, -29, 207, 346, 958, 1176, 0,
];
/** no enemy piece or attack on the pawn or its path, Ethereal 12.75 PassedSafePromotionPath. Feature: Passed_Pawn. */
export const PASSED_SAFE_PATH_MG = -142;
export const PASSED_SAFE_PATH_EG = 314;
/** an own rook behind the pawn on its file, Weiss c735b8f PassedRookBack. Feature: Tarrasch_Rule. */
export const PASSED_ROOK_BEHIND_MG = 56;
export const PASSED_ROOK_BEHIND_EG = 98;
/** an enemy rook or queen behind the passer on its file (Sirius idea, no constants taken) */
export const PASSED_ENEMY_ROOK_BEHIND_MG = -192;
export const PASSED_ENEMY_ROOK_BEHIND_EG = -238;
/** a passer whose stop square is defended by an own piece (Sirius idea, no constants taken) */
export const PASSED_DEFENDED_STOP_MG = 70;
export const PASSED_DEFENDED_STOP_EG = 88;
/** rule of the square for an uncatchable passer in pawn endings, Weiss 3e95de9 PassedSquare (CPW Rule_of_the_Square). Feature: Rule_of_the_Square. */
export const PASSED_SQUARE_EG = 678;

// Threats, Ethereal 12.75 evaluateThreats: against the side named, except the push.
// Features: Hanging_Piece, Overloading, Threat_by_Pawn_Push.
export const THREAT_WEAK_PAWN_MG = -72;
export const THREAT_WEAK_PAWN_EG = -372;
export const THREAT_MINOR_BY_PAWN_MG = -289;
export const THREAT_MINOR_BY_PAWN_EG = -503;
export const THREAT_MINOR_BY_MINOR_MG = -124;
export const THREAT_MINOR_BY_MINOR_EG = -249;
export const THREAT_MINOR_BY_MAJOR_MG = -134;
export const THREAT_MINOR_BY_MAJOR_EG = -515;
export const THREAT_ROOK_BY_LESSER_MG = -282;
export const THREAT_ROOK_BY_LESSER_EG = -382;
export const THREAT_MINOR_BY_KING_MG = -34;
export const THREAT_MINOR_BY_KING_EG = -412;
export const THREAT_ROOK_BY_KING_MG = -299;
export const THREAT_ROOK_BY_KING_EG = -293;
export const THREAT_QUEEN_MG = -305;
export const THREAT_QUEEN_EG = -340;
export const THREAT_OVERLOADED_MG = -10;
export const THREAT_OVERLOADED_EG = -70;
export const THREAT_PUSH_MG = 54;
export const THREAT_PUSH_EG = 158;

// Complexity, Ethereal 12.75 evaluateComplexity: the endgame half's adjustment, seeded from its four terms.
// Feature: Initiative.
export const COMPLEXITY_PAWNS = 11;
export const COMPLEXITY_FLANKS = 509;
export const COMPLEXITY_ENDGAME = 264;
export const COMPLEXITY_OFFSET = -769;

// ---------------------------------------------------------------- search

/*
 * A value's comment cites the seed it started from, in its source's unit. The values
 * here are tuned since, so a seed records where a value began, not what it is.
 */

// ------------------------ search: iterative deepening

/** aspiration windows, Ethereal 0e47e9b aspirationWindow: from depth 4, delta 10 at its PawnValue 82, widened by half; search.ts think names where the form differs. Feature: Aspiration_Windows. */
export const ASP_DEPTH = 4;
export const ASP_DELTA = 56;

// ------------------------ search: table, draws and repetition

/**
 * 1: at a node not expected to cut, the table cuts on a fail low only (Ethereal 311d110 search); 0 turns it off.
 * Stockfish 43e100ae Search::Worker::search's form, the node type equal to the bound's side up to a depth, is not taken.
 * Feature: Transposition_Table#Transposition_Table_Cutoffs.
 */
export const TT_CUT_NODE = 1;
/**
 * 1: a result for a key the table already holds overwrites an entry left by an earlier search, however deep that entry is
 * (Berserk fe1363a TTPut). 0 keeps a deeper entry of any age against a result that is not exact. A probe does
 * not refresh an entry's age, as in Berserk: with a refresh, the entry a node stores over would always be of this search.
 * Feature: Transposition_Table#Aging.
 */
export const TT_AGE_STORE = 1;
/**
 * A draw by repetition or the fifty-move rule scores +DRAW_JITTER or -DRAW_JITTER by a bit of the node count, so drawn
 * lines do not all look equal to the search: Stash 767fdb1 draw_score's (nodes & 2) - 1 at its PAWN_MG_SCORE 74. 0 scores
 * every draw 0. Weiss e9021fb AlphaBeta's 8 - (nodes & 7) leans every draw toward the side to move, the form not taken.
 * Feature: Draw_Score_Randomization.
 */
export const DRAW_JITTER = 6;
/**
 * 1: a node with depth left whose side to move can repeat an earlier position raises alpha to the draw score before
 * its table probe (cycle.ts upcomingRepetition; Stockfish 91a76331 search's Step 3). The repeating move's child
 * returns the draw score, so on the plain tree the raise changes no value. 2: the horizon node raises too, before its
 * quiescence search (Stockfish e4f8a4fa search; Stash 079fcba search), where the quiet repeating move is not in the
 * tree and the raise adds it. 0 turns both off. Stockfish b7b7a3f3 qsearch raises inside the quiescence search as
 * well, the placement not taken. Feature: Upcoming_Repetition_Detection.
 */
export const UPCOMING_REP = 2;

// ------------------------ search: pruning before the move loop

/**
 * reverse futility, Stash f91e750 search: depth <= 7, 86 per ply less 79 when improving, at its PAWN_MG_SCORE 103.
 * The margin per ply grows by RFP_QUAD for each ply of depth, as Lynx f87f5d5f NegaMax adds a term quadratic in depth
 * and lowers its linear term. Features: Reverse_Futility_Pruning, Improving.
 */
export const RFP_DEPTH = 7;
export const RFP_MARGIN = 291;
export const RFP_QUAD = 24;
export const RFP_IMPROVING = 281;

/** razoring, Stash f91e750 search: depth <= 3, static eval + 120 per ply <= alpha, at its PAWN_MG_SCORE 103. Feature: Razoring. */
export const RAZOR_DEPTH = 3;
/** at this depth or less, razoring returns qsearch's score without the null-window test */
export const RAZOR_QS_DEPTH = 2;
export const RAZOR_MARGIN = 758;
/**
 * 1: the last clause of Stash 13ac9e7 search's razoring. When the null-window qsearch does not fail low and beats beta by
 * one ply's margin, the node is searched a ply shallower. 0 turns it off. Clockwork 641d9f5 Worker::search tests qsearch
 * at alpha itself, down to depth 7 with a wider margin, the form not taken. Feature: Razoring.
 */
export const RAZOR_DROP = 1;

/** null move, Ethereal 12.75 search: R = 4 + depth / 6 + min(3, (eval - beta) / 200), at its PawnValue 82. Feature: Depth_Reduction_R. */
export const NMP_DEPTH = 2;
export const NMP_BASE = 4;
export const NMP_DEPTH_DIV = 6;
export const NMP_EVAL_DIV = 1258;
export const NMP_EVAL_MAX = 3;
/**
 * 1: the null move is tried at an expected cut node only (Stash f91e750 search); 0 tries it at every non-PV node, as
 * Ethereal 12.75 search does. Feature: Null_Move_Pruning.
 */
export const NMP_CUT_NODE = 1;
/**
 * The null move needs the eval at or above beta by this much: Stash 8546bfe search's 30 at its PAWN_MG_SCORE 103. 0 gives
 * the plain test, eval >= beta. Feature: Null_Move_Pruning.
 */
export const NMP_EVAL_MARGIN = 149;
/**
 * 1: the null move also needs the static eval at or above beta + NMP_STATIC_BASE - NMP_STATIC_PER * depth, Weiss c735b8f
 * AlphaBeta: 138 and 13 at its P_MG 104, a gate that eases with depth. 0 turns it off. Stockfish 11 search's gate also
 * eases when improving, the form not taken. Feature: Null_Move_Pruning.
 */
export const NMP_STATIC = 1;
export const NMP_STATIC_BASE = 701;
export const NMP_STATIC_PER = 66;

/** ProbCut, Stash f91e750 search: depth >= 6, beta + 152 at its PAWN_MG_SCORE 103, a capture's reduced search at depth - 4. Feature: ProbCut. */
export const PROBCUT_DEPTH = 6;
export const PROBCUT_MARGIN = 812;
export const PROBCUT_REDUCTION = 4;

/** internal iterative reduction, Berserk 03cebd6 Negamax: PV or cut node, depth >= 4, no TT move. Feature: Internal_Iterative_Reductions. */
export const IIR_DEPTH = 4;

// ------------------------ search: extensions

/**
 * singular extensions, Stash f91e750 search's gate and margin: TT depth >= depth - 3, singular beta = TT score - 10 d / 16 at its
 * PAWN_MG_SCORE 103. SE_DEPTH 6: the least depth, Stockfish 11 search's; Stash's 7 gives the play before it, and Weiss c735b8f
 * AlphaBeta's 5 is the form not taken
 * Feature: Singular_Extensions.
 */
export const SE_DEPTH = 6;
/**
 * the singular search's depth is depth / 2 plus this. 0 is Clockwork 641d9f5 Worker::search's; 1 is Stash f91e750 search's and
 * gives the play before it. Ethereal f71ac47 singularity's (depth - 1) / 2 is the form not taken
 * Feature: Singular_Extensions.
 */
export const SE_SEARCH_ADD = 0;
export const SE_TT_DEPTH = 3;
export const SE_MARGIN = 54;
export const SE_MARGIN_DIV = 16;
/** a double extension at a non-PV node whose singular search fails low by more than 14, while the line has at most 10: Stash f91e750 search at its PAWN_MG_SCORE 103. Feature: Singular_Extensions. */
export const SE_DOUBLE_MARGIN = 113;
export const SE_DOUBLE_MAX = 10;
/**
 * a double extension becomes a triple when the TT move is quiet and the singular search fails low by more than this, Stash f91e750
 * search's 120 at its PAWN_MG_SCORE 103; 100000000 turns it off. Clockwork 641d9f5 Worker::search lowers the margin by the move's
 * history instead
 * Feature: Singular_Extensions.
 */
export const SE_TRIPLE_MARGIN = 615;
/**
 * plies taken off a TT move that is not singular, where the TT score itself does not reach beta; 0 turns each off.
 * SE_NEG_CUT: at a cut node, Weiss c735b8f AlphaBeta; Berserk d7e1f05 Negamax takes two.
 * SE_NEG_ALPHA: when the TT score is at or below alpha, Ethereal f71ac47 singularity
 * Feature: Singular_Extensions.
 */
export const SE_NEG_CUT = 1;
export const SE_NEG_ALPHA = 1;
/** the check extension's plies, on the move in the parent (Stash f91e750 search); 0 turns it off, for the flag screen. Feature: Check_Extensions. */
export const CHECK_EXT = 1;

// ------------------------ search: pruning in the move loop

/**
 * late move pruning's move count at depth d, (BASE + PER_DEPTH * d + PER_DEPTH_SQ * d * d) >> 10, one set not improving
 * and one improving; initSearch fills a table from them up to LMP_DEPTH. The form is Ethereal 1eff740 initSearch, a
 * quadratic by depth per row. The seeds are the values that give Ethereal 12.75 LateMovePruningCounts exactly at depths
 * 1 to 8; the improving row needs the linear term for that. Not taken: Stockfish 7cdd5e89 search's
 * (3 + depth * depth) / (2 - improving), and Ethereal 1eff740's own coefficients, which each play another tree.
 * search.ts counts moves played against it, where Ethereal counts quiets seen.
 * Features: Futility_Pruning#Move_Count_Based_Pruning, Improving.
 */
export const LMP_DEPTH = 8;
export const LMP_BASE = 2471;
export const LMP_PER_DEPTH = -211;
export const LMP_PER_DEPTH_SQ = 422;
export const LMP_IMPROVING_BASE = 4823;
export const LMP_IMPROVING_PER_DEPTH = -937;
export const LMP_IMPROVING_PER_DEPTH_SQ = 1063;

/** futility on the reduced depth, Ethereal 0e47e9b search: eval + 77 + 52 per ply <= alpha at its PawnValue 82; history limits by improving, Ethereal 12.75 FutilityPruningHistoryLimit. Features: Futility_Pruning, Improving. */
export const FUT_DEPTH = 8;
export const FUT_BASE = 501;
export const FUT_PER_DEPTH = 567;
export const FUT_HISTORY: StaticArray<i32> = [12000, 6000];

/**
 * history pruning, Ethereal 0e47e9b search's continuation pruning: 1- or 2-ply continuation history below a limit, by
 * improving, one ContinuationPruningDepth and ContinuationPruningHistoryLimit pair for both tables. Ethereal 12.75 search's
 * limit and depth per table, CounterMoveHistoryLimit and FollowUpMoveHistoryLimit, is the form not taken
 * Features: History_Leaf_Pruning, Improving.
 */
export const HIST_PRUNE_DEPTH: StaticArray<i32> = [3, 2];
export const HIST_PRUNE_LIMIT: StaticArray<i32> = [-1000, -2500];

/**
 * SEE pruning, Ethereal 12.75 search: depth <= 9, quiets below SEEQuietMargin -64 per ply, noisy below SEENoisyMargin -19 per
 * ply squared. As seeds, at its SEEPieceValues pawn 100, they are 256 and 76 in SEE_VALUE's unit
 * Feature: Static_Exchange_Evaluation#Pruning.
 */
export const SEE_DEPTH = 9;
export const SEE_QUIET = 125;
export const SEE_NOISY = 77;
/**
 * a quiet's bar moves by its history, in 1/1024 of SEE's unit per point: Clockwork f236181 Worker::search's form, at Clockwork
 * 641d9f5's see_pvs_hist_mult 17 and f236181 SEE::value's pawn 100, on a sum of tables with this limit; 0 turns it off.
 * Stockfish 17 search moves a capture's bar by its capture history, the form not taken
 * Feature: Static_Exchange_Evaluation#Pruning.
 */
export const SEE_HISTORY = 86;

/**
 * futility for the bad captures, Clockwork 662c568 Worker::search: at depth <= 8, not in check, once the picker reaches them,
 * static eval + 75 per ply <= alpha ends the move loop, and the score rises to that estimate; converted by Clockwork 641d9f5's
 * PAWN_MAT middlegame pawn 112. A depth of 0 turns it off. Stockfish 15 search's test per capture, with the victim and
 * capture history, is the form not taken. Feature: Futility_Pruning.
 */
export const BAD_NOISY_FUT_DEPTH = 8;
export const BAD_NOISY_FUT_MARGIN = 157;

/**
 * the reduced depth futility and history pruning read: depth less one ply, less base + ln(depth) ln(moves) / div, the logs
 * scaled by 1024 and the sum in 1/1024 ply, Ethereal 0e47e9b search's lmrDepth. It has its own values, so LMR's can move
 * without moving the pruning. Its seeds are LMR's: Ethereal 12.75 initSearch's 0.75 less the ply that Ethereal counts for the
 * move itself, and 2.25, where 0e47e9b initSearch has 0.7844 and 2.4696
 * Features: Futility_Pruning, History_Leaf_Pruning.
 */
export const PRUNE_BASE = -263;
export const PRUNE_DIV = 1591;

// ------------------------ search: reductions

/**
 * late move reductions in 1/1024 ply, the terms summed before the sum is cut to whole plies (Clockwork 641d9f5 Worker::search),
 * where Ethereal 12.75 search adds whole plies. The sum counts plies past the move's own, so 0 is no reduction, where
 * Ethereal's R = 1 is. Base + ln(depth) ln(moves) / div is Ethereal 12.75 initSearch's 0.75 + ln d ln m / 2.25 less that one
 * ply, with the logs scaled by 1024. A non-PV node, a node not improving and a move from before the quiet stage are its
 * terms, and history moves the sum by whole steps, capped
 * Features: Late_Move_Reductions, Improving.
 */
export const LMR_MIN_DEPTH = 3;
export const LMR_BASE = -168;
export const LMR_DIV = 2322;
export const LMR_NON_PV = 1441;
/**
 * 1: the non-PV term skips a node whose TT entry has the PV bit, a node that is or was on a PV (Berserk f05f9dc Negamax);
 * qsearch then keeps the bit when it stores. 0 turns it off. Clockwork 04f2f0e Worker::search takes a ply off at every
 * such node and adds one when the TT score is at or below alpha, the form not taken. Feature: Late_Move_Reductions.
 */
export const LMR_TT_PV = 1;
export const LMR_NOT_IMPROVING = 1050;
export const LMR_EARLY_STAGE = 1037;
export const LMR_HISTORY_STEP = 1060;
export const LMR_HISTORY_DIV = 5958;
export const LMR_HISTORY_MAX = 2;
/**
 * terms that reduce more, in 1/1024 ply, at Clockwork 641d9f5 Worker::search's tuned values: a cut node (Weiss 95b0951
 * AlphaBeta adds two plies); a quiet when the TT move is noisy; a node whose children have failed high more than LMR_FAIL_HIGH_COUNT times;
 * and each time a move has raised alpha here. 0 turns a term off
 * Feature: Late_Move_Reductions.
 */
export const LMR_CUT_NODE = 1155;
export const LMR_TT_NOISY = 971;
export const LMR_FAIL_HIGH = 879;
export const LMR_FAIL_HIGH_COUNT = 3;
export const LMR_ALPHA_RAISE = 535;
/**
 * late move reductions on noisy moves: their own base and divisor, Weiss 95b0951 InitReductions' 0.38 + ln d ln m / 3.76,
 * restated for a sum where 0 is no reduction and a node neither PV nor improving adds 2. Capture history moves it by whole
 * steps, at Weiss AlphaBeta's divisor 8870 scaled from its table's limit 14387 to 16384. A depth of 200 turns them off
 * Feature: Late_Move_Reductions.
 */
export const LMR_NOISY_MIN_DEPTH = 3;
export const LMR_NOISY_BASE = -1580;
export const LMR_NOISY_DIV = 4196;
export const LMR_NOISY_HISTORY_DIV = 8600;
/**
 * the re-search after a reduced search beats alpha: a ply deeper if it beat the best by more than LMR_DEEPER, Clockwork 641d9f5
 * Worker::search's 94 by its PAWN_MAT middlegame pawn 112; else a ply shallower if it beat the best by less than LMR_SHALLOWER per ply of depth.
 * 100000000 and 0 turn them off
 * Feature: Late_Move_Reductions#Re-searches.
 */
export const LMR_DEEPER = 214;
export const LMR_SHALLOWER = 3;
/** 1: a quiet's continuation history takes the re-search's result; 0 turns it off */
export const LMR_CONT_UPDATE = 1;

// ------------------------ search: move ordering and history

/** SEE values by piece type (none, P, N, B, R, Q, K); the king is never captured */
export const SEE_VALUE: StaticArray<i32> = [0, 400, 1200, 1200, 2000, 3600, 0];

/** most valuable victim by piece type, Clockwork 641d9f5 score_move. Feature: MVV-LVA. */
export const MVV: StaticArray<i32> = [0, 800, 2400, 2400, 4800, 7200, 0];

/** a capture is tried among the good ones if SEE >= -score / this, Clockwork 641d9f5 MovePicker::next's movepicker_see_capthist_divisor 51 at its PAWN_MAT 112. Feature: Static_Exchange_Evaluation#Move_Ordering. */
export const GOOD_CAPTURE_DIV = 14;

/**
 * 1: a queen promotion without a capture is picked among the captures, as Stockfish 10 make_promotions lists it, so a node
 * that skips its quiets still tries it; 0 leaves it first among the quiets
 * Feature: Move_Ordering.
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
 * Features: Threat_History, Pawn_History, History_Heuristic.
 */
export const THREAT_HISTORY = 1;
export const PAWN_HISTORY = 1;
export const HIST_PAWN_MAX = 8192;
export const HIST_DEEP_MARGIN = 233;
/**
 * 1: capture history is also indexed by whether the opponent attacks the capture's from square and its to square
 * (Ethereal b0e3d52 underlying_capture_history). Each node that scores a capture then makes its attacked squares, a
 * quiescence node too. 0: by piece, square and victim alone, the first quarter of the table.
 * Features: History_Heuristic#Capture_History, Threat_History.
 */
export const CAPTURE_THREATS = 1;

/**
 * 1: the move six plies back orders quiets and takes their bonus, Clockwork 3dd022c History::get_conthist and
 * update_quiet_stats; 0 turns it off. It stays out of the history sum that pruning and reductions read, as the 4-ply table
 * does. Stockfish 7cdd5e89 update_continuation_histories gives this table a smaller bonus, the form not taken
 * Feature: History_Heuristic#Continuation_History.
 */
export const CONT6 = 1;

/** history bonus and malus, Weiss c735b8f Bonus and Malus: min(2418, 251 d - 267) and min(693, 532 d - 163). Feature: History_Heuristic. */
export const HIST_BONUS_MUL = 336;
export const HIST_BONUS_SUB = 224;
export const HIST_BONUS_MAX = 2343;
export const HIST_MALUS_MUL = 518;
export const HIST_MALUS_SUB = 151;
export const HIST_MALUS_MAX = 700;
/**
 * 1: a fail high, or a TT cut on a lower bound, takes the malus of depth + 1 from the continuation entries of the parent's
 * move, when that move is quiet and was the first one played at its node (at a TT cut: the first or second). Stockfish 11
 * update_all_stats' and search's "extra penalty". 0 turns it off. Stockfish also counts the parent's first killer.
 * Feature: History_Heuristic#Continuation_History.
 */
export const HIST_PRIOR_MALUS = 1;
/**
 * From this depth, or at any depth at a PV node, a node where no move raised alpha gives the bonus to the continuation
 * entries of the parent's quiet move, which caused the fail low (Stockfish 8fd34d77 search; Stockfish 11 search's depth 3).
 * 0 turns it off. Feature: History_Heuristic#Continuation_History.
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
 * Features: Delta_Pruning, Quiescence_Search.
 * QS_EVASIONS 1: in check, once a move has a score that is not a mate, only captures and promotions that pass SEE are searched
 * (Weiss 95b0951 Quiescence); 0 searches every evasion, as Stash does. Stockfish 15 qsearch stops after two quiet evasions, the
 * form not taken.
 */
export const QS_DELTA = 620;
export const QS_SEE = 1;
export const QS_EVASIONS = 1;

// ------------------------ search: correction history

/** correction history, Stash f91e750 update_correction_histories: each table's entry within 32 at its PAWN_MG_SCORE 103 (CORRECTION_HISTORY_MAX); an update weighs 1 + depth, at most 16, of 256. Feature: Static_Evaluation_Correction_History. */
export const CORR_MAX = 173;
/**
 * 1: a sixth table, by the last two moves, corrects the static eval (Clockwork e774be4 History::get_correction);
 * 0 turns it off. Each table has its own weight out of 256 (Weiss 2a3f84c GetCorrectionHistory; unweighted Stash dcc25ed sum not taken).
 * Feature: Static_Evaluation_Correction_History.
 */
export const CORR_CONT = 1;
export const CORR_WEIGHT_MAX = 15;
export const CORR_W_PAWN = 317;
export const CORR_W_NONPAWN_US = 245;
export const CORR_W_NONPAWN_THEM = 263;
export const CORR_W_MINOR = 318;
export const CORR_W_MAJOR = 318;
export const CORR_W_CONT = 296;
/**
 * the update's weight in sixteenths of Stash 302136d add_correction_history's 1 + depth: 16 is Stash's weight, and 32
 * is Lynx ae1c2768 UpdateCorrectionHistory's, twice 1 + depth. Feature: Static_Evaluation_Correction_History.
 */
export const CORR_RATE = 48;

// ---------------------------------------------------------------- time

/** Weiss c735b8f InitTimeManagement: sudden death uses a share of the time left, at most 0.2 of the clock; its 0.022 scaled so that the soft limit's score factor keeps mean time use. Feature: Time_Management. */
export const TM_SHARE = 0.0296;
export const TM_SHARE_CAP = 0.2;
/** with moves to go, 0.7 over min(moves to go, 50) (Weiss c735b8f InitTimeManagement). Feature: Time_Management. */
export const TM_MTG_SHARE = 0.7;
export const TM_MTG_CAP = 50;
/** the increments counted ahead (Weiss c735b8f InitTimeManagement's 50). Feature: Time_Management. */
export const TM_INC_MOVES = 50.0;
/** with an increment under the overhead, the moves counted ahead per millisecond of clock: Stockfish 23493de0 TimeManagement::init's one per 20 ms, so the count falls under one second. Feature: Time_Management. */
export const TM_INC_MOVES_PER_MS = 0.05;
/** hard limit: 5 times the soft one, at most 0.8 of the clock (Weiss c735b8f InitTimeManagement). Feature: Time_Management#Soft_Bound. */
export const TM_HARD_MUL = 5.0;
export const TM_HARD_CAP = 0.8;
/** clock milliseconds held back per move for the host and the match runner */
export const TM_OVERHEAD = 10.0;
/**
 * node share of the best move, Weiss 1401211 IterativeDeepening's form with Weiss 693b322 IterativeDeepening's values: stop past
 * soft * (0.52 + 3.73 * (1 - share)). 1401211 measured 0.5 + 2.5 beside its live `uncertain` veto; 693b322 tuned these after
 * Weiss 7608ca3 AspirationWindow left that veto always false
 * Feature: Best_Move_Node_Share.
 */
export const TM_NODE_BASE = 0.52;
export const TM_NODE_MUL = 3.73;
/** score fall over three iterations, Berserk 787b2e1b Search: the soft limit times 0.1127 + 0.0262 per centipawn, within 0.5028 and 1.6561; an NNUE-era value, read as 4 units per centipawn. Feature: Extra_Time_on_Falling_Score. */
export const TM_FALL_BASE = 0.1127;
export const TM_FALL_PER = 0.00655;
export const TM_FALL_MIN = 0.5028;
export const TM_FALL_MAX = 1.6561;
/** the soft limit with one legal move, Weiss d7d1334 IterativeDeepening's cap. Feature: Time_Management#Premature_Termination. */
export const TM_ONE_MOVE = 500.0;
