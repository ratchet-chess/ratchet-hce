# Runtimes

Each engine's search speed under each runtime, over the same searches. `bench/search.ts` runs a
fresh `go(depth)` from every position of `bench/positions.txt`, the set the releases' references
use, and `tools/results.ts runtimes` writes its rows. Runtime rankings differ by workload and by
engine, so every engine is measured under Bun, Node and Deno.

- **node signature** is the engine's total node count over the set at that depth. It is equal
  under every runtime, or the writer refuses the run, so the speeds in one engine's rows are of
  the same searches.
- **knodes/s** is the median of the timed passes, in thousands of nodes per second.
- **protocol** names the passes, the host and the load during the run. Rows under different
  protocols do not compare.

| engine | runtime | depth | node signature | knodes/s | protocol | commit | date |
|---|---|---|---|---|---|---|---|
| chess-4.6 | bun 1.4.4 | 5 | 8569073 | 1003 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6 | deno 2.9.8 | 5 | 8569073 | 896 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6 | node 26.12.1 | 5 | 8569073 | 930 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-schaigorodsky | bun 1.4.4 | 5 | 26031495 | 931 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-schaigorodsky | deno 2.9.8 | 5 | 26031495 | 814 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-schaigorodsky | node 26.12.1 | 5 | 26031495 | 871 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-selfplay | bun 1.4.4 | 5 | 11255079 | 898 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-selfplay | deno 2.9.8 | 5 | 11255079 | 786 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-selfplay | node 26.12.1 | 5 | 11255079 | 841 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-zurichess | bun 1.4.4 | 5 | 13691040 | 906 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-zurichess | deno 2.9.8 | 5 | 13691040 | 784 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| chess-4.6-zurichess | node 26.12.1 | 5 | 13691040 | 834 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| fruit-2.1 | bun 1.4.4 | 7 | 30154307 | 2525 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| fruit-2.1 | deno 2.9.8 | 7 | 30154307 | 2041 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| fruit-2.1 | node 26.12.1 | 7 | 30154307 | 2370 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| gnuchess-1987 | bun 1.4.4 | 5 | 18583764 | 1676 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| gnuchess-1987 | deno 2.9.8 | 5 | 18583764 | 1470 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| gnuchess-1987 | node 26.12.1 | 5 | 18583764 | 1591 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| phalanx-xii | bun 1.4.4 | 6 | 17630975 | 1657 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| phalanx-xii | deno 2.9.8 | 6 | 17630975 | 1511 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| phalanx-xii | node 26.12.1 | 6 | 17630975 | 1601 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| ratchet | bun 1.4.4 | 12 | 14398479 | 4984 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 2.1 of 32 threads) | 3724c4d | 2026-11-03 |
| ratchet | deno 2.9.8 | 12 | 14398479 | 4456 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 2.1 of 32 threads) | 3724c4d | 2026-11-03 |
| ratchet | node 26.12.1 | 12 | 14398479 | 4964 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 2.1 of 32 threads) | 3724c4d | 2026-11-03 |
| sargon-1978 | bun 1.4.4 | 3 | 516914 | 160 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| sargon-1978 | deno 2.9.8 | 3 | 516914 | 149 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
| sargon-1978 | node 26.12.1 | 3 | 516914 | 160 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; local, idle but for light desktop and agent load (load average 1.8-1.9 of 32 threads) | 905c348 | 2026-11-03 |
