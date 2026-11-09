/**
 * Runs a UCI engine behind a pipe that holds each `go` until a gap after the engine's
 * last `bestmove`. Stash 9 and MissingPawn hand each go to a search thread, and can
 * miss a go that arrives before that thread waits again: the engine then never replies
 * and loses on time. An opponent that replies within a millisecond, as one that has
 * found a mate does, sends that go; a loaded host makes the miss likely. The held time
 * counts on the engine's clock, at most the gap a move.
 *
 *   bun tools/uci-gap.ts <gap-ms> <engine> [args...]
 *
 * tools/mate-suite.sh runs its defender behind it. host/uci/worker.ts MIN_REPLY_MS
 * guards the same race from the other side, for a release with levels, which can
 * reply at once in any game.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { setTimeout as sleep } from "node:timers/promises";

const [gapArg, cmd, ...args] = process.argv.slice(2);
const gap = Number(gapArg);
if (!(gap >= 0) || !cmd) {
  console.error("usage: bun tools/uci-gap.ts <gap-ms> <engine> [args...]");
  process.exit(2);
}

const engine = spawn(cmd, args, { stdio: ["pipe", "pipe", "inherit"] });
let lastBest = -Infinity;
createInterface({ input: engine.stdout! }).on("line", (line) => {
  if (line.startsWith("bestmove")) lastBest = performance.now();
  process.stdout.write(line + "\n");
});

// lines reach the engine in their order, so a line after a held go waits with it
let sent = Promise.resolve();
createInterface({ input: process.stdin })
  .on("line", (line) => {
    sent = sent.then(async () => {
      if (line === "go" || line.startsWith("go ")) {
        const wait = lastBest + gap - performance.now();
        if (wait > 0) await sleep(wait);
      }
      engine.stdin!.write(line + "\n");
    });
  })
  .on("close", () => void sent.then(() => engine.stdin!.end()));

for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => engine.kill(signal));
engine.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
