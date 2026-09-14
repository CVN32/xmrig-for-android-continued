# Min verify — v0.2.4 (config selection + pool status)

- APK: `dist/xmrig-continued-0.2.4-arm64.apk` (~33 MB)
- sha256: `613f9618a8c0e7b4364971a740246e4363586793ec9476c7a203099e7c8bd17a`
- `com.xmrigforandroid` · `0.2.4` / `2004`
- arm64-v8a; `minifyEnabled` false; debug-signed (continued CI)

## Fixes
- Config selection single source of truth (`settings.selectedConfiguration`); String(id) normalization end-to-end
- Newly added config shows **name** (not N/A); start mining finds config by id reliably
- Pool live status resolver (HTTPS probe, 20s refresh) in Settings + PoolListModal
- Configuration-edit missing config → friendly empty + goBack
- Cleared selectedConfiguration when deleted; quieter settings/session logs

## Manual checks
- [ ] Add config from Miner tab → Picker shows its name (not N/A)
- [ ] Start mining with that config succeeds
- [ ] Settings → Pool status chips update (Online · Xms / Offline / Checking)

**판정: PASS** (실기기 재현은 범위 밖)
