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
| chrome 156.0.0.0 | yes | yes | yes | yes | yes | yes | 3840 | 5 | e1beea5 | 2026-11-05 |
| firefox 159.0 | yes | yes | yes | yes | yes | yes | 3840 | 20 | e1beea5 | 2026-11-05 |

| engine | runtime | passes | hash, MB | depth | node signature | knodes/s | range | cold knodes/s | first searches, cold over warm | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ratchet | bun 1.4.2 | fresh | default | 11 | 7817894 | 1461 | 1460 to 1461 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | bun 1.4.2 | kept | 4 | 11 | 5804094 | 1433 | 1430 to 1435 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | bun 1.4.2 | kept | 16 | 11 | 6108946 | 1363 | 1357 to 1369 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | bun 1.4.2 | kept | 128 | 11 | 6048239 | 1350 | 1346 to 1354 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | chrome 156.0.0.0 | fresh | default | 11 | 7817894 | 1401 | 1398 to 1404 | 1392 | 1.06 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | chrome 156.0.0.0 | kept | 4 | 11 | 5804094 | 1381 | 1377 to 1385 | 1378 | 1.06 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | chrome 156.0.0.0 | kept | 16 | 11 | 6108946 | 1320 | 1315 to 1325 | 1303 | 1.04 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | chrome 156.0.0.0 | kept | 128 | 11 | 6048239 | 1302 | 1301 to 1302 | 1292 | 1.05 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | firefox 159.0 | fresh | default | 11 | 7817894 | 1359 | 1358 to 1359 | 1323 | 1.13 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | firefox 159.0 | kept | 4 | 11 | 5804094 | 1351 | 1346 to 1357 | 1345 | 1.04 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | firefox 159.0 | kept | 16 | 11 | 6108946 | 1295 | 1293 to 1298 | 1288 | 1.03 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | firefox 159.0 | kept | 128 | 11 | 6048239 | 1277 | 1277 to 1278 | 1274 | 1.03 | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | node 24.21.0 | fresh | default | 11 | 7817894 | 1426 | 1425 to 1426 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | node 24.21.0 | kept | 4 | 11 | 5804094 | 1402 | 1394 to 1409 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | node 24.21.0 | kept | 16 | 11 | 6108946 | 1338 | 1334 to 1342 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
| ratchet | node 24.21.0 | kept | 128 | 11 | 6048239 | 1299 | 1285 to 1313 |  |  | worker1, depth 11, 96 positions, repeat 2, rounds 2 | e1beea5 | 2026-11-05 |
