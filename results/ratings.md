# Ratings

Ratings on the CCRL Blitz scale, fitted by `tools/fit-rating.ts` against anchors held at their
published ratings. `tools/calibrate.sh` writes a gauntlet's row at the end of its run, through
`tools/results.ts`. A row is keyed by player and protocol: a new run replaces the row with the same
key, and a run under another protocol adds its own. The own engine's player names its version, so
each rated version keeps its row.

- **player** is `release[@level]`, as the match tools name it (`tools/player.sh`).
- **±** is the fit's 95% interval, from the spread of its residuals over color-swapped pairs. It covers
  sampling only, not the anchors' published errors or the scale's stretch.
- **score** is the player's share of the points against the anchors. At 0% or 100% the fit has no
  finite value, and the row says the player lies below or above the anchors it played.
- **protocol** is the run's time control and conditions. Rows under different protocols do not
  compare.

| player | rating | ± | games | score | anchors | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|
| chess-4.6-schaigorodsky@4 | 1320 | 39 | 500 | 27.2% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | ee11ef9 | 2026-11-03 |
| chess-4.6-schaigorodsky@5 | 1529 | 38 | 500 | 47.5% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | ee11ef9 | 2026-11-03 |
| chess-4.6-schaigorodsky@6 | 1704 | 39 | 500 | 64.3% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | ee11ef9 | 2026-11-03 |
| chess-4.6-schaigorodsky@7 | 1907 | 42 | 500 | 80.3% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | ee11ef9 | 2026-11-03 |
| chess-4.6-selfplay@4 | 1323 | 38 | 500 | 27.5% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 084ac68 | 2026-11-02 |
| chess-4.6-selfplay@5 | 1534 | 38 | 500 | 48.0% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 084ac68 | 2026-11-02 |
| chess-4.6-selfplay@6 | 1712 | 40 | 500 | 65.0% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 084ac68 | 2026-11-02 |
| chess-4.6-selfplay@7 | 1877 | 44 | 500 | 78.2% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 084ac68 | 2026-11-02 |
| chess-4.6-zurichess@4 | 1316 | 39 | 500 | 26.9% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| chess-4.6-zurichess@5 | 1531 | 36 | 500 | 47.7% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| chess-4.6-zurichess@6 | 1730 | 38 | 500 | 66.6% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| chess-4.6-zurichess@7 | 1852 | 42 | 500 | 76.4% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| chess-4.6@4 | 1304 | 40 | 500 | 25.8% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| chess-4.6@5 | 1506 | 36 | 500 | 45.2% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| chess-4.6@6 | 1615 | 34 | 500 | 56.0% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| chess-4.6@7 | 1818 | 40 | 500 | 73.9% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | fbe9180 | 2026-11-03 |
| fruit-2.1 | 2698 | 60 | 100 | 57.5% | stash-19.0, floyd-0.9, blunder-8.5.5, stash-21.0, velvet-1.2.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 66899f5 | 2026-11-02 |
| gnuchess-1987 | 1836 | 89 | 100 | 58.5% | vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1, stash-15.3 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | fbe9180 | 2026-11-03 |
| phalanx-xii | 2237 | 33 | 500 | 75.7% | rustic-alpha1, stash-11.0.1, stash-13.0.1, stash-15.3, crucible-1.0.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | fbe9180 | 2026-11-03 |
| phalanx-xii-zurichess | 2327 | 37 | 500 | 82.4% | rustic-alpha1, stash-11.0.1, stash-13.0.1, stash-15.3, crucible-1.0.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | fbe9180 | 2026-11-03 |
| ratchet-0.1.0 | 2955 | 26 | 500 | 60.0% | stash-21.0, velvet-1.2.0, clovis-iii, stash-25.0, stash-30.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 3724c4d | 2026-11-03 |
| ratchet-0.2.0 | 3208 | 21 | 700 | 62.6% | zurichess-neuchatel, stash-25.0, polaris-1.8.1, texel-1.07, stash-30.0, simbelmyne-1.10.0, mantissa-3.7.2 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 20787fb | 2026-11-04 |
| ratchet-0.3.0 | 3351 | 19 | 700 | 61.2% | stash-30.0, priessnitz-2.0, halogen-10, simbelmyne-1.10.0, weiss-2.0, xiphos-0.6, stash-37.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | cac79b5 | 2026-11-04 |
| ratchet-0.3.3 | 3351 | 16 | 704 | 47.0% | weiss-2.0, xiphos-0.6, perseus-1.1, stash-37.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 2b6d278 | 2026-11-05 |
| ratchet-0.3.4 | 3402 | 21 | 400 | 50.0% | xiphos-0.6, perseus-1.1, stash-37.0, blackcore-6.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 392f458 | 2026-11-07 |
| sargon-1978@1 | 582 | 95 | 100 | 9.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@2 | 785 | 66 | 100 | 21.5% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@3 | 860 | 61 | 100 | 28.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@4 | 981 | 55 | 100 | 40.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@5 | 1168 | 66 | 100 | 59.5% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@6 | 1212 | 63 | 100 | 64.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
