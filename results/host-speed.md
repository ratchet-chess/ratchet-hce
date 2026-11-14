# Host speed

Each host's Stockfish 10 bench, alone and at game load: as many copies at once as the host plays games, under a
game's limits. `tools/host-speed.ts measure` plays it and `tools/results.ts host-speed` writes this table. A read is
the median over spread rounds, since reads come in low bursts; **load's range** is the lowest and highest round.
**over host** is local's read over the host's: at load, it scales a worker's time control.

| job | host | copies | alone | at load | load's range | over host at load | over host alone | note | commit | date |
|---|---|---|---|---|---|---|---|---|---|---|
| 96 | local | 14 | 3205319 | 2459012 | 2370239 to 2526836 | 1.000 | 1.000 |  | ec4d866 | 2026-11-04 |
| 96 | worker1 | 5 | 2094278 | 1965737 | 1958895 to 1966718 | 1.251 | 1.531 |  | ec4d866 | 2026-11-04 |
| 96 | worker2 | 5 | 2085409 | 1946313 | 1941517 to 1950167 | 1.263 | 1.537 |  | ec4d866 | 2026-11-04 |
| 96 | worker3 | 5 | 2092054 | 1963777 | 1961821 to 1965737 | 1.252 | 1.532 |  | ec4d866 | 2026-11-04 |
| 593 | htpc | 11 | 2801805 | 1772879 | 1763356 to 1776076 | 1.411 | 1.116 |  | cb1a17f | 2026-11-14 |
| 593 | local | 14 | 3126458 | 2501166 | 2482254 to 2512332 | 1.000 | 1.000 |  | cb1a17f | 2026-11-14 |

Anchors' own speeds, from `tools/host-speed.ts anchors`, at a game's Hash: `go depth 50` then `stop` after a second, over spread positions, alone and at the same load.

| anchor | host | alone nps | at load nps | over host at load | over host alone | lost searches | job | commit | date |
|---|---|---|---|---|---|---|---|---|---|
| halogen-10 | local | 5546244 | 4376279 | 1.000 | 1.000 | 0 | 99 | bfd5f3f | 2026-11-04 |
| halogen-10 | worker1 | 3773299 | 3448068 | 1.269 | 1.470 | 0 | 99 | bfd5f3f | 2026-11-04 |
| halogen-10 | worker2 | 3735296 | 3411779 | 1.283 | 1.485 | 0 | 99 | bfd5f3f | 2026-11-04 |
| halogen-10 | worker3 | 3766401 | 3454182 | 1.267 | 1.473 | 0 | 99 | bfd5f3f | 2026-11-04 |
| laser-1.7 | local | 1869175 | 1499629 | 1.000 | 1.000 | 0 | 99 | bfd5f3f | 2026-11-04 |
| laser-1.7 | worker1 | 1237613 | 1150136 | 1.304 | 1.510 | 0 | 99 | bfd5f3f | 2026-11-04 |
| laser-1.7 | worker2 | 1223677 | 1136177 | 1.320 | 1.528 | 0 | 99 | bfd5f3f | 2026-11-04 |
| laser-1.7 | worker3 | 1237897 | 1143318 | 1.312 | 1.510 | 0 | 99 | bfd5f3f | 2026-11-04 |
| mantissa-3.7.2 | local | 1932803 | 1462402 | 1.000 | 1.000 | 0 | 99 | bfd5f3f | 2026-11-04 |
| mantissa-3.7.2 | worker1 | 1179352 | 987438 | 1.481 | 1.639 | 0 | 99 | bfd5f3f | 2026-11-04 |
| mantissa-3.7.2 | worker2 | 1174823 | 1034608 | 1.413 | 1.645 | 0 | 99 | bfd5f3f | 2026-11-04 |
| mantissa-3.7.2 | worker3 | 1180744 | 1087738 | 1.344 | 1.637 | 0 | 99 | bfd5f3f | 2026-11-04 |
| simbelmyne-1.10.0 | local | 3075978 | 2361420 | 1.000 | 1.000 | 0 | 99 | bfd5f3f | 2026-11-04 |
| simbelmyne-1.10.0 | worker1 | 2021822 | 1870954 | 1.262 | 1.521 | 0 | 99 | bfd5f3f | 2026-11-04 |
| simbelmyne-1.10.0 | worker2 | 2002619 | 1858245 | 1.271 | 1.536 | 0 | 99 | bfd5f3f | 2026-11-04 |
| simbelmyne-1.10.0 | worker3 | 2027902 | 1864870 | 1.266 | 1.517 | 0 | 99 | bfd5f3f | 2026-11-04 |
| texel-1.07 | local | 3308548 | 2584026 | 1.000 | 1.000 | 0 | 99 | bfd5f3f | 2026-11-04 |
| texel-1.07 | worker1 | 2140173 | 1951761 | 1.324 | 1.546 | 0 | 99 | bfd5f3f | 2026-11-04 |
| texel-1.07 | worker2 | 2126195 | 1935434 | 1.335 | 1.556 | 0 | 99 | bfd5f3f | 2026-11-04 |
| texel-1.07 | worker3 | 2148432 | 1948364 | 1.326 | 1.540 | 0 | 99 | bfd5f3f | 2026-11-04 |
