/**
 * Builds a release's distribution files from its WASI build (build/wasi/<release>.wasm), so it plays as a UCI
 * engine everywhere engines run: GUIs, match runners, and pages.
 *
 *   bun tools/package.ts [--release ratchet] [--out dist] [--native linux-x86-64,...] [--bun bun-linux-x64,...]
 *
 * Into <out>/<name>/ it writes:
 *   <name>.wasm                   the WASI build itself: UCI over WASI, for any WASI host
 *   <name>.js                     the browser Worker (host/wasi/browser.ts); it loads <name>.wasm beside it
 *   <name>-<os>-<arch>[.exe]      native builds: the WASI build through wasm2c and a C compiler, with
 *                                 host/wasi/native.c, and no runtime
 *   <name>-bun-<os>-<arch>[.exe]  Bun executables: Bun with host/wasi/ and the build inside
 *   SHA256SUMS
 * where <name> is <release>-<version>, and the own engine's is ratchetHCE-<version>, so its files differ from
 * ratchet's. Run `bun run build:wasm` first.
 *
 * --native lists the native targets (default every one in NATIVE). wasm2c is wabt's, from the flake's pinned
 * nixpkgs. --bun lists Bun's --target names (default the host's own). A target other than the host's makes Bun
 * download that platform's runtime when it compiles.
 *
 * Every file prints its node signature with `bench`. Before it writes SHA256SUMS, the tool runs `bench` on each
 * file this host can run (Windows builds under Wine, when wine64 is installed), at bench/search.ts's depth for
 * the release, and fails if any count differs from the release's node signature.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { Engine } from "../host/wasm.ts";

const root = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const release = opt("--release") ?? "ratchet";
const out = opt("--out") ?? join(root, "dist");
const wasi = join(root, "build/wasi", `${release}.wasm`);

/**
 * Native targets: the C compiler and its flags. Each target's file is named for its OS and for the oldest x86-64
 * level it runs on, as Stockfish names its builds. gcc where a target has it, since the compiler moves the speed
 * of wasm2c's output; read each binary's speed before trusting it.
 */
const NATIVE: Record<string, { cc: string; flags: string[]; exe: string }> = {
  "linux-x86-64": { cc: "gcc", flags: ["-march=x86-64", "-static", "-lpthread", "-lm"], exe: "" },
  "linux-x86-64-v3": { cc: "gcc", flags: ["-march=x86-64-v3", "-static", "-lpthread", "-lm"], exe: "" },
  "windows-x86-64": { cc: "x86_64-w64-mingw32-gcc", flags: ["-march=x86-64", "-static", "-lpthread", "-Wl,--no-insert-timestamp"], exe: ".exe" },
  "windows-x86-64-v3": { cc: "x86_64-w64-mingw32-gcc", flags: ["-march=x86-64-v3", "-static", "-lpthread", "-Wl,--no-insert-timestamp"], exe: ".exe" },
};

const run = (cmd: string, argv: string[], cwd = root) => execFileSync(cmd, argv, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

const version = (await Engine.load(release)).version;
/** the name in the files: this repo packages the own engine, engines/ratchet/, as ratchetHCE */
const product = release === "ratchet" ? "ratchetHCE" : release;
const name = version ? `${product}-${version}` : product;
const dir = join(out, name);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const files: string[] = [];

// the WASI build and the browser Worker
copyFileSync(wasi, join(dir, `${name}.wasm`));
files.push(`${name}.wasm`);
run("bun", ["build", "host/wasi/browser.ts", "--outfile", join(dir, `${name}.js`), "--format", "iife", "--target", "browser"]);
files.push(`${name}.js`);

// native builds: one translation to C, compiled per target
const nativeTargets = (opt("--native") ?? Object.keys(NATIVE).join(",")).split(",").filter(Boolean);
if (nativeTargets.length) {
  const wabt = run("nix", ["build", "--inputs-from", root, "nixpkgs#wabt", "--no-link", "--print-out-paths"]).trim();
  // wasm2c's C for a module with SIMD includes SIMDe's headers, which wabt does not hold
  const simde = run("nix", ["build", "--inputs-from", root, "nixpkgs#simde", "--no-link", "--print-out-paths"]).trim();
  const work = join(root, "tmp/package", name);
  mkdirSync(work, { recursive: true });
  run(join(wabt, "bin/wasm2c"), [wasi, "-n", "engine", "-o", join(work, "engine.c")]);
  const rt = join(wabt, "share/wabt/wasm2c");
  for (const target of nativeTargets) {
    const t = NATIVE[target];
    if (!t) throw new Error(`unknown native target ${target}: one of ${Object.keys(NATIVE).join(", ")}`);
    const file = `${name}-${target}${t.exe}`;
    const sources = [join(work, "engine.c"), join(root, "host/wasi/native.c"), ...["wasm-rt-impl.c", "wasm-rt-mem-impl.c", "wasm-rt-exceptions-impl.c"].map((f) => join(rt, f))];
    run(t.cc, ["-O3", "-I", join(wabt, "include"), "-I", rt, "-I", work, "-I", join(simde, "include"), ...sources, "-o", join(dir, file), ...t.flags]);
    files.push(file);
  }
}

// Bun executables: a generated entry embeds the build; Bun keeps host/wasi/thread.ts at host/wasi/thread.js
// under the common root of its two entry points, which is the repo's
const bunTargets = (opt("--bun") ?? `bun-${process.platform}-${process.arch}`).split(",").filter(Boolean);
if (bunTargets.length) {
  const work = join(root, "tmp/package", name);
  mkdirSync(work, { recursive: true });
  const entry = join(work, "bun-entry.ts");
  writeFileSync(
    entry,
    `import { readFileSync } from "node:fs";\n` +
      `import wasm from ${JSON.stringify(wasi)} with { type: "file" };\n` +
      `import { runEngine } from ${JSON.stringify(join(root, "host/wasi/main.ts"))};\n\n` +
      `runEngine(readFileSync(wasm), [${JSON.stringify(name)}, ...process.argv.slice(2)], new URL("./host/wasi/thread.js", import.meta.url));\n`,
  );
  for (const target of bunTargets) {
    const os = target.replace(/^bun-/, "").replace("darwin", "macos").replace("x64", "x86-64");
    const file = `${name}-bun-${os}${target.includes("windows") ? ".exe" : ""}`;
    run("bun", ["build", "--compile", `--target=${target}`, entry, join(root, "host/wasi/thread.ts"), "--outfile", join(dir, file)]);
    files.push(file);
  }
}

// every file this host can run must print the release's node signature
const tool = run("bun", ["bench/search.ts", "--engine", release, "--repeat", "1", "--warmup", "1"]);
const found = /d(\d+)\s+signature (\d+)/.exec(tool);
if (!found) throw new Error(`no signature from bench/search.ts:\n${tool}`);
const [depth, signature] = [found[1], Number(found[2])];
const wine = spawnSync("sh", ["-c", "command -v wine64"], { encoding: "utf8" }).stdout.trim();
const hostOs = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : process.platform;
for (const f of files) {
  let cmd: string[] | undefined;
  if (f.endsWith(".wasm")) cmd = ["bun", "host/wasi/main.ts", join(dir, f)];
  else if (f.endsWith(".exe") && hostOs !== "windows") cmd = wine ? [wine, join(dir, f)] : undefined;
  else if (!f.endsWith(".js") && f.includes(`-${hostOs}-`)) cmd = [join(dir, f)];
  if (!cmd) {
    console.error(`${f}: not run on this host`);
    continue;
  }
  const r = spawnSync(cmd[0], [...cmd.slice(1), "bench", depth], { cwd: root, input: "", encoding: "utf8", env: { ...process.env, WINEDEBUG: "-all" } });
  const nodes = Number(/Nodes searched\s*:\s*(\d+)/.exec(r.stdout)?.[1]);
  if (nodes !== signature) throw new Error(`${f}: bench ${depth} gave ${nodes} nodes, bench/search.ts ${signature}\n${r.stderr}`);
  console.error(`${f}: ${nodes} nodes at depth ${depth}, the release's node signature`);
}

const sums = files.map((f) => `${createHash("sha256").update(readFileSync(join(dir, f))).digest("hex")}  ${f}`).join("\n") + "\n";
writeFileSync(join(dir, "SHA256SUMS"), sums);
process.stdout.write(`${dir}\n${sums}`);
