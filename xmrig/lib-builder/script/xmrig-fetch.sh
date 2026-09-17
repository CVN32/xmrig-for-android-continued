#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

cd "$EXTERNAL_LIBS_BUILD_ROOT"
version="v6.26.0"

if [ ! -d xmrig/.git ]; then
  rm -rf xmrig
  git clone --depth 1 --branch "$version" https://github.com/xmrig/xmrig.git xmrig
else
  git -C xmrig fetch --depth 1 origin "refs/tags/$version:refs/tags/$version" || true
  git -C xmrig reset --hard
  git -C xmrig clean -fdx
  git -C xmrig checkout --force "$version"
fi
