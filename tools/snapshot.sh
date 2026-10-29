#!/bin/sh
# Builds a frozen copy of the engine for a match, so editing or rebuilding the
# working tree does not change it mid-run.
#
#   tools/snapshot.sh <dir> <git-ref|worktree>
#
# A git ref is extracted with git archive and reused if already built; the
# worktree (tracked and untracked files) is copied fresh every time.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
dir=$1
src=$2

if [ -f "$dir/build/core.wasm" ] && [ "$src" != worktree ]; then exit 0; fi
rm -rf "$dir"
mkdir -p "$dir"
if [ "$src" = worktree ]; then
  (cd "$root" && git ls-files -co --exclude-standard -z | grep -zv '^vendor/' | xargs -0 tar -c) | tar -x -C "$dir"
else
  git -C "$root" archive "$src" | tar -x -C "$dir"
fi
# run the snapshot's own build command with this repo's installed compiler
(cd "$dir" && PATH="$root/node_modules/.bin:$PATH" bun run build:wasm > build.log 2>&1) || { cat "$dir/build.log"; exit 1; }
