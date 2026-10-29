# Agent instructions

`README.md` has the goal, the layout and the commands. This file is the working rules: the terms, the
engineering gates, and how tools run. Where another text disagrees with this file, one of them is
stale; correct it. A user decision newer than this file holds until this file records it.

The user's decisions and the work's state are kept outside this repo. If the session's instructions
do not say where, ask the user.

The procedure for building a release is written after the first release is built. Until then, the
rules in § Releases hold.

## Terms

| term | meaning | not |
|---|---|---|
| **release** | one program as it stood at one dated version or event; the unit of the inventory and of `engines/` | exhibit, snapshot, edition, version |
| **original** | a release's own code or binary, as its authors left it | |
| **port** | a release built from the original's code | |
| **reconstruction** | a release built from papers and descriptions | estimate |
| **core** | the shared board code in `core/`: board, move generation, hashing, perft | base, engine |
| **fidelity** | how closely a release matches its original | accuracy |
| **inventory record** | one release's record of mechanisms and sources, in `inventory/` | dossier, card |
| **node signature** | a build's total node count over a fixed position set | bench, node count |
| **`SPEED`** | a candidate's search speed over a base's, which scales its node budget in a match | speed ratio |
| **conversion suite** | `tools/mate-suite.sh`: KQK and KRK starts to mate | mate test |

## Releases

- **A release has an inventory record before it has code.** The record follows `inventory/TEMPLATE.md`.
- **A record is reviewed before it is accepted.** A second agent checks a sample of its rows, and every quirk, against the source.
- **A release owns everything above the board:** search, eval, move ordering, its tables and its time use.
- **Releases share only the core.** Copy code between releases rather than share it.
- **A change to the core keeps every release's node signature,** or its commit names each one that changes and why.
- **Fidelity is judged against the original,** by a standard set after the first releases.
- **Label every reading of an ambiguous source,** and every guard that is Ratchet's own.

## Engineering rules

- **Correctness comes before speed.** A speed number counts only after `bun test/perft.ts --full` passes. Run it for any change to move generation or `make`/`unmake`.
- **Measure search speed on every runtime.** Benchmarks run under Bun, Node and Deno, because runtime rankings differ by workload and release. Matches, tests and tools run on Bun only.
- **Repeat a benchmark before you trust a delta.** Run-to-run noise is several percent. A change below that noise is not a result.
- **Run one benchmark per machine at a time.** A benchmark beside a match, or on a loaded machine, measures the load.
- **Write no hand-picked unit tests.** The gates, the fidelity checks and the matches judge a change.
- **Keep hot paths allocation-free.** Use typed arrays, moves packed into int32, and preallocated per-ply buffers. Never use BigInt.
- **Keep hot functions monomorphic.** Each representation owns its recursion. The harness calls it once per run, never once per node.
- **Use erasable TypeScript only.** No `enum`, `namespace` or parameter properties, because Node runs the source through type stripping.
- **Record results in commit messages, not in docs.** Docs hold decisions and invariants. Benchmark numbers go stale.

## History and scratch

- **Unpushed history may be rewritten; pushed history never is.**
- **A tested tree is the committed tree.** Commit the tree as tested, not a rebuild of it.
- **Build experiments on scratch branches.** Delete a branch once its result is committed or saved as a patch.
- **Rebuild the wasm after switching branches,** before reading a node signature.
- **Match state goes in the repo's gitignored `tmp/`.** Research notes, scripts and patches go in the folder that `SCRATCH` in `tools/local.env` names, outside the repo.

## Running tools

- **Build and run an original only inside the chess-bench image,** because its code is an untrusted download.
- **Never edit a tool script while a run of it is live.** Stage the change beside it, and swap it in after the run.
- **Stop a run by its PID or its process group,** never by a name pattern.
- **Wait for a run to finish,** rather than polling it in a loop.
- **A bug found in a tool becomes a tools commit** before the tool is used again. A run that used the bug is repeated, unless the bug cannot change its verdict.
- **Name a host by its `tools/hosts` name,** never by its address.
