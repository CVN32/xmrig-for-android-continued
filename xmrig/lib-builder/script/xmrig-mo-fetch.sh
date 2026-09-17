#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

cd "$EXTERNAL_LIBS_BUILD_ROOT"
version="v6.16.5-mo1"

if [ ! -d xmrig-mo/.git ]; then
  rm -rf xmrig-mo
  git clone --depth 1 --branch "$version" https://github.com/MoneroOcean/xmrig.git xmrig-mo
else
  git -C xmrig-mo fetch --depth 1 origin "refs/tags/$version:refs/tags/$version" || true
  git -C xmrig-mo reset --hard
  git -C xmrig-mo clean -fdx
  git -C xmrig-mo checkout --force "$version"
fi
