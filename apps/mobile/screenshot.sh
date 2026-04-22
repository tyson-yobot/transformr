#!/bin/bash
# Take an emulator screenshot and save to the transformr screenshots directory
# Usage: ./screenshot.sh [optional_filename]

SCREENSHOT_DIR="C:/dev/transformr/apps/mobile/screenshots"
TIMESTAMP=$(date +%s)
FILENAME="${1:-Screenshot_${TIMESTAMP}}.png"

mkdir -p "$SCREENSHOT_DIR"

# Capture screenshot via exec-out (avoids shell file issues)
adb exec-out screencap -p > "$SCREENSHOT_DIR/$FILENAME"

echo "Screenshot saved: $SCREENSHOT_DIR/$FILENAME"
