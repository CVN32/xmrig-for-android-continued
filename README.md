# XMRig for Android Continued

Continued community maintenance fork of [XMRig for Android](https://github.com/XMRig-for-Android/xmrig-for-android).

XMRig for Android Continued acts as a User Interface & Management application for XMRig on modern Android devices. This fork focuses on:

1. **UI visibility fixes** for latest Android (Material You / dark theme / transparent or invisible controls)
2. **xmrig upgrade** to official **v6.26.0** (upstream UI previously shipped v6.17.0)
3. **High-clock SoC optimizations** (affinity, RandomX mode, threads presets, lib-builder flags) for chips like Snapdragon 8 Elite Gen 5

To understand how mining works, see [XMRig's Documentation](https://xmrig.com/docs/miner).

## About: XMRig

XMRig is a high-performance, open-source, cross-platform RandomX, KawPow, CryptoNight, and AstroBWT unified CPU/GPU miner and RandomX benchmark.

https://github.com/xmrig/xmrig

## Status

- App version: **0.2.0** (Continued branding)
- Target official xmrig: **v6.26.0** (`xmrig/lib-builder/script/xmrig-fetch.sh`)
- MoneroOcean fork script still at **v6.16.5-mo1** (review separately)
- Android `applicationId` remains `com.xmrigforandroid` for now (package rename is optional P1)

See [`../CONTINUED_PLAN.md`](../CONTINUED_PLAN.md) or `CONTINUED_PLAN.md` in this tree for investigation steps and build-environment notes.

## Build

See [BUILD.md](./BUILD.md). Native miners:

```
cd xmrig/lib-builder
make install
```

Then:

```
yarn install
yarn start
npx react-native run-android
```

### Upstream credits

Original project: https://github.com/XMRig-for-Android/xmrig-for-android

* Splash Screen Artwork by [AOICARD](https://www.reddit.com/user/AOICARD/)
