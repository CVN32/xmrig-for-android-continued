realpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

export NDK_VERSION="${NDK_VERSION:-21.4.7075529}"
if [ ! -d "${ANDROID_HOME}/ndk/${NDK_VERSION}" ]; then
  SDKMANAGER="${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager"
  if [ ! -x "$SDKMANAGER" ]; then
    echo "sdkmanager not found and requested NDK is not installed: ${NDK_VERSION}" >&2
    return 1 2>/dev/null || exit 1
  fi
  DETECTED_NDK="$($SDKMANAGER --list_installed 2>/dev/null \
    | awk -F'|' '/^[[:space:]]*ndk;/{gsub(/[[:space:]]/, "", $1); sub(/^ndk;/, "", $1); print $1; exit}')"
  if [ -z "$DETECTED_NDK" ] || [ ! -d "${ANDROID_HOME}/ndk/${DETECTED_NDK}" ]; then
    echo "No installed Android NDK could be resolved" >&2
    return 1 2>/dev/null || exit 1
  fi
  export NDK_VERSION="$DETECTED_NDK"
fi

export ANDROID_NDK_HOME="${ANDROID_HOME}/ndk/${NDK_VERSION}"
export ANDROID_NDK_ROOT="$ANDROID_NDK_HOME"
export TOOLCHAINS_PATH="$(python3 script/toolchains_path.py --ndk "$ANDROID_NDK_HOME")"
export ANDROID_NDK_ROOT="$(realpath "$ANDROID_NDK_ROOT")"

DEFAULT_EXTERNAL_LIBS_BUILD="$(pwd)/build/"
EXTERNAL_LIBS_BUILD="${EXTERNAL_LIBS_BUILD:-${DEFAULT_EXTERNAL_LIBS_BUILD}}"
export EXTERNAL_LIBS_BUILD="${EXTERNAL_LIBS_BUILD%/}"

DEFAULT_EXTERNAL_LIBS_BUILD_ROOT="${EXTERNAL_LIBS_BUILD}/src/"
EXTERNAL_LIBS_BUILD_ROOT="${EXTERNAL_LIBS_BUILD_ROOT:-${DEFAULT_EXTERNAL_LIBS_BUILD_ROOT}}"
export EXTERNAL_LIBS_BUILD_ROOT="${EXTERNAL_LIBS_BUILD_ROOT%/}"

DEFAULT_EXTERNAL_LIBS_ROOT="${EXTERNAL_LIBS_BUILD}/build/"
EXTERNAL_LIBS_ROOT="${EXTERNAL_LIBS_ROOT:-${DEFAULT_EXTERNAL_LIBS_ROOT}}"
export EXTERNAL_LIBS_ROOT="${EXTERNAL_LIBS_ROOT%/}"

DEFAULT_NDK_TOOL_DIR="${EXTERNAL_LIBS_BUILD}/tool/"
NDK_TOOL_DIR="${NDK_TOOL_DIR:-${DEFAULT_NDK_TOOL_DIR}}"
export NDK_TOOL_DIR="${NDK_TOOL_DIR%/}"
