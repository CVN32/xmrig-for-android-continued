# Min verify — v0.2.1

- APK: `/workspace/xmrig-android-continued/dist/xmrig-continued-0.2.1-arm64.apk` (~32.1 MB)
- sha256: `8cdb3a61dde2f84d866615b415132cbfca20158fb7ba4c1004dda46b7d0533d9` ✓
- package `com.xmrigforandroid` · versionName `0.2.1` · versionCode `2001` ✓
- ABI: **arm64-v8a only** (intentional; not universal 4-ABI like 0.2.0)
- `libxmrig.so` = XMRig **6.26.0** ✓
- `libxmrig-mo.so` = XMRig **6.16.5-mo1** ✓
- Hotfix smoke: `ACTION_BATTERY_CHANGED` not in PowerMonitorReceiver filters (LOW/OKAY only); `MiningService` has `foregroundServiceType`
- Release: https://github.com/CVN32/xmrig-for-android-continued/releases/tag/v0.2.1

**판정: PASS** (실기기 크래시 재현은 범위 밖)
