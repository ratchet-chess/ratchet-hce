# Host speed

Each host's Stockfish 10 bench, alone and at game load: as many copies at once as the host plays games, under a
game's limits. `tools/host-speed.ts measure` plays it and `tools/results.ts host-speed` writes this table. A read is
the median over spread rounds, since reads come in low bursts; **load's range** is the lowest and highest round.
**over host** is local's read over the host's: at load, it scales a worker's time control.

| job | host | copies | alone | at load | load's range | over host at load | over host alone | note | commit | date |
|---|---|---|---|---|---|---|---|---|---|---|
