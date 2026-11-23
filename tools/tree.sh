#!/bin/sh
# Builds the files it is started in into a tree for the testing platform, ratchet-bench. Its tools/engine.ts starts
# this script, and its tools/player.sh states what a tree holds.
#
#   cd <a ref's files> && WORKTREE=<worktree> sh tools/tree.sh <out-dir> [<map.json>]
#
# The tree is the build, the hosts and the bench, with this repo's launcher as bin/engine. PLAYER lists the one
# player, ratchet-hce, with the version that the files give it. With a map (tools/texel/maps/), the tree is the map's
# tuning build's: tools/tuning-build.ts adds build/ratchet-spsa.wasm and tunables.json.
#
# WORKTREE is the worktree whose installed compiler the build uses, since a ref's files have no node_modules.
# The platform runs a ref's own copy of this script. For a ref older than the script it runs the start worktree's
# copy, which then builds that ref's files and gives them this launcher.
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
out=$1
map=${2:-}
PATH="${WORKTREE:-$here}/node_modules/.bin:$PATH"
export PATH
bun run build:wasm
[ -z "$map" ] || bun tools/tuning-build.ts "$map"
version=$(sed -nE 's/^const VERSION = \(([0-9]+) << 16\) \| \(([0-9]+) << 8\) \| ([0-9]+);.*/\1.\2.\3/p' engines/ratchet/index.ts)
[ -n "$version" ] || { echo "no VERSION in engines/ratchet/index.ts" >&2; exit 2; }
mkdir -p "$out"
cp -R bin build host bench "$out/"
# the copy of uci-over-wasi's host, which the launcher runs a WASI build under; an older ref has its host in host/
[ ! -d vendor/uci-over-wasi ] || { mkdir -p "$out/vendor" && cp -R vendor/uci-over-wasi "$out/vendor/"; }
cp "$here/bin/engine" "$out/bin/engine"
echo "bun node" > "$out/RUNTIMES"
if [ -n "$map" ]; then
  cp tunables.json "$out/"
  version="$version-tune"
fi
echo "ratchet-hce $version" > "$out/PLAYER"
