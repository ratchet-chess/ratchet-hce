# Tuning

Texel tuning runs (`tools/texel/main.ts tune`), one row per subject and protocol. A run fits K at the
subject's defaults, then moves its tuned elements by the optimizer the protocol names, rounds them to
the subject's storage, and scores the result through the subject itself. `tools/results.ts tuning`
writes the row.

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
| chess-4.6 | 1.051 | 0.15556 | 0.15197 | 0.15467 | 0.15101 | 0.15145 | 60 | 58 | chess-4.6-selfplay-d5.resolved; adam α 0.1, at most 2000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 556a237 | 2026-11-02 |
| chess-4.6 | 1.154 | 0.13015 | 0.12516 | 0.13070 | 0.12616 |  | 61 | 59 | schaigorodsky-before-1978.resolved, sample 250‰; local over the adapter, at most 8 passes | 81e962d | 2026-11-02 |
| chess-4.6 | 1.154 | 0.13015 | 0.12395 | 0.13070 | 0.12497 |  | 61 | 56 | schaigorodsky-before-1978.resolved, sample 250‰; local over the adapter, at most 8 passes, from chess-4.6-2026-11-02T19-29-12-448Z.values.json | 81e962d | 2026-11-03 |
| chess-4.6 | 1.156 | 0.12999 | 0.13016 | 0.13123 | 0.13104 | 0.12595 | 60 | 58 | schaigorodsky-before-1978.resolved; adam α 0.1, at most 2000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 556a237 | 2026-11-02 |
| chess-4.6 | 1.156 | 0.12999 | 0.12518 | 0.13123 | 0.12631 |  | 61 | 59 | schaigorodsky-before-1978.resolved; local over the adapter, at most 0 passes, from chess-4.6-2026-11-02T19-29-12-448Z.values.json | 81e962d | 2026-11-02 |
| chess-4.6 | 1.156 | 0.12999 | 0.12404 | 0.13123 | 0.12523 |  | 61 | 56 | schaigorodsky-before-1978.resolved; local over the adapter, at most 0 passes, from chess-4.6-2026-11-02T21-42-55-582Z.values.json | 81e962d | 2026-11-03 |
| chess-4.6 | 1.331 | 0.05186 | 0.04839 | 0.05713 | 0.05308 | 0.05392 | 62 | 61 | zurichess-quiet.resolved, first 20000; adam α 0.1, at most 2000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 1410157 | 2026-11-01 |
| chess-4.6 | 1.399 | 0.05043 | 0.04911 | 0.05946 | 0.05797 |  | 65 | 44 | zurichess-quiet.resolved, first 5000; local over the adapter, at most 1 passes | 1410157 | 2026-11-01 |
| chess-4.6 | 1.332 | 0.05165 | 0.04832 | 0.05165 | 0.04831 | 0.04828 | 60 | 59 | zurichess-quiet.resolved; adam α 0.1, at most 2000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 4c547a8 | 2026-11-02 |
| phalanx-xii | 1.427 | 0.06025 | 0.05658 | 0.06043 | 0.05831 | 0.05798 | 482 | 472 | zurichess-quiet.resolved, first 100000; adam α 0.1, at most 2000 epochs, patience 100; trace Δ ×4, tol 2 cp; touched ≥ 100 | 1410157 | 2026-11-01 |
| phalanx-xii | 1.427 | 0.06025 | 0.05863 | 0.06043 | 0.05957 | 0.05942 | 482 | 467 | zurichess-quiet.resolved, first 100000; local over the trace, at most 5 passes; trace Δ ×4, tol 2 cp; touched ≥ 100 | 1410157 | 2026-11-01 |
