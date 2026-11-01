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
