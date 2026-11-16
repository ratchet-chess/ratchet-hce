# Ratchet

Ratchet is a collection of historical chess programs, each rebuilt as it stood at one dated version
or event: a **release**. A release with surviving code is a port of it; one known only from papers
and descriptions is a reconstruction. Each is tested against its original, and the match tools
measure the distance between releases. Taken in order, the releases are the history of computer
chess.

Iterative Deepening, an open edutainment incremental game, plays through the same history. Each
engine there is a release here.

## How a release is built

- **The inventory comes first.** Each release has a record in `inventory/`. It holds:
  - the release's date and its receipt;
  - where its source is, and under which license;
  - every mechanism it has, in search, eval, move ordering, tables and time use, with its constants;
  - what each mechanism depends on.
- **A release owns everything above the board.** Its search, eval and time use are its own, tuned
  as its authors tuned them.
- **A release keeps its original's board when its play depends on it.** Move order breaks ties
  between equal moves, and some programs read their own list orders and memory layout. Sargon
  (1978) keeps its 10x12 board and its byte tables.
- **The core is the shared board:** Ratchet's bitboards, move generation and hashing. It referees
  every game for the host, checks each release's own move generator by perft, and is the board of
  each release built on it.
- **A release is tested for fidelity:** how closely it plays like its original. The original runs in
  a runner container (`tools/ws.ts`), and the release must play its moves.

`AGENTS.md` has the working rules and terms.

## Layout

- `core/`: the board, in AssemblyScript: bitboards, magic sliders, legal move generation, Zobrist hashing and perft. It compiles to `build/core.wasm`. It also holds the WASI build's UCI front end (`uci.ts`, `wasi.ts`) and the calls a release makes to its host (`host.ts`).
- `engines/`: one directory per release, each compiled with the core to `build/<release>.wasm`, with its fidelity reference; and `engines/ratchet/`, the own engine, Ratchet's own program on the core.
- `inventory/`: one record per release.
- `results/`: measured results that change as protocols change, such as ratings, anchor checks and timings; the tools write their rows.
- `host/`: the TypeScript host: the WASM wrapper, FEN, and the UCI front end, which passes each `go`'s limits and a clock to the release. `host/wasi/` runs a WASI build, Ratchet's or another engine's: the seven WASI calls a build may rely on, fixed answers for the rest of preview 1, and stdin fed through a ring in shared memory.
- `bin/`: the UCI launcher.
- `web/`: a browser page to play a release or the own engine, or to watch two play, on a real clock or a node budget, on a chessground board. Each engine searches in a Web Worker, and the core referees.
- `test/`: the gates: perft, incremental state, each release's own move generator, the own engine's eval mirror and its window gate; and the 0x88 board the perft gate checks the core against.
- `bench/`: the perft benchmark, the search benchmark over the releases' shared position set, and the own engine's eval benchmark.
- `helper/`: the poll helper that another engine links to become a WASI build, in C, Rust and Go: its search runs on the UCI thread and reads its input through the helper.
- `tools/`: fidelity checks, matches, ratings, the conversion suite, and readers of match PGNs and time logs.
- `flake.nix` and `nix/`: the containers. The runner plays matches on the workers; the local runner plays them on the host and builds the anchor tree (`nix/anchors.sh`); the workspace is for work on originals. `tools/ws.ts` builds, loads and runs them. `nix/anchor-tree` and `nix/syzygy` pin the anchor tree and the Syzygy tables in the Nix store.
- `vendor/fastchess/`: the match runner, as a submodule.

## Build and test

Bun installs the dependencies and runs every script, test and tool. The TypeScript runs without a
build step, so it also runs under Node's type stripping. Only the WASM builds and fastchess need a
build.

```sh
bun install                  # dev dependencies
git submodule update --init  # fetch fastchess
make -C vendor/fastchess     # build it
tools/fetch-book.sh          # opening books for matches, into books/
bun run build:wasm           # compile the core and every release into build/; tests and benches need it
bun run typecheck
bun run test                 # the perft, incremental-state, release-generator, eval-mirror and window gates (`bun test` is Bun's own test runner)
bun test/perft.ts --full     # every perft depth in the suite
bun test/window.ts --depth 6 # the own engine's window gate deeper than `bun run test` runs it
bun run bench:all            # perft throughput under Bun, Node and Deno
bun run bench:search:all     # each engine's node signature and search speed under Bun, Node and Deno
bun bench/search.ts --engine ratchet --against <ref>  # the build's SPEED over the same engine built from <ref>, for tools/pool.ts
bun bench/eval.ts --against <ref>  # the eval alone in ns per call, read in seconds, for a speed edit to the own engine
bun run web  # the play page: rebuilds any stale wasm, builds web/dist/, serves http://127.0.0.1:8080/
```

`bin/ratchet` is the UCI engine for a GUI or a match runner: `bin/ratchet [bun|node|deno] --release <name>`.

A release with an `engines/<release>/wasi.ts` also builds to `build/wasi/<release>.wasm`, its WASI build: a WASI
preview-1 module with the UCI front end inside, which speaks UCI on stdin and stdout (UCI over WASI). Its `bench`
prints the build's node signature, which equals the tool build's:

```sh
bun host/wasi/main.ts build/wasi/ratchet.wasm             # UCI on stdin and stdout, under Bun or Node
bun host/wasi/main.ts build/wasi/ratchet.wasm bench       # the node signature over bench/positions.txt
bun tools/package.ts --release ratchet                    # dist/: the .wasm, the browser Worker, native builds, Bun executables
bun tools/wasi-check.ts build/wasi/ratchet.wasm           # a WASI build's handling of input during a search
```

## Fidelity

- `tools/positions.ts`: a fixed position set, drawn from the opening books;
- `tools/reference.ts`: runs an original over a position set inside a runner container, and records each depth's move and node count, and the search's time;
- `tools/fidelity.ts`: checks a release against that reference, and against published games its original played. Over a timed reference it also compares the two speeds, for `results/speed.md`.

Each release keeps its reference in `engines/<release>/fidelity/`.

## Matches and ratings

The match tools play releases with fastchess, each side from a snapshot of its commit. A player is `[ref:]release[@level]` (`tools/player.sh`), such as `phalanx-xii` or `HEAD:sargon-1978@3`:

- `tools/pool.ts`: an SPRT match, or a race of several candidates, over the hosts HOSTS names. Every run has a row in the run index, `<archive>/sprt/index.md`, which `tools/runs.ts` reads, and a run takes its openings from seeds no earlier run played;
- `tools/calibrate.sh`: a rating on the CCRL Blitz scale, against anchor engines with published ratings;
- `tools/mate-suite.sh`: the conversion suite, KQK and KRK starts to mate;
- `tools/player-perft.ts`: an external player's perft counts against the core's, on the hosts it plays on;
- `tools/depth.ts`: the mean depth of a match's PGNs.
- `tools/similarity.ts`: how often engines choose the same move over one position set, for `results/similarity.md`.
- `tools/host-speed.ts`: each host's speed at game load, for the pinned ratios that scale a worker's time control, in `results/host-speed.md`.
- `tools/speed-read.ts`: a `SPEED` read on one host, through the queue, so the other hosts keep playing; two external players are read through their own benchmark;
- `tools/admit.ts`: the admission chain of one own-engine change in one command: the `SPEED` read, the conversion suite and the SPRT, with one summary;
- `tools/browser-bench.ts`: an engine's speed in real browsers by hash size, its cold start, and what each browser offers an engine, in `results/browser.md`. It runs under an exclusive allocation on this host, or as an exclusive unit on a worker in the `browser` image.
- `tools/spsa.ts`: an SPSA tune of a map's constants, in one queue job, or with `--screen` a factorial screen of flags, which reads each flag's effect and, against a random opponent mix, each pair's; `tools/texel/main.ts write` puts a tune's values in the engine for an SPRT;
- `tools/queue.ts`: the CPU manager's queue, which hands every host its units in priority order and drains a host for a priority job. The manager (`tools/queue/manager.ts`) runs in a container on this host, and an agent on each host (`tools/queue/agent.ts`) claims units and runs them. `tools/pool.ts` and `tools/calibrate.sh` submit their games there; Texel and benchmarks run on this host under an allocation (`queue.ts alloc`), which keeps the queue's units off it.

Each tool's header comment documents its options. `nix/anchors.sh` builds every anchor, and `tools/anchors.ts` lists them with their CCRL ratings.

## License

Ratchet is free software under the GNU General Public License, version 3 or any
later version. See `LICENSE`.
