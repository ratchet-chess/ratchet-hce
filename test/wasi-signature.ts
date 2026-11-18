/**
 * The WASI build's gate: a release's WASI build has the node signature of the wasm the gates load.
 *
 * The gates and bench/search.ts call build/<release>.wasm through its exports. bin/ratchet and the match tools
 * play build/wasi/<release>.wasm, the file that ships. Both are compiled from one engine, and this gate is the
 * check that they search alike: the WASI build's `bench` must count the nodes bench/search.ts counts, at its depth.
 *
 *   bun test/wasi-signature.ts
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const run = (args: string[]): string => {
  const r = spawnSync("bun", args, { cwd: root, input: "", encoding: "utf8" });
  if (r.status !== 0) throw new Error(`bun ${args.join(" ")} failed:\n${r.stdout}${r.stderr}`);
  return r.stdout;
};

let failed = false;
for (const file of readdirSync(join(root, "build/wasi")).filter((f) => f.endsWith(".wasm")).sort()) {
  const release = file.replace(/\.wasm$/, "");
  const found = /d(\d+)\s+signature (\d+)/.exec(run(["bench/search.ts", "--engine", release, "--repeat", "1", "--warmup", "1"]));
  if (!found) throw new Error(`no signature for ${release} from bench/search.ts`);
  const [depth, signature] = [found[1], Number(found[2])];
  const nodes = Number(/Nodes searched\s*:\s*(\d+)/.exec(run(["host/wasi/main.ts", join("build/wasi", file), "bench", depth]))?.[1]);
  const equal = nodes === signature;
  failed ||= !equal;
  console.log(`${equal ? "ok  " : "FAIL"} ${release}: WASI build ${nodes} nodes at depth ${depth}, bench/search.ts ${signature}`);
}
process.exit(failed ? 1 : 0);
