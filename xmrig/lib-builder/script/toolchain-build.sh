#!/usr/bin/env bash

set -euo pipefail

source script/env.sh

LLVM_BIN="$TOOLCHAINS_PATH/bin"

# Modern Android NDKs ship one LLVM toolchain for every target ABI. The old
# make_standalone_toolchain.py flow was removed years ago and must not be used
# with the pinned side-by-side NDK.
test -x "$LLVM_BIN/clang" || {
  echo "Android NDK clang was not found at $LLVM_BIN/clang" >&2
  exit 1
}
test -x "$LLVM_BIN/llvm-ar" || {
  echo "Android NDK llvm-ar was not found at $LLVM_BIN/llvm-ar" >&2
  exit 1
}

echo "Using Android NDK LLVM toolchain: $TOOLCHAINS_PATH"
