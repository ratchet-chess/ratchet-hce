# Speed

A release's search speed against its original's, over the same searches. `tools/reference.ts` times
the original's search to each position's last depth, and `tools/fidelity.ts` times the release's
search of the same position at that depth. `tools/results.ts speed` writes the row. Both sides run
on one host, one search at a time, with nothing else running.

- **knodes/s** is each side's own node count over its own time, in thousands of nodes per second.
  Where fidelity is exact, the node counts are equal, and the ratio is a ratio of times.
- **original over release** is how many times faster the original searches. A rating played on the
  real clock is a rating of the release at its own speed.
- **protocol** names the positions, the depth, the release's runtime and the host.

| release | searches | depth | release knodes/s | original knodes/s | original over release | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|
| phalanx-xii | 192 | 8 | 1703 | 2123 | 1.25x | 192 reference positions to depth 8, one fresh search each; release under Bun, original as built in the anchor tree; local runner on local | 9342f2a | 2026-10-30 |
