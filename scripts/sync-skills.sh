#!/bin/sh
# Refreshes skills/ from a checkout of Vaillus/view-concept: sh scripts/sync-skills.sh ~/github/view-concept
set -e
source_dir="${1:?path to a view-concept checkout}"
rm -rf "$(dirname "$0")/../skills"
cp -R "$source_dir/skills" "$(dirname "$0")/../skills"
