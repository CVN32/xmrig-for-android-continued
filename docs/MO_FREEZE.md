# MoneroOcean (MO) fork — freeze (Continued P0)

Date: 2026-09-15 (KST)

## Decision

**Freeze MO fetch at `v6.16.5-mo1` for this milestone.** Do not bump `xmrig-mo-fetch.sh` in lockstep with official `v6.26.0`.

Script: `xmrig/lib-builder/script/xmrig-mo-fetch.sh` → `version="v6.16.5-mo1"`.

## Why freeze

1. **P0 path is official xmrig** — `xmrig-fetch.sh` is already on `v6.26.0`; refreshed `xmrig.patch` applies; NDK/`make install` still blocked.
2. **MO tags are independent** — never set MO to bare `v6.26.0` (wrong repo tag shape). MO uses `v*-moN`.
3. **MO does not use `xmrig.patch`** — donate redirect only applies to the official tree.
4. Avoid dual-tree churn until one official Android binary path builds cleanly.

## Upstream MO status (public, as of 2026-09-15)

MoneroOcean/xmrig **does** publish 6.26-era tags (examples): `v6.26.0-mo1` … `v6.26.0-mo4`  
https://github.com/MoneroOcean/xmrig/releases

So this freeze is **process**, not “MO has no 6.26”. A later milestone can bump to a chosen `v6.26.0-moN` after:

- official `lib-builder` Android build succeeds
- smoke-test of MO binary on device / emulator
- confirm algo/config differences still match app UI

## Out of scope now

- Changing MO version in fetch script
- Porting donate patch to MO
- Claiming MO binary was rebuilt here (NDK still pending)

## Related

- Official patch notes: `xmrig/lib-builder/CONFLICTS.md`
- SoC preset (config-only): `docs/HIGH_CLOCK_SOC_PRESET.md`
