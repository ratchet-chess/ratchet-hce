# Move similarity

How often two engines choose the same move over one position set, after one short search each.
`tools/similarity.ts run` plays the positions and `tools/results.ts similarity` writes these tables.

A percentage holds only for its position set, its time and its pool of engines, so compare rows of one
protocol, and never with a published threshold. Strength and search time shift agreement, so
compare pairs of like gaps. **repeat** is a player's agreement with itself across passes, the noise floor
of its pairs. **no move** counts positions where it gave no bestmove and was restarted, over all passes.

| protocol | players | pairs' mean | pairs' sd | mean repeat | commit | date |
|---|---|---|---|---|---|---|

| player | repeat | no move | protocol |
|---|---|---|---|

| pair | CCRL gap | agreement | protocol |
|---|---|---|---|
