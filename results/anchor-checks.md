# Anchor checks

How each anchor's published CCRL Blitz rating holds here: `tools/calibrate.sh check` plays a set of
anchors against each other, and `tools/fit-rating.ts --check` fits each against the others and
drops the one that disagrees most, until the rest agree. An anchor that agrees can rate a release;
one that is dropped should not. A check run with `CHECK=<letter>` writes its rows here, through
`tools/results.ts check`.

From check K on, a check plays no pair from one engine family, whose versions stretch toward the
newer one, and leaves out an anchor that loses over 2% of its games by a forfeit, before the drop
loop. Each such check's row also gives the slope of a free fit against CCRL: above 1, gaps here are
wider than CCRL's. Earlier rows stand as played. After check K, checks are runs of the chain in
`results/anchor-chain.md`, which also decides the trusted anchors; these verdicts stand as played.

Checks A to F were played in the retired chess-bench image, and G in the anchor tree that
replaced it. That tree plays the same moves with the same node counts for every deterministic
anchor (go depth 5 over 16 book lines). For Blunders 0.1.0, Lynx, Magog and Stash 9 and 11, which
are not deterministic, the node counts could not compare the two builds.

Check H, refitted from its games with no new play: without the 14 pairs that played on local beside
another job's node-clock units, and then without the 42 that may have, every anchor still agrees, and
no fit moves more than 7. Check J, refitted without its 34 time forfeits: the same anchors are dropped
in the same order, and lozza-8 fits 3196 ± 51.

Rows through check K hold intervals from the model's e(1-e), which ignores draws and reads wider than
the pair-level intervals `tools/fit-rating.ts` now gives; `results/anchor-chain.md` shows those.
These rows stand as played. A later check tests an anchor against its fit's interval and CCRL's errors.

| check | date | anchors | games | result | protocol |
|---|---|---|---|---|---|
| A | 2026-10-23 | missingpawn, iota, megalodon, dragontooth | 600 | consistent once Dragontooth is dropped; most of its gap is one pair, 88.5% against Iota | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| B | 2026-10-23 | dragontooth, sargon-1978-1.01b, blunders, stash-9, seblague | 1000 | consistent once Sargon, then SebLague, are dropped | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| C | 2026-10-23 | stash-9, vividmind, lynx, magog, rustic | 1000 | no consistent set; the ends fit high and the middle low | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| D | 2026-10-24 | rustic, stash-11, stash-13 | 300 | consistent | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| E | 2026-10-24 | stash-11, stash-13, stash-15.3 | 300 | consistent | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| F | 2026-10-25 | stash-15.3, crucible, cinnamon, sofcheck, stash-19 | 1000 | consistent; Cinnamon segfaulted in 3 of its 400 games | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| G | 2026-11-01 | stash-19, floyd, blunder, stash-21, velvet | 1000 | consistent; Stash 21 lost 3 of its 400 games on time | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| H | 2026-11-03 | stash-21.0, velvet-1.2.0, clovis-iii, zurichess-neuchatel, stash-25.0 | 1000 | consistent; stash-21.0 lost 3 of its 400 games on time | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| I | 2026-11-03 | zurichess-neuchatel, stash-25.0, polaris-1.8.1, texel-1.07, stash-30.0 | 1000 | consistent once texel-1.07 is dropped | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| J | 2026-11-04 | stash-30.0, lozza-8, simbelmyne-1.10.0, laser-1.7, mantissa-3.7.2, stash-37.0 | 1498 | consistent once simbelmyne-1.10.0, then stash-37.0, then laser-1.7 are dropped; lozza-8 lost 30 of its 498 games on time; mantissa-3.7.2 lost 4 of its 500 games on time; simbelmyne-1.10.0 lost 69 of its 498 games by an illegal move | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| K | 2026-11-04 | polaris-1.8.1, stash-30.0, simbelmyne-1.10.0, laser-1.7, mantissa-3.7.2, weiss-2.0, xiphos-0.6, stash-37.0 | 2700 | consistent once polaris-1.8.1, then stash-30.0 are dropped; mantissa-3.7.2 lost 4 of its 700 games on time; slope 1.26 +/- 0.08 against CCRL over 8 anchors | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |

| anchor | CCRL Blitz | fitted here (95%) | check: verdict |
|---|---|---|---|
| missingpawn-1 | 786 | 754 ± 53 | A: agrees |
| iota-1.0 | 882 | 891 ± 49 | A: agrees |
| megalodon-1.0.0 | 930 | 951 ± 51 | A: agrees |
| dragontooth-0.2 | 1047 | 1138 ± 52; 1057 ± 57 | A: dropped; B: agrees |
| sargon-1978-1.01b | 1167 | 963 ± 45 | B: dropped |
| blunders-0.1.0 | 1267 | 1305 ± 54 | B: agrees |
| stash-9.0.1 | 1271 | 1227 ± 51; 1330 ± 37 | B: agrees; C: disagrees |
| vividmind-1.1.0 | 1358 | 1346 ± 37 | C: agrees |
| seblague-0.1 | 1373 | 1249 ± 41 | B: dropped |
| lynx-0.10.0 | 1422 | 1368 ± 36 | C: disagrees |
| magog-1.0 | 1499 | 1450 ± 36 | C: disagrees |
| rustic-alpha1 | 1551 | 1628 ± 42; 1509 ± 67 | C: disagrees; D: agrees |
| stash-11.0.1 | 1687 | 1713 ± 57; 1702 ± 75 | D: agrees; E: agrees |
| stash-13.0.1 | 1968 | 1979 ± 75; 1963 ± 60 | D: agrees; E: agrees |
| stash-15.3 | 2174 | 2167 ± 70; 2173 ± 40 | E: agrees; F: agrees |
| crucible-1.0.0 | 2285 | 2280 ± 36 | F: agrees |
| cinnamon-2.4 | 2327 | 2358 ± 36 | F: agrees |
| sofcheck-0.9-beta | 2384 | 2379 ± 36 | F: agrees |
| stash-19.0 | 2474 | 2450 ± 38; 2437 ± 43 | F: agrees; G: agrees |
| floyd-0.9 | 2583 | 2599 ± 36 | G: agrees |
| blunder-8.5.5 | 2663 | 2655 ± 36 | G: agrees |
| stash-21.0 | 2714 | 2720 ± 37; 2713 ± 38 | G: agrees; H: agrees |
| velvet-1.2.0 | 2764 | 2781 ± 39; 2767 ± 36 | G: agrees; H: agrees |
| clovis-iii | 2828 | 2852 ± 35 | H: agrees |
| zurichess-neuchatel | 2919 | 2891 ± 36; 2924 ± 43 | H: agrees; I: agrees |
| stash-25.0 | 2933 | 2934 ± 37; 2922 ± 43 | H: agrees; I: agrees |
| polaris-1.8.1 | 3049 | 3025 ± 41; 2982 ± 37 | I: agrees; K: dropped |
| texel-1.07 | 3130 | 3171 ± 38 | I: dropped |
| stash-30.0 | 3153 | 3191 ± 48; 3180 ± 50; 3108 ± 35 | I: agrees; J: agrees; K: dropped |
| lozza-8 | 3205 | 3184 ± 50 | J: agrees |
| simbelmyne-1.10.0 | 3239 | 3179 ± 33; 3226 ± 32 | J: dropped; K: agrees |
| laser-1.7 | 3292 | 3358 ± 43; 3286 ± 31 | J: dropped; K: agrees |
| mantissa-3.7.2 | 3311 | 3305 ± 51; 3320 ± 31 | J: agrees; K: agrees |
| weiss-2.0 | 3318 | 3318 ± 31 | K: agrees |
| xiphos-0.6 | 3354 | 3345 ± 31 | K: agrees |
| stash-37.0 | 3418 | 3468 ± 42; 3439 ± 33 | J: dropped; K: agrees |
