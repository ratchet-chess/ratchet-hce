# Move similarity

How often two engines choose the same move over one position set, after one short search each.
`tools/similarity.ts run` plays the positions and `tools/results.ts similarity` writes these tables.

A percentage holds only for its position set, its time and its pool of engines, so compare rows of one
protocol, and never with a published threshold. Strength and search time shift agreement, so
compare pairs of like gaps. **repeat** is a player's agreement with itself across passes, the noise floor
of its pairs. **no move** counts positions where it gave no bestmove and was restarted, over all passes.
**search** is how a player's search ends: `stop` after the time, or `movetime` for a player that reads no
input during a search, whose own time management sets its **median ms**. A pair compares like searches
only when those times match.

| protocol | players | pairs' mean | pairs' sd | mean repeat | commit | date |
|---|---|---|---|---|---|---|
| 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots | 26 | 45.8% | 5.0 | 94.6% | c6a4d8a | 2026-11-05 |

| player | search | median ms | repeat | no move | protocol |
|---|---|---|---|---|---|
| blackcore-6.0 | stop | 100 | 98.2% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 | stop | 100 | 81.1% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| carp-3.0.1 | stop | 101 | 98.2% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii | movetime | 449 | 98.8% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 | stop | 100 | 98.1% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 | stop | 100 | 98.0% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 | stop | 100 | 97.4% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 | stop | 100 | 96.0% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| marvin-6.3.0 | stop | 100 | 98.0% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| midnight-9 | movetime | 97 | 98.0% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 | stop | 101 | 97.0% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 | stop | 100 | 97.6% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 | movetime | 100 | 97.6% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| ratchet@41ac7fa | stop | 101 | 97.1% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 | stop | 101 | 96.7% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 | stop | 101 | 95.2% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 | stop | 101 | 95.3% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 | stop | 100 | 97.4% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 | stop | 100 | 97.8% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-37.0 | stop | 100 | 96.4% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 | stop | 100 | 95.9% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 | stop | 103 | 98.0% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 | stop | 100 | 97.6% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| willow-4.0 | clock | 101 | 98.7% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 | stop | 101 | 69.9% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel | stop | 102 | 70.9% | 0 | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |

| pair | CCRL gap | agreement | protocol |
|---|---|---|---|
| midnight-9 v carp-3.0.1 | 49 | 61.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| carp-3.0.1 v willow-4.0 | 6 | 60.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| midnight-9 v willow-4.0 | 55 | 59.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| marvin-6.3.0 v carp-3.0.1 | 67 | 58.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v stash-25.0 | 219 | 58.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| marvin-6.3.0 v midnight-9 | 18 | 58.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v stash-30.0 | 220 | 58.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| marvin-6.3.0 v willow-4.0 | 73 | 57.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blackcore-6.0 v carp-3.0.1 | 87 | 55.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blackcore-6.0 v marvin-6.3.0 | 20 | 55.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blackcore-6.0 v midnight-9 | 38 | 55.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blackcore-6.0 v willow-4.0 | 93 | 55.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v marvin-6.3.0 | 248 | 53.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v midnight-9 | 165 | 53.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v midnight-9 | 266 | 52.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v weiss-2.0 | 165 | 52.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v xiphos-0.6 | 36 | 52.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v carp-3.0.1 | 214 | 52.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v carp-3.0.1 | 315 | 52.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v marvin-6.3.0 | 147 | 52.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v polaris-1.8.1 | 130 | 52.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v mantissa-3.7.2 | 101 | 51.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v weiss-2.0 | 26 | 51.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v willow-4.0 | 220 | 51.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v weiss-2.0 | 79 | 51.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v blackcore-6.0 | 228 | 51.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v willow-4.0 | 321 | 51.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v simbelmyne-1.10.0 | 190 | 51.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v laser-1.7 | 118 | 51.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v weiss-2.0 | 144 | 51.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v stash-37.0 | 100 | 51.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v stash-37.0 | 244 | 51.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v ratchet@41ac7fa | - | 51.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v texel-1.07 | 81 | 51.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v stash-30.0 | 439 | 51.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v perseus-1.1 | 79 | 51.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v stash-30.0 | 325 | 50.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v simbelmyne-1.10.0 | 65 | 50.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v perseus-1.1 | 244 | 50.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v laser-1.7 | 162 | 50.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v texel-1.07 | 302 | 50.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v perseus-1.1 | 223 | 50.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-37.0 v ratchet@41ac7fa | - | 50.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v stash-37.0 | 64 | 50.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v xiphos-0.6 | 180 | 50.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v weiss-2.0 | 188 | 50.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v polaris-1.8.1 | 285 | 50.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v blackcore-6.0 | 127 | 50.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v weiss-2.0 | 269 | 50.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v xiphos-0.6 | 62 | 50.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v priessnitz-2.0 | 44 | 50.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v simbelmyne-1.10.0 | 109 | 50.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v stash-30.0 | 23 | 50.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v priessnitz-2.0 | 125 | 50.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v stash-37.0 | 265 | 50.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v polaris-1.8.1 | 221 | 49.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v laser-1.7 | 53 | 49.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v laser-1.7 | 464 | 49.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v weiss-2.0 | 490 | 49.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v marvin-6.3.0 | 140 | 49.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v ratchet@41ac7fa | - | 49.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v stash-30.0 | 104 | 49.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v zurichess-neuchatel | 155 | 49.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v ratchet@41ac7fa | - | 49.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v stash-25.0 | 270 | 49.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v priessnitz-2.0 | 346 | 49.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v perseus-1.1 | 105 | 49.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v perseus-1.1 | 158 | 49.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v polaris-1.8.1 | 116 | 49.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v simbelmyne-1.10.0 | 86 | 49.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v stash-25.0 | 14 | 49.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 v stash-37.0 | 21 | 49.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v ratchet@41ac7fa | - | 49.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v stash-25.0 | 105 | 49.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v stash-37.0 | 126 | 49.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v weiss-2.0 | 385 | 49.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v polaris-1.8.1 | 386 | 49.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v perseus-1.1 | 569 | 49.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v perseus-1.1 | 464 | 49.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v perseus-1.1 | 43 | 49.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v velvet-1.2.0 | 101 | 49.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v ratchet@41ac7fa | - | 49.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v weiss-2.0 | 108 | 49.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v simbelmyne-1.10.0 | 306 | 49.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v texel-1.07 | 197 | 49.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v priessnitz-2.0 | 21 | 49.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v stash-37.0 | 590 | 48.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v laser-1.7 | 82 | 48.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v perseus-1.1 | 267 | 48.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v ratchet@41ac7fa | - | 48.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v simbelmyne-1.10.0 | 320 | 48.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v ratchet@41ac7fa | - | 48.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v priessnitz-2.0 | 255 | 48.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v zurichess-neuchatel | 256 | 48.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v simbelmyne-1.10.0 | 411 | 48.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v laser-1.7 | 139 | 48.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v stash-30.0 | 234 | 48.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v zurichess-neuchatel | 91 | 48.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 v ratchet@41ac7fa | - | 48.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v laser-1.7 | 243 | 48.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v texel-1.07 | 211 | 48.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v xiphos-0.6 | 526 | 48.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v xiphos-0.6 | 201 | 48.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v xiphos-0.6 | 224 | 48.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v stash-25.0 | 169 | 48.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v stash-21.0 | 51 | 48.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v marvin-6.3.0 | 284 | 48.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v stash-37.0 | 288 | 48.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v xiphos-0.6 | 115 | 48.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v halogen-10 | 80 | 48.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v midnight-9 | 158 | 48.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v weiss-2.0 | 399 | 48.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-37.0 v marvin-6.3.0 | 40 | 48.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v marvin-6.3.0 | 166 | 47.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 v marvin-6.3.0 | 61 | 47.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v texel-1.07 | 366 | 47.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v laser-1.7 | 373 | 47.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v halogen-10 | 57 | 47.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v perseus-1.1 | 348 | 47.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v halogen-10 | 36 | 47.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v stash-37.0 | 179 | 47.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v laser-1.7 | 359 | 47.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v ratchet@41ac7fa | - | 47.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v marvin-6.3.0 | 104 | 47.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v midnight-9 | 184 | 47.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v ratchet@41ac7fa | - | 47.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v carp-3.0.1 | 207 | 47.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| marvin-6.3.0 v ratchet@41ac7fa | - | 47.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v xiphos-0.6 | 305 | 47.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v carp-3.0.1 | 351 | 47.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v stash-37.0 | 208 | 47.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v halogen-10 | 161 | 47.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v willow-4.0 | 357 | 47.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v priessnitz-2.0 | 241 | 47.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v ratchet@41ac7fa | - | 47.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-37.0 v midnight-9 | 58 | 47.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-37.0 v willow-4.0 | 113 | 47.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v willow-4.0 | 213 | 47.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 v carp-3.0.1 | 128 | 47.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v midnight-9 | 302 | 47.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v carp-3.0.1 | 171 | 47.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v midnight-9 | 122 | 47.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v perseus-1.1 | 187 | 47.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v halogen-10 | 277 | 47.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-37.0 v carp-3.0.1 | 107 | 47.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v simbelmyne-1.10.0 | 475 | 47.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v ratchet@41ac7fa | - | 47.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v stash-30.0 | 389 | 47.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v carp-3.0.1 | 233 | 46.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v velvet-1.2.0 | 50 | 46.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v zurichess-neuchatel | 205 | 46.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v xiphos-0.6 | 144 | 46.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v willow-4.0 | 239 | 46.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| carp-3.0.1 v ratchet@41ac7fa | - | 46.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v perseus-1.1 | 478 | 46.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| halogen-10 v simbelmyne-1.10.0 | 29 | 46.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v marvin-6.3.0 | 328 | 46.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 v midnight-9 | 79 | 46.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| weiss-2.0 v blackcore-6.0 | 120 | 46.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v willow-4.0 | 177 | 46.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v halogen-10 | 382 | 46.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v stash-37.0 | 485 | 46.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v xiphos-0.6 | 421 | 46.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v marvin-6.3.0 | 630 | 46.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v weiss-2.0 | 7 | 46.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 v willow-4.0 | 134 | 46.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v priessnitz-2.0 | 410 | 46.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v stash-37.0 | 369 | 46.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v marvin-6.3.0 | 219 | 46.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v clovis-iii | 64 | 46.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v xiphos-0.6 | 435 | 46.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v polaris-1.8.1 | 335 | 46.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| midnight-9 v ratchet@41ac7fa | - | 46.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v mantissa-3.7.2 | 137 | 46.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v ratchet@41ac7fa | - | 46.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-37.0 v blackcore-6.0 | 20 | 46.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v blackcore-6.0 | 146 | 45.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v clovis-iii | 165 | 45.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v texel-1.07 | 416 | 45.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v midnight-9 | 346 | 45.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v willow-4.0 | 401 | 45.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v marvin-6.3.0 | 305 | 45.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| xiphos-0.6 v blackcore-6.0 | 84 | 45.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v halogen-10 | 291 | 45.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v texel-1.07 | 467 | 45.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v midnight-9 | 648 | 45.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v willow-4.0 | 703 | 45.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| perseus-1.1 v blackcore-6.0 | 41 | 45.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v carp-3.0.1 | 395 | 45.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v weiss-2.0 | 554 | 45.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v stash-30.0 | 490 | 45.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v stash-37.0 | 107 | 45.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v marvin-6.3.0 | 409 | 45.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v midnight-9 | 237 | 45.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v weiss-2.0 | 604 | 45.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| willow-4.0 v ratchet@41ac7fa | - | 45.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blackcore-6.0 v ratchet@41ac7fa | - | 45.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| laser-1.7 v mantissa-3.7.2 | 19 | 45.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v stash-21.0 | 240 | 45.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v stash-25.0 | 459 | 45.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v midnight-9 | 323 | 45.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v blackcore-6.0 | 308 | 45.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v halogen-10 | 446 | 45.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v carp-3.0.1 | 697 | 44.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v xiphos-0.6 | 43 | 44.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| priessnitz-2.0 v blackcore-6.0 | 264 | 44.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v simbelmyne-1.10.0 | 525 | 44.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v simbelmyne-1.10.0 | 576 | 44.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v carp-3.0.1 | 286 | 44.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v willow-4.0 | 378 | 44.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v clovis-iii | 114 | 44.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| texel-1.07 v mantissa-3.7.2 | 181 | 44.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v ratchet@41ac7fa | - | 44.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v stash-37.0 | 499 | 44.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v blackcore-6.0 | 199 | 44.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v willow-4.0 | 292 | 44.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v perseus-1.1 | 633 | 44.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v perseus-1.1 | 86 | 44.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v laser-1.7 | 528 | 44.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| mantissa-3.7.2 v ratchet@41ac7fa | - | 44.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v priessnitz-2.0 | 460 | 44.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| simbelmyne-1.10.0 v mantissa-3.7.2 | 72 | 44.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v laser-1.7 | 578 | 43.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v perseus-1.1 | 683 | 43.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v marvin-6.3.0 | 539 | 43.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v mantissa-3.7.2 | 483 | 43.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v blackcore-6.0 | 285 | 43.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v carp-3.0.1 | 372 | 43.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v midnight-9 | 427 | 43.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-30.0 v mantissa-3.7.2 | 158 | 43.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v xiphos-0.6 | 590 | 43.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v willow-4.0 | 482 | 43.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v halogen-10 | 496 | 43.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| clovis-iii v blackcore-6.0 | 610 | 43.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v carp-3.0.1 | 476 | 43.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v marvin-6.3.0 | 525 | 43.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v priessnitz-2.0 | 511 | 43.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v perseus-1.1 | 734 | 43.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v mantissa-3.7.2 | 378 | 43.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v blackcore-6.0 | 389 | 43.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v midnight-9 | 543 | 43.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v stash-37.0 | 654 | 43.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v weiss-2.0 | 655 | 42.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| polaris-1.8.1 v mantissa-3.7.2 | 262 | 42.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v xiphos-0.6 | 640 | 42.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v midnight-9 | 557 | 42.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v ratchet@41ac7fa | - | 42.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v carp-3.0.1 | 606 | 42.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v laser-1.7 | 629 | 42.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v mantissa-3.7.2 | 392 | 42.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v halogen-10 | 547 | 42.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v blackcore-6.0 | 505 | 42.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v willow-4.0 | 598 | 42.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v blackcore-6.0 | 519 | 42.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v marvin-6.3.0 | 694 | 42.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v stash-25.0 | 350 | 41.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v ratchet@41ac7fa | - | 41.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-25.0 v carp-3.0.1 | 592 | 41.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v midnight-9 | 712 | 41.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v stash-37.0 | 704 | 41.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v mantissa-3.7.2 | 547 | 41.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| zurichess-neuchatel v willow-4.0 | 612 | 41.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v blunder-8.5.5 | 80 | 41.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v texel-1.07 | 547 | 41.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v blunder-8.5.5 | 189 | 41.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v velvet-1.2.0 | 181 | 41.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v xiphos-0.6 | 691 | 40.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v stash-21.0 | 131 | 40.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v carp-3.0.1 | 761 | 40.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v polaris-1.8.1 | 466 | 40.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v stash-30.0 | 679 | 40.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v zurichess-neuchatel | 336 | 40.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v velvet-1.2.0 | 290 | 40.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v willow-4.0 | 767 | 40.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v zurichess-neuchatel | 445 | 40.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| velvet-1.2.0 v blackcore-6.0 | 674 | 40.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v priessnitz-2.0 | 591 | 39.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v simbelmyne-1.10.0 | 656 | 39.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v stash-30.0 | 570 | 39.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v stash-37.0 | 755 | 39.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v laser-1.7 | 709 | 39.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v polaris-1.8.1 | 575 | 39.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v marvin-6.3.0 | 744 | 39.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v halogen-10 | 627 | 39.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v texel-1.07 | 656 | 39.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v mantissa-3.7.2 | 597 | 39.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v clovis-iii | 354 | 38.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v midnight-9 | 762 | 38.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v marvin-6.3.0 | 795 | 38.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v midnight-9 | 813 | 38.7% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v simbelmyne-1.10.0 | 765 | 38.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v weiss-2.0 | 735 | 38.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v blackcore-6.0 | 775 | 38.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v mantissa-3.7.2 | 648 | 38.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v perseus-1.1 | 814 | 38.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v perseus-1.1 | 923 | 38.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v blackcore-6.0 | 724 | 38.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v laser-1.7 | 818 | 38.1% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v ratchet@41ac7fa | - | 38.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v priessnitz-2.0 | 700 | 38.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v carp-3.0.1 | 811 | 37.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v halogen-10 | 736 | 37.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-21.0 v willow-4.0 | 817 | 37.8% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v carp-3.0.1 | 862 | 37.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| blunder-8.5.5 v willow-4.0 | 868 | 37.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v clovis-iii | 245 | 37.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v weiss-2.0 | 844 | 37.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v stash-37.0 | 835 | 37.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v floyd-0.9 | 109 | 37.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v mantissa-3.7.2 | 728 | 37.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v stash-37.0 | 944 | 37.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v xiphos-0.6 | 771 | 36.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v ratchet@41ac7fa | - | 36.6% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v marvin-6.3.0 | 875 | 36.5% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v carp-3.0.1 | 942 | 36.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v midnight-9 | 893 | 36.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v blackcore-6.0 | 855 | 36.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v xiphos-0.6 | 880 | 36.0% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| floyd-0.9 v willow-4.0 | 948 | 35.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v mantissa-3.7.2 | 837 | 35.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v marvin-6.3.0 | 984 | 35.4% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v blackcore-6.0 | 964 | 34.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v carp-3.0.1 | 1051 | 34.3% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v midnight-9 | 1002 | 34.2% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
| stash-19.0 v willow-4.0 | 1057 | 33.9% | 8238 positions (sim03-positions.txt 71e062b2), 100 ms by stop, by movetime where a player ignores stop, 2 passes, ucinewgame each, Hash 16, local at 14 slots |
