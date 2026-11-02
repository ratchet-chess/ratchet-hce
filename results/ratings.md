# Ratings

Ratings on the CCRL Blitz scale, fitted by `tools/fit-rating.ts` against anchors held at their
published ratings. `tools/calibrate.sh` writes a gauntlet's row at the end of its run, through
`tools/results.ts`. A row is keyed by player and protocol: a new run replaces the row with the same
key, and a run under another protocol adds its own.

- **player** is `release[@level]`, as the match tools name it (`tools/player.sh`).
- **±** is the fit's 95% interval. Games are treated as independent, so it is slightly narrow.
- **score** is the player's share of the points against the anchors. At 0% or 100% the fit has no
  finite value, and the row says the player lies below or above the anchors it played.
- **protocol** is the run's time control and conditions. Rows under different protocols do not
  compare.

| player | rating | ± | games | score | anchors | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|
| chess-4.6-zurichess@4 | 1350 | 85 | 100 | 30.0% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 03d6f52 | 2026-11-02 |
| chess-4.6-zurichess@5 | 1459 | 82 | 100 | 40.5% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 03d6f52 | 2026-11-02 |
| chess-4.6-zurichess@6 | 1700 | 86 | 100 | 64.0% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 03d6f52 | 2026-11-02 |
| chess-4.6-zurichess@7 | 1926 | 102 | 100 | 81.5% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 03d6f52 | 2026-11-02 |
| chess-4.6@4 | 1289 | 89 | 100 | 24.5% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 3fa0961 | 2026-11-01 |
| chess-4.6@5 | 1559 | 82 | 100 | 50.5% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 3fa0961 | 2026-11-01 |
| chess-4.6@6 | 1594 | 83 | 100 | 54.0% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 3fa0961 | 2026-11-01 |
| chess-4.6@7 | 1746 | 88 | 100 | 68.0% | blunders-0.1.0, vividmind-1.1.0, rustic-alpha1, stash-11.0.1, stash-13.0.1 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 3fa0961 | 2026-11-01 |
| fruit-2.1 | 2698 | 72 | 100 | 57.5% | stash-19.0, floyd-0.9, blunder-8.5.5, stash-21.0, velvet-1.2.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 66899f5 | 2026-11-02 |
| phalanx-xii | 2260 | 93 | 100 | 77.5% | rustic-alpha1, stash-11.0.1, stash-13.0.1, stash-15.3, crucible-1.0.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | eb20240 | 2026-10-30 |
| sargon-1978@1 | 582 | 124 | 100 | 9.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@2 | 785 | 91 | 100 | 21.5% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@3 | 860 | 85 | 100 | 28.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@4 | 981 | 80 | 100 | 40.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@5 | 1168 | 81 | 100 | 59.5% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
| sargon-1978@6 | 1212 | 82 | 100 | 64.0% | missingpawn-1, megalodon-1.0.0, dragontooth-0.2, blunders-0.1.0, vividmind-1.1.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign, own clock 3600+10 | 6cb8528 | 2026-10-30 |
