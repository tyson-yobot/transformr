#!/usr/bin/env bash
# TRANSFORMR monitor - emits SCREENSHOT: and ERROR: lines to stdout

SCREENSHOTS="/c/dev/transformr/apps/mobile/screenshots"
declare -A known

# Seed known files
for f in "$SCREENSHOTS"/*.png; do
  [ -f "$f" ] && known["$f"]=1
done

echo "MONITOR:started"

# Start logcat in background, piping errors to a temp file
LOGCAT_PIPE=$(mktemp)
rm -f "$LOGCAT_PIPE"
mkfifo "$LOGCAT_PIPE"

adb logcat -v brief 2>/dev/null | grep --line-buffered -E "(ReactNativeJS|com\.transformr|AndroidRuntime|ReactNative)" | grep --line-buffered -E "(Error|Exception|FATAL|TypeError|Warning|CRASH)" > "$LOGCAT_PIPE" &
LOGCAT_PID=$!

# Read logcat pipe in background, emit ERROR lines
while IFS= read -r line; do
  echo "ERROR:$line"
done < "$LOGCAT_PIPE" &
READER_PID=$!

cleanup() {
  kill $LOGCAT_PID $READER_PID 2>/dev/null
  rm -f "$LOGCAT_PIPE"
}
trap cleanup EXIT INT TERM

# Poll for new screenshots
while true; do
  for f in "$SCREENSHOTS"/*.png; do
    [ -f "$f" ] || continue
    if [ -z "${known[$f]}" ]; then
      known["$f"]=1
      echo "SCREENSHOT:$(cygpath -w "$f")"
    fi
  done
  sleep 0.8
done
