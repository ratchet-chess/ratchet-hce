# Ratchet HCE

**Ratchet HCE** is a UCI chess engine built for the browser, with a hand-written eval. It is one WebAssembly
module, written in AssemblyScript. The aim is the strongest engine a web page can run, and the CCRL Blitz rating
is the ruler.

It is the hand-written eval line of Ratchet. It was copied from `ratchet` at version 0.3.15, and it is developed
as its own engine. `ratchet` is the line that gets a net.

Ratchet HCE is developed with AI coding agents throughout. The user directs the work. The agents write the code,
run the tests and keep the records. These rules decide where the engine's knowledge comes from:

* **Sources are read first:** before an agent writes a feature, it reads the feature's page on the
  [Chess Programming Wiki](https://www.chessprogramming.org). It also reads the code of two other engines.
* **Every function cites its origin:** its comment names the form it follows and the form it rejected, by engine,
  revision and symbol. `engines/ratchet/SOURCES.md` maps each revision to an exact commit, and
  `engines/ratchet/FEATURES.md` indexes every feature's dated implementations and where they are used.
* **No code is ported:** the engine's code is its own, in its own structure.
* **Some constants started elsewhere:** a search constant may start from a cited engine's value, scaled to
  the engine's units. SPSA then tunes it on the engine's own games.

`AGENTS.md` holds these rules and the others the agents work under.

The language models that do the work were trained on this literature, and probably on public engine code too.
These rules cannot undo that. They govern what an agent reads while it works, and what the code must cite.

**The name:** Ratchet started as the strength-building side project of Iterative Deepening, an open edutainment
incremental game that walks through the history of chess engines. HCE is short for hand-crafted evaluation, the
field's name for an eval written by hand.

**Play online:** [ratchetchess.com](https://ratchetchess.com/) runs Ratchet HCE and adapted WASI chess engines
directly in your browser.

**Status:** `results/ratings.md` has the rating of each rated version, and the tag `v<version>` marks its commit.
The versions up to 0.3.15 are Ratchet's, from before the copy.

**License:** Ratchet HCE is free software under the GNU General Public License, version 3 or any later version. See
`LICENSE`.

## Download

Prebuilt releases are published on [GitHub Releases](https://github.com/ratchet-chess/ratchet-hce/releases).
`tools/package.ts` builds these files for one version:

| File | For |
|---|---|
| `ratchetHCE-X.Y.Z.wasm` | Any WASI host. This is the WASI build: UCI on stdin and stdout, as UCI over WASI states. |
| `ratchetHCE-X.Y.Z.js` | A web page. This Worker script loads the `.wasm` beside it. |
| `ratchetHCE-X.Y.Z-linux-x86-64` | Linux, x86-64. A native build, statically linked. |
| `ratchetHCE-X.Y.Z-linux-x86-64-v3` | Linux, x86-64-v3. |
| `ratchetHCE-X.Y.Z-windows-x86-64.exe` | Windows, x86-64. A native build. |
| `ratchetHCE-X.Y.Z-windows-x86-64-v3.exe` | Windows, x86-64-v3. |
| `ratchetHCE-X.Y.Z-macos-arm64` | macOS, Apple Silicon. A native build. |
| `THIRD-PARTY-NOTICES.txt` | Notices for the `wasm2c` runtime and SIMDe headers used in native builds. |
| `SHA256SUMS` | The sha256 of each file. |

A native build is the WASI build translated to C by wasm2c, with no runtime, and is the recommended download for
desktop GUIs and rating lists. The x86-64-v3 files need AVX2 and BMI2 (Intel Haswell or AMD Zen 1 and later).
Every file plays the same search: `bench` prints one node signature for all of them. The ratings in
`results/ratings.md` are measured on the WASI build under Bun.

The spec, in [uci-over-wasi](https://github.com/ratchet-chess/uci-over-wasi), states what a WASI host must give the module.

## Features

* **Board:** bitboards with magic sliders, legal move generation and Zobrist hashing.
* **Search:** iterative deepening with aspiration windows, a principal variation search, a quiescence search
  and a transposition table.
* **Pruning:** null-move pruning, reverse futility pruning, razoring, futility and late-move pruning, SEE
  pruning and ProbCut.
* **Reductions and extensions:** late-move reductions, internal iterative reductions and singular extensions.
* **Move ordering:** a staged move picker. It reads a killer, butterfly history that knows attacked squares,
  continuation history, pawn history and capture history.
* **Correction history:** search results correct the static eval. The tables are keyed by pawn structure, by
  each side's pieces, by minor and major pieces, and by the last two moves.
* **Eval:** hand-written and tapered between middlegame and endgame. Its terms are material and piece-square
  tables, pawn structure, passed pawns, mobility, piece terms, king safety, threats and endgame scaling. Texel's
  method tunes its values.
* **Draws:** repetition is seen one move before it happens, by van Kervinck's cuckoo method.
* **Time use:** a soft and a hard limit. The soft limit moves with the best move's share of the nodes and with
  a falling score.
* **Not included:** more than one thread, endgame tablebases and pondering.

## UCI options

| Option | Default | |
|---|---|---|
| `Hash` | 128 | Transposition table size in MB (1-1024). `bench` runs at 16. |
| `Threads` | 1 | Search threads. Only 1 is accepted. |
| `TimeRecord` | false | Developer option: print the engine's record of its time use after each search. |

A tuning build also takes its tuned values as options. No packaged file is a tuning build.

## Command line

Every packaged file but the Worker script takes these, and so does `bun vendor/uci-over-wasi/main.ts build/wasi/ratchet.wasm`:

* `bench [depth]`: searches a fixed position set, then prints the node signature and the speed.
* `--nodestime N`: the engine counts its clock in nodes, at N nodes per millisecond. A match on this clock does
  not depend on the host's speed.

The scripts in `tools/`, `bench/` and `test/` are development tools. Each one's header comment states its options.

## Building

You need [Bun](https://bun.sh), at the version `package.json` names.

```sh
bun install
bun run build:wasm                             # build/wasi/ratchet.wasm, the WASI build, and the wasm the tools load
bun vendor/uci-over-wasi/main.ts build/wasi/ratchet.wasm  # the engine: UCI on stdin and stdout
```

`bin/ratchet [bun|node|deno] --release ratchet` starts the same engine for a GUI or a match runner. `bun run test`
runs the gates. `bun tools/package.ts` builds the files of § Download (`--native ""` skips native builds when Nix,
gcc or MinGW are absent).

## Credits

Ratchet HCE is built, tested and tuned with these tools:

* [AssemblyScript](https://www.assemblyscript.org): the language and its compiler.
* [Bun](https://bun.sh): runs the build, the tools and the rated games. The TypeScript also runs under Node and
  Deno.
* [uci-over-wasi](https://github.com/ratchet-chess/uci-over-wasi): the UCI over WASI spec and reference host.
* `ratchet-bench`: the internal testing platform that runs SPRT matches, SPSA tunes and rating gauntlets.
* [fastchess](https://github.com/Disservin/fastchess) by Disservin: plays the matches.
* [WABT](https://github.com/WebAssembly/wabt)'s wasm2c and [SIMDe](https://github.com/simd-everywhere/simde):
  the native builds.
* The [Chess Programming Wiki](https://www.chessprogramming.org): the first source read for every feature.
* [CCRL](https://computerchess.org.uk/ccrl/404/): the published Blitz ratings of the anchor engines, which set
  the rating scale.
* Texel's tuning method, by Peter Österlund. The eval is tuned on the engine's own self-play from Stefan Pohl's
  [UHO_Lichess](https://www.sp-cc.de/) openings, and on Clockwork's `v5_25knpm` self-play positions. Contains
  information from the [Clockwork dataset](https://data.cwchess.org/), which is made available under the
  [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/). Versions up to 0.3.15 were tuned
  on the quiet-labeled positions of the [zurichess tuner](https://bitbucket.org/zurichess/tuner), by Alexandru
  Moșoi (BSD-3-Clause), and positions from the engine's own games.

### Engines we learned from

The engine's code is its own, and it builds on forms that other engines published. Each is credited in the comment
of the function that follows it. `engines/ratchet/SOURCES.md` pins every citation to a commit.

* **GPL-3.0:** Alexandria, Berserk, Ethereal, Incipit, Koivisto, Laser, Stash, Stockfish, Weiss, Xiphos.
* **AGPL-3.0:** Clockwork (forms, ideas and some starting values; zero code is ported, Ratchet HCE is clean-room
  AssemblyScript, and the web app runs the WASI module client-side with full source published).
* **GPL-2.0-or-later:** Fruit 2.1.
* **MIT:** Lynx.

These are credited for forms and ideas, and for starting values: a comment whose value started from another
engine's names that engine's value. If you see a problem with a credit or a license, please open an issue.
