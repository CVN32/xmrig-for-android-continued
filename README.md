# XMRig for Android Continued

Continued community maintenance fork of [XMRig for Android](https://github.com/XMRig-for-Android/xmrig-for-android).

XMRig for Android Continued is an Android user interface and management application for XMRig. This fork focuses on:

1. modern Android UI and state-management fixes;
2. official XMRig **v6.26.0**;
3. reproducible native Android builds instead of reusing binaries from an older APK;
4. power, thermal, configuration and miner lifecycle reliability.

To understand how mining works, see [XMRig's Documentation](https://xmrig.com/docs/miner).

## Status

- App version: **0.2.8**
- Official XMRig: **v6.26.0** (`xmrig/lib-builder/script/xmrig-fetch.sh`)
- MoneroOcean XMRig fork: **v6.16.5-mo1**
- Release ABI: **arm64-v8a**
- Android `applicationId`: `com.xmrigforandroid`

The 0.2.8 reliability pass re-audits previously marked fixes, including miner startup/stop, service binding, WakeLock lifecycle, settings persistence, Pool Presets, power/thermal automation and native rebuilds.

## Build

See [BUILD.md](./BUILD.md).

Build the native dependencies and miner binaries:

```bash
cd xmrig/lib-builder
ARCHS=arm64 make all
```

Then install JavaScript dependencies and build the Android app:

```bash
yarn install
cd android
./gradlew assembleRelease
```

GitHub Actions performs the same native rebuild before producing release APKs.

## Upstream credits

- Original Android project: https://github.com/XMRig-for-Android/xmrig-for-android
- XMRig: https://github.com/xmrig/xmrig
- Splash Screen Artwork by [AOICARD](https://www.reddit.com/user/AOICARD/)
