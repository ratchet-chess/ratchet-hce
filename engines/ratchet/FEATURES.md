# Features of the own engine, and their dated implementations

A feature is a technique, named by its Chess Programming Wiki page, or by a page and section as `Page#Section`. An
implementation is one engine's version of it. A comment in `engines/ratchet/` names the features its code implements,
as `Feature: Delta_Pruning.` or `Features: A, B.`, and cites the implementation it follows.

Each section below is one feature. Its "Used in" line is written by `bun tools/citations.ts --write` from those
names. Its list holds dated implementations found in other programs and publications:

- the oldest found;
- the ones the engine follows, dated by the cited revision;
- the steps between that matter: a credit from one program to another, a rename, or the implementation that gave the
  feature its name.

Each line is a fact about its own date. A line cites engine, revision and symbol, which `SOURCES.md` resolves, or a
publication in italics. A source that states no license is cited by file and symbol only. An implementation read from a
disputed clone is cited as the program it is assumed to copy. A git revision's line is dated by its commit; an
archive's, by the stamp of the routine or file it cites where the source has one, so one release can carry several
dates. ⚠ marks an inferred date.

## Aspiration_Windows
<!-- used-in -->
Used in: `params.ts` ASP_DEPTH; `search.ts` think.
<!-- /used-in -->
- 1977, Chess 4.6 EVALU8 BAS29–BAS34: each iteration searches a window of one pawn, `FLXTOL` 64, either side of the
  last iteration's score; when no root move reaches the lower bound, that bound opens fully and the iteration starts
  again.
- 1990-09-23, Cray Blitz 49h fail.f FAILHI, FAILLO: a root bound that fails is moved by a pawn, then by a queen, then
  to infinity, for the same move. The date is the routines' last revision.
- 2020-01-15, Stockfish 11 Thread::search: from depth 4, a window of 21 + |score| / 256 around the root move's last
  score; a fail low moves beta to the window's middle, a failed bound reopens from the returned score, the window grows
  by a quarter plus 5, and each fail high in a row searches the root a ply shallower.
- 2020-10-09, Ethereal 12.75 aspirationWindow: from depth 5, a window of 10 either side of the last score; a fail low
  moves beta to the window's middle and lowers alpha from its old bound, a fail high raises beta and searches a ply
  shallower, and the window grows by half after each fail.

## Attack_Spans
<!-- used-in -->
Used in: `pawns.ts` sideValue.
<!-- /used-in -->
- 2025-04-24, Stash 37 compute_attack_span: the union of the squares on the neighboring files ahead of each own pawn,
  which that pawn could attack as it advances; evaluate_backward calls a pawn backward when its stop square lies outside
  that set.

## Attack_and_Defend_Maps
<!-- used-in -->
Used in: `pieces.ts` record.
<!-- /used-in -->
- 1977, Chess 4.6 CREATE ADDATK, DELATK, CUTATK, PRPATK; SQRLST ATKFR, ATKTO: for every square, the set of squares its
  man attacks and the set of men that attack it, updated as each move is made and unmade.
- 2008-09-01, Stockfish bb751d6c evaluate attackedBy: in the import of Glaurung's version 2.1, a bitboard per side and
  piece type of the squares it attacks, filled as each piece is scored, and their union.
- 2020-10-09, Ethereal 12.75 evaluateKnights attackedBy, attackedBy2: the same maps by piece type and in all, and the
  squares a side attacks twice, filled as each piece is scored. In evaluateBishops and evaluateRooks a bishop sees
  through its own bishops and queens and a rook through its own rooks and queens; evaluateQueens sees through
  nothing.

## Backward_Pawn
<!-- used-in -->
Used in: `params.ts` PAWN_BACKWARD_MG, PAWN_BACKWARD_OPEN_MG; `pawns.ts` sideValue.
<!-- /used-in -->
- 1959, Kmoch, *Pawn Power in Chess*: the straggler, a pawn that has lost its pawn support and whose stop square an
  enemy pawn controls, as the wiki's Backward_Pawns_(Bitboards) page gives it; the book is closed.
- 1977, Chess 4.6 EVCODE PSEVAL: on each file, the most advanced pawn with no actual or potential pawn defense, scored
  by how many enemy pawns bear on its stop square.
- 2020-10-09, Ethereal 12.75 evaluatePawns PawnBackwards: a pawn no own pawn can defend whose stop square an enemy pawn
  attacks; one value on a file an enemy pawn closes, one on an open file.
- 2025-04-24, Stash 37 evaluate_backward: the same stop-square test, scored on an open file only.

## Bad_Bishop
<!-- used-in -->
Used in: `params.ts` BISHOP_PAWNS_MG, BISHOP_RAMMED_MG, BISHOP_BAD_PAWNS_MG; `pieces.ts` bishops.
<!-- /used-in -->
- 1998-02-22, Phalanx XII static.c score_position: an own pawn flagged as fixed, on a square of an own bishop's color,
  costs a few centipawns, more on d3, e3, d4 and e4. A pawn is fixed when its stop square is occupied, or when its own
  pawns beside it, less the enemy pawns diagonally ahead, number fewer than one.
- 2019-02-06, Laser 1.7 BISHOP_PAWN_COLOR_PENALTY, BISHOP_RAMMED_PAWN_COLOR_PENALTY: per bishop, a cost for each own
  pawn on its color, and another for each own pawn there that an enemy pawn blocks.
- 2024-09-24, Weiss 11a0f72 BishopBadP: the count of own pawns on the bishop's color, times the own blocked pawns on
  files c to f.

## Best_Move_Node_Share
<!-- used-in -->
Used in: `params.ts` TM_NODE_BASE; `time.ts` header.
<!-- /used-in -->
- 2005-08-07, Glaurung Mainz root.c root_search: from iteration 5, an easy move whose subtree took over 85% of the
  nodes stops the search past a sixteenth of max_time, over 99% past a thirty-second of it.
- 2021-07-12, Koivisto 51747be9 spentEffort: each root move's nodes are counted by from- and to-square, and the best
  move's percentage of the nodes sets how much of the time the search may still use.
- 2024-02-11, Stockfish bf2c7306 Search::Worker::iterative_deepening: the search stops early when nearly all its nodes
  went to one move; the message credits the idea to Koivisto.
- 2024-12-18, Weiss 1401211 IterativeDeepening: the search stops past soft × (0.5 + 2.5 × (1 − share)), unless the last
  iteration changed the best move.

## Bishop_Long_Diagonal
<!-- used-in -->
Used in: `params.ts` BISHOP_LONG_MG; `pieces.ts` bishops.
<!-- /used-in -->
- 2020-01-29, Ethereal df2d953 evaluateBishops BishopLongDiagonal: a bishop on a long diagonal, off the four center
  squares, that sees two center squares through pawns alone. The commit names Stockfish as the idea's source.
- 2020-10-09, Ethereal 12.75 evaluateBishops BishopLongDiagonal: the same test, with its value retuned.

## Bishop_Pair
<!-- used-in -->
Used in: `params.ts` BISHOP_PAIR_MG; `pieces.ts` bishops.
<!-- /used-in -->
- 1986-04-02 ⚠, Awit 1986 awit.alw HUB: a partial form. Outside the endgame, while either side has both bishops,
  every bishop is valued a little above a knight. The date is the listing's latest internal date.
- 1988, Stanback, *GNU Chess* version 2, comp.sources.games v04i037–040: ExaminePosition raises every square of both
  bishops' tables a little for a side that has two bishops.
- 1999, Kaufman, *The Evaluation of Material Imbalances*: the pair is worth half a pawn on average.
- 2005-06-17, Fruit 2.1 material.cpp material_comp_info: BishopPairOpening and BishopPairEndgame, 50 each, in the
  material table.
- 2020-10-09, Ethereal 12.75 evaluateBishops BishopPair: one (middlegame, endgame) value for a side with two or more
  bishops.

## Bishop_X-Ray_Pawns
<!-- used-in -->
Used in: `params.ts` BISHOP_XRAY_PAWNS_MG; `pieces.ts` bishops.
<!-- /used-in -->
- 2020-05-06, Stockfish a91cb9fc Evaluation::pieces BishopXRayPawns: a cost per enemy pawn on the bishop's diagonals
  as they run on an empty board.

## Bishop_on_King_Ring
<!-- used-in -->
Used in: `params.ts` BISHOP_KING_RING_MG; `pieces.ts` bishops.
<!-- /used-in -->
- 2020-05-25, Stockfish d40d04c1 RookOnKingRing: a rook that does not attack the enemy king ring, on a file that crosses
  the ring, gets a bonus.
- 2020-05-31, Stockfish d1ec10cd BishopOnKingRing: a like bonus for a bishop whose diagonals reach the ring when only
  pawns block them; the commit names the rook term as its model.

## Bishops_of_Opposite_Colors
<!-- used-in -->
Used in: `eval.ts` endgameScale.
<!-- /used-in -->
- 1996-09-20, Crafty 10.18 evaluate.c Evaluate bishops_opposite_color: with one bishop each on opposite colors and no
  other piece, the whole score, material included, is halved.
- 2005-06-17, Fruit 2.1 eval.cpp eval DrawBishopFlag: with bishops alone on opposite colors, each side's draw
  multiplier drops to 8 of 16.
- 2025-04-24, Stash 37 eval_scale_endgame eval_is_ocb_endgame: the endgame half's factor of 256 is 33 plus 21 per
  passed pawn of the strong side with the bishops alone, and 71 plus 9 per man of the strong side with other pieces.

## Candidate_Passed_Pawn
<!-- used-in -->
Used in: `params.ts` PAWN_CANDIDATE_MG; `pawns.ts` header, sideValue.
<!-- /used-in -->
- 1977, Chess 4.6 EVPOSS MIN40 FPNMAJ: a pawn-majority bonus, not a candidate test: each file's front pawn gains by its
  rank when its side has more pawns than the enemy on that file and the two beside it.
- 2005-06-17, Fruit 2.1 pawn_comp_info: a pawn with no pawn of either color ahead on its file, not passed, whose own
  pawns at or behind it on the neighboring files are as many as the enemy pawns ahead there, and which is defended by as
  many pawns as attack it; a bonus by rank.
- 2020-10-09, Ethereal 12.75 evaluatePawns PawnCandidatePasser: a pawn whose stoppers all attack it or its stop square,
  with at least as many own pawns guarding the stop square as enemy pawns attacking it; a table by rank and by whether
  its own defenders match its attackers.
- 2025-04-24, Stash 37 evaluate_passed: a pawn with no enemy pawn ahead on its file whose path has no square that enemy
  pawns attack more often than own pawns, counting up to two attacks; Stash pays it the passed bonus.

## Check_Extensions
<!-- used-in -->
Used in: `params.ts` CHECK_EXT.
<!-- /used-in -->
- 1977, Chess 4.6 EVCHEK MIN70–MIN85; EVFULL FUL52: a node in check at or past the last full-width ply searches every
  evasion, with no stand pat, so a check given at the horizon is answered a ply deeper.
- 1983, Kaindl, *Searching to Variable Depth in Computer Chess*, IJCAI-83: the best programs no longer count a reply to
  check as a ply of depth.
- 1996-09-24, Crafty 10.18 search.c Search: the move that gives check is searched a ply deeper while the line stays
  within 12 plies past the iteration depth; at the root, in searchr.c SearchRoot, always.
- 2026-10-26, Stash f91e750 search: a move that gives check is searched a ply deeper, unless it is the TT move under a
  singular test, within the limits on the line's extensions.

## Connected_Pawns
<!-- used-in -->
Used in: `params.ts` PAWN_PHALANX_MG, PAWN_DEFENDER_MG; `pawns.ts` sideValue.
<!-- /used-in -->
- 1978-12, Chess 0.5 EVPAWN: a bonus per pair of own pawns side by side (`FPFLNX`) and per own pawn that a pawn defends
  (`FPCONN`).
- 1994-03-08, Arasan 1.0 SCORING.CPP PAWN_DUO: a bonus for own pawns side by side past the third rank; its comment
  credits the term to Kmoch.
- 2025-04-24, Stash 37 evaluate_connected PhalanxBonus, DefenderBonus: a bonus by rank once per pair of own pawns side
  by side, and one by the defender's rank for each pawn that defends an own pawn.

## Delta_Pruning
<!-- used-in -->
Used in: `params.ts` QS_DELTA; `search.ts` qsearch.
<!-- /used-in -->
- 1977, Chess 4.6 EVMINI MIN65: in the capture search, a capture other than a promotion or en passant is skipped when
  the material after it, plus the side's best positional bound, cannot raise the side's bound.
- 1996-09-20, Crafty 10.18 quiesce.c Quiesce: each capture is skipped when the material after it stays more than half a
  pawn below α; the `main.c` changelog puts the test at version 9.27. The feature's name comes from this code's
  variable `delta`: Hyatt, *Computer Chess Club*, 2004-08-12.
- 2023-09-11, Stash 007850d qsearch: when stand pat plus the margin is already below alpha, a capture that does not win
  material by SEE is skipped as well.
- 2026-10-26, Stash f91e750 qsearch: a capture that gives no check is skipped when stand pat, its victim's value and a
  margin cannot reach α, and the skip raises the node's score to that estimate.

## Depth_Reduction_R
<!-- used-in -->
Used in: `params.ts` NMP_DEPTH; `search.ts` search.
<!-- /used-in -->
- 1993, Donninger, *Null Move and Deep Search*, ICCA Journal 16(3): a recursive null move with R = 2.
- 1999, Heinz, *Adaptive Null-Move Pruning*, ICCA Journal 22(3): R = 3 at greater depths, R = 2 below.
- 2009-05-20, assumed Rybka 3, from the disputed IPPOLIT 2009 clone, IPPOLIT.c: R grows with how far the eval is above
  β, up to a cap.
- 2009-11-13, Stockfish 314faa90 search: R one ply larger when the eval is far enough above β.
- 2014-01-24, Stockfish 074c7a3c search: R by depth and by the eval's margin over β together.
- 2020-10-09, Ethereal 12.75 search: R = 4 + depth / 6 + min(3, (eval − β) / 200).

## Doubled_Pawn
<!-- used-in -->
Used in: `params.ts` PAWN_DOUBLED_MG, PAWN_DOUBLED2_MG; `pawns.ts` sideValue.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: doubled pawns, D, are one term of his evaluation f(P).
- 1977, Chess 4.6 EVPOSS MI36A: one penalty per file that holds two or more own pawns.
- 2021-08-04, Weiss 2.0 EvalPawns PawnDoubled: one penalty per own pawn that stands directly in front of another and so
  blocks it.
- 2022-09-08, Weiss 4024a5e PawnDoubled2: a second penalty for own pawns two ranks apart on a file, one square between
  them.

## Draw_Evaluation
<!-- used-in -->
Used in: `eval.ts` header, endgameScale, evalWith; `params.ts` (file).
<!-- /used-in -->
- 1977, Chess 4.6 EVCODE MBTAB; EVMINI MINI1–MINI5: below a material threshold a table scores simple endings by
  material alone, a lone minor as a draw, and bare kings are a draw.
- 1996-09-10, Crafty 10.18 evaluate.c EvaluateDraws: a side with no pawns and at most a minor cannot be scored ahead,
  and with no pawns on the board and at most a minor each the position is a draw. The `main.c` changelog puts the
  one-sided rule at version 10.0.
- 2005-06-17, Fruit 2.1 material.cpp material_comp_info; eval.cpp eval: a multiplier per side in sixteenths, applied
  while that side is ahead: 0 for a pawnless side with a minor or less, and smaller cuts for other drawish material
  and for the endings its recognizers know.
- 2020-06-28, Stockfish 16836f39 Evaluation::winnable: a rook each, the strong side's pawns on one wing and at most
  one more than the defender's, and the defending king beside its own pawns, scale 36 of 64. Stockfish 67818ee9
  (2020-07-02) drops the condition that the strong side has no passed pawn.
- 2020-06-28, Stockfish c7194bd9 Evaluation::winnable: with one queen on the board, scale 37 of 64. Stockfish 69d3be42
  (2020-06-29) adds 3 per minor of the side without the queen.
- 2021-08-15, Weiss b65b91e ScaleFactor: the strong side's pawn scale loses 20 when all its pawns stand on one wing.
- 2025-04-24, Stash 37 eval_scale_endgame: the endgame half times a factor of 256. Without strong pawns and at most a
  bishop ahead, it is a draw or a small factor by the material gap; in other endings it is 177 plus 13 per strong
  pawn.
- 2025-12-20, Lynx 1d3047b5 StaticEvaluation: a minor against a minor with one pawn on the board is halved.

## Draw_Score_Randomization
<!-- used-in -->
Used in: `params.ts` DRAW_JITTER; `search.ts` drawScore.
<!-- /used-in -->
- 2018-10-14, Stockfish 97d2cc9a value_draw: from depth 4, a draw scores one unit above or below zero by the parity of
  the thread's node count, so that the search does not settle on one threefold repetition among many; its message
  credits the hint to a user's reports.
- 2022-01-26, Stash 767fdb1 draw_score: a draw by repetition or by the fifty-move rule scores one unit above or below
  zero by the second bit of the node count.
- 2026-10-26, Stash f91e750 worker_draw_score: the same score.

## Evaluation_Hash_Table
<!-- used-in -->
Used in: `eval.ts` EVAL_CACHE_SIZE, evalCached.
<!-- /used-in -->
- 1992-10-20 ⚠, GNU Chess 4.0.74 doc/ChangeLog: the entry for patchlevel 59 adds a cache of static evaluations. As read
  in patchlevel 74's src/eval.c PutInEETable, ProbeEETable, it is a table per side, indexed by the hash key and checked
  by the second hash word, compiled in with CACHE. The year is inferred from the entry's weekday and the entries after
  it.
- 1998-03-01, Phalanx XII evaluate.c static_eval, initcache: 65536 four-byte words; the key's low 16 bits index the
  table, and its high 16 bits are a tag kept in one word with a 14-bit value.
- 2020-10-09, Ethereal 12.75 EvalEntry, getCachedEvaluation, storeCachedEvaluation: one 64-bit word per entry, the key's
  high 48 bits over the eval in the low 16; a store always replaces.

## Extensions
<!-- used-in -->
Used in: `search.ts` rootDepth, search.
<!-- /used-in -->
- 1983, Kaindl, *Searching to Variable Depth in Computer Chess*, IJCAI-83: a search whose depth varies by line, with
  replies to check not counted as a ply and some moves counted as half a ply.
- 1996-09-24, Crafty 10.18 search.c Search: the check, recapture, pawn-push and one-reply extensions each stop once the
  line is 12 plies past the iteration depth.
- 2004-03-04, Amy 0.8.7 search.c negascout: past twice the iteration depth, a move's extensions are halved.
- 2026-10-26, Stash f91e750 search: no extension at the root, none once the line is twice the iteration's depth, and
  none once the line's double extensions reach half of it.

## Extra_Time_on_Falling_Score
<!-- used-in -->
Used in: `params.ts` TM_FALL_BASE; `time.ts` header.
<!-- /used-in -->
- 1979 ⚠, Blitz 6.9 select.f SELECT: when the root score is three quarters of a pawn below the last iteration's,
  which only a root fail low allows, the search runs on to twice the target, or to the target plus half the time saved
  on earlier moves if that is more. Its clock code was edited after the listing, so the form is read from its logic.
  Dated by CPW's ACM 1979 crosstable; the text is an OCR transcription.
- 1987, Stanback and others, *GNU Chess*, comp.sources.games volume 3: SelectMove and UpdateSearchStatus add time
  as the root score falls below its running mean, up to five times the target on a root fail low.
- 1996-09-02, Crafty 10.18 time.c TimeCheck: a root score that falls or fails low lets the search run past its limit, to
  2.5 or 6 times it.
- 2024-03-29, Berserk 787b2e1b Search scoreChangeFactor: the soft limit times 0.1127 + 0.0262 per centipawn of fall
  over three iterations, within 0.5028 and 1.6561, beside a second term for the fall since the last move.

## Fifty-move_Eval_Scaling
<!-- used-in -->
Used in: `search.ts` search.
<!-- /used-in -->
- 1974, CHESS 4.0, as its authors' notes in Hayes & Levy, *The World Computer Chess Championship, Stockholm 1974*,
  1976, p. 86, describe it: the score is pulled toward the draw value as the fifty-move limit nears.
- 1998-02-27, Phalanx XII evaluate.c static_eval: with fewer than 24 plies left before the hundredth, material and
  positional score are each scaled by the plies left over 24.
- 2009-05-20, assumed Rybka 3, from the disputed IPPOLIT 2009 clone, IPPOLIT.c otsOSNO: past 50 reversible plies, the
  eval is scaled by (114 − count) / 64.
- 2020-06-10, Stockfish 3af083a7 Evaluation::value: the eval is scaled by (100 − count) / 100, in place of a shuffling
  term inside the initiative.
- 2024-11-22, Weiss a7d7783 CorrectEval: past 12 plies, the corrected eval is scaled by (256 − count) / 256.

## Futility_Pruning
<!-- used-in -->
Used in: `params.ts` FUT_DEPTH, BAD_NOISY_FUT_DEPTH, PRUNE_BASE; `search.ts` search.
<!-- /used-in -->
- 1977, Chess 4.6 EVPARS; EVFULL FUL31, FUL40: at the last full-width ply, a move after the first that is not a
  capture, promotion, castle or check is skipped when material plus the side's best positional bound cannot raise its
  bound.
- 1998, Heinz, *Extended Futility Pruning*, ICCA Journal 21(2): at a frontier node, a move that gives no check is
  skipped when material plus a margin cannot reach alpha; a node one ply further back runs the same test with a wider
  margin.
- 2010-01-21, Stockfish 5b2fc1e1 search: a quiet move's margin is read at the depth the move would have after its
  late-move reduction, plus the largest gain that move has shown.
- 2020-10-09, Ethereal 12.75 search: up to depth 8, when eval + 65 per ply is at or below alpha and the move's history
  is under 12000, or 6000 when improving, the remaining quiets are skipped.
- 2024-06-11, Ethereal 0e47e9b search: the test on the reduced depth, with a margin of 77 + 52 per ply of it and
  history limits of 14296 and 6004.
- 2026-09-11, Clockwork 662c568 Worker::search: at depth 8 or less, not in check, once the picker reaches the bad
  captures, static eval + 75 per ply at or below alpha ends the move loop, and the best score rises to that estimate.

## Futility_Pruning#Move_Count_Based_Pruning
<!-- used-in -->
Used in: `params.ts` LMP_DEPTH; `search.ts` search.
<!-- /used-in -->
- 2007-08-04, Glaurung g070804 search.cpp search: at a null-window node, a quiet move that gives no check is skipped
  once the move count reaches 2 + depth, in half plies, if its history allows the prune.
- 2013-07-29, Stockfish 5ee16a18 search: a second row of move counts, three quarters of the first from 5 half plies,
  applies when the static eval is below that of two plies back; the commit names the test improving.
- 2020-10-09, Ethereal 12.75 LateMovePruningCounts: up to depth 8, once the quiets seen reach the count of one of two
  rows, chosen by improving, the remaining quiets are skipped.
- 2021-01-27, Ethereal 1eff740 initSearch: the two rows computed from a quadratic in depth each.
- 2021-08-04, Weiss 2.0 AlphaBeta: the count is of moves played before the move, so the quiet that brings it past
  (1 + depth²) / (2 − improving) is still played, and every later quiet is dropped.

## Hanging_Piece
<!-- used-in -->
Used in: `params.ts` THREAT_WEAK_PAWN_MG; `pieces.ts` threats.
<!-- /used-in -->
- 1971, Mittman et al., *Computer Chess Programs (Panel)*, ACM '71: in his section, Slate lists hung pieces and threats
  to pieces among the terms of CHESS 3.5's position evaluator.
- 1977, Chess 4.6 EVPOSS MIN45–MI47A: a cost when a piece of the side to move is attacked and undefended, or attacked
  by a cheaper man, and a further cost when two or more are.
- 2009-05-20, assumed Rybka 3, from the disputed IPPOLIT 2009 clone, IPPOLIT.c otsOSNO: a queen attacked by a pawn
  pays; a queen gains for attacking an enemy piece that no pawn defends, and a rook for attacking such a pawn or
  minor, or the queen.
- 2009-10-25, Stockfish b3868562 evaluate_threats ThreatBonus: a bonus per pair of attacker type and victim type over
  the enemy pieces that no pawn defends, and a cost by type for each piece an enemy pawn attacks.
- 2020-10-09, Ethereal 12.75 evaluateThreats: popcounts of named sets: weak pawns, minors attacked by pawns and by
  minors, poorly defended minors attacked by majors, rooks attacked by lesser pieces, poorly defended pieces attacked
  by the king, and queens attacked.

## Hash_Move
<!-- used-in -->
Used in: `movepick.ts` header.
<!-- /used-in -->
- 1977, Chess 4.6 EVFULL FU20A: the table's from-to move is tried after the main-variation move, the good captures and
  the first killer, before the other killers.
- 1996-09-27, Crafty 10.18 next.c NextMove: the table move is tried before any generation, once ValidMove accepts it.
- 2005-06-17, Fruit 2.1 sort.cpp sort_next: the table move first, tested for pseudo-legality and legality; the readme
  puts the legality test at 2.1.
- 2026-08-13, Weiss c735b8f NextMove: the TT move first, before any generation.

## Hashfull
<!-- used-in -->
Used in: `tt.ts` ttHashfull.
<!-- /used-in -->
- 2026-08-13, Weiss c735b8f HashFull: the permille of entries in the first 1000 buckets that the current search stored.

## History_Heuristic
<!-- used-in -->
Used in: `history.ts` header, bonusAt; `movepick.ts` header, quietScore; `params.ts` THREAT_HISTORY, HIST_BONUS_MUL; `search.ts` rewardQuiet, updateHistories, search.
<!-- /used-in -->
- 1983, Schaeffer, *The History Heuristic*, ICCA Journal 6(3): a counter per from- and to-square, raised for each move
  that proves best by an amount that grows with depth (secondary; the journal is closed).
- 1987, Stanback and others, *GNU Chess*, comp.sources.games volume 3: in search and LinkMove, a byte per from- and
  to-square gains the depth at each node's best move, up to 180, and is zeroed at each search.
- 2005-06-17, Fruit 2.1 sort.cpp good_move, quiet_move_value: a counter by piece and to-square gains depth² for a node's
  best quiet move, and every entry is halved when one reaches 16384.
- 2015-05-05, Stockfish 946fa476 id_loop: the history tables last from one move of the game to the next.
- 2015-08-25, Stockfish 7f300a76 Stats::update: history gravity: each update first pulls the entry toward zero by a
  share of its value, so the table saturates instead of being clamped.
- 2018-01-28, Ethereal 013ca36 updateHistory: a butterfly entry moves by gravity within ±16384; the message credits
  Stockfish's approach.
- 2021-01-07, Weiss 7a05d2f HistoryBonus: the butterfly entry moves by gravity, ±depth² scaled by 32 against 512; the
  message credits the formula to Ethereal.
- 2021-01-10, Weiss 5168a50 AlphaBeta: a quiet TT move that cuts from the table takes the history bonus.
- 2024-06-11, Ethereal 0e47e9b update_history, update_quiet_histories: entry += bonus − entry × |bonus| / 16384; a quiet
  that cut as the only quiet tried, at depth 3 or less, leaves the quiet histories as they are.
- 2026-08-13, Weiss c735b8f Bonus: min(2418, 251 d − 267).
- 2026-10-25, Clockwork 641d9f5 Worker::search: a cut far enough above beta takes the bonus and the malus of one ply
  deeper.

## History_Heuristic#Capture_History
<!-- used-in -->
Used in: `history.ts` header, captureThreatsAt; `movepick.ts` captureIndex; `params.ts` CAPTURE_THREATS; `search.ts` updateHistories.
<!-- /used-in -->
- 2017-11-03, Stockfish 4bc11984 MovePicker::score: a history by moved piece, to-square and captured type, added to the
  victim's value to order captures; a capture that cuts gains, the captures tried before it lose.
- 2022-05-25, Ethereal b0e3d52 underlying_capture_history: the table is also indexed by whether the opponent attacks
  the capture's from-square and its to-square.
- 2025-03-30, Weiss 95b0951 UpdateHistory: each capture tried before the best move takes the malus, whatever the best
  move's kind, and a capture that cuts takes the bonus.
- 2026-10-25, Clockwork 641d9f5 score_move: a capture's order is the victim's MVV value plus its capture history.

## History_Heuristic#Continuation_History
<!-- used-in -->
Used in: `history.ts` header, gravityFrom; `movepick.ts` quietScore; `params.ts` CONT6, HIST_PRIOR_MALUS, HIST_PRIOR_BONUS_DEPTH; `search.ts` rewardQuiet, rewardPrior, search.
<!-- /used-in -->
- 2015-03-12, Stockfish 13c11f40 CounterMovesHistoryStats: counter-move history, a piece and to-square table for each
  piece and square of the last move, summed with the main history to order quiets.
- 2015-10-12, Stockfish 8fd34d77 search: a node where no move raised alpha gives the bonus to the counter-move history
  entry of the parent's quiet move.
- 2016-03-10, Stockfish a273b6ef MovePicker::score<QUIETS>: the same table for the move two plies back, the follow-up
  history.
- 2017-06-30, Stockfish b40e45c1 MovePicker: the table is renamed ContinuationHistory; quiets are ordered by the
  butterfly entry plus the entries for the moves 1, 2 and 4 plies back.
- 2018-11-29, Stockfish 10 MovePicker::score<QUIETS>: the butterfly entry plus the 1-, 2- and 4-ply entries.
- 2020-01-15, Stockfish 11 update_continuation_histories, update_all_stats: an update goes to the entries for the moves
  1, 2, 4 and 6 plies back, and a refuted quiet first move of the parent takes an extra malus.
- 2020-10-09, Ethereal 12.75 getHistory: the butterfly entry plus the 1- and 2-ply entries, the sum that pruning and
  reductions read.
- 2023-09-20, Stash 660df34 update_cont_histories: the 4-ply table takes the bonus and the malus too.
- 2025-10-01, Clockwork 3dd022c History::get_conthist, update_quiet_stats: a 6-ply table orders quiets and takes their
  updates.
- 2025-11-29, Stash 93a6d5f update_piece_hist_entry, update_continuation_histories: each continuation entry decays
  against the move's combined continuation entries, not against itself.
- 2026-10-25, Clockwork 641d9f5 Worker::search: after a reduced search is searched again, a quiet's continuation entries
  take the bonus if it failed high and the malus if it failed low.

## History_Heuristic#History_Maluses
<!-- used-in -->
Used in: `search.ts` updateHistories.
<!-- /used-in -->
- 2009-05-20, assumed Rybka 3, from the disputed IPPOLIT 2009 clone, IPPOLIT.c: at a cut, each quiet that failed loses
  a depth-scaled fraction of its history value, when the eval is above the bound less 50.
- 2018-01-28, Ethereal 013ca36 updateHistory: at a quiet cut, the cut move gains depth² and each quiet tried before it
  loses depth²; the message credits Stockfish's approach.
- 2025-03-30, Weiss 95b0951 UpdateHistory: each move of the best move's kind tried before it takes the malus.
- 2026-08-13, Weiss c735b8f Malus: min(693, 532 d − 163), a slope and cap apart from the bonus's.

## History_Leaf_Pruning
<!-- used-in -->
Used in: `params.ts` HIST_PRUNE_DEPTH, PRUNE_BASE; `search.ts` search.
<!-- /used-in -->
- 2006 ⚠, Toga II 1.2.1a search_full.cpp full_search: at a non-PV node of depth 4 or less, not in check, an
  unextended move whose fail-high ratio is under a third of the 70% history threshold, a quarter at depth 4, is
  skipped.
- 2015-10-21, Stockfish 4eca981e search: at depth 3 or less, a quiet move is skipped when its history by piece and
  to-square and its counter-move history are both negative.
- 2020-10-09, Ethereal 12.75 search: past the killers and the counter move, a quiet move whose counter-move or
  follow-up history is under that table's limit is skipped, at a reduced depth of 3, or 2 when improving.
- 2024-06-11, Ethereal 0e47e9b search: one limit for both tables, −1000, or −2500 when improving, at the same reduced
  depths.

## Improving
<!-- used-in -->
Used in: `params.ts` RFP_DEPTH, LMP_DEPTH, FUT_DEPTH, HIST_PRUNE_DEPTH, LMR_MIN_DEPTH; `search.ts` search.
<!-- /used-in -->
- 2013-07-29, Stockfish 5ee16a18 search: improving holds when the static eval is at or above that of two plies back;
  it picks the row of move-count pruning margins.
- 2019-02-06, Laser 1.7 PVS: improving holds when the static eval is at or above that of two plies back, or that ply
  was in check; its comment credits the idea to Stockfish.
- 2026-11-02, Alexandria 829daf4 Negamax: false in check; else the static eval is above that of two plies up, or of
  four plies up when that ply was in check, and true when both were.

## Initiative
<!-- used-in -->
Used in: `eval.ts` header, complexity; `params.ts` COMPLEXITY_PAWNS.
<!-- /used-in -->
- 2019-10-10, Ethereal 05c2457 complexity: the endgame half moves toward or away from zero, never past it, by a sum
  of passed pawns, all pawns, pawns on both wings, a pawn-only ending and a negative offset. The commit names
  Stockfish's initiative code as its base.
- 2019-11-06, Xiphos 0.6 eval initiative: the same sum over all pawns, pawns on both wings and a pawn-only ending, less
  an offset, applied to the endgame half the same way. Its commit, Xiphos 1f57b81 (2019-11-05), credits the idea
  to Stockfish and the form to Ethereal 05c2457.
- 2020-10-09, Ethereal 12.75 evaluateComplexity: four terms, all pawns, pawns on both wings, a pawn-only ending and an
  offset, applied the same way.

## Internal_Iterative_Reductions
<!-- used-in -->
Used in: `params.ts` IIR_DEPTH; `search.ts` search.
<!-- /used-in -->
- 2020-08-13, Schröder, *An alternative to IID*, TalkChess t=74769: his older program drops internal iterative
  deepening for a full-ply reduction with no re-search.
- 2020-08-21, Stockfish e64b9572 search: internal iterative deepening is removed; a PV node of depth 6 or more with no
  TT move searches two plies shallower.
- 2026-11-01, Berserk 03cebd6 Negamax: a PV or cut node of depth 4 or more with no hash move, not in check and not in a
  singular search, searches a ply shallower; its comment credits Schröder's post.

## Isolated_Pawn
<!-- used-in -->
Used in: `params.ts` PAWN_ISOLATED_MG, PAWN_ISOLATED_OPEN_MG; `pawns.ts` sideValue.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: isolated pawns, I, are one term of his evaluation f(P).
- 1977, Chess 4.6 EVPOSS MIN37-MI37A: one penalty per file whose pawns have no own pawn on a neighboring file, larger
  when no enemy pawn stands on the file.
- 2005-06-17, Fruit 2.1 pawn_comp_info: a penalty per isolated pawn, its middlegame half doubled when no pawn of either
  color stands ahead on its file.
- 2020-05-31, Stockfish 8c3d9d99 evaluate: each isolated pawn pays Isolated, and WeakUnopposed too when no enemy pawn
  stands ahead on its file; an opposed doubled isolated pawn pays only the doubled penalty.

## Iterative_Deepening
<!-- used-in -->
Used in: `search.ts` think.
<!-- /used-in -->
- 1969, Scott's program Lancaster, as Marsland, *Computer Chess and Search*, 1991, p. 12, reports it (secondary): an
  iterated search.
- 1977, Chess 4.6 EVALU8 BAS13–BAS31: iterations from 2 plies, one ply deeper each; a finished iteration seeds the next
  one's window, root order and principal variation.
- 1978, Gillogly, *Performance Analysis of the Technology Chess Program*, CMU-CS-78-189: Tech has searched by iterative
  deepening since August 1972, so that the clock cannot stop it without a move.
- 2020-01-15, Stockfish 11 Thread::search: a root move whose search finishes above alpha takes its score at once, and
  the root list is sorted after each search, so a stop inside an iteration keeps the best move found so far.

## KBNK_Endgame
<!-- used-in -->
Used in: `eval.ts` cornerDistance, evalWith.
<!-- /used-in -->
- 1977-05-14, Tech II 614 chess2.614 EVEGPC, TENT: in a pawnless ending with exactly a knight and a bishop, a term
  drives the bare king toward a corner of the bishop's color, beside its centrality and the kings' closeness.
- 1996-05-16, Crafty 10.18 evaluate.c EvaluateMate: against a bare king, a bishop and knight read a 64-square table
  chosen by the bishop's color, which drives the losing king to the bishop's corner.
- 2025-04-24, Stash 37 endgame.c eval_kbnk: 100 per step of the gap between the bare king's file and rank, after a
  flip by the bishop's color, so the score grows toward that color's corners, plus a bonus for the kings' closeness.

## Killer_Heuristic
<!-- used-in -->
Used in: `history.ts` header; `movepick.ts` header; `search.ts` updateHistories, search.
<!-- /used-in -->
- 1968, Huberman, *A Program to Play Chess End Games*, Stanford Ph.D. thesis: the killer idea, which Uiterwijk 1992
  credits to it (secondary).
- 1976, Hayes & Levy, *The World Computer Chess Championship, Stockholm 1974*, Edinburgh University Press: CHAOS keeps
  the moves that refuted and tries them first, under the name killer heuristic (secondary).
- 1977, Chess 4.6 EVFULL FUL17–FUL22: two killers per ply with counts, then the first killer of two plies back.
- 1991-09-14, Cray Blitz 49h phase.f PHASE3: after its own ply's killers, a node tries the killers of every other ply of
  the same side; its comment gives the idea to the program's seventh version. The date is the routine's last revision.
- 2005-06-17, Fruit 2.1 sort.cpp good_move: two killers per ply, the newest first, set whenever a quiet move raises
  alpha.
- 2020-01-15, Stockfish 11 update_quiet_stats: a quiet move that cuts, a TT move at a table cutoff included, becomes the
  first killer.
- 2024-11-15, Weiss 0d00a00 UpdateQuietHistory: one killer per ply.

## King_Pawn_Tropism
<!-- used-in -->
Used in: `params.ts` PASSED_OUR_KING_MG; `pawns.ts` header, sideValue.
<!-- /used-in -->
- 1977, Chess 4.6 EVPOSS MIN26 FKPTRP: in the endgame, a side gains by the enemy king's mean Manhattan distance to all
  the pawns.
- 1996-05-16, Crafty 10.18 evaluate.c EvaluatePassedPawns supported_passer: a bonus by rank when the own king stands
  next to a file's most advanced passer.
- 2005-06-17, Fruit 2.1 eval_passer AttackerDistance, DefenderDistance: a passer's endgame bonus falls with its own
  king's distance and rises with the enemy king's, both scaled by rank.
- 2020-10-09, Ethereal 12.75 evaluatePassed PassedFriendlyDistance, PassedEnemyDistance: each king's distance to the
  passer times a value per rank; a passer with another own passer ahead on its file skips both.

## King_Safety#Attacking_King_Zone
<!-- used-in -->
Used in: `params.ts` (file), SAFETY_ATTACK_MG, SAFETY_UNSAFE_MG; `pieces.ts` KING_AREA, KS_DIV_MG, record, knights, bishops, rooks, queens, kingSafety.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: attacks on the squares near the king are one of his
  king-safety factors.
- 1977, Chess 4.6 EVPOSS MIN20 FKSATK: a penalty by the count of squares next to the king that the enemy attacks,
  weighted by the attacker's material.
- 2008-05-14, Glaurung's version 2.1, as imported in Stockfish bb751d6c evaluate.cpp attackZone: the king's moves plus
  those moves one rank toward the enemy; attack units on it index a nonlinear table.
- 2017-05-17, Stockfish c216dcbe evaluate_king: king danger is computed only when the attackers outnumber one less than
  the enemy's queens. Ethereal bd96fb9 credits this gate to Stockfish.
- 2020-10-09, Ethereal 12.75 kingAreaMasks, evaluateKings: the area is the king's moves, its square and the rank ahead,
  a file wider on an edge; attacks on it, less squares two of the king's own pawns defend, feed a sum squared in the
  middlegame and linear in the endgame.
- 2025-04-24, Stash 37 evaluate_safety UnsafeCheck: a penalty per square from which the attacker could give check but
  not safely.

## King_Safety#Pawn_Shield
<!-- used-in -->
Used in: `params.ts` (file), SHELTER_MG, SAFETY_SHELTER_MG; `pawns.ts` header, sideValue, shelter.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: weak pawns near the king are one of his king-safety
  factors.
- 1977, Chess 4.6 EVPOSS MIN21-MIN24: a penalty when the king's file has no pawn of its side, larger once the king
  cannot castle, and one when neither neighboring file has one.
- 1978-12, Chess 0.5 EVKING FKPSHD: a bonus per own pawn on a square next to the king.
- 2005-06-17, Fruit 2.1 shelter_file: per file at and beside the king, a middlegame penalty that grows as the nearest
  own pawn ahead of the king stands farther up the file.
- 2020-05-24, Stockfish 7f2c8a2b evaluate_shelter: own pawns that enemy pawns attack leave the shelter, and enemy pawns
  that own pawns attack leave the storm.
- 2020-10-09, Ethereal 12.75 evaluateKingsPawns KingShelter, SafetyShelter: per file at and beside the king, a value by
  file, by whether it is the king's file and by the nearest own pawn's distance ahead, 7 for none; a second table by the
  same distance enters the king-safety sum.
- 2025-10-03, Lynx 21a3016e KingPawnShield: own pawns on the squares next to the king, one value for those enemy pawns
  attack and another for the rest.

## King_Safety#Pawn_Storm
<!-- used-in -->
Used in: `params.ts` (file), STORM_MG, SAFETY_SHELTER_MG; `pawns.ts` header, sideValue, shelter.
<!-- /used-in -->
- 1996-05-16, Crafty 10.18 evaluate.c EvaluatePawns: enemy pawns on the third and fourth ranks of the king's wing add 6
  and 4 shelter defects, which king safety scales by the enemy's material.
- 2005-06-17, Fruit 2.1 storm_file: per file at and beside the king, a middlegame penalty of 10, 30 or 60 when the enemy
  pawn there has reached the fourth, fifth or sixth rank; its readme lists pawn storms as new in this version.
- 2020-05-24, Stockfish 7f2c8a2b evaluate_shelter: enemy pawns that own pawns attack leave the storm, and the value of a
  blocked storming pawn becomes a table by rank.
- 2020-10-09, Ethereal 12.75 evaluateKingsPawns KingStorm, SafetyStorm: per file at and beside the king, a value by
  whether an own pawn stands directly in front of the enemy pawn, by file from the edge and by that pawn's distance, 7
  for none; a second table enters the king-safety sum.

## King_Safety#Square_Control
<!-- used-in -->
Used in: `params.ts` SAFETY_FLANK_ATTACK_MG, FLANK_ATTACK_MG; `pieces.ts` KING_FLANK, kingSafety.
<!-- /used-in -->
- 2016-07-08, Stockfish 1d09ee70 evaluate_king: a count of the squares a side attacks on the enemy king's wing, four
  files by five ranks, middlegame only; a square attacked twice and not covered by an enemy pawn counts twice. The code
  called it king tropism, a name that elsewhere means distance to the king.
- 2020-01-15, Stockfish 11 KingFlank FlankAttacks: the count, three files wide for a king on an edge file, inside the
  king danger.
- 2026-04-08, Clockwork bedb1e8 evaluate_king_safety: four flank counts in the king safety sum.
- 2026-10-25, Clockwork 641d9f5 king_flank: the flank as files a to d, c to f or e to h.

## Knight_In_Siberia
<!-- used-in -->
Used in: `params.ts` FAR_KNIGHT_MG; `pieces.ts` knights.
<!-- /used-in -->
- 2020-10-09, Ethereal 12.75 evaluateKnights KnightInSiberia: a knight whose distance to the nearer king is 4 to 7
  pays by that distance, a value for each of the four.

## Late_Move_Reductions
<!-- used-in -->
Used in: `params.ts` LMR_MIN_DEPTH, LMR_TT_PV, LMR_CUT_NODE, LMR_NOISY_MIN_DEPTH; `search.ts` ssFailHigh, search.
<!-- /used-in -->
- 2004-12-24, Fruit 2.0 search_full.cpp full_search: history pruning, on by default: at a non-PV node from depth 3,
  not in check, after 3 moves, an unextended quiet move whose history score is under the 60% threshold is searched a
  ply shallower, with no re-search. Its readme lists it as new in this version.
- 2005-06-17, Fruit 2.1 search_full.cpp full_search; sort.cpp history_prob: at a non-PV node from depth 3, after 3
  moves, an unextended quiet move whose fail-high ratio is under 60% is searched a ply shallower, and again at full
  depth if it fails high.
- 2010-01-03, Stockfish c99d963f search: the reduction grows with ln(move count) × ln(depth).
- 2020-01-15, Stockfish 11 search: a quiet move is reduced a ply more when the TT move is a capture.
- 2020-10-09, Ethereal 12.75 search: 0.75 + ln(depth) × ln(moves) / 2.25, a ply more at a non-PV node and when not
  improving, a ply less for the killers and the counter move, and up to two plies either way by history / 5000.
- 2021-08-04, Weiss 2.0 AlphaBeta: the reduction is taken from the depth after extensions, at least 1 and at most that
  depth, so an extended move keeps its extension in the reduced search.
- 2022-09-11, Berserk f05f9dc Negamax: the ply for a non-PV node is not added where the TT entry marks the node as on
  a PV now or before.
- 2025-03-30, Weiss 95b0951 InitReductions: captures and promotions have their own table,
  0.38 + ln(depth) × ln(moves) / 3.76, which capture history moves.
- 2026-10-25, Clockwork 641d9f5 Worker::search: the terms are summed in 1024ths of a ply and cut to whole plies at the
  end; a cut node, a noisy TT move, children that have failed high more than three times, and each raise of alpha at
  the node add to the sum.

## Late_Move_Reductions#Re-searches
<!-- used-in -->
Used in: `params.ts` LMR_DEEPER; `search.ts` search.
<!-- /used-in -->
- 2005-06-17, Fruit 2.1 search_full.cpp full_search: a reduced move that fails high is searched again at full depth.
- 2021-12-07, Stockfish c228f319 search: when the reduced search beats alpha by more than 88, the full-depth search
  runs a ply deeper.
- 2022-11-17, Stockfish 219fa2f0 search: when it beats the best score by less than one unit per ply of depth, the
  full-depth search runs a ply shallower; its message credits the idea to another developer.
- 2026-10-25, Clockwork 641d9f5 Worker::search: a ply deeper when the reduced search beats the best score by more than
  94; else a ply shallower when it beats it by less than one unit per ply of depth.

## MVV-LVA
<!-- used-in -->
Used in: `params.ts` MVV.
<!-- /used-in -->
- 1972, Gillogly, *The Technology Chess Program*, Artificial Intelligence 3: Tech tries the captures first, the most
  valuable victim first, as Marsland 1991 quotes it (secondary).
- 1977, Chess 4.6 EVFULL FUL10–FUL15: captures by estimated gain, the victim's value, less the attacker's on a square
  the enemy attacks.
- 1982, Condon & Thompson, *Belle Chess Hardware*, Advances in Computer Chess, volume 3: Belle orders captures by most
  valuable victim, then least valuable attacker (secondary).
- 2005-06-17, Fruit 2.1 sort.cpp mvv_lva: the victim's order times 6, less the attacker's.
- 2015-04-28, Stockfish cc54a91c MovePicker::score<CAPTURES>: the good captures are ordered by the victim alone.
- 2026-10-25, Clockwork 641d9f5 score_move: the victim's value by piece type, under capture history.

## Mate_Distance_Pruning
<!-- used-in -->
Used in: `search.ts` search.
<!-- /used-in -->
- 2004-03-17, Fruit 1.0 search_full.cpp full_search, full_quiescence: on by default, alpha rises to a mate against
  the side to move at this ply and beta falls to a mate for it at the next, in the main search and in the quiescence
  search.
- 2008-09-01, Stockfish bb751d6c search_pv, search: as imported from Glaurung's version 2.1, both bounds are clamped at
  PV nodes, and a null-window node returns beta or beta − 1 from the same two tests.
- 2020-01-15, Stockfish 11 search: at every node but the root, PV or not, alpha rises to mated at this ply and beta
  falls to mate at the next; when they cross, alpha is returned.

## Material
<!-- used-in -->
Used in: `eval.ts` material; `params.ts` (file).
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: piece values 9, 5, 3, 3 and 1 as the eval's main term.
- 1977, Chess 4.6 EVCODE MBEVAL1; CREATE MBCAPT: each side's material, kept up to date as moves are made, with a
  trade-down term beside it.
- 1978, Frey & Atkin, *Creating a Chess Player*, BYTE, Part 3: the article's program, CHESS 0.5, scores material
  with what the authors call essentially CHESS 4.5's function.
- 2005-06-17, Fruit 2.1 material.cpp material_comp_info: piece values as an opening and endgame pair, a pawn 80 and
  90, computed per material signature and cached.
- 2025-04-24, Stash 37 board.c stack->material: each side's non-pawn material at the middlegame values, kept as moves
  are made, which the endgame scale reads.

## Minor_Behind_Pawn
<!-- used-in -->
Used in: `params.ts` BEHIND_KNIGHT_MG; `pieces.ts` knights, bishops.
<!-- /used-in -->
- 2020-10-09, Ethereal 12.75 evaluateKnights KnightBehindPawn; evaluateBishops BishopBehindPawn: a knight or bishop on
  the square directly behind a pawn of either color.

## Mobility
<!-- used-in -->
Used in: `params.ts` MOB_KNIGHT_MG; `pieces.ts` knights, bishops, rooks, queens, pieceTerms.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: mobility, the count of legal moves, as a term of the
  eval.
- 1977, Chess 4.6 EVPOSS: mobility for each bishop, rook and queen, as the squares it attacks.
- 2008-09-01, Stockfish bb751d6c evaluate_knight, evaluate_bishop, evaluate_rook, evaluate_queen: in the import of
  Glaurung's version 2.1, a table per piece type by its count of reachable squares, one for the middlegame and one
  for the endgame.
- 2009-01-05, Stockfish d0804341 evaluate_common: the squares that enemy pawns attack leave the count.
- 2025-04-24, Stash 37 KnightMobility, BishopMobility, RookMobility, QueenMobility; evaldata_init_next: tables by
  count over a mobility zone that leaves out the squares enemy pawns attack, the own king, and own pawns that are
  blocked or on their second and third ranks.

## Mop-up_Evaluation
<!-- used-in -->
Used in: `eval.ts` header, evalWith.
<!-- /used-in -->
- 1976, Hayes & Levy, *The World Computer Chess Championship, Stockholm 1974*: in the authors' notes on CHESS 4.0
  (1974), separate endgame heuristics drive the opponent's king to a corner when one side is far ahead.
- 1977, Chess 4.6 EVMOPS: in mop-up, the winner gains per step of the losing king's distance from the center, toward
  any corner, and per step its king and knights close on that king. The *Chess Programming Wiki*'s
  Mop-up_Evaluation page gives the same form, center Manhattan distance and the kings' Manhattan distance, from
  Slate and Atkin's chapter *CHESS 4.5 – The Northwestern University Chess Program* (1977).

## Move_Generation#Staged_Move_Generation
<!-- used-in -->
Used in: `movepick.ts` header.
<!-- /used-in -->
- 1977, Chess 4.6 EVFULL; CREATE GENCAP, GENFSL: captures are generated alone and tried by estimated gain; each killer
  and the table move are generated from their piece alone; then the moves of attacked pieces and the rest, so a node
  generates each move once.
- 1978, Frey & Atkin, *Creating a Chess Player*, BYTE, Part 2: the series' program generates the captures, then the
  killer, the castles and the rest, each stage only when the last gave no cutoff; the text calls this generating in
  stages.
- 1996-09-27, Crafty 10.18 next.c NextMove: the table move before any generation, then captures, two killers, history
  moves and the rest; the main.c changelog puts the killers before the quiet generation at its 5.6 entry.
- 2005-06-17, Fruit 2.1 sort.cpp sort_init, sort_next: the table move, the good captures by MVV/LVA, two killers, the
  quiets by history, then the bad captures set aside; the readme gives the incremental generation and the postponed bad
  captures to version 2.0.
- 2026-08-13, Weiss c735b8f NextMove: the TT move, the good noisy moves, the killer, the quiets, the bad noisy moves.

## Move_Ordering
<!-- used-in -->
Used in: `movepick.ts` header, nextMove; `params.ts` PROMO_NOISY.
<!-- /used-in -->
- 1967, Greenblatt, Eastlake & Crocker, *The Greenblatt Chess Program*, AFIPS Fall Joint Computer Conference: Mac Hack
  VI's plausible-move generator scores each legal move, and the search takes the best-scored ones first, to a set width
  per ply.
- 1977, Chess 4.6 EVFULL FULL1–FUL27: the main-variation move, the captures by gain, the first killer, the table move,
  the second killer, the killer of two plies back, the moves of hung and attacked pieces, then the rest.
- 2005-06-17, Fruit 2.1 move_gen.cpp gen_captures, sort.cpp capture_is_good: a pawn push that promotes is generated with
  the captures; a queen promotion that passes SEE is tried among the good captures, an underpromotion among the bad.
- 2018-11-29, Stockfish 10 make_promotions: the queen promotion with the captures, the other promotions with the quiets.
- 2025-04-24, Stash 37 extmove_generate_pawn_noisy: the same split, in the noisy generator.
- 2026-08-13, Weiss c735b8f NextMove: the TT move, the noisy moves that pass SEE, the killer, the quiets by history,
  then the noisy moves that fail it.

## Null_Move_Pruning
<!-- used-in -->
Used in: `params.ts` NMP_CUT_NODE, NMP_EVAL_MARGIN, NMP_STATIC; `search.ts` search.
<!-- /used-in -->
- 1989, Beal, *Experiments with the null move*, Advances in Computer Chess, vol. 5: a null move in the quiescence
  search, with R = 1; the book is closed.
- 1991-02-11, Cray Blitz 49h phase.f PHASE0: a recursive null move, tried first in the move list at every node but the
  root, searched a ply shallower unless the operator sets more; not in check, never twice in a row, and not while either
  side has 18 points of pieces or fewer. The date is the routine's last revision.
- 1996-09-24, Crafty 10.18 search.c Search: a recursive null move with R = 2, not in check and only with a piece other
  than pawns; a fail high returns beta.
- 2004-03-17, Fruit 1.0 search_full.cpp full_search: the null move is tried only when the static eval is at or above
  beta.
- 2020-10-09, Ethereal 12.75 search: at a non-PV node not in check, with the eval at or above beta, non-pawn material,
  no null move in the last two plies and no TT bound that predicts a fail low; a fail high returns beta.
- 2025-11-30, Stash 8546bfe search: the eval must clear beta by 30.
- 2026-08-13, Weiss c735b8f AlphaBeta: the static eval must also reach beta + 138 − 13 per ply.
- 2026-10-26, Stash f91e750 search: tried at an expected cut node only, with the eval at or above the static eval; a
  fail high returns the search's score.

## Outposts
<!-- used-in -->
Used in: `params.ts` OUTPOST_KNIGHT_MG; `pieces.ts` outpost, knights, bishops.
<!-- /used-in -->
- 1976, Hayes & Levy, *The World Computer Chess Championship, Stockholm 1974*: Kaissa's eval, read from its 1970
  description, rewards a minor piece on a hole, a square in the opponent's camp that the opponent's pawns can never
  defend (secondary).
- 1979 ⚠, Blitz 6.9 scoren.f SCOREN: a knight on the fifth or sixth rank, on files c to f, that no enemy pawn on a
  neighboring file can attack gains a bonus, more with one own pawn defending it, and more again with two defenders and
  no enemy pawn on its file. Dated by CPW's ACM 1979 crosstable; the text is an OCR transcription.
- 1996-09-20, Crafty 10.18 evaluate.c Evaluate white_outpost: a knight on a weighted square of ranks 5 to 7 that no
  enemy pawn can attack and an own pawn supports scores the weight, twice when the enemy has no knight and no bishop
  of the square's color.
- 2015-09-19, Stockfish 77b4f4c2 evaluate_pieces Outpost: a knight or bishop on relative ranks 4 to 6 that no enemy
  pawn can attack, scored by piece and by pawn support. Stockfish ad87d707 (2015-06-07) set the two-cell table and
  the band's lower edge; this commit adds the upper edge.
- 2020-10-09, Ethereal 12.75 evaluateKnights KnightOutpost; evaluateBishops BishopOutpost: a knight or bishop on
  relative ranks 4 to 6 with no enemy pawn on the adjacent files ahead, by [a- or h-file][pawn-defended].
  Ethereal 9050afb (2019-10-25) added the file index.

## Overloading
<!-- used-in -->
Used in: `params.ts` THREAT_WEAK_PAWN_MG; `pieces.ts` threats.
<!-- /used-in -->
- 2020-10-09, Ethereal 12.75 evaluateThreats ThreatOverloadedPieces: a cost per non-pawn piece that the enemy attacks
  exactly once and its own side defends exactly once.

## Passed_Pawn
<!-- used-in -->
Used in: `params.ts` PAWN_PASSED_MG, (file), PASSED_ADVANCE_MG, PASSED_SAFE_PATH_MG; `pawns.ts` header, sideValue; `pieces.ts` passers.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: passed pawns are one of the positional factors his
  evaluation weighs.
- 1977, Chess 4.6 EVCODE PSEVAL, EVPOSS MIN40-MIN43: the passed test runs only on each file's most advanced pawn, so a
  rear twin never scores; the bonus grows with the rank squared, less when an enemy piece stands on or attacks the
  square ahead, more when the side guards it.
- 2005-06-17, Fruit 2.1 pawn_comp_info, eval_passer: a passer needs no pawn of either color ahead on its file; its rank
  bonus, king distances and free and unstoppable passers are scored outside the pawn hash.
- 2020-03-29, Stockfish f2430bf0 evaluate: a pawn with an own pawn ahead on its file is not passed, a rule Stockfish had
  from its import of Glaurung's version 2.1 and dropped on 2018-08-09.
- 2020-10-09, Ethereal 12.75 evaluatePassed PassedPawn, PassedSafePromotionPath: a value by whether the stop square is
  empty, whether the enemy attacks it, and rank, plus a bonus when no enemy piece or attack is on the pawn's path.
- 2025-04-24, Stash 37 evaluate_passed PassedBonus: a bonus by rank for a pawn with no enemy pawn ahead on its file
  whose path enemy pawns attack no more often than own pawns guard it.

## Pawn_Hash_Table
<!-- used-in -->
Used in: `pawns.ts` header, kingPawn.
<!-- /used-in -->
- 1977, Chess 4.6 CREATE PSHASH, PSUPDT; EVCODE PSEVAL: 512 entries, each with a file's pawn descriptors read from a
  window of three files, not scores; always replaced.
- 1990, Hyatt & Nelson, *Chess and supercomputers: details about optimizing Cray Blitz*, Supercomputing '90: Cray Blitz
  keeps pawn-structure scores in a table by a pawn hash key, and king-safety scores the same way.
- 1996-05-16, Crafty 10.18 evaluate.c EvaluatePawns: the pawn score, the passed and weak pawn masks and the defect
  counts, by pawn key; always replaced.
- 2025-04-24, Stash 37 king_pawn_probe, king_pawn_key: a key of the pawns and both kings; an entry keeps the king-pawn
  eval and the passed pawns.

## Pawn_History
<!-- used-in -->
Used in: `history.ts` header, PAWN_STRUCTURES; `movepick.ts` quietScore; `params.ts` THREAT_HISTORY; `search.ts` rewardQuiet.
<!-- /used-in -->
- 2023-10-27, Stockfish b0658f09 PawnHistory, MovePicker::score<QUIETS>: a quiet history by pawn structure, 512 rows by
  the pawn key, then piece and to-square, within 8192, added to the quiet order; the message credits the idea to Seer.
- 2023-12-10, Weiss 20c95ce GetQuietHistory, UpdateQuietHistory: the table enters the quiet order and takes the
  butterfly table's bonus and malus.

## Pawn_Rams_(Bitboards)
<!-- used-in -->
Used in: `params.ts` PAWN_BLOCKED_5_MG; `pawns.ts` sideValue.
<!-- /used-in -->
- 1996-05-16, Crafty 10.18 evaluate.c EvaluatePawns pawn_rams: the pawns blocked by an enemy pawn are counted, and only
  the side to move at the root pays, by a table of the count, with more for rams on its own ranks 2 to 5.
- 2020-07-06, Stockfish 7225d254 evaluate BlockedPawn: a pawn with an enemy pawn directly in front, on relative rank 5
  or 6, one value per rank.

## Pawn_Structure
<!-- used-in -->
Used in: `params.ts` (file); `pawns.ts` header.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: doubled, backward and isolated pawns, D, S and I, are terms
  of his evaluation f(P).
- 1962, Kotok, *A Chess Playing Program for the IBM 7090 Computer*, B.S. thesis, MIT: JPAWNS scores an open file +8, an
  isolated pawn −1, a backward pawn −5 and a doubled pawn −3, weighted 1/20 of material.
- 1977, Chess 4.6 EVCODE PSEVAL: per side and file, a descriptor of the most advanced pawn, built from the pawns of that
  file and its neighbors and kept in a pawn-structure hash; EVPOSS scores the descriptors.
- 2025-04-24, Stash 37 king_pawn_probe: backward, connected, passed, doubled and isolated pawns, and each passer's
  distance to both kings, kept in one entry keyed by the pawns and both kings.

## ProbCut
<!-- used-in -->
Used in: `params.ts` PROBCUT_DEPTH; `search.ts` search.
<!-- /used-in -->
- 1995, Buro, *ProbCut: An Effective Selective Extension of the Alpha-Beta Algorithm*, ICCA Journal 18(2): a shallow
  search predicts, through a linear fit between two depths, whether the deep search would fall outside the window, and
  the node is cut on that prediction; tested in the Othello program Logistello.
- 2011-05-21, Stockfish fca0a2dd search: at a non-PV node, a capture whose SEE clears the value of the piece just taken
  is searched at depth − 4 against beta + 200, and the node is cut when it holds; its message credits a patch from
  Onno.
- 2018-02-26, Stockfish 71cc01c2 search: a depth-1 search checks the capture before the depth − 4 search; its message
  credits Ethereal.
- 2026-10-26, Stash f91e750 search: from depth 6, at PV nodes too, a capture whose SEE clears beta + 152 less the
  static eval is checked by a quiescence search, then searched at depth − 4; one that holds cuts the node and is stored
  as a lower bound.

## Quiescence_Search
<!-- used-in -->
Used in: `params.ts` QS_DELTA; `search.ts` qsearch.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: the evaluation is applied at quiescent positions.
- 1967, Greenblatt, Eastlake & Crocker, *The Greenblatt Chess Program*, AFIPS FJCC 31: past a fixed number of plies,
  Mac Hack VI searches favorable captures and pawn promotions, with no limit on depth or width.
- 1977, Chess 4.6 EVMINI MINI0–MIN50, MIN65–MI68D: the side to move may stand on the eval; then captures in
  decreasing estimated gain, then quiet queen promotions.
- 2020-09-27, Weiss 2568fb7 Quiescence: the move loop stops at the captures the picker's SEE test rates as bad.
- 2021-11-01, Stockfish 45e5e65a qsearch: its table entries are stored as bounds, never as exact scores.
- 2025-03-30, Weiss 95b0951 Quiescence: in check, once one evasion has a score that is not a loss, only the captures
  that pass SEE are searched.

## Razoring
<!-- used-in -->
Used in: `params.ts` RAZOR_DEPTH, RAZOR_DROP; `search.ts` search.
<!-- /used-in -->
- 1974, MASTER, as Hayes & Levy, *The World Computer Chess Championship, Stockholm 1974*, 1976, p. 81, report it
  (secondary): a move is searched further only when its static value beats the backed-up value, within an error
  estimate; the book calls this razoring.
- 2007-10-01, Glaurung g071001 search.cpp search: at a null-window node of depth 3 or less, when the eval is below beta
  less a margin, a null-window quiescence search at beta that fails low returns its value.
- 2026-07-29, Stash 13ac9e7 search: at a non-PV node of depth 3 or less, not in check, with static eval + 120 per ply
  at or below alpha, depths 1 and 2 return the quiescence search; depth 3 runs a null-window quiescence search at alpha
  less the margin, returns it on a fail low, and takes a ply off the node when it beats beta by 120. Its message
  credits Halogen.

## Reverse_Futility_Pruning
<!-- used-in -->
Used in: `params.ts` RFP_DEPTH; `search.ts` search.
<!-- /used-in -->
- 2006-01-23, Glaurung 1.0.2 search.c static_nullmove_test: an option on by default; at low depth, when the
  opponent's captures cannot cost the eval its lead over beta plus a margin, the node returns beta before its null
  move.
- 2009-05-20, assumed Rybka 3, from the disputed IPPOLIT 2009 clone, IPPOLIT.c belNIZKO: at 3.5 plies or less, eval
  less 70 plus 10 per depth unit, at or above beta, returns eval.
- 2010-01-21, Stockfish 05a8c318 search: at a null-window node, before the null move, the static eval less a margin that
  grows with the log of depth, at or above beta, is returned; the message calls it post futility pruning.
- 2010-02-02, Stockfish b5a4edd8 search: its stand-pat return is renamed static null move pruning, with a description
  its message credits to Tord Romstad.
- 2025-12-07, Lynx f87f5d5f NegaMax: the margin gets a term quadratic in depth, and its linear terms are lowered, so
  the margin is smaller at low depth and larger at high depth.
- 2026-07-06, Stockfish 7da31a1f search: the margin per ply is 40 plus 4 per ply of depth, to a cap of 80.
- 2026-08-13, Weiss c735b8f AlphaBeta: no reverse futility, nor other pruning before the move loop, inside a singular
  search.
- 2026-10-26, Stash f91e750 search: at a non-PV node of depth 7 or less, eval − 86 per ply, plus 79 when improving, at
  or above beta returns eval.

## Rook_on_Open_File
<!-- used-in -->
Used in: `params.ts` ROOK_FILE_MG; `pieces.ts` rooks.
<!-- /used-in -->
- 1949, Shannon, *Programming a Computer for Playing Chess*: a rook on an open or semi-open file, among the
  positional terms.
- 1977, Chess 4.6 EVPOSS MIN30–MIN32: a bonus for a rook on a file with no pawns; on a file with no own pawn, a bonus
  only when the enemy's front pawn there is vulnerable.
- 2005-06-17, Fruit 2.1 eval.cpp eval_piece: a rook on a file with an own pawn −10, a semi-open file 0, an open file
  +10, in both phases. The readme thanks Vincent Diepeveen for the reminder to add it.
- 2020-10-09, Ethereal 12.75 evaluateRooks RookFile: one (middlegame, endgame) value for a semi-open file and one for
  an open file.

## Rook_on_Queen_File
<!-- used-in -->
Used in: `params.ts` ROOK_QUEEN_FILE_MG; `pieces.ts` rooks.
<!-- /used-in -->
- 2025-04-24, Stash 37 RookXrayQueen: a rook on a file that holds an enemy queen, whatever stands between them.

## Rule_of_the_Square
<!-- used-in -->
Used in: `params.ts` PASSED_SQUARE_EG; `pieces.ts` passers.
<!-- /used-in -->
- 1974, CHAOS, as Hayes & Levy, *The World Computer Chess Championship, Stockholm 1974*, 1976, describe it (secondary):
  its king endgame term rewards staying within the square of the opponent's passed pawn.
- 1979 ⚠, Blitz 6.9 scorep.f SCOREP: against a bare king, each passer races the king by the square, corrected for the
  side to move, the double step, the own king in the way and its escort; the side that queens two moves first gains a
  queen less two pawns. Dated by CPW's ACM 1979 crosstable; the text is an OCR transcription.
- 1996-05-16, Crafty 10.18 evaluate.c EvaluatePassedPawnRaces, utility.c KingPawnSquare: when one side has no pieces, a
  passer whose race square the defending king is outside counts as queening, and the two sides' races are compared.
- 2005-06-17, Fruit 2.1 unstoppable_passer: against a defender with no piece, a passer its king cannot catch adds 800 to
  its bonus; a pawn on its second rank counts from the square ahead.
- 2022-08-09, Weiss 3e95de9 PassedSquare: when the enemy has no pieces, an endgame bonus for a passer nearer its
  promotion square than the enemy king is, less one move when the enemy is to move.

## Score#Mate_Scores
<!-- used-in -->
Used in: `search.ts` scoreFromTT.
<!-- /used-in -->
- 1977, Chess 4.6 EVFULL FUL49–FUL50; EVCHEK MIN85: a mate scores the mate constant less 1024 per ply from the root,
  so a nearer mate is worth more.
- 1996-08-27, Crafty 10.18 store.c StoreBest; lookup.c LookUp: an exact mate score is stored relative to its node and
  read back relative to the root; bounds are not shifted.
- 2019-10-26, Stockfish 5ae195ee value_from_tt: a table mate that the fifty-move count would reach first is read as
  the best non-mate score, so the move is kept and the line is searched again.

## Singular_Extensions
<!-- used-in -->
Used in: `params.ts` SE_DEPTH, SE_SEARCH_ADD, SE_DOUBLE_MARGIN, SE_TRIPLE_MARGIN, SE_NEG_CUT; `search.ts` ssDouble, EXCLUDED_MIX, search.
<!-- /used-in -->
- 1988, Anantharaman, Campbell & Hsu, *Singular Extensions: Adding Selectivity to Brute-Force Searching*, ICCA Journal
  11(4): a move whose value stands above all its siblings' by a margin is searched deeper; the paper is closed.
- 2009-05-20, assumed Rybka 3, from the disputed IPPOLIT 2009 clone, IPPOLIT.c belISKLOO: the TT move is extended when
  a reduced search of the other moves, below the TT score by a margin, fails low.
- 2020-01-15, Stockfish 11 search: the test runs from depth 6, when the TT entry is a lower bound at most 3 plies
  shallower than the node.
- 2023-03-16, Ethereal f71ac47 singularity: a TT move that is not singular, and whose TT score is at or below alpha, is
  searched a ply shallower.
- 2026-08-13, Weiss c735b8f AlphaBeta: a TT move that is not singular is searched a ply shallower at a cut node.
- 2026-10-25, Clockwork 641d9f5 Worker::search: the singular search runs at half the depth.
- 2026-10-26, Stash f91e750 search: the bar is the TT score less 10/16 per ply; a fail low by more than 14 at a non-PV
  node extends two plies, at most 10 times on a line, and three for a quiet TT move past 120; a bar at or above beta
  is returned, and a TT score at or above beta takes a ply off.

## Space
<!-- used-in -->
Used in: `params.ts` SPACE_MG; `pieces.ts` space.
<!-- /used-in -->
- 2008-12-21, Stockfish 31d4f0b7 evaluate_space: in the middlegame, the safe squares on files c to f of the own
  second to fourth ranks, counted again when up to three squares behind an own pawn, weighted by the minor pieces on
  the board. The commit merges it from Glaurung's version 2.2.
- 2020-04-13, Stockfish db59696a Evaluation::space: the weight becomes the side's men less 2, plus half the blocked
  pawns.
- 2026-09-16, Clockwork 958d0d0 evaluate_sf_space: the same count, weighted by the square of the side's men less 3
  plus its blocked pawns, at most 9, and applied only at a phase of 18 or more.

## Static_Evaluation_Correction_History
<!-- used-in -->
Used in: `correction.ts` header, correction, update; `params.ts` CORR_MAX, CORR_CONT; `search.ts` search; `state.ts` pawnKey, nonPawnKey, minorKey, majorKey.
<!-- /used-in -->
- 2023-10, Caissa, as the *Chess Programming Wiki*'s Static_Evaluation_Correction_History page dates it (secondary):
  the difference between search score and static eval, kept per pawn structure, corrects later static evals.
- 2024-06-28, Stash 302136d add_correction_history: a table by the pawn key; an update moves the entry toward the
  search's error by a weight of 1 + depth, at most 16, of 256, within 32 units.
- 2024-12-29, Weiss 2a3f84c GetCorrectionHistory: each table weighted in the sum.
- 2025-04-23, Stash dcc25ed correction_hist_update: tables by each color's non-pawn key.
- 2025-07-09, Stash ba73642 board_minor_key: a table by the key of both colors' knights and bishops and both kings.
- 2025-07-27, Stash ea9fd72 board_major_key: a table by the key of both colors' rooks and queens and both kings.
- 2026-10-19, Clockwork e774be4 History::get_correction: a table by the last two moves.
- 2026-10-25, Clockwork 641d9f5 Worker::search: a singular search neither reads the correction nor updates it.

## Static_Exchange_Evaluation
<!-- used-in -->
Used in: `see.ts` header.
<!-- /used-in -->
- 1962, Kotok, *A Chess Playing Program for the IBM 7090 Computer*, B.S. thesis, MIT: `LTRADE`, with its swap and
  pin lists, projects the material an exchange gains over all the attacks and defenses on a square, pins respected.
- 1996-08-27, Crafty 10.18 swap.c Swap, SwapXray: the gain of one move once every capture on its square is played,
  attackers taken cheapest first, with each slider behind a piece that leaves added; every capture after the first may
  be declined.
- 2022-04-18, Stockfish 15 Position::see_ge: whether a move gains at least a threshold, by one running balance, least
  valuable attacker first, with x-rays added as pieces leave.

## Static_Exchange_Evaluation#Move_Ordering
<!-- used-in -->
Used in: `movepick.ts` header, nextMove; `params.ts` GOOD_CAPTURE_DIV.
<!-- /used-in -->
- 1979 ⚠, Blitz 6.9 phase3.f PHASE3: captures are tried by the victim's value less the exchange loss on the to-square,
  from ripoff.f RIPOFF; those that lose material are left for the last phase. Dated by CPW's ACM 1979 crosstable; the
  text is an OCR transcription.
- 1996-09-27, Crafty 10.18 next.c NextMove: captures that Swap rates at zero or more, or whose victim outweighs the
  attacker, come before the killers; the losing ones come after the killers and the history picks.
- 2005-06-17, Fruit 2.1 sort.cpp sort_next: the captures SEE does not rate as losing follow the TT move, and the losing
  ones follow every quiet move.
- 2025-09-29, Clockwork 26eccaa MovePicker::next: a capture stays among the good ones when its SEE reaches −score / a
  divisor, so a capture with a high score may lose material and still be tried early.

## Static_Exchange_Evaluation#Pruning
<!-- used-in -->
Used in: `params.ts` SEE_DEPTH, SEE_HISTORY; `search.ts` search, qsearch.
<!-- /used-in -->
- 1979 ⚠, Blitz 6.9 phase3.f PHASE3; select.f SELECT: past the full-width depth, only the captures whose exchange
  estimate, ripoff.f RIPOFF, loses no material are searched. Dated by CPW's ACM 1979 crosstable; the text is an OCR
  transcription.
- 1996-09-20, Crafty 10.18 quiesce.c Quiesce: in the capture search, a capture that Swap rates as losing material is
  not searched.
- 2009-05-20, assumed Rybka 3, from the disputed IPPOLIT 2009 clone, IPPOLIT.c belVSE, belISKLOO: below 10 plies, in
  all-node and exclusion searches, a quiet move is skipped when the eval plus a depth margin is below beta + 125 and the
  move fails its SEE test.
- 2020-09-27, Weiss 2568fb7 Quiescence: the quiescence search stops at the captures that fail SEE.
- 2020-10-09, Ethereal 12.75 search: up to depth 9, past the good captures, a quiet move whose SEE is under −64 per
  ply, or a capture under −19 per ply squared, is skipped.
- 2025-09-29, Clockwork f236181 Worker::search: a quiet move's SEE bar moves with its history.

## TT_Adjusted_Eval
<!-- used-in -->
Used in: `search.ts` search.
<!-- /used-in -->
- 2019-02-06, Laser 1.7 PVS, quiescence: the table score replaces the static eval where its bound says it is better:
  an upper bound below it, a lower bound above it, or an exact score.
- 2025-06-13, Clockwork 6bf993b tt_adjusted_eval: the table score replaces the static eval where its bound allows, and
  reverse futility reads the result.

## Tapered_Eval
<!-- used-in -->
Used in: `eval.ts` header, evalWith; `score.ts` header.
<!-- /used-in -->
- 1987, Stanback, *GNU Chess*, comp.sources.games v03i038–041 (posted 1988-01-12): UpdateWeights sets a stage from 0
  to 10 by both sides' piece material, pawns and kings out, and BlendBoard interpolates the king's opening and ending
  tables by it, once per search at the root.
- 1998-02-22, Phalanx XII static.c score_position: a middlegame and an endgame sum, blended linearly by the total
  material, pawns included, between ENDMATERIAL 2500 and MIDMATERIAL 6000.
- 2005-06-17, Fruit 2.1 material.cpp material_comp_info; eval.cpp eval: a phase from 24 less 1 per knight or bishop, 2
  per rook and 4 per queen, pawns out; every term has an opening and an endgame value, mixed by the phase over 256.
- 2020-01-15, Stockfish 11 Score make_score: the middlegame and endgame values packed in one integer, the endgame in
  the high half, so sums and differences stay exact.

## Tarrasch_Rule
<!-- used-in -->
Used in: `params.ts` PASSED_ROOK_BEHIND_MG; `pieces.ts` passers.
<!-- /used-in -->
- 1974, CHAOS, as Hayes & Levy, *The World Computer Chess Championship, Stockholm 1974*, 1976, describe it (secondary):
  its rook usage term rewards rooks behind passed pawns.
- 1979 ⚠, Blitz 6.9 scorer.f SCORER: a rook of either color on a passer's file, behind it as the passer's owner sees
  it, scores for its own side 2 × (rank + 1)², the rank as the passer's owner counts it; nothing between rook and pawn
  is tested. Dated by CPW's ACM 1979 crosstable; the text is an OCR transcription.
- 1994-03-08, Arasan 1.0 SCORING.CPP PawnStructure ROOK_BEHIND_PP: the nearest own rook or queen behind each own passer
  on its file, with no enemy piece between.
- 1996-09-20, Crafty 10.18 evaluate.c Evaluate: a rook behind the most advanced pawn of its own passed file, or behind
  an enemy passer, +50 each; its comment counts the file as open.
- 2026-08-13, Weiss c735b8f EvalPassedPawns PassedRookBack: for each own passer on relative rank 4 or higher, one bonus
  when an own rook stands anywhere behind it on its file; a queen does not count.

## Tempo
<!-- used-in -->
Used in: `eval.ts` header, evalWith; `params.ts` TEMPO_MG.
<!-- /used-in -->
- 1977, Chess 4.6 EVPOSS: a bonus to the side to move, in the regular eval.
- 2006-01-13 ⚠, Glaurung 1.0.2 eval.c evaluate: TEMPO_BONUS_MIDGAME 40 and TEMPO_BONUS_ENDGAME 10 for the side to
  move, a middlegame and endgame pair. The date is the file's.
- 2025-04-24, Stash 37 Initiative: a (middlegame, endgame) pair for the side to move, added before the blend.

## Threat_History
<!-- used-in -->
Used in: `history.ts` header, attackedAt, threatsAt; `movepick.ts` quietScore; `params.ts` THREAT_HISTORY, CAPTURE_THREATS; `search.ts` rewardQuiet, search.
<!-- /used-in -->
- 2021-11-24, Koivisto 2bce075 SearchData th, mainThreat: a quiet history by side, the square of the opponent's main
  threat, and the move's from- and to-square; the message credits the idea to Connor, Seer's author.
- 2022-05-21, Ethereal 341c43f underlying_quiet_history, allAttackedSquares: the butterfly table indexed also by whether
  the opponent attacks the move's from-square and its to-square.

## Threat_by_Pawn_Push
<!-- used-in -->
Used in: `params.ts` THREAT_WEAK_PAWN_MG; `pieces.ts` threats.
<!-- /used-in -->
- 2015-02-03, Stockfish 18b08096 evaluate_threats PawnAttackThreat: a bonus per enemy piece that a safe single or
  double pawn push would attack, past those the own pawns attack already. The commit credits the idea to Lyudmil
  Tsvetkov.
- 2020-10-09, Ethereal 12.75 evaluateThreats ThreatByPawnPush: the same count, over enemy pieces other than pawns.

## Time_Management
<!-- used-in -->
Used in: `params.ts` TM_SHARE, TM_MTG_SHARE, TM_INC_MOVES, TM_INC_MOVES_PER_MS; `time.ts` header, setNodeLimit.
<!-- /used-in -->
- 1977, Chess 4.6 YRMOVE CTILTC, CTIMPM: the time per move is the time to the next control, less a reserve, over the
  moves left to it.
- 1978, Gillogly, *Performance Analysis of the Technology Chess Program*, CMU-CS-78-189: from August 1972, Tech has one
  maximum time per move, reads the clock inside the tree, and drops an iteration the clock cuts short.
- 2024-03-11, Stockfish 23493de0 TimeManagement::init: in sudden death, the moves counted ahead fall with a low clock,
  one per 20 ms.
- 2024-12-22, Weiss 216d6c1 AspirationWindow: the search does not stop between iterations while the last one changed
  the best move.
- 2026-08-13, Weiss c735b8f InitTimeManagement: in sudden death, 0.022 of the time left with 50 increments counted
  ahead, at most 0.2 of the clock; with moves to go, 0.7 over min(moves to go, 50).
- 2026-09-05, Stockfish 19 SearchManager::check_time: a node limit is tested at the periodic clock check.

## Time_Management#Premature_Termination
<!-- used-in -->
Used in: `params.ts` TM_ONE_MOVE.
<!-- /used-in -->
- 1977, Chess 4.6 EVALU8 BA28A, BAS11, BAS17: a new iteration starts only while the time used is under TIMIN, and a move
  whose preliminary score led by a pawn stops the search once TIMIN has passed.
- 2005-08-07, Glaurung Mainz root.c root_search: with a single legal move, the search stops after its second iteration.
- 2021-07-15, Weiss d7d1334 IterativeDeepening: a forced move's time is capped at 500 ms.

## Time_Management#Soft_Bound
<!-- used-in -->
Used in: `params.ts` TM_HARD_MUL; `time.ts` header.
<!-- /used-in -->
- 1977, Chess 4.6 EVALU8 BASE3, BA28A, BAS18: a new iteration starts only under TIMIN, an adaptive fraction of the
  move's time, and TIMAX, 4 times that time, stops the search; both are read at the root.
- 1987, Stanback and others, *GNU Chess*, comp.sources.games volume 3: SelectMove stops after an iteration once 4 times
  the elapsed time passes twice the target plus the extra time, and ElapsedTime stops the tree past the target plus
  the extra time.
- 1990-06-10, Cray Blitz 49h select.f SELECT1: a target, and an absolute limit up to which a falling score or a root
  fail low may run on; both are read inside the tree each time the node count passes a step. The date is the
  routine's last revision.
- 1996-09-29, Crafty 10.18 time.c TimeSet, TimeCheck: a target and an absolute limit, both read inside the search.
- 2008-09-01, Stockfish bb751d6c think, id_loop, poll: MaxSearchTime, read after each iteration, and
  AbsoluteMaxSearchTime, polled inside the tree, as imported from Glaurung's 2.1 release.
- 2026-08-13, Weiss c735b8f InitTimeManagement: the hard limit is 5 times the soft one, at most 0.8 of the clock.

## Transposition_Table
<!-- used-in -->
Used in: `search.ts` qsearch; `tt.ts` header.
<!-- /used-in -->
- 1967, Greenblatt, Eastlake & Crocker, *The Greenblatt Chess Program*, AFIPS Fall Joint Computer Conference: Mac Hack
  VI keeps the positions it has searched in a hash table of 32,000 entries.
- 1977, Chess 4.6 CREATE TRACKT, TRASAV: one entry per slot, matched on the whole packed board, with a from-to move, a
  score and its bound type; cleared at every move.
- 2021-11-01, Stockfish 45e5e65a qsearch: quiescence stores its result as a bound at its own depth, not as an exact
  score.
- 2024-06-11, Ethereal 0e47e9b tt_store: a store that brings no move keeps the entry's old move.

## Transposition_Table#Aging
<!-- used-in -->
Used in: `params.ts` TT_AGE_STORE; `tt.ts` header, ttStore.
<!-- /used-in -->
- 1979 ⚠, Blitz 6.9 store.f STORE: each entry keeps the game move it was stored at, and a store's first pass takes an
  empty slot or one stored at an earlier move, whatever its draft. As held, lookup.f LOOKUP jumps past its probe.
  Dated by CPW's ACM 1979 crosstable; the text is an OCR transcription.
- 1989-04-26, Cray Blitz 49h store.f STORE1: each entry has an old bit, which every entry gets at the start of a search
  and a store clears; a store takes the key's own entry, else the first old one among its probes, else the shallowest.
  The date is the routine's last revision.
- 1996-08-27, Crafty 10.18 store.c StoreBest, StoreRefutation: an entry keeps the 2-bit id of the search that stored it,
  and one from an earlier search is replaced whatever its draft; the main.c changelog's 9.18 entry credits the id to
  Cray Blitz.
- 2015-08-15, Stockfish 9dbb3ae8 TranspositionTable::probe: a store replaces the slot whose depth less 8 per search of
  age is least.
- 2018-05-16, Ethereal aa3bc68 storeTTEntry: a store replaces the slot whose depth less 8 per search of age is least;
  the message credits Stockfish's aging scheme.
- 2025-03-07, Berserk fe1363a TTPut: a result for a key the table holds overwrites an entry left by an earlier search,
  however deep, and a probe leaves the entry's age as it is.

## Transposition_Table#Bucket_Systems
<!-- used-in -->
Used in: `tt.ts` header, ttStore.
<!-- /used-in -->
- 1979 ⚠, Blitz 6.9 store.f STORE: up to 25 slots on a random-probe sequence from the key's index, in two passes: the
  first takes an empty slot or one from an earlier move, the second one of this move with less draft. As held,
  lookup.f LOOKUP jumps past its probe. Dated by CPW's ACM 1979 crosstable; the text is an OCR transcription.
- 1989-04-26, Cray Blitz 49h store.f STORE1; lookup.f LOOKUP: eight slots, an odd stride apart from the key's index,
  read in one vector load; a store takes the key's own entry, else the first old one, else the shallowest. The date is
  the routine's last revision.
- 1990, Hyatt & Nelson, *Chess and supercomputers: details about optimizing Cray Blitz*, Supercomputing '90: Cray Blitz
  probes eight entries per position with vector loads, and chooses among them the one to overwrite.
- 2005-06-17, Fruit 2.1 trans.cpp trans_store: the four 16-byte entries from the index form a cluster, and a store
  overwrites the one with the greatest age × 256 − depth.
- 2014-06-28, Stockfish ccd823a4 TTCluster: three entries packed in a 32-byte cluster; the message credits the idea to
  Ron Britvich.
- 2015-08-15, Stockfish 9dbb3ae8 TranspositionTable::probe: a store takes the key's own entry or an empty one, else the
  entry of the cluster whose depth less 8 per search of age is least.
- 2026-09-27, Clockwork 8ee523a TTCluster: a 32-byte cluster of one word with three 21-bit key fragments and three
  8-byte entries, matched by one SWAR compare.

## Transposition_Table#Depth-Preferred
<!-- used-in -->
Used in: `tt.ts` ttStore.
<!-- /used-in -->
- 1979 ⚠, Blitz 6.9 store.f STORE: a store's second pass replaces a slot of this move only when its draft is less than
  the result's, and a slot that holds the same position keeps a deeper exact score. As held, lookup.f LOOKUP jumps
  past its probe. Dated by CPW's ACM 1979 crosstable; the text is an OCR transcription.
- 1989-04-26, Cray Blitz 49h store.f STORE1: the shallowest of the eight probes is replaced only when it is not deeper
  than the result, else the result is dropped; an entry for the same position that is deeper is kept only when exact.
  The date is the routine's last revision.
- 1996-08-27, Crafty 10.18 store.c StoreBest, StoreRefutation: per side, one table keeps an entry of this search against
  a shallower result, and one twice its size is always overwritten; the main.c changelog's 9.10 entry credits the scheme
  to Ken Thompson's Belle.
- 2015-08-15, Stockfish 9dbb3ae8 TranspositionTable::probe: a store replaces the slot whose depth less 8 per search of
  age is least.
- 2024-06-11, Ethereal 0e47e9b tt_store: on a key match, a result that is not exact and more than 2 plies shallower is
  dropped.

## Transposition_Table#Transposition_Table_Cutoffs
<!-- used-in -->
Used in: `params.ts` TT_CUT_NODE; `search.ts` search.
<!-- /used-in -->
- 1977, Chess 4.6 CREATE TRACKT; EVTRAP: a stored score counts only in the same iteration and ply; an exact one
  returns, a bound returns or narrows the window.
- 2005-06-17, Fruit 2.1 search_full.cpp full_search: a table bound returns at once only at a node off the PV.
- 2014-11-12, Stockfish 4739037f search: the PV-node cutoff on an exact entry is dropped, for an exact PV display.
- 2019-12-12, Stockfish bae019b5 search: the table cuts only while the fifty-move count is under 90 plies.
- 2023-07-26, Ethereal 311d110 search: at a node not expected to cut, an entry cuts on a fail low only.

## Trapped_Pieces
<!-- used-in -->
Used in: `params.ts` ROOK_TRAPPED_MG; `pieces.ts` rooks.
<!-- /used-in -->
- 1987, Stanback, *GNU Chess*, comp.sources.games v03i038–041 (posted 1988-01-12): trapped marks a knight or slider
  that has no safe square to go to, and it counts as one more hung man.
- 1996-09-20, Crafty 10.18 evaluate.c Evaluate: a rook on a1, a2, b1, g1, h1 or h2 shut in by its own king pays
  ROOK_TRAPPED, beside a knight in a corner and a bishop caught on a7 or h7. The `main.c` changelog puts the rook
  case at version 9.16, after a change to rook scoring for it at version 2.3.
- 2008-09-01, Stockfish bb751d6c evaluate_rook TrappedRookPenalty: in the import of Glaurung's version 2.1, a rook
  with six moves or fewer between its king and the near edge, with no half-open file there, pays 180 less 16 per
  move, half that while the king can still castle.
- 2025-04-24, Stash 37 RookTrapped, RookBuried: a rook with four moves or fewer on its back two ranks, its king off
  its file and between it and the center, pays one value while castling rights remain and another once they are
  gone.

## Upcoming_Repetition_Detection
<!-- used-in -->
Used in: `cycle.ts` header, upcomingRepetition; `params.ts` UPCOMING_REP; `search.ts` search.
<!-- /used-in -->
- 2013, van Kervinck, *A fast software-based method for upcoming cycle detection in search trees*: a cuckoo table of
  the keys of reversible moves tells whether a move leads back to an earlier position.
- 2018-05-16, Stockfish 91a76331 search: a node, not the root, whose side to move has a move back into an earlier
  position raises alpha to the draw score before its table probe.
- 2018-06-05, Stockfish e4f8a4fa search: the test also runs at a horizon node, before its quiescence search.
- 2021-12-13, Stash 079fcba search: the test at the top of the search, before the drop into quiescence; its message
  credits the Stockfish team's code.
- 2024-06-25, Stockfish 6b782211 Position::upcoming_repetition: the test answers only for a repetition the side to
  move can reach, as the paper it cites states it.

## Wrong_Color_Bishop_and_Rook_Pawn
<!-- used-in -->
Used in: `eval.ts` header, wrongBishop, endgameScale, evalWith.
<!-- /used-in -->
- 1996-09-10, Crafty 10.18 evaluate.c EvaluateDraws: a bishop and rook pawns against no enemy piece are a draw when
  the bishop misses the queening square's color and the defending king, with the side to move counted, stands inside
  every pawn's square. The `main.c` changelog puts the rule at version 9.28.
- 2000-10-18, Blass, *Re: King, rook pawn and wrong bishop endgames*, Computer Chess Club, as the
  *Chess Programming Wiki*'s Wrong_Color_Bishop_and_Rook_Pawn page gives it (secondary): Uri's rule, a race to the
  queening square in king steps, with the tempo, against the other king and the pawn.
- 2005-06-17, Fruit 2.1 recog.cpp kbpk_draw: one rook pawn and a bishop against a bare king are a draw when the
  bishop misses the queening square and the king is within one step of it.
- 2020-01-15, Stockfish 11 Endgame<KBPsK>: a draw when every pawn is on one rook file, the bishop misses the queening
  square, and the defending king is within one step of it, whatever else the defender has.
