# Ratchet

Ratchet is a collection of historical chess programs, each rebuilt as it stood at one dated version
or event: a **release**. A release with surviving code is a port of it; one known only from papers
and descriptions is a reconstruction. Each is tested against its original, and the match tools
measure the distance between releases. Taken in order, the releases are the history of computer
chess.

Holy-hell, an open edutainment incremental game, plays through the same history. Each engine there
is a release here.

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
  the chess-bench image, and the release must play its moves.

`AGENTS.md` has the working rules and terms.

## Layout

- `core/`: the board, in AssemblyScript: bitboards, magic sliders, legal move generation, Zobrist hashing and perft. It compiles to `build/core.wasm`.
- `engines/`: one directory per release, each compiled with the core to `build/<release>.wasm`, with its fidelity reference.
- `inventory/`: one record per release.
- `host/`: the TypeScript host: the WASM wrapper, FEN, and the UCI front end with its time limits.
- `bin/`: the UCI launcher.
- `test/`: the gates: perft, incremental state, and each release's own move generator; and the 0x88 board the perft gate checks the core against.
- `bench/`: the perft benchmark.
- `tools/`: fidelity checks, matches, ratings, the conversion suite, and readers of match PGNs and time logs.
- `flake.nix` and `nix/`: the containers. The runner plays matches on the workers; the local runner plays them on the host and builds the anchor tree (`nix/anchors.sh`); the workspace is for work on originals. `tools/ws.ts` builds, loads and runs them.
- `docker/chess-bench/`: the image the workers play in, with every anchor build, until the runner reproduces its references and anchor checks.
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
bun run test                 # the perft, incremental-state and release-generator gates (`bun test` is Bun's own test runner)
bun test/perft.ts --full     # every perft depth in the suite
bun run bench:all            # perft throughput under Bun, Node and Deno
```

`bin/ratchet` is the UCI engine for a GUI or a match runner: `bin/ratchet [bun|node|deno] --release <name>`.

## Fidelity

- `tools/positions.ts`: a fixed position set, drawn from the opening books;
- `tools/reference.ts`: runs an original over a position set inside the chess-bench image, and records each depth's move and node count;
- `tools/fidelity.ts`: checks a release against that reference, and against published games its original played.

Each release keeps its reference in `engines/<release>/fidelity/`.

## Matches and ratings

The match tools play a UCI engine from a snapshot of each side, with fastchess:

- `tools/sprt.sh` and `tools/pool.ts`: an SPRT match, on one host or spread over every free host;
- `tools/calibrate.sh`: a rating on the CCRL Blitz scale, against anchor engines with published ratings;
- `tools/mate-suite.sh`: the conversion suite, KQK and KRK starts to mate;
- `tools/depth.ts` and `tools/time-rules.ts`: the mean depth of a match's PGNs, and which time rule ended each move.

Each tool's header comment documents its options. `docker/chess-bench/Dockerfile` builds every anchor, and `nix/anchors.sh` ports its recipes to the local runner.

## License

Ratchet is free software under the GNU General Public License, version 3 or any
later version. See `LICENSE`.
