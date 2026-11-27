/**
 * A sampled profile of an engine's search, by function: Node's CPU profiler over bench/search.ts, on a build that
 * keeps the wasm name section. The names build must equal the plain build in every section but the names, so the
 * profile is of the code that ships.
 *
 *   bun tools/profile.ts <out-dir> [engine] [repeat] [positions-file]
 *   bun tools/profile.ts unit <out> <host> <engine> <repeat>     (in a queue unit; writes setup-<host>.txt)
 *
 * Each run is one fresh Node process: a warm-up of 24 positions, then `repeat` timed passes over the set. It runs
 * twice, with V8's wasm inlining on (as shipped) and off (so a small function's time stays its own). The report is
 * each function's share of the sampled time.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

/** a wasm module's sections, keyed by id or by `custom:<name>` */
function sections(path: string): Map<string, Buffer> {
  const b = readFileSync(path);
  const out = new Map<string, Buffer>();
  let i = 8;
  const leb = (): number => {
    let r = 0,
      s = 0,
      x: number;
    do {
      x = b[i++];
      r |= (x & 0x7f) << s;
      s += 7;
    } while (x & 0x80);
    return r >>> 0;
  };
  while (i < b.length) {
    const id = b[i++];
    const n = leb();
    const start = i;
    let key = String(id);
    if (id === 0) {
      const l = leb();
      key = `custom:${b.subarray(i, i + l).toString()}`;
    }
    out.set(key, b.subarray(start, start + n));
    i = start + n;
  }
  return out;
}

/** the names build's sections equal the plain build's, the name section aside */
function sameCode(plain: string, names: string): void {
  const a = sections(plain),
    c = sections(names);
  for (const k of new Set([...a.keys(), ...c.keys()])) {
    if (k === "custom:name") continue;
    if (!a.get(k)?.equals(c.get(k) ?? Buffer.alloc(0)))
      throw new Error(`${names} differs from ${plain} in section ${k}`);
  }
}

interface CpuProfile {
  nodes: { id: number; callFrame: { functionName: string; url?: string } }[];
  samples: number[];
  timeDeltas: number[];
}

/** self time per function from one .cpuprofile, in ms */
function selfTimes(file: string): Map<string, number> {
  const p = JSON.parse(readFileSync(file, "utf8")) as CpuProfile;
  const name = new Map<number, string>();
  for (const n of p.nodes) {
    const f = n.callFrame;
    const where = f.url?.startsWith("wasm") ? "wasm" : f.url ? f.url.split("/").pop() : "";
    name.set(n.id, `${f.functionName || "(anonymous)"}${where ? ` [${where}]` : ""}`);
  }
  const t = new Map<string, number>();
  for (let k = 0; k < p.samples.length; k++) {
    const key = name.get(p.samples[k]) ?? "?";
    t.set(key, (t.get(key) ?? 0) + (p.timeDeltas[k] ?? 0) / 1000);
  }
  return t;
}

/** profiles one configuration; returns its report lines */
function run(out: string, engine: string, repeat: string, positions: string | undefined, inlining: boolean): string[] {
  const dir = join(out, inlining ? "inlining-on" : "inlining-off");
  mkdirSync(dir, { recursive: true });
  const wasm = join(root, "build", `${engine}.names.wasm`);
  const argv = [
    inlining ? "--wasm-inlining" : "--no-wasm-inlining",
    "--cpu-prof",
    `--cpu-prof-dir=${dir}`,
    join(root, "bench/search.ts"),
    "--engine",
    engine,
    "--wasm",
    wasm,
    "--repeat",
    repeat,
    "--warmup",
    "24",
  ];
  if (positions) argv.push("--positions", positions);
  const r = spawnSync("node", argv, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`node failed:\n${r.stdout}${r.stderr}`);
  const prof = readdirSync(dir).find((f) => f.endsWith(".cpuprofile"));
  if (!prof) throw new Error(`no profile in ${dir}`);
  const t = selfTimes(join(dir, prof));
  const total = [...t.values()].reduce((a, b) => a + b, 0);
  const summary = r.stdout.trim().split("\n").pop();
  const lines = [`config\t${inlining ? "inlining on" : "inlining off"}\t${summary}\ttotal ms ${total.toFixed(0)}`];
  for (const [k, v] of [...t].sort((a, b) => b[1] - a[1]))
    lines.push(`fn\t${inlining ? "on" : "off"}\t${((100 * v) / total).toFixed(2)}\t${v.toFixed(0)}\t${k}`);
  return lines;
}

function profile(out: string, engine: string, repeat: string, positions?: string): string[] {
  sameCode(join(root, "build", `${engine}.wasm`), join(root, "build", `${engine}.names.wasm`));
  const load = () => readFileSync("/proc/loadavg", "utf8").split(" ")[0];
  const lines = [`node\t${spawnSync("node", ["--version"], { encoding: "utf8" }).stdout.trim()}\tload ${load()}`];
  lines.push(...run(out, engine, repeat, positions, true));
  lines.push(...run(out, engine, repeat, positions, false));
  lines.push(`end\tload ${load()}`);
  return lines;
}

if (import.meta.main) {
  const [first, ...rest] = process.argv.slice(2);
  if (first === "unit") {
    const [out, host, engine, repeat] = rest;
    const part = join(out, `setup-${host}.part`);
    try {
      writeFileSync(part, profile(join(out, "prof"), engine, repeat).join("\n") + "\n");
      renameSync(part, join(out, `setup-${host}.txt`));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      writeFileSync(join(out, `setup-${host}.err`), `${msg}\n`);
      process.exit(1);
    }
    process.exit(0);
  }
  if (!first) throw new Error("usage: bun tools/profile.ts <out-dir> [engine] [repeat] [positions-file]");
  console.log(profile(first, rest[0] ?? "ratchet", rest[1] ?? "3", rest[2]).join("\n"));
}
