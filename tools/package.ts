/**
 * Builds a release's distribution files from its WASI build (build/wasi/<release>.wasm), so it plays as a UCI
 * engine everywhere engines run: GUIs, match runners, and pages.
 *
 *   bun tools/package.ts [--release ratchet] [--out dist] [--native linux-x86-64,...] [--bun ...]
 *                        [--wabt <dir>] [--simde <dir>]
 *
 * Into <out>/<name>/ it writes:
 *   <name>.wasm                   the WASI build itself: UCI over WASI, for any WASI host
 *   <name>.js                     the browser Worker (vendor/uci-over-wasi/browser.ts); it loads <name>.wasm beside it
 *   <name>-<os>-<arch>[.exe]      native builds: the WASI build through wasm2c and a C compiler, with
 *                                 host/wasi/native.c, and no runtime
 *   THIRD-PARTY-NOTICES.txt       notices for WABT/wasm2c runtime and SIMDe headers in native builds
 *   SHA256SUMS
 * where <name> is <release>-<version>, and the own engine's is ratchetHCE-<version>, so its files differ from
 * ratchet's. Run `bun run build:wasm` first.
 *
 * --native lists the native targets (default Linux and Windows x86-64/x86-64-v3; pass `macos-arm64` on macOS, or
 * empty string to skip native builds). --wabt and --simde override nixpkgs lookups when Nix is not installed.
 * --bun is empty by default (Bun executables are omitted from releases); pass comma-separated Bun --target names
 * to build them.
 *
 * Every runnable file prints its node signature with `bench`. Before it writes SHA256SUMS, the tool runs `bench`
 * on each file this host can execute (Windows builds under Wine when wine64 is installed on non-Windows), at
 * bench/search.ts's depth for the release, and fails if any count differs from the release's node signature.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Engine } from "../host/wasm.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const release = opt("--release") ?? "ratchet";
const out = opt("--out") ?? join(root, "dist");
const wasi = join(root, "build/wasi", `${release}.wasm`);

/**
 * Native targets: the C compiler and its flags. Each target's file is named for its OS and for the oldest CPU
 * level it runs on, as Stockfish names its builds. gcc where a target has it, since the compiler moves the speed
 * of wasm2c's output; read each binary's speed before trusting it.
 */
const NATIVE: Record<string, { cc: string; flags: string[]; exe: string }> = {
  "linux-x86-64": { cc: "gcc", flags: ["-march=x86-64", "-static", "-lpthread", "-lm"], exe: "" },
  "linux-x86-64-v3": { cc: "gcc", flags: ["-march=x86-64-v3", "-static", "-lpthread", "-lm"], exe: "" },
  "windows-x86-64": {
    cc: "x86_64-w64-mingw32-gcc",
    flags: ["-march=x86-64", "-static", "-lpthread", "-Wl,--no-insert-timestamp"],
    exe: ".exe",
  },
  "windows-x86-64-v3": {
    cc: "x86_64-w64-mingw32-gcc",
    flags: ["-march=x86-64-v3", "-static", "-lpthread", "-Wl,--no-insert-timestamp"],
    exe: ".exe",
  },
  "macos-arm64": { cc: "clang", flags: ["-arch", "arm64", "-lpthread", "-lm"], exe: "" },
};
const DEFAULT_NATIVE = ["linux-x86-64", "linux-x86-64-v3", "windows-x86-64", "windows-x86-64-v3"];

const THIRD_PARTY_NOTICES = `Third-Party Notices for Ratchet HCE Native Builds
=================================================

Ratchet HCE itself is licensed under the GNU General Public License, version 3
or any later version (see LICENSE). Native executables are produced by
translating the WASI build to C via WABT's wasm2c and compiling it with the
following third-party components:

1. WABT (The WebAssembly Binary Toolkit) — wasm2c runtime
   https://github.com/WebAssembly/wabt
   License: Apache License, Version 2.0 (SPDX: Apache-2.0)
   Copyright (c) WebAssembly Community Group participants.

   Licensed under the Apache License, Version 2.0 (the "License"); you may not
   use these files except in compliance with the License. You may obtain a copy
   of the License at http://www.apache.org/licenses/LICENSE-2.0.

2. SIMDe (SIMD Everywhere)
   https://github.com/simd-everywhere/simde
   License: MIT License (SPDX: MIT)
   Copyright (c) 2017-2024 Evan Nemerson and SIMDe contributors.

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:
   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
`;

const run = (cmd: string, argv: string[], cwd = root) =>
  execFileSync(cmd, argv, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

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
run("bun", [
  "build",
  "vendor/uci-over-wasi/browser.ts",
  "--outfile",
  join(dir, `${name}.js`),
  "--format",
  "iife",
  "--target",
  "browser",
]);
files.push(`${name}.js`);

// native builds: one translation to C, compiled per target
const nativeArg = opt("--native");
const nativeTargets = (nativeArg ?? DEFAULT_NATIVE.join(",")).split(",").filter(Boolean);
if (nativeTargets.length) {
  const wabt =
    opt("--wabt") ??
    run("nix", ["build", "--inputs-from", root, "nixpkgs#wabt", "--no-link", "--print-out-paths"]).trim();
  // wasm2c's C for a module with SIMD includes SIMDe's headers, which wabt does not hold
  const simde =
    opt("--simde") ??
    run("nix", ["build", "--inputs-from", root, "nixpkgs#simde", "--no-link", "--print-out-paths"]).trim();
  const work = join(root, "tmp/package", name);
  mkdirSync(work, { recursive: true });
  const wasm2cBin = existsSync(join(wabt, "bin/wasm2c")) ? join(wabt, "bin/wasm2c") : "wasm2c";
  run(wasm2cBin, [wasi, "-n", "engine", "-o", join(work, "engine.c")]);
  const rt = existsSync(join(wabt, "share/wabt/wasm2c")) ? join(wabt, "share/wabt/wasm2c") : join(wabt, "wasm2c");
  const wabtInc = existsSync(join(wabt, "include")) ? join(wabt, "include") : rt;
  const simdeInc = existsSync(join(simde, "include")) ? join(simde, "include") : simde;
  for (const target of nativeTargets) {
    const t = NATIVE[target];
    if (!t) throw new Error(`unknown native target ${target}: one of ${Object.keys(NATIVE).join(", ")}`);
    const file = `${name}-${target}${t.exe}`;
    const sources = [
      join(work, "engine.c"),
      join(root, "host/wasi/native.c"),
      ...["wasm-rt-impl.c", "wasm-rt-mem-impl.c", "wasm-rt-exceptions-impl.c"].map((f) => join(rt, f)),
    ];
    run(t.cc, [
      "-O3",
      "-I",
      wabtInc,
      "-I",
      rt,
      "-I",
      work,
      "-I",
      simdeInc,
      ...sources,
      "-o",
      join(dir, file),
      ...t.flags,
    ]);
    files.push(file);
  }
  writeFileSync(join(dir, "THIRD-PARTY-NOTICES.txt"), THIRD_PARTY_NOTICES);
  files.push("THIRD-PARTY-NOTICES.txt");
}

// Bun executables (optional; omitted by default)
const bunTargets = (opt("--bun") ?? "").split(",").filter(Boolean);
if (bunTargets.length) {
  const work = join(root, "tmp/package", name);
  mkdirSync(work, { recursive: true });
  const entry = join(work, "bun-entry.ts");
  writeFileSync(
    entry,
    `import { readFileSync } from "node:fs";\n` +
      `import wasm from ${JSON.stringify(wasi)} with { type: "file" };\n` +
      `import { runEngine } from ${JSON.stringify(join(root, "vendor/uci-over-wasi/main.ts"))};\n\n` +
      `runEngine(readFileSync(wasm), [${JSON.stringify(name)}, ...process.argv.slice(2)], new URL("./vendor/uci-over-wasi/thread.js", import.meta.url));\n`,
  );
  for (const target of bunTargets) {
    const os = target.replace(/^bun-/, "").replace("darwin", "macos").replace("x64", "x86-64");
    const file = `${name}-bun-${os}${target.includes("windows") ? ".exe" : ""}`;
    run("bun", [
      "build",
      "--compile",
      `--target=${target}`,
      entry,
      join(root, "vendor/uci-over-wasi/thread.ts"),
      "--outfile",
      join(dir, file),
    ]);
    files.push(file);
  }
}

// every runnable file on this host must print the release's node signature
const tool = run("bun", ["bench/search.ts", "--engine", release, "--repeat", "1", "--warmup", "1"]);
const found = /d(\d+)\s+signature (\d+)/.exec(tool);
if (!found) throw new Error(`no signature from bench/search.ts:\n${tool}`);
const [depth, signature] = [found[1], Number(found[2])];
const wine = process.platform === "win32" ? "" : spawnSync("sh", ["-c", "command -v wine64"], { encoding: "utf8" }).stdout.trim();
const hostOs = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : process.platform;
const hostArch = process.arch === "x64" ? "x86-64" : process.arch;
const cpuFlags = process.platform === "linux" && existsSync("/proc/cpuinfo") ? readFileSync("/proc/cpuinfo", "utf8") : "";
const hasV3 = process.arch === "x64" && (process.platform !== "linux" || (/\bavx2\b/.test(cpuFlags) && /\bbmi2\b/.test(cpuFlags)));

for (const f of files) {
  let cmd: string[] | undefined;
  if (f.endsWith(".wasm")) cmd = ["bun", "vendor/uci-over-wasi/main.ts", join(dir, f)];
  else if (f.endsWith(".js") || f.endsWith(".txt")) continue;
  else if (f.endsWith(".exe") && hostOs !== "windows") {
    if (wine && process.arch === "x64" && (!f.includes("-v3") || hasV3)) cmd = [wine, join(dir, f)];
  } else if (f.includes(`-${hostOs}-${hostArch}`) && (!f.includes("-v3") || hasV3)) {
    cmd = [join(dir, f)];
  }
  if (!cmd) {
    console.error(`${f}: not run on this host (${hostOs}-${hostArch})`);
    continue;
  }
  const r = spawnSync(cmd[0], [...cmd.slice(1), "bench", depth], {
    cwd: root,
    input: "",
    encoding: "utf8",
    env: { ...process.env, WINEDEBUG: "-all" },
  });
  const nodes = Number(/Nodes searched\s*:\s*(\d+)/.exec(r.stdout)?.[1]);
  if (nodes !== signature) throw new Error(`${f}: bench ${depth} gave ${nodes} nodes, bench/search.ts ${signature}\n${r.stderr}`);
  console.error(`${f}: ${nodes} nodes at depth ${depth}, the release's node signature`);
}

const sums = files.map((f) => `${createHash("sha256").update(readFileSync(join(dir, f))).digest("hex")}  ${f}`).join("\n") + "\n";
writeFileSync(join(dir, "SHA256SUMS"), sums);
process.stdout.write(`${dir}\n${sums}`);
