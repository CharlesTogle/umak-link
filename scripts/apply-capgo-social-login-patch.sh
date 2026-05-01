#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
PATCH_FILE="$ROOT_DIR/patches/capgo-social-login-android-browser.patch"

PACKAGE_DIR=$(
  find "$ROOT_DIR/node_modules/.pnpm" \
    -path '*/node_modules/@capgo/capacitor-social-login/android/build.gradle' \
    -print \
    2>/dev/null \
    | head -n 1 \
    | xargs -r dirname \
    | xargs -r dirname
)

if [ -z "${PACKAGE_DIR:-}" ]; then
  echo "[patch] Capgo social login package not found, skipping"
  exit 0
fi

TARGET_FILE="$PACKAGE_DIR/android/build.gradle"

if grep -q 'compileOnly "androidx.browser:browser:1.4.0"' "$TARGET_FILE"; then
  echo "[patch] Capgo social login Android browser patch already applied"
  exit 0
fi

(
  cd "$PACKAGE_DIR"
  git apply --check "$PATCH_FILE"
  git apply "$PATCH_FILE"
)

echo "[patch] Applied Capgo social login Android browser patch"
