# Build XMRig for Android Continued

## Prerequisites

The release workflow currently uses:

- JDK 17
- Node.js 17
- Android platform 31
- Android Build Tools 31.0.0
- Android NDK 21.4.7075529
- CMake 3.18.1
- Git, Make, Perl and a POSIX shell

Set `ANDROID_HOME` to your Android SDK directory. The native scripts derive the LLVM toolchain from `$ANDROID_HOME/ndk/21.4.7075529`.

## Build native miners

From the repository root:

```bash
cd xmrig/lib-builder
ARCHS=arm64 make all
```

`make all` fetches and builds libuv, hwloc, OpenSSL, official XMRig and the MoneroOcean XMRig fork, then installs the produced executables into:

```text
android/app/src/main/jniLibs/arm64-v8a/libxmrig.so
android/app/src/main/jniLibs/arm64-v8a/libxmrig-mo.so
```

To build all ABIs supported by the scripts, omit `ARCHS=arm64`.

## Build the Android APK

From the repository root:

```bash
yarn install
cd android
echo "sdk.dir=${ANDROID_HOME}" > local.properties
NODE_OPTIONS=--openssl-legacy-provider ./gradlew assembleRelease
```

The APK is written under `android/app/build/outputs/apk/release/`.

## Development

For Metro / React Native development:

```bash
yarn install
yarn start
```

Then, with an Android device or emulator available:

```bash
npx react-native run-android
```

The GitHub `BuildAll` workflow is the release reference: pull requests lint the JavaScript/TypeScript code, rebuild the arm64 miner binaries from source, and assemble a release APK before merge.
