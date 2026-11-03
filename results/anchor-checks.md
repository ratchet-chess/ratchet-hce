# Anchor checks

How each anchor's published CCRL Blitz rating holds here: `tools/calibrate.sh check` plays a set of
anchors against each other, and `tools/fit-rating.ts --check` fits each against the others and
drops the one that disagrees most, until the rest agree. An anchor that agrees can rate a release;
one that is dropped should not. A check run with `CHECK=<letter>` writes its rows here, through
`tools/results.ts check`.

Checks A to F were played in the retired chess-bench image, and G in the anchor tree that
replaced it. That tree plays the same moves with the same node counts for every deterministic
anchor (go depth 5 over 16 book lines). For Blunders 0.1.0, Lynx, Magog and Stash 9 and 11, which
are not deterministic, the node counts could not compare the two builds.

| check | date | anchors | games | result | protocol |
|---|---|---|---|---|---|
| A | 2026-10-23 | missingpawn, iota, megalodon, dragontooth | 600 | consistent once Dragontooth is dropped; most of its gap is one pair, 88.5% against Iota | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| B | 2026-10-23 | dragontooth, sargon-1978-1.01b, blunders, stash-9, seblague | 1000 | consistent once Sargon, then SebLague, are dropped | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| C | 2026-10-23 | stash-9, vividmind, lynx, magog, rustic | 1000 | no consistent set; the ends fit high and the middle low | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| D | 2026-10-24 | rustic, stash-11, stash-13 | 300 | consistent | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| E | 2026-10-24 | stash-11, stash-13, stash-15.3 | 300 | consistent | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| F | 2026-10-25 | stash-15.3, crucible, cinnamon, sofcheck, stash-19 | 1000 | consistent; Cinnamon segfaulted in 3 of its 400 games | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |
| G | 2026-11-01 | stash-19, floyd, blunder, stash-21, velvet | 1000 | consistent; Stash 21 lost 3 of its 400 games on time | 53+0.44, Hash 128, 8moves_v3, draw adjudication, no resign |

| anchor | CCRL Blitz | fitted here (95%) | check: verdict |
|---|---|---|---|
| missingpawn-1 | 786 | 754 ± 53 | A: agrees |
| iota-1.0 | 882 | 891 ± 49 | A: agrees |
| megalodon-1.0.0 | 930 | 951 ± 51 | A: agrees |
| dragontooth-0.2 | 1047 | 1138 ± 52; 1057 ± 57 | A: dropped; B: agrees |
| sargon-1978-1.01b | 1167 | 963 ± 45 | B: dropped |
| blunders-0.1.0 | 1267 | 1305 ± 54 | B: agrees |
| stash-9.0.1 | 1271 | 1227 ± 51; 1330 ± 37 | B: agrees; C: disagrees |
| seblague-0.1 | 1373 | 1249 ± 41 | B: dropped |
| vividmind-1.1.0 | 1358 | 1346 ± 37 | C: agrees |
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
| stash-21.0 | 2714 | 2720 ± 37 | G: agrees |
| velvet-1.2.0 | 2764 | 2781 ± 39 | G: agrees |
