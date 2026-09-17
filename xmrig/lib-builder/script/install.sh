#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

IFS=' ' read -r -a archs <<< "${ARCHS:-arm arm64 x86 x86_64}"
ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"

for arch in "${archs[@]}"; do
  case "$arch" in
    arm) xarch="armeabi-v7a" ;;
    arm64) xarch="arm64-v8a" ;;
    x86) xarch="x86" ;;
    x86_64) xarch="x86_64" ;;
    *) echo "Unsupported architecture: $arch" >&2; exit 16 ;;
  esac

  XMRIG_BIN="$EXTERNAL_LIBS_BUILD_ROOT/xmrig/build/$xarch/xmrig"
  XMRIG_MO_BIN="$EXTERNAL_LIBS_BUILD_ROOT/xmrig-mo/build/$xarch/xmrig"
  JNI_DIR="$ROOT_DIR/android/app/src/main/jniLibs/$xarch"

  test -x "$XMRIG_BIN" || {
    echo "Missing XMRig binary: $XMRIG_BIN" >&2
    exit 1
  }
  test -x "$XMRIG_MO_BIN" || {
    echo "Missing MoneroOcean binary: $XMRIG_MO_BIN" >&2
    exit 1
  }

  mkdir -p "$JNI_DIR"
  rm -f "$JNI_DIR/libxmrig.so" "$JNI_DIR/libxmrig-mo.so"
  cp "$XMRIG_BIN" "$JNI_DIR/libxmrig.so"
  cp "$XMRIG_MO_BIN" "$JNI_DIR/libxmrig-mo.so"
  chmod 0755 "$JNI_DIR/libxmrig.so" "$JNI_DIR/libxmrig-mo.so"

  echo "installed $xarch"
done
