#!/bin/sh

set -eu

BASE_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
MVNW="$BASE_DIR/mvnw"
WATCH_DIRS="$BASE_DIR/src/main/java $BASE_DIR/src/main/resources"
POLL_INTERVAL="${POLL_INTERVAL:-1}"
SPRING_PID=""
LAST_STAMP=""

latest_stamp() {
  find $WATCH_DIRS -type f -print0 2>/dev/null \
    | xargs -0 stat -f '%m' 2>/dev/null \
    | sort -nr \
    | head -n 1
}

cleanup() {
  if [ -n "$SPRING_PID" ] && kill -0 "$SPRING_PID" 2>/dev/null; then
    kill "$SPRING_PID" 2>/dev/null || true
    wait "$SPRING_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Compiling backend before startup..."
"$MVNW" -q -DskipTests compile

echo "Starting Spring Boot with DevTools..."
(
  cd "$BASE_DIR"
  exec "$MVNW" spring-boot:run
) &
SPRING_PID=$!
LAST_STAMP=$(latest_stamp)

echo "Watching backend sources for changes..."

while kill -0 "$SPRING_PID" 2>/dev/null; do
  sleep "$POLL_INTERVAL"
  CURRENT_STAMP=$(latest_stamp)

  if [ "$CURRENT_STAMP" != "$LAST_STAMP" ]; then
    LAST_STAMP=$CURRENT_STAMP
    echo "Change detected. Recompiling backend..."
    (
      cd "$BASE_DIR"
      "$MVNW" -q -DskipTests compile
    )
  fi
done

wait "$SPRING_PID"
