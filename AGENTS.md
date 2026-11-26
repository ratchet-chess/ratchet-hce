# Agent instructions

`README.md` describes the engine for its users. This file has the terms, the layout and the working rules. Where
another text disagrees with this file, one of them is stale; correct it. A user decision newer than this file
holds until this file records it.

This repo is the own engine's hand-written eval line. It was copied from ratchet at version 0.3.15, and ratchet
is the line that gets a net.

The user's decisions and the work's state are kept outside this repo. If the session's instructions do not say
where, ask the user.

## Terms

The rows for **own engine**, **core** and **node signature** quote ratchet's `AGENTS.md`.
The rows for **feature** and **implementation** quote ratchet-historical's.
The rows for **`SPEED`**, **conversion suite**, **player**, **tree** and **tuning build** quote ratchet-bench's.
The row for **WASI build** quotes uci-over-wasi's.

| term | meaning | not |
|---|---|---|
| **own engine** | Ratchet's own program, `engines/ratchet/`: Ratchet's code on the core, with no original | release, variant |
| **core** | the shared board code in `core/`: board, move generation, hashing, perft | base, engine |
| **node signature** | a build's total node count over a fixed position set | bench, node count |
| **WASI build** | a WASI preview-1 command module that speaks UCI on stdin and stdout, as UCI over WASI states; the spec calls it a module | |
| **feature** | a technique, named by its Chess Programming Wiki page, or by a page and section as `Page#Section` where one page covers several | mechanism |
| **implementation** | one engine's version of a feature: what it scores or decides, and under which conditions | shape |
| **`SPEED`** | a candidate's search speed over a base's, which scales its node budget in a match | speed ratio |
| **conversion suite** | `tools/mate-suite.sh`: KQK and KRK starts to mate | mate test |
| **player** | one name that a tree's `PLAYER` lists, as a match plays it: by ref, `[<ref>:][<name>][@<level>]`, or by tree, `tree:<tree>[:<name>][@<level>]` | external player |
| **tree** | one built commit in the code export, which the runners mount | snapshot |
| **tuning build** | a build that takes its tuned values as UCI options, published as a tree with `tunables.json` | |

## Layout

- `core/`: the board, in AssemblyScript: bitboards, magic sliders, legal move generation, Zobrist hashing and perft. It also holds the WASI build's UCI front end (`uci.ts`, `wasi.ts`) and the calls an engine makes to its host (`host.ts`).
- `engines/ratchet/`: the own engine. Its `README.md` holds the invariants that span its files. `SOURCES.md` maps its citations to their public sources, and `FEATURES.md` lists its features' dated implementations.
- `host/`: the TypeScript host: the wasm wrapper, FEN, and the UCI front end for a tuning build (`host/uci/`). `host/wasi/native.c` is the WASI build's native host.
- `vendor/uci-over-wasi/`: a copy of uci-over-wasi's host, which runs a WASI build under Bun or Node and in a browser Worker. Its `README.md` names the commit. Fix the host in uci-over-wasi, never in the copy.
- `bin/`: `ratchet`, the UCI launcher, and `engine`, the tree's launcher.
- `test/`: the gates: perft, incremental state, the eval mirror, the window gate and the WASI build's node signature. `test/boards/` holds the boards the perft gate checks the core against.
- `bench/`: the perft benchmark, the search benchmark, which prints the node signature, and the eval benchmark.
- `tools/`: the build, the tree's build, the packages, the Texel tuner (`tools/texel/`), the citation check and the PGN reader. Each tool's header comment states its options.
- `results/`: the tables the tools write.

```sh
bun install
bun run build:wasm            # the core and the own engine into build/, and the WASI build into build/wasi/
bun run typecheck
bun run test                  # the gates (`bun test` is Bun's own test runner)
bun test/perft.ts --full      # every perft depth in the suite
bun test/window.ts --depth 6  # the window gate deeper than `bun run test` runs it
bun run bench:search          # the node signature and the search speed under Bun (`bench:search:all` adds Node and Deno)
bun tools/citations.ts        # the citations that `engines/ratchet/SOURCES.md` does not resolve
bun tools/package.ts          # dist/: the .wasm, the browser Worker, native builds and Bun executables
```

## Own engine

- **The browser is the target, and the CCRL Blitz rating is the ruler.** The target sets the engine's limits: one thread, a wasm build, the hash a page can hold, and a cold start. A change is judged by matches on the testing platform. Browser measurements check that the limits still hold. Do not tune toward the rating itself.
- **The own engine is written in Ratchet's own code.** Ideas come from anywhere; code is not ported.
- **Cite the implementation each function follows** in its comment: the engine, paper or page.
- **Name the features a citing comment's code implements,** as `Feature: Delta_Pruning.` `engines/ratchet/FEATURES.md` lists each feature's dated implementations, and `bun tools/citations.ts --write` writes its "Used in" lines.
- **Read a feature's Chess Programming Wiki page and two other engines before choosing its implementation.** Its comment names the implementation it rejected.
- **Take ideas only from an engine that has no license.** Take no constant and no table from it.
- **Its version is a constant that `id name` reports.** Bumping the minor or patch version is the developer's call. A rated version gets the tag `v<version>`, at the commit that was rated.
- **Pass this repo's gates (`bun run test`) and the conversion suite.** A search change passes the window gate (`test/window.ts`).
- **A change that keeps the node signature is a speed change.** Read it on Bun and Node on one quiet host, with the testing platform's speed read.
- **A change that alters the node signature has no one `SPEED`.** Its ratio depends on the tables' state and on the positions. The admission chain reads it through the launcher at `SPEED_DEPTH`, and the match reports its own `SPEED` from its games as the check.
- **Any other change is admitted by SPRT against its parent.** Start with cheap tests, and go longer or deeper only when a result needs it.
- **A read without games gives a search form's size and cost, not its sign.** Do not predict a gain from error counts, fixed-depth nodes, or depth at equal nodes.
- **Before proposing an admission chain, check how many events the form touches.** If the count is too small for a chain to resolve, say so before any games.

## Tuning

- **A game tune plays a real clock scaled per host,** `MODE=scaled` of the testing platform's `tools/spsa.ts`. A node clock hides a value that makes a node slower.
- **A tune's proof is its SPRT against main,** on the node clock.
- **A tune and its proof play one clock,** the long rung's nodes a game.
- **A tune keeps one set of values and grows it.** A value leaves the set when a test of that value fails.
- **Test a new form alone against main first.** Once it is admitted, its values join the next tune's set.
- **A form that failed alone may go inside a tune of the whole set,** one form per tune. The tune's proof judges it.
- **Remove a form's avoidable code cost before its test.**
- **Size a tune by its total games.** A value's resolution follows the total, whatever the count of values.
- **Write tuned values into the engine itself,** as a commit.
- **Agree a tune's map, its game count and its clock with the user before it starts.**

## Testing a change

- **The testing platform is ratchet-bench.** Its queue plays the matches, the conversion suite and the rating runs.
- **This repo builds its own tree.** `tools/tree.sh` builds a ref's files, and `bin/engine` is the tree's launcher. Change how the engine is built or started in those two files, not in ratchet-bench.
- **Start a match tool from this repo's worktree.** The platform then builds a player by ref, such as `HEAD:ratchet-hce` or `worktree:ratchet-hce`.
- **`BENCH` in the gitignored `tools/local.env` names the testing platform's checkout.** The admission chain is `SPEED_DEPTH=16 bun <BENCH>/tools/admit.ts <parent-ref> [candidate-ref]`.
- **`SPEED_DEPTH` is the depth at which a search has about the nodes of a game's move.** 16 is the long rung's, 24+0.24. Read it again when the rung or the search's depth changes.
- **A rung's hash keeps the table pressure of the UCI default at the browser target,** 128 MB at the target's nodes a move. So 6+0.06 plays HASH 16, 24+0.24 HASH 32, and 60+0.6 and the rating runs HASH 128. A new rung scales by its nodes a move.
- **`bench` and a fresh `go(depth)` keep a 16 MB table,** so the node signature and the speed reads stay comparable.
- **A match tool writes its rows to this worktree's `results/`,** and keeps its run state in `tmp/`. Each row names its protocol, so a protocol change shows which rows are old. Docs hold decisions and invariants.
- **Research notes and scripts are off-tree,** in the store that `ARTIFACTS` in `tools/local.env` names. Records cite it as `<artifacts>`.

## Engineering rules

- **Correctness comes before speed.** A speed number counts only after `bun test/perft.ts --full` passes. Run it for any change to move generation or `make`/`unmake`.
- **A change to the core keeps the own engine's node signature.** Otherwise its commit says why the signature changes.
- **Write no hand-picked unit tests.** The gates and the matches judge a change.
- **Keep hot paths allocation-free,** with preallocated per-ply buffers.
- **Use erasable TypeScript only.** No `enum`, `namespace` or parameter properties, because Node runs the source through type stripping.
