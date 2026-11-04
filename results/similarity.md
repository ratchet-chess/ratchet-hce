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

| player | search | median ms | repeat | no move | protocol |
|---|---|---|---|---|---|

| pair | CCRL gap | agreement | protocol |
|---|---|---|---|
