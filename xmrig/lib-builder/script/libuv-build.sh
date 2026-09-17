#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

SOURCE_DIR="$EXTERNAL_LIBS_BUILD_ROOT/libuv"
TOOLCHAIN="$ANDROID_HOME/ndk/$NDK_VERSION/build/cmake/android.toolchain.cmake"
CMAKE="${CMAKE:-$ANDROID_HOME/cmake/3.18.1/bin/cmake}"
ANDROID_PLATFORM="${ANDROID_PLATFORM:-android-29}"
IFS=' ' read -r -a archs <<< "${ARCHS:-arm arm64 x86 x86_64}"

if [ ! -x "$CMAKE" ]; then
  CMAKE="$(command -v cmake)"
fi

for arch in "${archs[@]}"; do
  case "$arch" in
    arm) ANDROID_ABI="armeabi-v7a" ;;
    arm64) ANDROID_ABI="arm64-v8a" ;;
    x86) ANDROID_ABI="x86" ;;
    x86_64) ANDROID_ABI="x86_64" ;;
    *) echo "Unsupported architecture: $arch" >&2; exit 16 ;;
  esac

  BUILD_DIR="$SOURCE_DIR/build/$ANDROID_ABI"
  TARGET_DIR="$EXTERNAL_LIBS_ROOT/libuv/$ANDROID_ABI"
  rm -rf "$BUILD_DIR"
  mkdir -p "$BUILD_DIR" "$TARGET_DIR"

  echo "Building libuv for $ANDROID_ABI"
  "$CMAKE" \
    -S "$SOURCE_DIR" \
    -B "$BUILD_DIR" \
    -DCMAKE_TOOLCHAIN_FILE="$TOOLCHAIN" \
    -DANDROID_ABI="$ANDROID_ABI" \
    -DANDROID_PLATFORM="$ANDROID_PLATFORM" \
    -DCMAKE_INSTALL_PREFIX="$TARGET_DIR" \
    -DBUILD_SHARED_LIBS=OFF \
    -DLIBUV_BUILD_TESTS=OFF \
    -DLIBUV_BUILD_BENCH=OFF

  "$CMAKE" --build "$BUILD_DIR" --parallel "${BUILD_JOBS:-4}"
  "$CMAKE" --install "$BUILD_DIR"

  test -f "$TARGET_DIR/lib/libuv_a.a" || {
    echo "libuv static library was not installed" >&2
    find "$TARGET_DIR" -maxdepth 3 -type f -print
    exit 1
  }
done
