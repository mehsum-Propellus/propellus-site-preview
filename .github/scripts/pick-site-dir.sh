#!/usr/bin/env bash
# Prints the directory to publish as the site root:
# the newest dated release folder (e.g. nov182026-updated = Nov 18 2026), or "." if none.
# Folder name format: <mon><DD><YYYY>-updated, e.g. jan052027-updated. Must contain index.html.
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
echo "${best:-.}"
