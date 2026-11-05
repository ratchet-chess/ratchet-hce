# Browser

An engine's search speed in real browsers, and what each browser offers an engine.
`tools/browser-bench.ts` measures both, and `tools/results.ts browser` writes the rows. Bun and Node
run the same passes beside the browsers. The tool stops if a browser's node signature differs from
Bun's, so the speeds in one set of rows are of the same searches.

- **passes:** `fresh` is a fresh `go(depth)` per position, as in `results/runtimes.md`. `kept` plays
  the set as one game with its tables kept, so the transposition table fills as it does in play.
- **knodes/s** is the median over rounds of each round's median timed pass; **range** is the
  rounds' lowest and highest.
- **cold knodes/s** is a new instance's first pass, when its code has not been optimized.
- **first searches, cold over warm** is how many times longer the set's first searches took cold
  than warm. A page's first moves pay this.
- **largest memory** is what one instance could grow to, tried in 256 MB steps.

| browser | isolated | SIMD | relaxed SIMD | threads | tail calls | memory64 | largest memory, MB | clock step, us | commit | date |
|---|---|---|---|---|---|---|---|---|---|---|

| engine | runtime | passes | hash, MB | depth | node signature | knodes/s | range | cold knodes/s | first searches, cold over warm | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
