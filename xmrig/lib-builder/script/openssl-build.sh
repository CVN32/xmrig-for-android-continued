#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

SOURCE_DIR="$EXTERNAL_LIBS_BUILD_ROOT/openssl"
LLVM_BIN="$TOOLCHAINS_PATH/bin"
ANDROID_API="${ANDROID_API:-29}"
IFS=' ' read -r -a archs <<< "${ARCHS:-arm arm64 x86 x86_64}"

for arch in "${archs[@]}"; do
  case "$arch" in
    arm) ANDROID_ABI="armeabi-v7a"; architecture="android-arm" ;;
    arm64) ANDROID_ABI="arm64-v8a"; architecture="android-arm64" ;;
    x86) ANDROID_ABI="x86"; architecture="android-x86" ;;
    x86_64) ANDROID_ABI="x86_64"; architecture="android-x86_64" ;;
    *) echo "Unsupported architecture: $arch" >&2; exit 16 ;;
  esac

  TARGET_DIR="$EXTERNAL_LIBS_ROOT/openssl/$ANDROID_ABI"
  rm -rf "$TARGET_DIR"
  mkdir -p "$TARGET_DIR"

  echo "Building OpenSSL for $ANDROID_ABI"
  (
    cd "$SOURCE_DIR"
    if [ -f Makefile ]; then
      make distclean >/dev/null 2>&1 || true
    fi

    PATH="$LLVM_BIN:$PATH" \
      ANDROID_NDK_ROOT="$ANDROID_NDK_ROOT" \
      ./Configure "$architecture" \
        -D__ANDROID_API__="$ANDROID_API" \
        --prefix="$TARGET_DIR" \
        --openssldir="$TARGET_DIR/ssl" \
        no-shared \
        no-tests \
        no-asm

    PATH="$LLVM_BIN:$PATH" make -j "${BUILD_JOBS:-4}" build_sw
    PATH="$LLVM_BIN:$PATH" make install_sw
  )

  test -f "$TARGET_DIR/lib/libssl.a" || test -f "$TARGET_DIR/lib64/libssl.a" || {
    echo "OpenSSL libssl.a was not installed" >&2
    find "$TARGET_DIR" -maxdepth 3 -type f -print
    exit 1
  }

  # Normalize OpenSSL installations that use lib64 so the XMRig CMake scripts
  # have one stable library path on every ABI/toolchain combination.
  if [ -d "$TARGET_DIR/lib64" ] && [ ! -f "$TARGET_DIR/lib/libssl.a" ]; then
    mkdir -p "$TARGET_DIR/lib"
    cp "$TARGET_DIR/lib64/libssl.a" "$TARGET_DIR/lib/libssl.a"
    cp "$TARGET_DIR/lib64/libcrypto.a" "$TARGET_DIR/lib/libcrypto.a"
  fi

done
