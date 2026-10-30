#!/bin/sh
# Builds the core and every release under engines/ into build/<name>.wasm.
set -eu
cd "$(dirname "$(readlink -f "$0")")/.."
flags="-O3 --converge --noAssert --uncheckedBehavior always --runtime stub"
bunx --bun asc core/index.ts -o build/core.wasm $flags
for dir in engines/*/; do
  name=$(basename "$dir")
  bunx --bun asc "${dir}index.ts" -o "build/$name.wasm" $flags
done
