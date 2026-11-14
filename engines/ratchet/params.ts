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
export const MAT_MG: StaticArray<i32> = [0, 307, 1854, 1640, 2347, 5065, 0];
export const MAT_EG: StaticArray<i32> = [0, 460, 1869, 1906, 3506, 6317, 0];

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
     34,   126,   45, 70, 84,  245,  265,  41,
     40,   43,   84,   90,   131,   112,   192,   25,
    18,  59,  132,  171,  215,  116,  79,  -19,
    97,  158,  169,  185,  160,  134,  168,  50,
    200,  164,  174,  264,  344,  373,  323,  78,
   552, 382, 377, 557, 171, 196, 55, 29,
     0,   0,   0,   0,   0,   0,   0,   0,
];
export const PAWN_EG: StaticArray<i32> = [
     0,    0,    0,    0,    0,    0,    0,    0,
     351,  275,  338,  272,  358,  278,  249, 267,
   301,  286, 257,  246,  276, 306, 247, 275,
     369,  322,  213, 170, 203, 270,  313,  318,
    414,   287,  218,  115, 193,  282,  335,    379,
   480,  390,  332,  207,  204,  303,  412,  475,
   219,  310,  314,  164,  401,  241,  341,  487,
     0,    0,    0,    0,    0,    0,    0,    0,
];
export const KNIGHT_MG: StaticArray<i32> = [
  118,  208, 158, 123,  287,  183,  169,  166,
  156, 169,   209,   238,   248,  287,   280,  179,
   275,   208,  274,  261,  333,  314,  315,  210,
   310,  320,  329,  290,  356,  369,  367,   262,
    356,  342,  323,  349,  337,  399,  357,  333,
  -108,  236,  193,  228,  288,  452,  392,  339,
  113,  -58,  337,  256,   133,  294,   218,   65,
  -546, -365, -24,  89,  545, -108, -249, -474,
];
export const KNIGHT_EG: StaticArray<i32> = [
  74, 77,  131,   318,  214,  183, 55, -64,
  103,  139,    247,   302,   303,  140,  165, 8,
   158,   306,   305,  426,   384,   279,  222,  195,
   357,   324,  503,  547,  493,  456,   473,  333,
   342,   435,  556,  622,  561,   505,   418,  327,
   394,  430,   589,   610,   556,   420,  270, 77,
   124,   406,  205,   392,   363, 226,  279, -38,
  -1, 235,    315, 190, 123,  158, 123, -226,
];
export const BISHOP_MG: StaticArray<i32> = [
   10,   166,    178,  205,   240,   115, 9,  -6,
    229,  205,  245,   182,  183,  312,  263,   161,
    193,  204,  165,  186,  207,  234,  295,  182,
    232,  238,  206,  239,  268,  198,   204,   249,
    190,   221,  179,  246,  229,  288,   166,   157,
   191,  195,  55,  193,  32,  257,  176,   237,
    63,  -62,   -12,  -195,  162,  -19,  -60, -215,
    -13,   17, -627, -311, -244, -18,   75,  84,
];
export const BISHOP_EG: StaticArray<i32> = [
   363,   549,  548,   579,    576,  572,    566,  435,
   463,  399,    529,   577,   587,    544,  356,  419,
   511,   573,   561,   608,   706,   468,    555,  560,
    448,   561,   658,  738,   627,   685,   592,  462,
    549,   560,   676,   726,   729,   657,   607,   573,
    498,   651,   524,   653,   718,   547,   635,   588,
   606,   557,   677,   613,  617,   733,   491,  544,
   427,  622,   738,   658,   757,  604,  557, 315,
];
export const ROOK_MG: StaticArray<i32> = [
   0,   30,   -1,  47,  73,   70,  27,  120,
  -109,   34,  -25,   80,   80,   34,   12, -148,
  -106,  -29,  0,  -9,   26,   105,   91,  -15,
  -64,  -9,   18,   -6,   74,   48,  189,  4,
   -46,   24,  23,  35,  112,  81,   -9,  14,
    -82,  -18,  -24,  100,  -103,  145,  225,  -71,
   -3,  15,  183,  39,  159,  156,   -126,  84,
   24,  58,  -94,  41,  162,   -167,   5,  -46,
];
export const ROOK_EG: StaticArray<i32> = [
    793,   823,   856,   806,   775,   799,   784,  630,
    851,   782,   843,   812,    799,   830,    749,   808,
    891,   913,   870,   876,   834,   756,    820,   767,
    942,   978,   964,   934,   887,   880,  850,   877,
    983,   954,  1046,   975,   974,   1002,   1022,   962,
    1053,   1054,   1017,   941,   1013,   957,  939,   967,
    1066,   1048,   976,   1043,  953,   1025,   1139,   1015,
    1060,   1048,  1106,   1067,   1017,   1154,   1077,   1052,
];
export const QUEEN_MG: StaticArray<i32> = [
   294,  232,  233,   332,  237, 213, 152, 199,
  145,  239,   318,   286,   322,   431,    328,   291,
  197,   306,  232,   276,  252,    264,   308,   364,
   295, 141,  231,  181,  247,  241,   296,   224,
  143, 146,  127,  76,   189,   289,  255,  233,
   219, 129,  180,   191,   154,  380,  330,  421,
   76, -70,  67,   261, -202,  291,   184,  341,
   238, 116,  50, -146,  379,  340,  731,   208,
];
export const QUEEN_EG: StaticArray<i32> = [
  885, 905, 966, 804,  1079, 963, 1000, 710,
  1055, 971, 924, 949,  991, 762, 813, 978,
   1021, 907,   1144,  1008,   1124,   1109,   1271,  1029,
  982,  1264,   1149,  1263,  1124,  1102,  1223,   1251,
    1241,   1243,   1179,  1226,  1171,  1064,  1249,  1263,
   1085,   1234,   1028,  1335,  1195,  1091,   896,  1017,
  1135,   1121,  1280,  1184,  1583,  818,   1072,  1160,
  926,  1261,  1382,  1492,   1080,  977, 695,  1468,
];
export const KING_MG: StaticArray<i32> = [
   -202,  -204,   -180, -372,   -44, -124,  134,  179,
    -106,  -188,  -206, -303, -130,  -99,  92,  215,
    -10,  -32, -53, -280, -77, 17,  169, 132,
  -104,   119, 0, -359, -152, 12, 137, -14,
    165,  4,  308, -289, 55, 147,  348, 147,
    373,  140,  399,   -257,  342,  486,  660,  130,
   431,   47,   -145,  -54,   -255,  -67, 144, -386,
   -880,  -89,  95,  -193, -354, -221,  95,  -366,
];
export const KING_EG: StaticArray<i32> = [
  -671, -432, 283,  -139, -109,  25, -149, -286,
  -374,  -313,   392,   2,   52,   89,  -61, -81,
  -324,  -296,   422,  76,  118,  80,   -30,  -45,
   -303,  -284,  495,  136,  157,  167,   -57,   -66,
   -257,  -65,  451,  143,  140,  211,  43,   6,
    -124,   -33,   459,   129,   30,  267,  162,   144,
  -291,   -6,   691,   57,   215,  472,  194,  344,
  -509, -382, 295, -107,    -32,   284,   63,  -159,
];

// ---------------------------------------------------------------- pawns
// Stash 37 kp_eval.c, converted by its PAWN_MG_SCORE 103; each pair is (middlegame, endgame).

/** a backward pawn that is not isolated, on a file an enemy pawn closes: its stop square attacked by an enemy pawn and out of reach of its own, Ethereal 12.75 PawnBackwards */
export const PAWN_BACKWARD_MG = -7;
export const PAWN_BACKWARD_EG = -58;
/** the same on a file no enemy pawn closes, Stash 37 BackwardPenalty */
export const PAWN_BACKWARD_OPEN_MG = -81;
export const PAWN_BACKWARD_OPEN_EG = -88;
/** a pawn with a friendly pawn directly behind it, Stash 37 DoubledPenalty */
export const PAWN_DOUBLED_MG = -20;
export const PAWN_DOUBLED_EG = -168;
/** a pawn with no friendly pawn on a neighboring file, Stash 37 IsolatedPenalty */
export const PAWN_ISOLATED_MG = -40;
export const PAWN_ISOLATED_EG = -67;
/** a passed pawn by relative rank: no enemy pawn ahead on its file or the next; Stash 37 PassedBonus */
export const PAWN_PASSED_MG: StaticArray<i32> = [0, -6, -26, -166, 110, 631, 952, 0];
export const PAWN_PASSED_EG: StaticArray<i32> = [0, -13, 169, 206, 310, 130, 587, 0];
/** a candidate by relative rank: not passed, no enemy pawn ahead on its file, and every square of its path an enemy pawn attacks is attacked as often by its own; seeded from Ethereal 12.75 PawnCandidatePasser at its PawnValue 82 */
export const PAWN_CANDIDATE_MG: StaticArray<i32> = [0, -58, -50, -51, 18, 149, 0, 0];
export const PAWN_CANDIDATE_EG: StaticArray<i32> = [0, 23, 37, 161, 309, 395, 0, 0];
/** a pawn with a friendly pawn beside it on the next file, by relative rank; Stash 37 PhalanxBonus */
export const PAWN_PHALANX_MG: StaticArray<i32> = [0, 42, 75, 89, 170, 276, -339, 0];
export const PAWN_PHALANX_EG: StaticArray<i32> = [0, -24, -1, 68, 240, 1459, 2441, 0];
/** a pawn defending a friendly pawn, by the defender's relative rank; Stash 37 DefenderBonus */
export const PAWN_DEFENDER_MG: StaticArray<i32> = [0, 71, 81, 71, 62, 769, 0, 0];
export const PAWN_DEFENDER_EG: StaticArray<i32> = [0, 73, 62, 137, 445, 415, 0, 0];
/** a passed pawn, per step of its distance from its own king, by relative rank; seeded by lines through the earlier table, ranks 1 and 2 from Ethereal 12.75 PassedFriendlyDistance at its PawnValue 82 */
export const PASSED_OUR_KING_MG: StaticArray<i32> = [0, -5, -8, 27, 2, -57, -29, 0];
export const PASSED_OUR_KING_EG: StaticArray<i32> = [0, -6, -23, -84, -119, -134, -190, 0];
/** the same from the enemy king */
export const PASSED_THEIR_KING_MG: StaticArray<i32> = [0, -13, -14, 7, -21, -33, -83, 0];
export const PASSED_THEIR_KING_EG: StaticArray<i32> = [0, 2, 17, 71, 159, 245, 305, 0];

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

// ---------------------------------------------------------------- search

/*
 * A value's comment cites the seed it started from, in its source's unit. The values
 * here are tuned since, so a seed records where a value began, not what it is.
 */

/** SEE values by piece type (none, P, N, B, R, Q, K); the king is never captured */
export const SEE_VALUE: StaticArray<i32> = [0, 400, 1200, 1200, 2000, 3600, 0];

/** aspiration windows, Ethereal 0e47e9b aspirationWindow: from depth 4, delta 10 at its PawnValue 82, widened by half; search.ts think names where the form differs */
export const ASP_DEPTH = 4;
export const ASP_DELTA = 61;

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

/** ProbCut, Stash f91e750 search: depth >= 6, beta + 152 at its PAWN_MG_SCORE 103, a capture's reduced search at depth - 4 */
export const PC_DEPTH = 6;
export const PC_MARGIN = 833;
export const PC_REDUCTION = 4;

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

/** internal iterative reduction, Berserk 03cebd6 Negamax: PV or cut node, depth >= 4, no TT move */
export const IIR_DEPTH = 4;

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
export const HP_DEPTH: StaticArray<i32> = [3, 2];
export const HP_LIMIT: StaticArray<i32> = [-1000, -2500];

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
export const NF_DEPTH = 8;
export const NF_MARGIN = 176;

/**
 * late move reductions in 1/1024 ply, the terms summed before the sum is cut to whole plies (Clockwork 641d9f5 Worker::search),
 * where Ethereal 12.75 search adds whole plies. Base + ln(depth) ln(moves) / div is Ethereal 12.75 initSearch's
 * 0.75 + ln d ln m / 2.25, with the logs scaled by 1024. A non-PV node, a node not improving and a move from before the
 * quiet stage are its terms, and history moves the sum by whole steps, capped
 */
export const LMR_MIN_DEPTH = 3;
export const LMR_BASE = 798;
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
 * restated for a sum where 1 ply is no reduction and a node neither PV nor improving adds 2. Capture history moves it by whole
 * steps, at Weiss AlphaBeta's divisor 8870 scaled from its table's limit 14387 to 16384. A depth of 200 turns them off
 */
export const LMR_NOISY_MIN_DEPTH = 3;
export const LMR_NOISY_BASE = -543;
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

/**
 * the reduced depth futility and history pruning read: depth less base + ln(depth) ln(moves) / div, the logs scaled by
 * 1024 and the sum in 1/1024 ply, Ethereal 0e47e9b search's lmrDepth. It has its own values, so LMR's can move without moving
 * the pruning. Its seeds are LMR's, Ethereal 12.75 initSearch's 0.75 and 2.25, where 0e47e9b initSearch has 0.7844 and 2.4696
 */
export const PRUNE_BASE = 706;
export const PRUNE_DIV = 1527;

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

/** a capture is tried among the good ones if SEE >= -score / this, Clockwork 641d9f5 MovePicker::next's movepicker_see_capthist_divisor 51 at its PAWN_MAT 112 */
export const GOOD_CAPTURE_DIV = 14;

/**
 * 1: a queen promotion without a capture is picked among the captures, as Stockfish 10 make_promotions lists it, so a node
 * that skips its quiets still tries it; 0 leaves it first among the quiets
 */
export const PROMO_NOISY = 1;
/**
 * 1: the move six plies back orders quiets and takes their bonus, Clockwork 3dd022c History::get_conthist and
 * update_quiet_stats; 0 turns it off. It stays out of the history sum that pruning and reductions read, as the 4-ply table
 * does. Stockfish 7cdd5e89 update_continuation_histories gives this table a smaller bonus, the form not taken
 */
export const CONT6 = 1;

/** most valuable victim by piece type, Clockwork 641d9f5 score_move */
export const MVV: StaticArray<i32> = [0, 800, 2400, 2400, 4800, 7200, 0];

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

// ---------------------------------------------------------------- pieces and attack maps (pieces.ts)

// Seeds: each term's source engine, converted by its middlegame pawn: Stash 37's PAWN_MG_SCORE 103, Ethereal 12.75's
// PawnValue 82, Weiss c735b8f's P_MG 104, Laser 1.7's PIECE_VALUES pawn 100.

/** mobility by count, Stash 37 KnightMobility, BishopMobility, RookMobility and QueenMobility */
export const MOB_KNIGHT_MG: StaticArray<i32> = [
  -292, -237, -190, -174, -108, -79, -49, -4,
  51,
];
export const MOB_KNIGHT_EG: StaticArray<i32> = [
  -211, 276, 423, 513, 499, 557, 563, 551,
  484,
];
export const MOB_BISHOP_MG: StaticArray<i32> = [
  -29, 34, 115, 117, 155, 196, 209, 228,
  228, 238, 286, 305, 362, 65,
];
export const MOB_BISHOP_EG: StaticArray<i32> = [
  -68, 116, 225, 358, 393, 411, 455, 472,
  508, 502, 450, 489, 475, 558,
];
export const MOB_ROOK_MG: StaticArray<i32> = [
  -246, -46, 10, 26, 45, 45, 63, 85,
  106, 150, 134, 191, 199, 185, 272,
];
export const MOB_ROOK_EG: StaticArray<i32> = [
  3, 190, 389, 435, 503, 559, 576, 595,
  638, 652, 686, 724, 740, 758, 744,
];
export const MOB_QUEEN_MG: StaticArray<i32> = [
  -194, -94, -127, -130, -105, -108, -76, -71,
  -68, -60, -54, -49, -40, -25, -10, -9,
  -17, -19, -29, 85, 81, 190, 295, 278,
  236, 199, -294, 47,
];
export const MOB_QUEEN_EG: StaticArray<i32> = [
  -536, 669, 855, 1522, 1441, 1496, 1553, 1628,
  1745, 1814, 1856, 1880, 1942, 1934, 1958, 1986,
  2011, 2066, 2093, 1984, 1947, 1892, 1739, 1730,
  1775, 1744, 2167, 1751,
];
/** outposts by [outside file][pawn-defended], Ethereal 12.75 KnightOutpost and BishopOutpost */
export const OUTPOST_KNIGHT_MG: StaticArray<i32> = [
  53, 133, 84, 106,
];
export const OUTPOST_KNIGHT_EG: StaticArray<i32> = [
  -159, 3, -124, -62,
];
export const OUTPOST_BISHOP_MG: StaticArray<i32> = [
  16, 124, -55, 163,
];
export const OUTPOST_BISHOP_EG: StaticArray<i32> = [
  -26, 70, 86, -156,
];
/** a minor directly behind any pawn, Ethereal 12.75 KnightBehindPawn and BishopBehindPawn */
export const BEHIND_KNIGHT_MG = 22;
export const BEHIND_KNIGHT_EG = 105;
export const BEHIND_BISHOP_MG = 31;
export const BEHIND_BISHOP_EG = 67;
/** a knight four to seven squares from both kings, Ethereal 12.75 KnightInSiberia */
export const FAR_KNIGHT_MG: StaticArray<i32> = [
  -86, -63, -133, -182,
];
export const FAR_KNIGHT_EG: StaticArray<i32> = [
  34, -22, 31, -282,
];
/** the bishop pair, Ethereal 12.75 BishopPair */
export const BISHOP_PAIR_MG = 175;
export const BISHOP_PAIR_EG = 357;
/** a bishop that sees both center squares from a long diagonal, Ethereal 12.75 BishopLongDiagonal */
export const BISHOP_LONG_MG = 88;
export const BISHOP_LONG_EG = 116;
/** per own pawn on the bishop's color, Laser 1.7 BISHOP_PAWN_COLOR_PENALTY */
export const BISHOP_PAWNS_MG = 1;
export const BISHOP_PAWNS_EG = -27;
/** per rammed own pawn on the bishop's color, Laser 1.7 BISHOP_RAMMED_PAWN_COLOR_PENALTY */
export const BISHOP_RAMMED_MG = -8;
export const BISHOP_RAMMED_EG = -64;
/** a rook on a semi-open and an open file, Ethereal 12.75 RookFile */
export const ROOK_FILE_MG: StaticArray<i32> = [
  57, 197,
];
export const ROOK_FILE_EG: StaticArray<i32> = [
  80, 16,
];
/** a rook on the enemy queen's file, Stash 37 RookXrayQueen */
export const ROOK_QUEEN_FILE_MG = 42;
export const ROOK_QUEEN_FILE_EG = 109;
/** a rook hemmed in by its own king, with and without castling rights, Stash 37 RookTrapped and RookBuried */
export const ROOK_TRAPPED_MG = 46;
export const ROOK_TRAPPED_EG = 15;
export const ROOK_BURIED_MG = -211;
export const ROOK_BURIED_EG = 59;

// King safety, Ethereal 12.75 evaluateKings and evaluateKingsPawns: the safety sum's terms, in the units its square reads (pieces.ts KS_DIV_MG).
/** the pawn shield by [king's file][file][own pawn's distance, 7 for none], Ethereal 12.75 KingShelter */
export const SHELTER_MG: StaticArray<i32> = [
  396, 656, 666, 652, 404, 882, -78, 426,
  147, 196, 205, -142, -190, 144, 395, -143,
  284, 352, 276, 204, 300, -178, 54, 164,
  47, 44, 20, 41, 23, -183, -584, -65,
  -28, 13, -78, -44, -137, -509, -1377, -104,
  60, 19, -41, 7, 55, 108, -314, -140,
  173, 123, 25, 75, 115, -45, 259, -63,
  -78, 12, 37, 24, -16, -143, -271, -167,
  0, 158, 248, -293, -426, -39, -820, -306,
  0, -558, -594, -810, -382, -492, -907, -942,
  0, 28, -135, -158, -5, -384, -429, -280,
  0, -300, -264, -233, -311, -636, -34, -370,
  0, -138, -151, -186, -143, -459, -493, -289,
  0, -10, -129, -155, 154, -860, 254, -293,
  0, 109, 84, 40, 25, -485, -86, -200,
  0, -95, -108, -252, -253, -368, -1098, -471,
];
export const SHELTER_EG: StaticArray<i32> = [
  338, 211, 295, 274, 404, 375, -161, 310,
  -371, -431, -415, -344, -218, 180, 400, -409,
  91, -9, 41, 100, 44, 645, 222, -33,
  137, 44, 34, -28, 9, 171, 661, 23,
  53, -49, 0, -27, 34, 260, 896, -10,
  -23, -95, -74, -140, -125, -221, 438, -22,
  24, -26, -8, -31, 9, 431, 357, 38,
  -28, -64, -14, 4, 81, 251, -860, 68,
  0, 458, 473, 776, 753, 244, -15, 614,
  0, -101, -89, 0, -362, 16, 20, -73,
  0, 51, 66, 17, 136, -39, -361, 12,
  0, 360, 293, 188, 295, 684, -220, 180,
  0, 187, 112, 129, 84, 571, -254, 137,
  0, -110, -52, -138, -307, 121, 190, -47,
  0, -78, -85, -142, -184, 264, 422, 48,
  0, -275, -178, -119, -20, -93, -239, -28,
];
/** the pawn storm by [blocked][file from the edge][enemy pawn's distance, 7 for none], Ethereal 12.75 KingStorm */
export const STORM_MG: StaticArray<i32> = [
  19, 206, -10, -144, -71, -23, -43, -105,
  -56, 127, -86, 11, 13, 64, 16, -97,
  224, 223, -133, -67, -50, 1, 55, -72,
  167, 69, 48, -78, 20, 53, 14, -9,
  0, -88, -142, 60, 80, -13, 292, -267,
  0, -73, -88, 166, 90, 18, 297, -672,
  0, -166, -37, 21, -8, -45, 193, 550,
  0, -5, 46, -39, 10, 85, 302, 421,
];
export const STORM_EG: StaticArray<i32> = [
  46, 37, 22, 1, -33, -55, -44, -76,
  221, 210, 146, 63, 59, 24, 26, 28,
  115, 145, 129, 46, 28, -11, -71, 9,
  -44, 34, -56, -24, -83, -104, -126, -72,
  0, -78, 10, -118, -126, -59, -179, 1184,
  0, -205, -20, -45, 16, -39, -273, 192,
  0, -302, -110, -42, -17, -116, -145, -133,
  0, -127, -219, -93, -57, -232, -444, 276,
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
export const FLANK_ATTACK_MG = 0;
export const FLANK_ATTACK_EG = -8;

// Passed pawns outside the king-pawn table, Ethereal 12.75 evaluatePassed and Weiss c735b8f EvalPassedPawns.
/** by [can advance][safe to advance][rank]; each cell is Ethereal 12.75 PassedPawn's less its blocked and unsafe cell, since pawns.ts has the rank's base value */
export const PASSED_ADVANCE_MG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 85, 104, -41, -73, -124, -212, 0,
  0, 40, 77, -45, 54, 29, 175, 0,
  0, 92, 146, -9, -13, -142, -508, 0,
];
export const PASSED_ADVANCE_EG: StaticArray<i32> = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 40, -79, 43, -38, 196, 230, 0,
  0, 148, -67, 79, -65, 185, 422, 0,
  0, 60, -136, 44, 111, 895, 1864, 0,
];
/** no enemy piece or attack on the pawn or its path, Ethereal 12.75 PassedSafePromotionPath */
export const PASSED_SAFE_PATH_MG = -200;
export const PASSED_SAFE_PATH_EG = 304;
/** an own rook behind the pawn on its file, Weiss c735b8f PassedRookBack */
export const PASSED_ROOK_BEHIND_MG = 71;
export const PASSED_ROOK_BEHIND_EG = 124;

// Threats, Ethereal 12.75 evaluateThreats: against the side named, except the push.
export const THREAT_WEAK_PAWN_MG = -46;
export const THREAT_WEAK_PAWN_EG = -231;
export const THREAT_MINOR_BY_PAWN_MG = -348;
export const THREAT_MINOR_BY_PAWN_EG = -306;
export const THREAT_MINOR_BY_MINOR_MG = -108;
export const THREAT_MINOR_BY_MINOR_EG = -181;
export const THREAT_MINOR_BY_MAJOR_MG = -110;
export const THREAT_MINOR_BY_MAJOR_EG = -373;
export const THREAT_ROOK_BY_LESSER_MG = -321;
export const THREAT_ROOK_BY_LESSER_EG = -181;
export const THREAT_MINOR_BY_KING_MG = -110;
export const THREAT_MINOR_BY_KING_EG = -314;
export const THREAT_ROOK_BY_KING_MG = -212;
export const THREAT_ROOK_BY_KING_EG = -283;
export const THREAT_QUEEN_MG = -336;
export const THREAT_QUEEN_EG = -161;
export const THREAT_OVERLOADED_MG = -13;
export const THREAT_OVERLOADED_EG = -102;
export const THREAT_PUSH_MG = 81;
export const THREAT_PUSH_EG = 125;

// Complexity, Ethereal 12.75 evaluateComplexity: the endgame half's adjustment, seeded from its four terms.
export const COMPLEXITY_PAWNS = 32;
export const COMPLEXITY_FLANKS = 416;
export const COMPLEXITY_ENDGAME = 386;
export const COMPLEXITY_OFFSET = -739;
