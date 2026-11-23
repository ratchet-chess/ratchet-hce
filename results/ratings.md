# Ratings

Ratings on the CCRL Blitz scale, fitted by ratchet-bench's `tools/fit-rating.ts` against anchors held
at their published ratings. The testing platform's `tools/calibrate.sh` writes a gauntlet's row at the
end of its run, through ratchet-bench's `tools/results.ts`. A row is keyed by player and protocol: a
new run replaces the row with the same key, and a run under another protocol adds its own. The own
engine's player names its version, so each rated version keeps its row.

- **player** is `release[@level]`, as the match tools name it (ratchet-bench's `tools/player.sh`).
- **±** is the fit's 95% interval, from the spread of its residuals over color-swapped pairs. It covers
  sampling only, not the anchors' published errors or the scale's stretch.
- **score** is the player's share of the points against the anchors. At 0% or 100% the fit has no
  finite value, and the row says the player lies below or above the anchors it played.
- **protocol** is the run's time control and conditions. Rows under different protocols do not
  compare.

| player | rating | ± | games | score | anchors | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|
| ratchet-0.1.0 | 2955 | 26 | 500 | 60.0% | stash-21.0, velvet-1.2.0, clovis-iii, stash-25.0, stash-30.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | c7dd806 | 2026-11-03 |
| ratchet-0.2.0 | 3208 | 21 | 700 | 62.6% | zurichess-neuchatel, stash-25.0, polaris-1.8.1, texel-1.07, stash-30.0, simbelmyne-1.10.0, mantissa-3.7.2 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 2c7c11c | 2026-11-04 |
| ratchet-0.3.0 | 3351 | 19 | 700 | 61.2% | stash-30.0, priessnitz-2.0, halogen-10, simbelmyne-1.10.0, weiss-2.0, xiphos-0.6, stash-37.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | e1beea5 | 2026-11-04 |
| ratchet-0.3.3 | 3351 | 16 | 704 | 47.0% | weiss-2.0, xiphos-0.6, perseus-1.1, stash-37.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | ccadff0 | 2026-11-05 |
| ratchet-0.3.4 | 3402 | 21 | 400 | 50.0% | xiphos-0.6, perseus-1.1, stash-37.0, blackcore-6.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 4736d2e | 2026-11-07 |
| ratchet-0.3.5 | 3397 | 15 | 800 | 49.4% | xiphos-0.6, perseus-1.1, stash-37.0, blackcore-6.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 3675ef4 | 2026-11-10 |
| ratchet-0.3.6 | 3414 | 14 | 800 | 51.7% | xiphos-0.6, perseus-1.1, stash-37.0, blackcore-6.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 41cd521 | 2026-11-11 |
| ratchet-0.3.7 | 3424 | 13 | 800 | 50.6% | perseus-1.1, stash-37.0, ethereal-12.75, blackcore-6.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | a389085 | 2026-11-11 |
| ratchet-0.3.9 | 3436 | 14 | 800 | 52.4% | perseus-1.1, stash-37.0, ethereal-12.75, blackcore-6.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | fc8ca51 | 2026-11-11 |
| ratchet-0.3.11 | 3443 | 11 | 1200 | 51.7% | perseus-1.1, stash-37.0, ethereal-12.75, blackcore-6.0, clockwork-20260705, marvin-6.3.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | f7f505e | 2026-11-13 |
| ratchet-0.3.12 | 3452 | 14 | 800 | 51.4% | ethereal-12.75, blackcore-6.0, clockwork-20260705, marvin-6.3.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 4b960f9 | 2026-11-14 |
| ratchet-0.3.13 | 3466 | 15 | 800 | 51.5% | blackcore-6.0, clockwork-20260705, marvin-6.3.0, midnight-9 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | f1d9776 | 2026-11-15 |
| ratchet-0.3.15 | 3470 | 14 | 800 | 52.1% | blackcore-6.0, clockwork-20260705, marvin-6.3.0, midnight-9 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | 2522202 | 2026-11-18 |
| ratchet-hce-0.3.16 | 3495 | 15 | 800 | 49.7% | marvin-6.3.0, midnight-9, carp-3.0.1, willow-4.0 | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign | adf0f1f | 2026-11-23 |
