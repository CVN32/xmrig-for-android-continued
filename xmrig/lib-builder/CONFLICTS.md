# xmrig.patch vs official v6.26.0

Fetched: `https://github.com/xmrig/xmrig` tag **v6.26.0** (`b2ca724`) into `/workspace/xmrig-android-continued/tmp-xmrig-6.26.0` (shallow).

Applied as fetch script does:

```bash
patch build/src/xmrig/src/net/strategies/DonateStrategy.cpp ./xmrig.patch --force
```

## Dry-run result (2026-09-15)

| Patch | Result |
|-------|--------|
| **Legacy** patch (written ~v6.17 / 2022) | **FAILED** — hunks 2–3 (hosts + `m_pools.emplace_back`) |
| **Refreshed** `xmrig.patch` (this tree) | **OK** — dry-run and apply clean on v6.26.0 |

## Why the old patch failed

1. **Namespace closing comment** changed: `} /* namespace xmrig */` → `} // namespace xmrig` (context mismatch on host hunk).
2. **`Pool` constructor arity** changed: old call sites used a 10th `bool` (daemon) argument; v6.26.0 is:
   `Pool(host, port, user, password, spendSecretKey, keepAlive, nicehash, tls, Mode)` — **9 args**. The old patch rewrote lines that no longer exist in that form.
3. Path strip: patch headers still use `build/src/xmrig/src/...` (matches `xmrig-fetch.sh`).

## Continued donate behavior (unchanged product intent)

- Hosts → `pool.hashvault.pro` (TLS 443 / plain 80).
- Fixed donate wallet + `get_uuid()` password (same as prior Android fork).
- **Product decision still open:** keep redirect, restore upstream donate hosts, or lower/`0` donate-level in app config.

## Not done

- NDK / full `make install` (no SDK/NDK on this box).
- MoneroOcean fork patch (MO fetch does not use `xmrig.patch`).

## MO freeze

Continued P0 freezes MO at `v6.16.5-mo1` even though upstream has `v6.26.0-mo*`. See `docs/MO_FREEZE.md`.
