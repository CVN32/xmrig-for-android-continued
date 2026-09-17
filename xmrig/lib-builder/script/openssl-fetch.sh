#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

cd "$EXTERNAL_LIBS_BUILD_ROOT"
OPENSSL_VERSION="3.5.8"

if [ ! -f openssl/.xmrig-android-version ] || [ "$(cat openssl/.xmrig-android-version 2>/dev/null || true)" != "$OPENSSL_VERSION" ]; then
  rm -rf openssl
  git clone --depth 1 --branch "openssl-${OPENSSL_VERSION}" \
    https://github.com/openssl/openssl.git openssl
  printf '%s\n' "$OPENSSL_VERSION" > openssl/.xmrig-android-version
fi
