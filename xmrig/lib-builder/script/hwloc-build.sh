#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

SOURCE_DIR="$EXTERNAL_LIBS_BUILD_ROOT/hwloc"
LLVM_BIN="$TOOLCHAINS_PATH/bin"
ANDROID_API="${ANDROID_API:-29}"
IFS=' ' read -r -a archs <<< "${ARCHS:-arm arm64 x86 x86_64}"

for arch in "${archs[@]}"; do
  case "$arch" in
    arm)
      ANDROID_ABI="armeabi-v7a"
      target_host="arm-linux-androideabi"
      cc="armv7a-linux-androideabi${ANDROID_API}-clang"
      cxx="armv7a-linux-androideabi${ANDROID_API}-clang++"
      ;;
    arm64)
      ANDROID_ABI="arm64-v8a"
      target_host="aarch64-linux-android"
      cc="aarch64-linux-android${ANDROID_API}-clang"
      cxx="aarch64-linux-android${ANDROID_API}-clang++"
      ;;
    x86)
      ANDROID_ABI="x86"
      target_host="i686-linux-android"
      cc="i686-linux-android${ANDROID_API}-clang"
      cxx="i686-linux-android${ANDROID_API}-clang++"
      ;;
    x86_64)
      ANDROID_ABI="x86_64"
      target_host="x86_64-linux-android"
      cc="x86_64-linux-android${ANDROID_API}-clang"
      cxx="x86_64-linux-android${ANDROID_API}-clang++"
      ;;
    *) echo "Unsupported architecture: $arch" >&2; exit 16 ;;
  esac

  BUILD_DIR="$SOURCE_DIR/build/$ANDROID_ABI"
  TARGET_DIR="$EXTERNAL_LIBS_ROOT/hwloc/$ANDROID_ABI"
  rm -rf "$BUILD_DIR"
  mkdir -p "$BUILD_DIR" "$TARGET_DIR"

  test -x "$LLVM_BIN/$cc" || { echo "Missing NDK compiler: $LLVM_BIN/$cc" >&2; exit 1; }

  echo "Building hwloc for $ANDROID_ABI"
  (
    cd "$BUILD_DIR"
    PATH="$LLVM_BIN:$PATH" \
      CC="$LLVM_BIN/$cc" \
      CXX="$LLVM_BIN/$cxx" \
      AR="$LLVM_BIN/llvm-ar" \
      RANLIB="$LLVM_BIN/llvm-ranlib" \
      STRIP="$LLVM_BIN/llvm-strip" \
      "$SOURCE_DIR/configure" \
        --host="$target_host" \
        --prefix="$TARGET_DIR" \
        --enable-static \
        --disable-shared \
        --disable-libxml2 \
        --disable-libudev \
        --disable-cairo \
        --disable-opencl \
        --disable-cuda \
        --disable-nvml

    make -j "${BUILD_JOBS:-4}"
    make install
  )

  test -f "$TARGET_DIR/lib/libhwloc.a" || {
    echo "hwloc static library was not installed" >&2
    find "$TARGET_DIR" -maxdepth 3 -type f -print
    exit 1
  }
done
