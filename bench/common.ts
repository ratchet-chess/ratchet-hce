/** What the benchmarks that compare two builds share: the runtime's name, a median, and the base's build. */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const root = join(import.meta.dirname, "..");

export function runtime(): string {
  const g = globalThis as { Bun?: { version: string }; Deno?: { version: { deno: string } } };
  if (g.Bun) return `bun ${g.Bun.version}`;
  if (g.Deno) return `deno ${g.Deno.version.deno}`;
  return `node ${process.versions.node}`;
}

/** the median of `xs`; of an even count, the mean of the middle two */
export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

/**
 * the base build of `name` at `ref`: the ref's tree in tmp/bench/, built once. The testing platform exports the ref
 * and starts this repo's tools/tree.sh, as it does for a match; BENCH in tools/local.env names its checkout.
 */
export function baseBuild(name: string, ref: string): { sha: string; wasm: string } {
  const rev = spawnSync("git", ["rev-parse", "--short", `${ref}^{commit}`], { cwd: root, encoding: "utf8" });
  if (rev.status !== 0) throw new Error(`not a commit: ${ref}`);
  const sha = rev.stdout.trim();
  const bench = /^BENCH=(.+)$/m.exec(readFileSync(join(root, "tools/local.env"), "utf8"))?.[1];
  if (!bench) throw new Error("tools/local.env has no BENCH, the testing platform's checkout");
  const built = spawnSync("bun", [join(bench, "tools/engine.ts"), "build", join(root, "tmp/bench"), sha], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  if (built.status !== 0) throw new Error(`could not build ${sha}`);
  const wasm = join(root, "tmp/bench", built.stdout.trim().split("\n").at(-1)!, "build", `${name}.wasm`);
  if (!existsSync(wasm)) throw new Error(`${sha} has no engine ${name}`);
  return { sha, wasm };
}
