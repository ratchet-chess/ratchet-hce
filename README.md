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
- **Releases share only the core:** the board, move generation and hashing. These hold no chess
  knowledge, so a release on Ratchet's bitboards plays its original's chess. Only the order in which
  moves are generated differs, and it can break ties between equal moves another way.
- **A release is tested for fidelity:** how closely it plays like its original.

`AGENTS.md` has the working rules and terms.

## Layout

- `core/`: the board, in AssemblyScript: bitboards, magic sliders, legal move generation, Zobrist hashing and perft. It compiles to `build/core.wasm`.
- `engines/`: one directory per release, each compiled with the core to `build/<release>.wasm`.
- `inventory/`: one record per release.
- `host/`: the TypeScript host: the WASM wrapper, FEN, and the UCI front end with its time limits.
- `bin/`: the UCI launcher.
- `test/`: the gates, and the 0x88 board the perft gate checks the core against.
- `bench/`: the perft benchmark.
- `tools/`: matches, ratings, the conversion suite, and readers of match PGNs and time logs.
- `docker/chess-bench/`: the image the workers play in, with every anchor build.
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
bun run build:wasm           # compile core/ to build/core.wasm; tests and benches need it
bun run typecheck
bun run test                 # the perft and incremental-state gates (`bun test` is Bun's own test runner)
bun test/perft.ts --full     # every perft depth in the suite
bun run bench:all            # perft throughput under Bun, Node and Deno
```

`bin/ratchet` is the UCI engine for a GUI or a match runner: `bin/ratchet [bun|node|deno] --release <name>`.

## Matches and ratings

The match tools play a UCI engine from a snapshot of each side, with fastchess:

- `tools/sprt.sh` and `tools/pool.ts`: an SPRT match, on one host or spread over every free host;
- `tools/calibrate.sh`: a rating on the CCRL Blitz scale, against anchor engines with published ratings;
- `tools/mate-suite.sh`: the conversion suite, KQK and KRK starts to mate;
- `tools/depth.ts` and `tools/time-rules.ts`: the mean depth of a match's PGNs, and which time rule ended each move.

Each tool's header comment documents its options. `docker/chess-bench/Dockerfile` builds every anchor.

## License

Ratchet is free software under the GNU General Public License, version 3 or any
later version. See `LICENSE`.
