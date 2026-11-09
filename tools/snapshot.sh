#!/bin/sh
# Builds a frozen copy of the engine for a match, so editing or rebuilding the
# working tree does not change it mid-run.
#
#   tools/snapshot.sh <dir> <git-ref|worktree>
#
# A git ref is extracted with git archive and reused if already built; the
# worktree (tracked and untracked files) is copied fresh every time.
#
# It builds in <dir>.part and renames that to <dir> once the build is done, so a
# tree exists only whole: tools/queue.ts takes a tree with build/core.wasm as
# published, and the build writes that file before the engines' own.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
dir=$1
src=$2
part="$dir.part"

if [ -f "$dir/build/core.wasm" ] && [ "$src" != worktree ]; then exit 0; fi
rm -rf "$dir" "$part"
mkdir -p "$part"
if [ "$src" = worktree ]; then
  (cd "$root" && git ls-files -co --exclude-standard -z | grep -zv '^vendor/' | xargs -0 tar -c) | tar -x -C "$part"
else
  git -C "$root" archive "$src" | tar -x -C "$part"
fi
# run the snapshot's own build command with this repo's installed compiler
(cd "$part" && PATH="$root/node_modules/.bin:$PATH" bun run build:wasm > build.log 2>&1) || { cat "$part/build.log"; exit 1; }
mv "$part" "$dir"
