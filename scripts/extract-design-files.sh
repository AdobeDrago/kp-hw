#!/usr/bin/env bash
#
# Extract the KP "vessel" design-system exports for use by Storybook.
#
# The zips in design-files/ are large (~130MB total) and are NOT committed
# (see .gitignore). This script unpacks them into design-files/.extracted/
# so the story-authoring workflow can read the demo HTML/CSS/assets.
#
# Usage:  npm run design-files:extract     (or)     bash scripts/extract-design-files.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/design-files"
OUT="$SRC/.extracted"

if [ ! -d "$SRC" ] || ! ls "$SRC"/*.zip >/dev/null 2>&1; then
  echo "No design-files/*.zip found at: $SRC"
  echo "Drop the kp-vessel-*.zip exports into design-files/ and re-run."
  exit 1
fi

mkdir -p "$OUT"
for zip in "$SRC"/*.zip; do
  echo "Extracting $(basename "$zip") ..."
  # -o overwrite, -q quiet; macOS __MACOSX cruft is removed afterward.
  unzip -oq "$zip" -d "$OUT"
done

# Strip macOS resource-fork noise.
find "$OUT" -name '__MACOSX' -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "$OUT" -name '.DS_Store' -delete 2>/dev/null || true

echo "Done. Extracted to: $OUT"
