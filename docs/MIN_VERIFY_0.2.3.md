# Min verify — v0.2.3

- APK: `dist/xmrig-continued-0.2.3-arm64.apk` (~33M)
- sha256: `37716671801aade5312deea603beefcd593ae431beedb726e295c98c51946410`
- `com.xmrigforandroid` · versionName `0.2.3` · versionCode `2003`
- ABI: arm64-v8a only
- Crash-on-launch fix: `FOREGROUND_SERVICE_DATA_SYNC` + `POST_NOTIFICATIONS` permissions; MiningService FGS deferred until mining start
- `minifyEnabled` remains false; still debug-signed

**판정: PASS** (실기기 재현은 범위 밖; launch should stay open without starting miner)
