# Timings

Time per move of releases whose search time is not set by a clock, for choosing match conditions.

## Sargon 1978, by level

Self-play through `goClock`, as a match plays it: each side its own engine in game mode, from
`books/8moves_v3.pgn` openings, games capped at 200 plies, every move timed on the wall clock under
Bun, on the host `local`. The workers run at about 0.6 of its speed.

| level | games | mean per move | 95th percentile | slowest move | slowest side per game | commit | date |
|---|---|---|---|---|---|---|---|
| 1 | 8 | 0.2 ms | 0.4 ms | 0.9 ms | 23 ms | 35745a9 | 2026-10-30 |
| 2 | 8 | 1.2 ms | 2.7 ms | 7.5 ms | 0.13 s | 35745a9 | 2026-10-30 |
| 3 | 8 | 9.9 ms | 25 ms | 38 ms | 1.3 s | 35745a9 | 2026-10-30 |
| 4 | 8 | 40 ms | 117 ms | 317 ms | 5.6 s | 35745a9 | 2026-10-30 |
| 5 | 8 | 190 ms | 0.89 s | 2.6 s | 29 s | 35745a9 | 2026-10-30 |
| 6 | 4 | 0.90 s | 2.9 s | 7.5 s | 132 s | 35745a9 | 2026-10-30 |
