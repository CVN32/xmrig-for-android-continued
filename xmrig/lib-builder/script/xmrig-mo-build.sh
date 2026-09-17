#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

SOURCE_DIR="$EXTERNAL_LIBS_BUILD_ROOT/xmrig-mo"
TOOLCHAIN="$ANDROID_HOME/ndk/$NDK_VERSION/build/cmake/android.toolchain.cmake"
CMAKE="${CMAKE:-$ANDROID_HOME/cmake/3.18.1/bin/cmake}"
ANDROID_PLATFORM="${ANDROID_PLATFORM:-android-29}"
IFS=' ' read -r -a archs <<< "${ARCHS:-arm arm64 x86 x86_64}"

if [ ! -x "$CMAKE" ]; then
  CMAKE="$(command -v cmake)"
fi

if grep -q "pthread rt dl log" "$SOURCE_DIR/CMakeLists.txt"; then
  sed -i.bak 's/pthread rt dl log/dl/g' "$SOURCE_DIR/CMakeLists.txt"
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
  TARGET_DIR="$EXTERNAL_LIBS_ROOT/xmrig-mo/$ANDROID_ABI"
  mkdir -p "$BUILD_DIR" "$TARGET_DIR"

  echo "Building MoneroOcean XMRig for $ANDROID_ABI"
  "$CMAKE" \
    -S "$SOURCE_DIR" \
    -B "$BUILD_DIR" \
    -DCMAKE_TOOLCHAIN_FILE="$TOOLCHAIN" \
    -DANDROID_ABI="$ANDROID_ABI" \
    -DANDROID_PLATFORM="$ANDROID_PLATFORM" \
    -DCMAKE_INSTALL_PREFIX="$TARGET_DIR" \
    -DANDROID_CROSS_COMPILE=ON \
    -DBUILD_SHARED_LIBS=OFF \
    -DWITH_OPENCL=OFF \
    -DWITH_CUDA=OFF \
    -DBUILD_STATIC=OFF \
    -DWITH_TLS=ON \
    -DHWLOC_LIBRARY="$EXTERNAL_LIBS_ROOT/hwloc/$ANDROID_ABI/lib/libhwloc.a" \
    -DHWLOC_INCLUDE_DIR="$EXTERNAL_LIBS_ROOT/hwloc/$ANDROID_ABI/include" \
    -DUV_LIBRARY="$EXTERNAL_LIBS_ROOT/libuv/$ANDROID_ABI/lib/libuv_a.a" \
    -DUV_INCLUDE_DIR="$EXTERNAL_LIBS_ROOT/libuv/$ANDROID_ABI/include" \
    -DOPENSSL_SSL_LIBRARY="$EXTERNAL_LIBS_ROOT/openssl/$ANDROID_ABI/lib/libssl.a" \
    -DOPENSSL_CRYPTO_LIBRARY="$EXTERNAL_LIBS_ROOT/openssl/$ANDROID_ABI/lib/libcrypto.a" \
    -DOPENSSL_INCLUDE_DIR="$EXTERNAL_LIBS_ROOT/openssl/$ANDROID_ABI/include"

  "$CMAKE" --build "$BUILD_DIR" --parallel "${BUILD_JOBS:-4}"

  test -x "$BUILD_DIR/xmrig" || {
    echo "Expected MoneroOcean miner binary was not produced: $BUILD_DIR/xmrig" >&2
    exit 1
  }
done
