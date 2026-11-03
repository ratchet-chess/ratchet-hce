# Ratchet, the own engine

Ratchet's own program on the core (`AGENTS.md` § Own engine). Each function's comment names the
engine or page its form follows; `params.ts` holds every tunable constant. This file holds only the
invariants that span files.

- **Score unit.** The eval and the search work in a quarter centipawn (`eval.ts` `UNITS_PER_CP`).
  The hand-seeded middlegame pawn is 400. The host sees centipawns, `searchScore` and `evaluate`
  divided by the unit, and mate scores unchanged: a mate in n plies is `MATE - n`.
- **Seeded margins.** A search constant taken from another engine is that engine's value converted
  by its middlegame pawn. After each eval retune the margins are retuned by SPSA, not reconverted.
- **Packed eval.** Material and PSQT are one i32 per piece and square, the endgame half in the high
  16 bits (`eval.ts` `S`). Each half of any sum must stay within i16.
- **Incremental state.** `state.ts` keeps the packed sum beside the core's make and unmake. The
  search reads it; `evaluate` and the tuner recompute it from `params.ts`. `test/eval-mirror.ts`
  checks that the two agree at every node and that the eval is color-symmetric.
- **TT entry.** Ten bytes, three to a 32-byte bucket: key16, move, score, raw eval, depth, and a
  flags byte of bound (2 bits), PV (1) and generation (5). Bound 0 is an empty slot. The move keeps
  the core's low 15 bits; a probe restores its flags from the board and checks it is legal. Mate
  scores are stored relative to the node.
- **Determinism.** `go(depth)` empties the TT and the histories first, so its node signature depends
  only on the build and the position. `goClock` keeps both between the moves of a game.
