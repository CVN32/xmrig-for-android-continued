#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

cd "$EXTERNAL_LIBS_BUILD_ROOT"
version="v1.52.1"

if [ ! -d libuv/.git ]; then
  rm -rf libuv
  git clone --depth 1 --branch "$version" https://github.com/libuv/libuv.git libuv
else
  git -C libuv fetch --depth 1 origin "refs/tags/$version:refs/tags/$version"
  git -C libuv checkout --force "$version"
fi
