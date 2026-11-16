#!/bin/sh
# A match player: a release of one commit, at a level if its original has levels.
#
#   tools/player.sh spec <player>
#   tools/player.sh launcher <snapshot-dir> <release> [level] [nodestime]
#
# A player is [ref:]release[@level]: ref is a git ref or "worktree" (default
# HEAD), release a directory under engines/, level the --level of a release whose
# original has levels and no clock, such as sargon-1978@3.
#
# An external player is ext:<tree>: a UCI engine from another repo, in a code
# tree that repo published into the code export itself. The tree holds PLAYER,
# whose first line is the player's name as results name it, its version
# included, and bin/engine, an executable that starts in the runner image
# (nix/images.nix), whose loader a musl build lacks. The engine takes
# --nodestime <n>: it then counts its clock in nodes, n per millisecond, as
# bin/ratchet does. It has no level and no runtime. It may also answer
# --perft <depth> <fen>, which tools/player-perft.ts checks against the core.
#
# spec prints "ref release level", with "-" for no level. An external player's
# ref is ext:<tree> and its release is its PLAYER name.
#
# launcher writes a wrapper in the snapshot that starts bin/ratchet with the
# release and its arguments, and prints its path. The match tools start an
# engine through it, because fastchess's args= does not survive ssh's word
# splitting. The wrapper takes the runtime as its one argument, which an
# external player's ignores. It is written to a temporary name and renamed,
# since parallel runs share snapshots.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)

case "${1:-}" in
  spec)
    p=$2
    case "$p" in
      ext:*)
        tree=${p#ext:}
        code=$(sed -n 's/^QUEUE_CODE=//p' "$root/tools/local.env")
        [ -f "$code/$tree/PLAYER" ] || { echo "no external tree $tree in $code; its own repo publishes it" >&2; exit 2; }
        name=$(head -n 1 "$code/$tree/PLAYER")
        # the match tools split a spec on spaces and put the name in labels and file names
        case "$name" in "" | *[!A-Za-z0-9._-]*) echo "PLAYER name '$name' in $tree is not [A-Za-z0-9._-]" >&2; exit 2 ;; esac
        echo "$p $name -"
        exit 0
        ;;
    esac
    case "$p" in *:*) ref=${p%%:*} rest=${p#*:} ;; *) ref=HEAD rest=$p ;; esac
    release=${rest%%@*}
    level=-
    case "$rest" in *@*) level=${rest#*@} ;; esac
    [ -n "$release" ] || { echo "no release in player $p" >&2; exit 2; }
    echo "$ref $release $level"
    ;;
  launcher)
    dir=$2 release=$3 level=${4:--} nodestime=${5:-}
    if [ -f "$dir/PLAYER" ]; then
      [ "$level" = - ] || { echo "external player $release has no levels" >&2; exit 2; }
      w="$dir/bin/engine-clock"
      [ -z "$nodestime" ] || w="$dir/bin/engine-nt$nodestime"
      if [ ! -x "$w" ]; then
        printf '#!/bin/sh\nexec "$(dirname "$0")/engine" %s\n' "${nodestime:+--nodestime $nodestime}" > "$w.$$"
        chmod +x "$w.$$"
        mv "$w.$$" "$w"
      fi
      echo "$w"
      exit 0
    fi
    [ -d "$dir/engines/$release" ] || { echo "no release $release in $dir" >&2; exit 2; }
    name="ratchet-$release"
    flags="--release $release"
    if [ "$level" != - ]; then name="$name-l$level" flags="$flags --level $level"; fi
    if [ -n "$nodestime" ]; then name="$name-nt$nodestime" flags="$flags --nodestime $nodestime"; fi
    w="$dir/bin/$name"
    if [ ! -x "$w" ]; then
      printf '#!/bin/sh\nexec "$(dirname "$0")/ratchet" "${1:-bun}" %s\n' "$flags" > "$w.$$"
      chmod +x "$w.$$"
      mv "$w.$$" "$w"
    fi
    echo "$w"
    ;;
  *)
    echo "usage: tools/player.sh spec <player> | launcher <snapshot-dir> <release> [level] [nodestime]" >&2
    exit 2
    ;;
esac
