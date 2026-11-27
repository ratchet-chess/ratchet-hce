# Runtimes

Each engine's search speed under each runtime, over the same searches. `bench/search.ts` runs a
fresh `go(depth)` from every position of `bench/positions.txt`, the set the releases' references
use, and ratchet-bench's `tools/results.ts runtimes` writes its rows. Runtime rankings differ by
workload and by engine, so every engine is measured under Bun, Node and Deno.

- **node signature** is the engine's total node count over the set at that depth. It is equal
  under every runtime, or the writer refuses the run, so the speeds in one engine's rows are of
  the same searches.
- **knodes/s** is the median of the timed passes, in thousands of nodes per second.
- **protocol** names the passes, the host and the load during the run. Rows under different
  protocols do not compare.

| engine | runtime | depth | node signature | knodes/s | protocol | commit | date |
|---|---|---|---|---|---|---|---|
| ratchet | bun 1.4.4 | 12 | 15048273 | 2257 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; quiet desktop | 958d6c0 | 2026-11-27 |
| ratchet | deno 2.9.8 | 12 | 15048273 | 2106 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; quiet desktop | 958d6c0 | 2026-11-27 |
| ratchet | node 26.12.1 | 12 | 15048273 | 2322 | bench/positions.txt, a fresh go(depth) per position, median of 3 timed passes after a warm-up; quiet desktop | 958d6c0 | 2026-11-27 |
