#!/usr/bin/env bash
# Prints the directory to publish as the site root ("." = repo root).
#
# Rule: publish whichever was updated MOST RECENTLY (by last git commit touching it):
#   - the newest dated release folder (<mon><DD><YYYY>-updated, e.g. nov182026-updated), or
#   - the repo root site files (everything except dated folders, .github/, AGENTS.md, .nojekyll).
# If one commit updates both, the folder wins. With no valid dated folder, the root is published.
# A dated folder is valid only if it contains index.html.
# Requires full git history (actions/checkout with fetch-depth: 0).
set -euo pipefail
months=(jan feb mar apr may jun jul aug sep oct nov dec)
best=""; best_key=0
for d in */; do
  d=${d%/}
  [[ $d =~ ^([a-z]{3})([0-9]{2})([0-9]{4})-updated$ ]] || continue
  mon=${BASH_REMATCH[1]}; day=${BASH_REMATCH[2]}; year=${BASH_REMATCH[3]}
  m=0
  for i in "${!months[@]}"; do [[ ${months[$i]} == "$mon" ]] && m=$((i+1)); done
  (( m > 0 )) || { echo "skip $d: unknown month" >&2; continue; }
  [[ -f $d/index.html ]] || { echo "skip $d: no index.html" >&2; continue; }
  key=$((10#$year * 10000 + m * 100 + 10#$day))
  (( key > best_key )) && { best_key=$key; best=$d; }
done

if [[ -z $best ]]; then
  echo "no dated release folder; using repo root" >&2
  echo "."; exit 0
fi

folder_ts=$(git log -1 --format=%ct -- "$best")
root_ts=$(git log -1 --format=%ct -- . ':(exclude,glob)*-updated/**' \
  ':(exclude).github/**' ':(exclude)AGENTS.md' ':(exclude).nojekyll')
folder_ts=${folder_ts:-0}; root_ts=${root_ts:-0}
echo "newest folder: $best (last change $folder_ts); root files last change $root_ts" >&2

if (( root_ts > folder_ts )) && [[ -f index.html ]]; then
  echo "root updated more recently; using repo root" >&2
  echo "."
else
  echo "$best updated more recently (or same commit); using $best" >&2
  echo "$best"
fi
