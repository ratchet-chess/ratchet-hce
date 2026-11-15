#!/bin/sh
# Builds the core and every release under engines/ into build/<name>.wasm, the tool build. A release with a
# wasi.ts also gets build/wasi/<name>.wasm, its WASI build: a WASI preview-1 command module that speaks UCI
# (core/uci.ts). WASI=1 switches core/host.ts to the module's own answers, and abortWasi replaces env.abort.
set -eu
cd "$(dirname "$(readlink -f "$0")")/.."
flags="-O3 --converge --noAssert --uncheckedBehavior always --runtime stub"
wasi="--use WASI=1 --use abort=core/wasi/abortWasi --exportStart _start"
bun tools/bench-fens.ts
bunx --bun asc core/index.ts -o build/core.wasm $flags
mkdir -p build/wasi
for dir in engines/*/; do
  name=$(basename "$dir")
  bunx --bun asc "${dir}index.ts" -o "build/$name.wasm" $flags
  if [ -f "${dir}wasi.ts" ]; then
    bunx --bun asc "${dir}wasi.ts" -o "build/wasi/$name.wasm" $flags $wasi
  fi
done
