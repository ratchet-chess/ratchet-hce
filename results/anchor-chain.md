# Anchor chain

How each anchor's published CCRL Blitz rating holds in the pool of every pair played. `tools/fit-rating.ts
--chain` fits every anchor at once from the pool's games, with no anchor held at CCRL. An anchor's **gap** is
its place on that scale against the anchors within 150 points of its CCRL rating, beside the same difference
on CCRL; **anchors in the tie** counts them. A trusted anchor is one that agrees here, and a candidate is rated
against its four nearest trusted anchors, held at CCRL. `tools/calibrate.sh chain` plays a run's pairs not yet
played, each anchor against the two nearest on each side by rating, past any of its own family, and adds its
games to the pool; `tools/results.ts` writes these tables.

The verdicts in `results/anchor-checks.md` stand as played: they fit each anchor against every other
in its check, so a stretched scale counts against a check's lowest and highest anchors. A flag here drops
nothing: a 95% interval on each of many anchors flags about one in twenty by chance, and `REPLAY=<anchor>`
plays an anchor's neighbor pairs again. An anchor with one side has a gap that a stretched scale still moves.

Runs up to L scaled each worker's clock by that run's bench, alone on each host; each run's log head records
them. Later runs use the pinned ratios (`tools/host-speed.ts`). The pool keeps both, since both players of a pair
scale together.

A fit's interval comes from color-swapped pairs and covers sampling only. **gap's ±** adds CCRL's
published errors, the anchor's own and those of the anchors in its tie, and an anchor is flagged
when its gap exceeds it.

| run | games file | protocol |
|---|---|---|
| G | anchors-20261101-192446.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| H | anchors-20261103-114758.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| I | anchors-20261103-130852.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| J | anchors-20261103-131039.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| K | anchors-20261103-203736.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| L | anchors-20261104-040240.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| M | anchors-20261104-164241.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| N | anchors-20261104-190440.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| O | anchors-20261110-081556.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |

| anchor | CCRL Blitz | pool fit (95%) | gap | gap's ± | games | anchors in the tie | verdict |
|---|---|---|---|---|---|---|---|
| stash-19.0 | 2474 | 2430 ± 46 | -44 | 51 | 300 | 1 | agrees, one side |
| floyd-0.9 | 2583 | 2604 ± 33 | +21 | 37 | 400 | 3 | agrees |
| blunder-8.5.5 | 2663 | 2646 ± 31 | -17 | 34 | 400 | 3 | agrees |
| stash-21.0 | 2714 | 2713 ± 24 | -1 | 29 | 600 | 4 | agrees |
| velvet-1.2.0 | 2764 | 2766 ± 23 | +2 | 27 | 800 | 3 | agrees |
| clovis-iii | 2828 | 2852 ± 27 | +24 | 29 | 400 | 4 | agrees |
| zurichess-neuchatel | 2919 | 2903 ± 22 | -16 | 25 | 800 | 3 | agrees |
| stash-25.0 | 2933 | 2929 ± 22 | -4 | 29 | 600 | 3 | agrees |
| polaris-1.8.1 | 3049 | 3015 ± 22 | -34 | 24 | 1100 | 5 | flagged |
| texel-1.07 | 3130 | 3138 ± 26 | +8 | 28 | 500 | 5 | agrees |
| stash-30.0 | 3153 | 3128 ± 16 | -25 | 24 | 1300 | 6 | flagged |
| priessnitz-2.0 | 3174 | 3187 ± 23 | +13 | 26 | 400 | 8 | agrees |
| halogen-10 | 3210 | 3227 ± 25 | +17 | 27 | 400 | 8 | agrees |
| simbelmyne-1.10.0 | 3239 | 3244 ± 17 | +5 | 21 | 900 | 9 | agrees |
| laser-1.7 | 3292 | 3289 ± 16 | -3 | 17 | 1100 | 12 | agrees |
| mantissa-3.7.2 | 3311 | 3302 ± 19 | -9 | 21 | 1000 | 14 | agrees |
| weiss-2.0 | 3318 | 3325 ± 16 | +7 | 18 | 1000 | 14 | agrees |
| xiphos-0.6 | 3354 | 3346 ± 17 | -8 | 18 | 1000 | 14 | agrees |
| lynx-1.11.0 | 3363 | 3363 ± 24 | +0 | 27 | 400 | 13 | agrees |
| perseus-1.1 | 3397 | 3385 ± 17 | -12 | 20 | 1000 | 14 | agrees |
| stash-37.0 | 3418 | 3436 ± 16 | +18 | 20 | 1400 | 15 | agrees |
| ethereal-12.75 | 3424 | 3437 ± 23 | +13 | 26 | 400 | 15 | agrees |
| blackcore-6.0 | 3438 | 3438 ± 17 | +0 | 19 | 800 | 15 | agrees |
| clockwork-20260705 | 3449 | 3460 ± 23 | +11 | 27 | 400 | 14 | agrees |
| berserk-5.0 | 3452 | 3411 ± 25 | -41 | 31 | 400 | 14 | flagged |
| marvin-6.3.0 | 3458 | 3477 ± 18 | +19 | 21 | 600 | 14 | agrees |
| midnight-9 | 3476 | 3483 ± 20 | +7 | 23 | 500 | 12 | agrees |
| carp-3.0.1 | 3525 | 3522 ± 23 | -3 | 25 | 400 | 10 | agrees |
| willow-4.0 | 3531 | 3524 ± 27 | -7 | 28 | 300 | 10 | agrees |
| stockfish-11 | 3563 | 3564 ± 36 | +1 | 39 | 200 | 9 | agrees, one side |

| measure | value |
|---|---|
| games | 9900 |
| neighbor pairs unplayed | none |
| slope against CCRL | 1.09 +/- 0.04 against CCRL over 30 anchors |
