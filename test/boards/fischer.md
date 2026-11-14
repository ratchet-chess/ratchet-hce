# fischer.epd

Chess960 perft positions: one position from each of the 960 starts, with leaf counts to depth 6, in Shredder-FEN.
It is Andrew Grant's `src/perft/fischer.epd` from Ethereal (GPL-3.0), unchanged, copied from commit
`0e47e9b67f345c75eb965d9fb3e2493b6a11d09a` of https://github.com/AndyGrant/Ethereal. The Chess Programming Wiki's
`Chess960_Perft_Results` page lists the same set. `test/perft.ts` reads it through `test/boards/fischer.ts`.
