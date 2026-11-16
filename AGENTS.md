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
| **variant** | a copy of a release that keeps its mechanisms and opens its constants or its speed | what-if branch, fork |
| **WASI build** | a WASI preview-1 command module that speaks UCI on stdin and stdout, as UCI over WASI states; a release's is `build/wasi/<release>.wasm` | |
| **own engine** | Ratchet's own program, `engines/ratchet/`: Ratchet's code on the core, with no original | release, variant |
| **concurrency** | how many units of one queue job a host runs at once, a per-host job param | slot, slots |
| **allocation** | the queue keeps a host free of some or all units, while a command outside the queue runs on local or until it is released, `tools/queue.ts alloc` | hold |
| **start rule** | the queue's per-host check of whether a job's next unit may start, made of named filters that each give a reason | START, fits |
| **attribute** | a fact about a host, held by the queue's manager, such as `gpu` | property, feature |
| **requirement** | an attribute a job's units need on a host | constraint |
| **taint** | an attribute that keeps off a host every job that does not tolerate it; naming a host tolerates its taints | mark, assigned host |
| **condition** | a host's one word in the queue's `status` (open, closed, allocated, retiring, drained, silent), with its reason | state |

## Releases

- **A release owns everything above the board:** search, eval, move ordering, its tables and its time use.
- **A release owns its board too when its fidelity depends on the original's board.** Generation order, list orders and memory layout all count.
- **Releases share only the core.** Copy code between releases rather than share it.
- **The core referees.** It loads positions for the host, judges legality, and checks each release's own move generator.
- **A change to the core keeps the node signature of every release built on it.** Otherwise its commit names each release that changes, and why.
- **Label every reading of an ambiguous source,** and every guard that is Ratchet's own.
- **Name the original's routine** that each function of a release stands for, in its comment.

## Variants

- **A variant is a directory on main,** `engines/<release>-<name>/`, copied from its release. The release stays untouched.
- **A variant opens one thing:** its constants (a tuned variant) or its speed (a speed variant). It adds no mechanism.
- **A variant has no fidelity bar.** It passes the gates its release passes.
- **A speed variant plays its release's moves with its release's node counts,** checked against the release's reference.
- **A tuned variant is rated at its release's depths or levels,** so the rating gap measures only its constants.

## Own engine

- **The browser is the target, and the CCRL Blitz rating is the ruler.** Judge a feature and its tuning by what they do under browser conditions: clocks, hash, runtimes and cold start. Do not tune toward the rating itself.
- **The own engine is written in Ratchet's own code.** Ideas come from anywhere; code is not ported.
- **Cite the origin of each function's form** in its comment: the engine, paper or page it follows.
- **Read a feature's Chess Programming Wiki page (`vendor/cpw/`) and two other engines before choosing its form.** Its comment names the form it rejected.
- **Its version is a constant that `id name` reports.** A stage's end bumps the minor version, and that commit is rated. A gain measured by the admission chain, `tools/admit.ts`, bumps the patch version. When to run the chain is a judgment call.
- **It has no fidelity bar.** It passes the gates a release on the core passes, and the conversion suite.
- **A search change passes the window gate,** `test/window.ts`: on the plain configuration with the table off, every windowed search is in Fishburn's relation to the full-window value. The plain configuration is every `off` value of the flag map.
- **The table lookup cuts only.** A stored bound that does not cut is left alone, and the window is never tightened from it. `boundCuts` in `engines/ratchet/search.ts` names the verified form and the rejected one.
- **A change that keeps the node signature is a speed change.** Measure it on Bun and Node.
- **Read a speed change and a match's `SPEED` on worker3, with `tools/speed-read.ts`.** Worker3 is quiet and runs the games' Bun, and the other hosts keep playing.
- **Any other change is admitted by SPRT against its parent.** Start with cheap tests, and go longer or deeper only when a result needs it.
- **Tuned values are written into the engine itself,** as a commit, not as a variant.

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
10. **Check fidelity** with `tools/fidelity.ts`, from the lowest depth up. Check every depth in one pass, and stop at the first mismatch.
11. **Count the reach.** In an instrumented copy under `tmp/`, count how often the reference reaches each quirk and rare path.
12. **Have the code reviewed.** A second agent reads it against the original. Give the reviewer the paths the reference never reached, by name. When fidelity is exact at every depth, the review reads only those paths.
13. **Check each review finding against the source** before fixing it. A finding on a path the reference never reaches gets at most one run of the original, over a small position set. If that run does not settle it, the record labels it as an ambiguity. A longer hunt needs the user's word.
14. **Update the record** with what the port measured: resolved ambiguities, and every place the record proved wrong. Mark each quirk the reference reached as confirmed by run. Write new prose only for the exceptions: corrections, new quirks and unreached paths.
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
- **Measure search speed on every runtime.** Benchmarks run under Bun, Node and Deno, because runtime rankings differ by workload and release. An own-engine step measures Bun and Node only. Matches, tests and tools run on Bun only.
- **Repeat a benchmark before you trust a delta.** Run-to-run noise is several percent. A change below that noise is not a result.
- **Run one benchmark per machine at a time,** under `bun tools/queue.ts alloc --kind exclusive -- <command>`. A benchmark beside a match, or on a loaded machine, measures the load.
- **Write no hand-picked unit tests.** The gates, the fidelity checks and the matches judge a change.
- **Keep hot paths allocation-free.** Use typed arrays, packed moves, and preallocated per-ply buffers. Never use BigInt.
- **Keep hot functions monomorphic.** Each release owns its recursion. The host calls it once per search, never once per node.
- **Use erasable TypeScript only.** No `enum`, `namespace` or parameter properties, because Node runs the source through type stripping.
- **Measured results go in `results/`, written by the tools.** Each row names its protocol, so a protocol change shows which rows are old. Commit messages and ticket comments point at `results/` and contain no such numbers. Docs hold decisions and invariants.

## History and scratch

- **A commit message explains the change and how the code works after it.** Plans and owed work go on the task.
- **Unpushed history may be rewritten; pushed history never is.**
- **A tested tree is the committed tree.** Commit the tree as tested, not a rebuild of it.
- **Build experiments on scratch branches.** Delete a branch once its result is committed or saved as a patch.
- **Each session works in its own git worktree, on its own branch.** The main checkout stays on main, because sessions share it. A new worktree needs the main checkout's gitignored `tools/local.env`, `tools/hosts` and `books/`, and `bun install`.
- **Rebuild the wasm after switching branches,** before reading a node signature or a fidelity result.
- **The CPU manager's queue state is in the folder that `QUEUE_STATE` in `tools/local.env` names, not in `tmp/`.** It outlives a checkout and a session.
- **Match state, instrumented copies and other run state go in the repo's gitignored `tmp/`.** Research notes, scripts and patches go off-tree, in the store that `ARTIFACTS` in `tools/local.env` names. Its README has the layout, and records cite it as `<artifacts>`.

## Running tools

- **Handle an original only inside a container,** because its code is an untrusted download. Build, run and disassemble it through `tools/ws.ts`.
- **Never run or open an original's binary on the host.** The anchor tree holds it only for containers to mount. On the host, open only an original's source text.
- **A download enters through `tools/ws.ts fetch`,** pinned by its sha256. Containers have no network, except a fetch phase that runs no downloaded code.
- **Never edit a tool script while a run of it is live.** Stage the change beside it, and swap it in after the run.
- **A tool that submits to `tools/queue.ts` runs its work through the queue.** The queue orders the hosts, not the tool.
- **Local is the user's desktop, so a job on the real clock runs there only by exception.** The conversion suite
  plays on worker3 alone. A rating run plays on the workers, and on local too inside its hours. A speed read on
  local is the other exception. Local's runner containers run in the idle CPU class, so the desktop takes the CPU
  first.
- **Local plays games only inside its hours or an extra window,** which `bun tools/queue.ts status` shows. `bun tools/queue.ts hours local --extra HH:MM-HH:MM` opens one window, which lapses at its end. A job submitted outside them
  plays on the workers.
- **Stop a run by its PID or its process group,** never by a name pattern.
- **Wait for a run to finish,** rather than polling it in a loop.
- **A bug found in a tool becomes a tools commit** before the tool is used again. A run that used the bug is repeated, unless the bug cannot change its verdict.
- **A change to a match tool is checked by a null control before it is merged to main:** `GAMES=1000 SPEED=1.001 bun tools/pool.ts <ref>:ratchet <ref>:ratchet`, the base against itself on the node clock. One control covers a branch of such changes, run once the branch's queue is deployed. It checks the tool, not the hosts, so it plays on whichever hosts are open. It passes when the read is within noise of zero and no game is forfeited. The match tools are `tools/pool.ts`, `tools/llr.ts` and the queue.
- **Name a host by its `tools/hosts` name,** never by its address.
