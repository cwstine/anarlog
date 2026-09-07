#!/bin/bash
# Generate every packaged Corola icon from one checked-in master image.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_TAURI="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_IMAGE="$SRC_TAURI/icons/src/corola.png"
TAURI_CLI="$SRC_TAURI/../node_modules/.bin/tauri"
PUBLIC_ASSETS="$SRC_TAURI/../public/assets"
CHANNELS=("stable" "dev" "staging")

if [[ ! -f "$SOURCE_IMAGE" ]]; then
  echo "Corola source icon not found: $SOURCE_IMAGE" >&2
  exit 1
fi

if [[ ! -x "$TAURI_CLI" ]]; then
  echo "Tauri CLI not found: $TAURI_CLI" >&2
  exit 1
fi

for channel in "${CHANNELS[@]}"; do
  output_dir="$SRC_TAURI/icons/$channel"
  resource_dir="$SRC_TAURI/resources/$channel"

  echo "Generating $channel icons from corola.png..."
  "$TAURI_CLI" icon "$SOURCE_IMAGE" --output "$output_dir"

  mkdir -p "$resource_dir"
  cp "$output_dir/icon.icns" "$resource_dir/AppIcon.icns"
done

mkdir -p "$PUBLIC_ASSETS"
cp "$SRC_TAURI/icons/stable/icon.png" "$PUBLIC_ASSETS/corola-icon.png"

echo "Corola icon generation complete"
