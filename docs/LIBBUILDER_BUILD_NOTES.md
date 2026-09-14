# lib-builder build notes (2026-09-15 KST)

## Result

`make`/pipeline produced jniLibs for all 4 ABIs:

- `libxmrig.so` — official **XMRig 6.26.0** (donate patch → `pool.hashvault.pro`)
- `libxmrig-mo.so` — MO tree at fetch tag **v6.16.5-mo1** (frozen; see `MO_FREEZE.md`)

## Toolchain quirks fixed on this box

- `ANDROID_HOME=$HOME/Android/Sdk`
- CMake scripts: prefer installed SDK CMake (3.18.1 and/or 3.22.1 present)
- Py3.13: `toolchains_path.py` `print(...)`; NDK `make_standalone_toolchain.py` needs `distutils` shim (`PYTHONPATH=/workspace/py-shim`) or setuptools
- `autoconf`/`automake`/`libtool` required for hwloc `autogen.sh`
- xmrig CMake has **no `install` target** — build scripts should `cp xmrig` into `TARGET_DIR/lib` instead of `make install`
- `install.sh` must `mkdir -p` jniLibs ABI dirs before `cp`
- Makefile: `install` should depend on `xmrig xmrig-mo` (avoid parallel race)

## NDK note

Build used **NDK 21.4.7075529** (matches `android/build.gradle` / env default) even though 23.0.7599858 is also installed. Pin via `NDK_VERSION` if 23 is required.
