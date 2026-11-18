# Agent instructions

`README.md` has the goal, the layout and the commands. This file has the terms and the working rules. Where
another text disagrees with this file, one of them is stale; correct it. A user decision newer than this file
holds until this file records it.

This repo is the own engine's hand-written eval line. It was copied from ratchet at version 0.3.15, and ratchet
is the line that gets a net.

The user's decisions and the work's state are kept outside this repo. If the session's instructions do not say
where, ask the user.

## Terms

The rows for **release**, **`SPEED`**, **conversion suite**, **engine config**, **player** and **tree** quote the
`AGENTS.md` of ratchet-historical and of ratchet-bench, which own those things.

| term | meaning | not |
|---|---|---|
| **own engine** | Ratchet's own program, `engines/ratchet/`: Ratchet's code on the core, with no original | release, variant |
| **core** | the shared board code in `core/`: board, move generation, hashing, perft | base, engine |
| **node signature** | a build's total node count over a fixed position set | bench, node count |
| **WASI build** | a WASI preview-1 command module that speaks UCI on stdin and stdout, as UCI over WASI states; a release's is `build/wasi/<release>.wasm` | |
| **adapted engine** | another engine with the edits that make it a module of UCI over WASI; the how-to is `helper/README.md` in uci-over-wasi | port, WASI port |
| **release** | one program as it stood at one dated version or event; the unit of the inventory and of `engines/` | exhibit, snapshot, edition, version |
| **`SPEED`** | a candidate's search speed over a base's, which scales its node budget in a match | speed ratio |
| **conversion suite** | `tools/mate-suite.sh`: KQK and KRK starts to mate | mate test |
| **engine config** | an engine repo's `engine.json`: what ratchet-bench reads to build that repo's players at a ref | manifest |
| **player** | one name an engine config lists, as a match plays it: by ref, `[<ref>:]<name>[@<level>]`, or by tree, `tree:<tree>` | external player |
| **tree** | one built commit in the code export, which the runners mount | snapshot |

## Own engine

- **The browser is the target, and the CCRL Blitz rating is the ruler.** The target sets the engine's limits: one thread, a wasm build, the hash a page can hold, and a cold start. A change is judged by matches on the testing platform. Browser measurements check that the limits still hold. Do not tune toward the rating itself.
- **The own engine is written in Ratchet's own code.** Ideas come from anywhere; code is not ported.
- **Cite the origin of each function's form** in its comment: the engine, paper or page it follows.
- **Read a feature's Chess Programming Wiki page and two other engines before choosing its form.** Its comment names the form it rejected.
- **Take ideas only from an engine that has no license.** Take no constant and no table from it. Sirius is such an engine.
- **Its version is a constant that `id name` reports.** A stage's end bumps the minor version, and that commit is rated. A gain measured by the admission chain bumps the patch version. When to run the chain is a judgment call.
- **A rated version gets the tag `v<version>`,** at the commit that was rated.
- **It has no fidelity bar.** It passes this repo's gates, `bun run test`, and the conversion suite.
- **A search change passes the window gate,** `test/window.ts`. On the plain configuration with the table off, every windowed search is in Fishburn's relation to the full-window value. The plain configuration is every `off` value of the flag map.
- **The table lookup cuts only.** A stored bound that does not cut is left alone, and the window is never tightened from it. `boundCuts` in `engines/ratchet/search.ts` names the verified form and the rejected one.
- **A change that keeps the node signature is a speed change.** Measure it on Bun and Node.
- **Read a speed change and a match's `SPEED` on one quiet host,** with the testing platform's speed read.
- **Any other change is admitted by SPRT against its parent.** Start with cheap tests, and go longer or deeper only when a result needs it.
- **Tuned values are written into the engine itself,** as a commit.

## Tuning

- **Size a tune as games per value.** Never quote another engine's game total without its count of values.
- **Plan a tune as stages up the clock.** Each stage starts from the last stage's admitted values, and the first stage starts from main's.
- **A tune's proof is its SPRT against main.** Run no detune, and no run that only shows that the tuner works.
- **Do not replace a tune by a screen, a jump of several values, or a short SPRT.**
- **Agree a tune's game count, its ratio and its stages with the user before it starts.**

## Reads before games

- **A read without games gives a search form's size and its cost.** It does not give the form's sign, and it does not rank forms.
- **Before proposing a chain, read how many events the form touches.** A small count says that a chain cannot resolve it. Say so before any games.
- **Do not predict a gain from error counts, fixed-depth nodes, or depth at equal nodes.**
- **Center a size prediction for one search form near zero.**
- **A new read of the selectivity census needs the user's word.** Its method and limits are in `<artifacts>/notes/20261116-selectivity-census.md`.

## Testing a change

- **The testing platform is ratchet-bench.** Its queue plays the matches, the conversion suite and the rating runs.
- **`engine.json` is this repo's engine config.** It has the build, the launcher and its runtimes, and the bench, perft and tune entries.
- **Start a match tool from this repo's worktree.** The tool then builds a player by ref from this worktree, such as `HEAD:ratchet` or `worktree:ratchet`.
- **`BENCH` in the gitignored `tools/local.env` names the testing platform's checkout.** The admission chain is `bun <BENCH>/tools/admit.ts <parent-ref> [candidate-ref]`.
- **A command of the engine config runs in the ref's own files.** So an entry works for every ref that has the files it names.
- **A tool writes its rows to this worktree's `results/`,** and keeps its run state in this worktree's `tmp/`.
- **Rebuild the wasm after switching branches,** before reading a node signature.
- **Measured results go in `results/`, written by the tools.** Each row names its protocol, so a protocol change shows which rows are old. Docs hold decisions and invariants.
- **Research notes and scripts are off-tree,** in the store that `ARTIFACTS` in the gitignored `tools/local.env` names. Records cite it as `<artifacts>`.

## Engineering rules

- **Correctness comes before speed.** A speed number counts only after `bun test/perft.ts --full` passes. Run it for any change to move generation or `make`/`unmake`.
- **Measure an own-engine step on Bun and Node.** Runtime rankings differ by workload. Matches, tests and tools run on Bun only.
- **Repeat a benchmark before you trust a delta.** Run-to-run noise is several percent. A change below that noise is not a result.
- **Run one benchmark per machine at a time.** A benchmark beside a match, or on a loaded machine, measures the load.
- **A change to the core keeps the own engine's node signature.** Otherwise its commit says why the signature changes.
- **Write no hand-picked unit tests.** The gates and the matches judge a change.
- **Keep hot paths allocation-free.** Use typed arrays, packed moves, and preallocated per-ply buffers. Never use BigInt.
- **Keep hot functions monomorphic.** The engine owns its recursion. The host calls it once per search, never once per node.
- **Use erasable TypeScript only.** No `enum`, `namespace` or parameter properties, because Node runs the source through type stripping.
