# Agent instructions

`README.md` has the goal, the layout and the commands. This file is the working rules: the terms, how a
release is built and checked, the engineering gates, and how tools run. Where another text disagrees
with this file, one of them is stale; correct it. A user decision newer than this file holds until this
file records it.

The user's decisions and the work's state are kept outside this repo. If the session's instructions
do not say where, ask the user.

## Terms

| term | meaning | not |
|---|---|---|
| **release** | one program as it stood at one dated version or event; the unit of the inventory and of `engines/` | exhibit, snapshot, edition, version |
| **original** | a release's own code or binary, as its authors left it | |
| **port** | a release built from the original's code, or from a record read from that code | |
| **reconstruction** | a release built from papers and descriptions | estimate |
| **core** | the shared board code in `core/`: board, move generation, hashing, perft | base, engine |
| **fidelity** | how closely a release matches its original | accuracy |
| **inventory record** | one release's record of mechanisms and sources, in `inventory/` | dossier, card |
| **reference** | an original's measured moves and node counts over a position set, made by `tools/reference.ts` | baseline |
| **node signature** | a build's total node count over a fixed position set | bench, node count |
| **`SPEED`** | a candidate's search speed over a base's, which scales its node budget in a match | speed ratio |
| **conversion suite** | `tools/mate-suite.sh`: KQK and KRK starts to mate | mate test |

## Releases

- **A release owns everything above the board:** search, eval, move ordering, its tables and its time use.
- **A release owns its board too when its fidelity depends on the original's board.** Generation order, list orders and memory layout all count.
- **Releases share only the core.** Copy code between releases rather than share it.
- **The core referees.** It loads positions for the host, judges legality, and checks each release's own move generator.
- **A change to the core keeps the node signature of every release built on it.** Otherwise its commit names each release that changes, and why.
- **Label every reading of an ambiguous source,** and every guard that is Ratchet's own.
- **Name the original's routine** that each function of a release stands for, in its comment.

## Building a release

The steps run in this order. Each step's output is the next step's input.

1. **Write the inventory record.** It follows `inventory/TEMPLATE.md`, and it comes before any code.
2. **Have the record reviewed.** A second agent checks a sample of its rows, and every quirk, against the source.
3. **Settle the license with the user.** The license decides how the code is written:
   - a license compatible with GPL-3.0-or-later: port from the code, with an attribution header in every file;
   - all rights reserved: write the code from the record, in Ratchet's own structure. Read the original routine by routine, only to check behavior;
   - anything else: the user decides.
4. **Make the reference before the code.** Generate the position set with `tools/positions.ts`. Run the original over it with `tools/reference.ts`, one fresh process per search.
5. **Run the reference twice.** Two identical runs show that the original is deterministic as driven. A difference is a finding for the record.
6. **Keep the reference** in `engines/<release>/fidelity/`, with any published games the original played, as PGN.
7. **Build the board and move generator first.** Pass `test/release-perft.ts` before writing the search.
8. **Write the engine.** Each search starts from the state the original had in the reference run. That is a fresh process or import, with every table empty.
9. **Reproduce the reference build,** not an idealized original. Where play depends on the build's memory or stack layout, copy that layout and label it.
10. **Check fidelity** with `tools/fidelity.ts`, working up one depth at a time.
11. **Count the reach.** In an instrumented copy under `tmp/`, count how often the reference reaches each quirk and rare path.
12. **Have the code reviewed.** A second agent reads it against the original. Give the reviewer the paths the reference never reached, by name.
13. **Check each review finding against the source** before fixing it.
14. **Update the record** with what the port measured: resolved ambiguities, and every place the record proved wrong.
15. **Commit the release, its reference and its `test/release-perft.ts` entry together,** because the gate needs the release.

## Fidelity

- **The user sets each release's fidelity bar** before the port starts.
- **The default bar is exact.** At every depth checked, the release plays the original's move with the original's node count.
- **Published games add to the bar.** The release plays each one inside its own game state, and must play every one of the original's moves.
- **A mismatch is a bug to find,** not a tolerance to tune.
- **Bring unreachable cases to the user.** If exact counts prove out of reach after real effort, report those cases, and keep the bar.
- **Say what the reference is a reference of.** A rebuilt original matches its rebuild's compiler and layout. The record notes where a period build may have played differently.

## Engineering rules

- **Correctness comes before speed.** A speed number counts only after `bun test/perft.ts --full` passes. Run it for any change to move generation or `make`/`unmake`.
- **Measure search speed on every runtime.** Benchmarks run under Bun, Node and Deno, because runtime rankings differ by workload and release. Matches, tests and tools run on Bun only.
- **Repeat a benchmark before you trust a delta.** Run-to-run noise is several percent. A change below that noise is not a result.
- **Run one benchmark per machine at a time.** A benchmark beside a match, or on a loaded machine, measures the load.
- **Write no hand-picked unit tests.** The gates, the fidelity checks and the matches judge a change.
- **Keep hot paths allocation-free.** Use typed arrays, packed moves, and preallocated per-ply buffers. Never use BigInt.
- **Keep hot functions monomorphic.** Each release owns its recursion. The host calls it once per search, never once per node.
- **Use erasable TypeScript only.** No `enum`, `namespace` or parameter properties, because Node runs the source through type stripping.
- **Record results in commit messages, not in docs.** Docs hold decisions and invariants. Measured numbers go stale.

## History and scratch

- **Unpushed history may be rewritten; pushed history never is.**
- **A tested tree is the committed tree.** Commit the tree as tested, not a rebuild of it.
- **Build experiments on scratch branches.** Delete a branch once its result is committed or saved as a patch.
- **Rebuild the wasm after switching branches,** before reading a node signature or a fidelity result.
- **Match state, instrumented copies and other run state go in the repo's gitignored `tmp/`.** Research notes, scripts and patches go in the folder that `SCRATCH` in `tools/local.env` names, outside the repo.

## Running tools

- **Handle an original only inside a container,** because its code is an untrusted download. Build, run and disassemble it through `tools/ws.ts`, or in the chess-bench image until it retires.
- **Never run or open an original's binary on the host.** The anchor tree holds it only for containers to mount. On the host, open only an original's source text.
- **A download enters through `tools/ws.ts fetch`,** pinned by its sha256. Containers have no network, except a fetch phase that runs no downloaded code.
- **Never edit a tool script while a run of it is live.** Stage the change beside it, and swap it in after the run.
- **Stop a run by its PID or its process group,** never by a name pattern.
- **Wait for a run to finish,** rather than polling it in a loop.
- **A bug found in a tool becomes a tools commit** before the tool is used again. A run that used the bug is repeated, unless the bug cannot change its verdict.
- **Name a host by its `tools/hosts` name,** never by its address.
