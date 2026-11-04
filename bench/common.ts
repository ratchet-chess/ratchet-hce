/** What the benchmarks that compare two builds share: the runtime's name, a median, and the base's build. */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
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

/** the base build of `name` at `ref`, built once into tmp/bench/<sha>/ */
export function baseBuild(name: string, ref: string): { sha: string; wasm: string } {
  const rev = spawnSync("git", ["rev-parse", "--short", `${ref}^{commit}`], { cwd: root, encoding: "utf8" });
  if (rev.status !== 0) throw new Error(`not a commit: ${ref}`);
  const sha = rev.stdout.trim();
  const dir = join(root, "tmp/bench", sha);
  const built = spawnSync(join(root, "tools/snapshot.sh"), [dir, sha], { stdio: "inherit" });
  if (built.status !== 0) throw new Error(`could not build ${sha}`);
  const wasm = join(dir, "build", `${name}.wasm`);
  if (!existsSync(wasm)) throw new Error(`${sha} has no engine ${name}`);
  return { sha, wasm };
}
