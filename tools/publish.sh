#!/bin/sh
# Publishes a commit of this repo as a player tree for the testing platform, which plays it as ext:<tree>
# (its tools/player.sh). The tree is the commit's files with their build (tools/snapshot.sh), plus:
#
#   PLAYER      the player's name as results name it: ratchet-<version>
#   bin/engine  starts the WASI build under Bun through bin/ratchet; it takes --nodestime <n>
#
#   tools/publish.sh [<git-ref>]    prints the tree's name, ratchet-<short sha>
#
# The code export is QUEUE_CODE in the gitignored tools/local.env. A tree is built beside its place and renamed,
# so it exists only whole, and a tree that exists is reused.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
ref=${1:-HEAD}
code=$(sed -n 's/^QUEUE_CODE=//p' "$root/tools/local.env")
[ -d "$code" ] || { echo "QUEUE_CODE in tools/local.env names no directory" >&2; exit 2; }
sha=$(git -C "$root" rev-parse --short "$ref^{commit}")
tree="ratchet-$sha"
dir="$code/$tree"
if [ ! -f "$dir/PLAYER" ]; then
  part="$dir.publish.$$"
  "$root/tools/snapshot.sh" "$part" "$sha" >&2
  version=$(sed -nE 's/^const VERSION = \(([0-9]+) << 16\) \| \(([0-9]+) << 8\) \| ([0-9]+);.*/\1.\2.\3/p' "$part/engines/ratchet/index.ts")
  [ -n "$version" ] || { echo "no VERSION in engines/ratchet/index.ts of $sha" >&2; exit 2; }
  printf 'ratchet-%s\n' "$version" > "$part/PLAYER"
  printf '#!/bin/sh\nexec "$(dirname "$(readlink -f "$0")")/ratchet" bun --release ratchet "$@"\n' > "$part/bin/engine"
  chmod +x "$part/bin/engine"
  rm -rf "$dir"
  mv "$part" "$dir"
fi
echo "$tree"
