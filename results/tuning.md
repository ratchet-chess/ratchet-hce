# Tuning

Texel tuning runs (`tools/texel/main.ts tune`), one row per subject and protocol. A run fits K at the
subject's defaults, then moves its tuned elements by the optimizer the protocol names, rounds them to
the subject's storage, and scores the result through the subject itself. The testing platform,
ratchet-bench, writes the row with its `tools/results.ts tuning`.

- **train** and **valid** are the mean squared error of σ(K·score) against the game results, on the
  training positions and on the held-out validation positions (a hash split of the dataset).
- **before** is the subject at its defaults. **after** is the subject at the rounded tuned values,
  scored by the subject itself. **valid after (linear)** is what the trace predicted for the same
  values; its distance from **valid after** is how far the subject's eval is from linear in its
  elements.
- **tuned** counts the elements the run moved freely; **changed**, those that ended off their default.
- **protocol** names the dataset, the optimizer and its settings, and the trace.

| subject | K | train before | train after | valid before | valid after | valid after (linear) | tuned | changed | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ratchet | 1.022 | 0.10116 | 0.10067 | 0.10143 | 0.10096 | 0.10096 | 1425 | 1415 | da2-uho102k-cw5-20261121; K held; hold TEMPO_,SAFETY_; adam α 0.5 cosine, at most 1200 epochs, patience 1200; trace Δ ×4, tol 2 cp; touched ≥ 100 | b66d745 | 2026-11-22 |
| ratchet | 1.436 | 0.06477 | 0.05911 | 0.06503 | 0.05958 | 0.05963 | 860 | 857 | zurichess-own-20261103; adam α 0.1, at most 2000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 7422bf2 | 2026-11-04 |
| ratchet | 1.151 | 0.05322 | 0.05307 | 0.05366 | 0.05356 | 0.05358 | 1513 | 1498 | zurichess-own-20261103; adam α 0.1, at most 3000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 446d004 | 2026-11-04 |
| ratchet | 1.166 | 0.06011 | 0.05322 | 0.06047 | 0.05366 | 0.05376 | 1514 | 1508 | zurichess-own-20261103; adam α 0.1, at most 6000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 446d004 | 2026-11-04 |
| ratchet | 1.151 | 0.05366 | 0.05362 | 0.05425 | 0.05421 | 0.05423 | 1477 | 1440 | zurichess-own-20261103; K held; adam α 0.1, at most 3000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | ba69c5b | 2026-11-05 |
| ratchet | 1.151 | 0.05410 | 0.05366 | 0.05471 | 0.05425 | 0.05390 | 1478 | 1439 | zurichess-own-20261103; K held; adam α 0.1, at most 6000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 40f5711 | 2026-11-05 |
| ratchet | 1.151 | 0.05412 | 0.05358 | 0.05466 | 0.05416 |  | 10 | 10 | zurichess-own-20261103; K held; local over the adapter, at most 30 passes, steps grow to ×16 | f906c7e | 2026-11-12 |
| ratchet | 1.506 | 0.06631 | 0.06011 | 0.06662 | 0.06066 | 0.06067 | 748 | 746 | zurichess-quiet.resolved; adam α 0.1, at most 2000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 9e38450 | 2026-11-03 |
