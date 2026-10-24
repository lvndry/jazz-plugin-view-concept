#!/bin/sh
# Refreshes vendor/ from a checkout of Vaillus/view-concept: sh scripts/sync-skills.sh ~/github/view-concept
# vendor/ mirrors the checkout's layout because the skills name files by their path in it.
set -e
source_dir="${1:?path to a view-concept checkout}"
vendor_dir="$(dirname "$0")/../vendor"
rm -rf "$vendor_dir" "$(dirname "$0")/../skills"
mkdir -p "$vendor_dir/src/view_concept"
cp -R "$source_dir/skills" "$vendor_dir/skills"
cp "$source_dir/src/view_concept/verdicts.yaml" "$vendor_dir/src/view_concept/verdicts.yaml"
git -C "$source_dir" rev-parse HEAD > "$vendor_dir/UPSTREAM_COMMIT"
