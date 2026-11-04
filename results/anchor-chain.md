# Anchor chain

How each anchor's published CCRL Blitz rating holds against its nearest anchors: the two on each
side by rating, past any of its own family. A trusted anchor is one that agrees here, and a
candidate is rated against its four nearest trusted anchors, held at CCRL. `tools/calibrate.sh
chain` plays a run's pairs not yet played and adds its games to the pool; `tools/fit-rating.ts
--chain` reads the pool, and `tools/results.ts` writes these tables.

The verdicts in `results/anchor-checks.md` stand as played: they fit each anchor against every other
in its check, so a stretched scale counts against a check's lowest and highest anchors. A flagged
anchor here gets more games on its pairs before any drop (`REPLAY=1`). An anchor with one side has a
fit that a stretched scale still moves.

A fit's interval comes from color-swapped pairs and covers sampling only. **gap's ±** adds CCRL's
published errors, the anchor's own and its opponents' as the fit weighs them, and an anchor is flagged
when its gap exceeds it.

| run | games file | protocol |
|---|---|---|
| G | anchors-20261101-192446.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| H | anchors-20261103-114758.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| I | anchors-20261103-130852.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| J | anchors-20261103-131039.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| K | anchors-20261103-203736.pgn | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |

| anchor | CCRL Blitz | nearest fit (95%) | gap | gap's ± | games | nearest anchors played | verdict |
|---|---|---|---|---|---|---|---|
| stash-19.0 | 2474 | 2430 ± 47 | -44 | 51 | 200 | blunder-8.5.5, floyd-0.9 | agrees, one side |
| floyd-0.9 | 2583 | 2604 ± 36 | +21 | 39 | 300 | stash-19.0, blunder-8.5.5, stash-21.0 | agrees |
| blunder-8.5.5 | 2663 | 2655 ± 29 | -8 | 32 | 400 | stash-19.0, floyd-0.9, stash-21.0, velvet-1.2.0 | agrees |
| stash-21.0 | 2714 | 2714 ± 26 | -0 | 30 | 500 | floyd-0.9, blunder-8.5.5, velvet-1.2.0, clovis-iii | agrees |
| velvet-1.2.0 | 2764 | 2775 ± 25 | +11 | 29 | 500 | blunder-8.5.5, stash-21.0, clovis-iii, zurichess-neuchatel | agrees |
| clovis-iii | 2828 | 2852 ± 27 | +24 | 30 | 400 | stash-21.0, velvet-1.2.0, zurichess-neuchatel, stash-25.0 | agrees |
| zurichess-neuchatel | 2919 | 2909 ± 25 | -10 | 28 | 500 | velvet-1.2.0, clovis-iii, stash-25.0, polaris-1.8.1 | agrees |
| stash-25.0 | 2933 | 2922 ± 23 | -11 | 30 | 500 | clovis-iii, zurichess-neuchatel, polaris-1.8.1, texel-1.07 | agrees |
| polaris-1.8.1 | 3049 | 3023 ± 24 | -26 | 27 | 500 | zurichess-neuchatel, stash-25.0, texel-1.07, stash-30.0 | agrees |
| texel-1.07 | 3130 | 3156 ± 28 | +26 | 32 | 300 | stash-25.0, polaris-1.8.1, stash-30.0 | agrees |
| stash-30.0 | 3153 | 3139 ± 21 | -14 | 27 | 600 | polaris-1.8.1, texel-1.07, laser-1.7, simbelmyne-1.10.0 | agrees |
| simbelmyne-1.10.0 | 3239 | 3250 ± 28 | +11 | 31 | 300 | stash-30.0, laser-1.7, mantissa-3.7.2 | agrees |
| laser-1.7 | 3292 | 3316 ± 20 | +24 | 22 | 600 | stash-30.0, mantissa-3.7.2, simbelmyne-1.10.0, weiss-2.0 | flagged |
| mantissa-3.7.2 | 3311 | 3317 ± 22 | +6 | 24 | 500 | laser-1.7, weiss-2.0, xiphos-0.6, simbelmyne-1.10.0 | agrees |
| weiss-2.0 | 3318 | 3304 ± 20 | -14 | 22 | 400 | mantissa-3.7.2, xiphos-0.6, stash-37.0, laser-1.7 | agrees |
| xiphos-0.6 | 3354 | 3338 ± 23 | -16 | 25 | 300 | mantissa-3.7.2, weiss-2.0, stash-37.0 | agrees |
| stash-37.0 | 3418 | 3432 ± 27 | +14 | 30 | 200 | weiss-2.0, xiphos-0.6 | agrees, one side |

| measure | value |
|---|---|
| games | 5900 |
| neighbor pairs unplayed | simbelmyne-1.10.0 v texel-1.07 |
| slope against CCRL | 1.11 +/- 0.05 against CCRL over 17 anchors |
