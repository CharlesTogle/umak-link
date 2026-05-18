#!/usr/bin/env bash

set -euo pipefail

export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export PATH="$JAVA_HOME/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

pnpm run build:android
./gradlew assembleDebug
adb install -r "$SCRIPT_DIR/app/build/outputs/apk/debug/app-debug.apk"
