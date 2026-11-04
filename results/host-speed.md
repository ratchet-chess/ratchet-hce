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

Anchors' own speeds, from `tools/host-speed.ts anchors`, at a game's Hash: `go depth 50` then `stop` after a second, over spread positions, alone and at the same load.

| anchor | host | alone nps | at load nps | over host at load | over host alone | lost searches | job | commit | date |
|---|---|---|---|---|---|---|---|---|---|
