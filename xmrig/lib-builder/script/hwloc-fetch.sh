#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

cd "$EXTERNAL_LIBS_BUILD_ROOT"
version="2.14.0"
archive="hwloc-${version}.tar.gz"

if [ ! -f hwloc/.xmrig-android-version ] || [ "$(cat hwloc/.xmrig-android-version 2>/dev/null || true)" != "$version" ]; then
  rm -rf hwloc "$archive"
  curl -fL --retry 3 \
    "https://github.com/open-mpi/hwloc/releases/download/hwloc-${version}/${archive}" \
    -o "$archive"
  tar -xzf "$archive"
  mv "hwloc-${version}" hwloc
  printf '%s\n' "$version" > hwloc/.xmrig-android-version
  rm -f "$archive"
fi
