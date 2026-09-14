# XMRig for Android Continued — Plan

Working tree: `/workspace/xmrig-android-continued/continued`  
Upstream clone: `/workspace/xmrig-android-continued/upstream`  
Upstream tip at copy: `2f6b474` (`release: 0.1.3`) from `https://github.com/XMRig-for-Android/xmrig-for-android`

## 1. Scope / Continued branding map

| Item | Upstream | Continued (this fork) | Priority |
|------|----------|------------------------|----------|
| App display name | `XMRigForAndroid` / “XMRig for Android” | **XMRig Continued** | Done (P0) |
| `version.properties` | 0.1.3 | **0.2.0** | Done (P0) |
| README / package description | Original project | Continued fork goals | Done (P0) |
| xmrig official fetch tag | v6.17.0 | **v6.26.0** | Done (P0 script bump; build pending) |
| Android `applicationId` / Java package | `com.xmrigforandroid` | Prefer keep for now | **Optional P1** |
| Proposed new package id | — | `com.xmrigforandroid.continued` | Optional P1 (heavy) |

### Package rename notes (optional P1)

Renaming `com.xmrigforandroid` is heavy: AndroidManifest `package=`, `applicationId`, Kotlin/Java directory tree under `android/app/src/main/java/com/xmrigforandroid/`, native module registration, Play Store identity, and any stored SharedPreferences/DB paths. Prefer **display-name + README branding first**; only rename if publishing side-by-side with the original Play Store app.

Files already branded (display only):

- `android/app/src/main/res/values/strings.xml` → `XMRig Continued`
- `app.json` `displayName`
- `package.json` `displayName` / `description` / `version`
- `src/components/core/app-navigator.tsx` header titles
- `README.md`

Unchanged (intentional P1):

- `android/app/build.gradle` `applicationId 'com.xmrigforandroid'`
- Java/Kotlin package `com.xmrigforandroid.*`
- `MainActivity.getMainComponentName()` → `"XMRigForAndroid"` (must match RN registration / `app.json` `name`)

---

## 2. UI transparency investigation plan

### Symptom hypothesis (Android 12+ / Material You)

On recent Android, `Theme.AppCompat.DayNight.NoActionBar` plus forced-light RN UI-lib scheme and semantic `$…` tokens can yield **low-contrast or “invisible” controls** when the system is in dark mode, or when status/nav bars are translucent and content draws under system chrome without explicit backgrounds.

### Concrete files found

| Path | Role / suspect notes |
|------|----------------------|
| `android/app/src/main/res/values/styles.xml` | **Top suspect.** `AppTheme` parent `Theme.AppCompat.DayNight.NoActionBar` with only `android:textColor=#000000`. No `windowBackground`, `statusBarColor`, `navigationBarColor`, `colorPrimary`, or light-status-bar flags. DayNight + black text → dark-mode system chrome / transparent bars often make labels vanish. No `values-night/`. |
| `android/app/src/main/AndroidManifest.xml` | Applies `@style/AppTheme`; no `android:windowLightStatusBar` / edge-to-edge attrs; Activity has no `fitsSystemWindows`. |
| `android/app/src/main/java/com/xmrigforandroid/MainActivity.java` | Splash + `FLAG_KEEP_SCREEN_ON` only. **No** `StatusBar` / `WindowCompat` / `WindowInsetsController` / edge-to-edge setup. |
| `src/App.tsx` | `Colors.loadSchemes({ light, dark })` then **`Colors.setScheme('light')` always**. Custom `screenBG`/`textColor` exist but many screens use ui-lib **semantic** tokens (`Colors.$textDefault`, `$backgroundPrimaryLight`, `$outlinePrimary`, …) that follow Design System defaults — can clash with forced light scheme under system dark. `SafeAreaView` from `react-native` (not always inset-correct on gesture nav). |
| `src/components/core/app-navigator.tsx` | Stack header + `TabController.TabBar` with `enableShadow`; no explicit header/tab background colors → may inherit transparent/default. |
| `src/components/miner/miner-navigator.tsx` | Uses `Colors.$outlinePrimary` for borders. |
| `src/components/miner/components/miner-card.component.tsx` | `backgroundColor={Colors.$backgroundPrimaryLight}`, `Colors.$textPrimary`. |
| `src/components/miner/components/miner-control.component.tsx` | Heavy use of `$outline*`, `$textDefault`, `$backgroundDangerHeavy`, `$iconDefaultLight`. |
| `src/components/miner/containers/xmrig-view.tsx` | Cards/icons with `$backgroundPrimaryLight`, `$outlinePrimary`, `$iconNeutral`; one hard-coded `Colors.grey30`. |
| `src/components/miner/containers/xmrig-log.tsx` | Log area `backgroundColor: 'black'` (OK); surrounding chrome may still be wrong. |
| `src/components/miner/screens/advanced/log.screen.tsx` | Buttons with `$backgroundPrimaryHeavy` / `$backgroundDangerHeavy`. |
| `src/components/settings/**` | Widespread `$textDefault`, `$textNeutralLight`, `$outlineDanger`, `$outlineDisabled` on cards/fields (e.g. `edit-simple-cpu.card.tsx`). |
| `android/app/src/main/res/layout/launch_screen.xml` | Splash ImageView + ProgressBar; not a runtime theming source. |
| `android/app/src/main/res/values/ic_launcher_background.xml` | Launcher only. |
| **Missing** | No `colors.xml`, no `themes.xml`, no `values-v27`/`values-v29`/`values-night`, no React Native `StatusBar` component usage found in `src/`. |

### UI fix applied (2026-09-15)

Native opaque chrome (light theme parent; avoids DayNight + black-text invisible UI):

- `android/.../values/styles.xml` + `values-v27/styles.xml`: `Theme.AppCompat.Light.NoActionBar`, opaque `windowBackground` / `statusBarColor` / `navigationBarColor`, light status/nav icons.
- `MainActivity.java`: `applyOpaqueSystemBars()` sets status/nav bar colors + light icon flags (API M/O).

RN system-aware scheme with solid backgrounds (no forced-light clash):

- `src/core/theme/chrome.ts`: `CHROME` light/dark opaque palettes + `applyColorScheme()` pins `$backgroundDefault` / `$textDefault` etc.
- `src/App.tsx`: follows `Appearance` / `useColorScheme`; `StatusBar` + `SafeAreaView` (safe-area-context) use opaque chrome.
- `app-navigator.tsx`, `miner-navigator.tsx`, `settings-navigator.tsx`: opaque header / TabBar / cardStyle.
- Worst-offender cards: `miner-card`, `miner-control`, `edit-simple-cpu.card` — explicit `backgroundColor={chrome.cardBG}`; badges use opaque `Colors.blue*`.

Device repro still needed once APK builds (NDK/SDK pending). Native styles stay **light** for splash/window; RN layer tracks system dark with solid greys.

### Investigation steps (next)

1. Reproduce on Android 12+ dark mode and gesture navigation; screenshot Miner / Settings / config edit.
2. Fix native theme first: explicit `windowBackground`, opaque `statusBarColor` / `navigationBarColor`, consider `Theme.AppCompat.Light.NoActionBar` or a defined night theme; add `values-night/styles.xml` if keeping DayNight.
3. In RN: set `StatusBar` barStyle/background; optionally replace root `SafeAreaView` with `react-native-safe-area-context` `SafeAreaView`; give `NavigationContainer` / stack `headerStyle.backgroundColor` and TabBar background from scheme.
4. Audit `$…` tokens vs `Colors.setScheme('light')`; either drive scheme from `Appearance` or pin Design System colors explicitly for light UI.
5. Re-test edge-to-edge (API 35+): if targeting newer SDKs later, use `WindowCompat.setDecorFitsSystemWindows` deliberately rather than accidental transparent insets.

---

## 3. xmrig upgrade steps

### Official xmrig → v6.26.0

1. **Done:** `xmrig/lib-builder/script/xmrig-fetch.sh` `version="v6.26.0"`.
2. **Before full build:** verify `xmrig.patch` still applies to `DonateStrategy.cpp` at v6.26.0 (patch was written against ~2022 / v6.17-era paths). Expect hunk failures — refresh or drop/replace patch intentionally.
3. Re-check `xmrig-build.sh` CMake flags (`-DWITH_OPENCL=OFF`, `-DWITH_CUDA=OFF`, `-DWITH_TLS=ON`, hwloc/libuv/openssl paths) against v6.26.0 `CMakeLists.txt` (option names may have changed; `sed` that rewrites `pthread rt dl log` may need update).
4. Align dependency pins if needed: OpenSSL / libuv / hwloc fetch scripts; Android CMake path currently hard-coded to `$ANDROID_HOME/cmake/3.18.1/bin/cmake`.
5. `NDK` / API: scripts use `ANDROID_PLATFORM=android-29`; `android/build.gradle` lists `ndkVersion = "21.4.7075529"` while `BUILD.md` mentions NDK 23 — reconcile before CI.
6. Run `cd xmrig/lib-builder && make install` **only when** Android SDK/NDK/CMake exist (they do **not** on this box today).
7. Confirm binaries land in jniLibs via `script/install.sh` for `armeabi-v7a` / `arm64-v8a` / `x86` / `x86_64`.

### MoneroOcean (MO) fork

- `xmrig/lib-builder/script/xmrig-mo-fetch.sh` still at **`v6.16.5-mo1`**.
- MO tagging is independent of official xmrig; do **not** blindly set MO to `v6.26.0`.
- **Frozen for P0** (2026-09-15): keep `v6.16.5-mo1` even though upstream publishes `v6.26.0-mo1`…`mo4`. Details: `docs/MO_FREEZE.md`.
- MO build does not use `xmrig.patch` in fetch script (official path does).

### Patch applicability

- File: `xmrig/lib-builder/xmrig.patch` — redirects donate host to `pool.hashvault.pro` and injects a fixed XMR address + UUID pass.
- **Done (2026-09-15):** shallow-cloned v6.26.0 → `../tmp-xmrig-6.26.0`. Legacy patch **failed** (Pool arity + comment). **Refreshed patch applies clean** (`patch …/DonateStrategy.cpp ./xmrig.patch`). Details: `xmrig/lib-builder/CONFLICTS.md`.
- Product decision still open: keep redirect, restore upstream donate, or zero donate-level.

---

## 4. High-clock SoC optimization ideas (grounded in this codebase)

**Sketch written:** `docs/HIGH_CLOCK_SOC_PRESET.md` + `docs/presets/high-clock-soc.simple.json` (RandomX fast / 75% threads / yield off on AC — no fake benchmarks).

Modern SoCs (e.g. Snapdragon 8 Elite Gen 5): many high-clock P-cores + efficiency cores; RandomX benefits from enough RAM for **fast** mode, careful thread count, and avoiding thermal/power throttling.

| Lever | Where in this repo | Idea |
|-------|--------------------|------|
| RandomX mode | `src/core/xmrig-config/config.ts` default `"mode": "light"`; UI in `edit-simple-cpu.card.tsx` (Auto/Fast/Light); builder maps `randomx.mode` in `config-builder.ts` | On devices with ≥3–4 GB free, prefer **fast** (2 GB) over light (256 MB) for hashrate; add a “high-end SoC” preset. |
| max-threads-hint | Default `100` in `config.ts`; UI `% of device cores` | On big.LITTLE / many-core chips, try **50–75%** on P-cores only to reduce E-core waste and heat; expose affinity later. |
| yield / priority | UI + `config-builder.ts` `cpu.yield`, `cpu.priority` | High-clock: `yield: false` + priority 2–4 for max hashrate when plugged in; keep yield true on battery (power hooks already exist). |
| huge pages | `config.ts` `"huge-pages": true`, `"huge-pages-jit": false`, `"1gb-pages": false` | Android often lacks huge pages for apps; keep true for best-effort but don’t rely on it; document that light mode is safer without HP. |
| CPU affinity | **Not exposed** in simple UI / `config-builder.ts` | Advanced JSON already allows xmrig `cpu` affinity arrays; add optional simple “pin to big cores” preset once `/sys` or JNI topology is available. |
| ASM | `"asm": true` in `config.ts` | Keep enabled; arm64 benefits from xmrig’s asm kernels. |
| lib-builder / NDK | `xmrig-build.sh` CMake; `toolchain-build.sh` standalone toolchains; `openssl-build.sh` `-no-asm` | For arm64 release builds: ensure NDK is new enough for Cortex-X/A720-class; consider `-O3` / march flags only after validating xmrig’s own asm; prefer arm64-v8a-only APK splits for high-end devices. |
| Thermal / power | `ThermalService`, `PowerMonitorReceiver`, settings thermal/power cards | Tie presets to existing thermal events: drop threads / switch to light when hot; restore when cool / on AC. |
| Default algo-perf | Stored in simple config properties | Re-run bench after xmrig upgrade; old algo-perf tables may be stale for v6.26.0. |

---

## 5. Build environment (this box)

Checked on the Continued box host (UTC clock; user zone Asia/Seoul).

| Tool | Status | Notes |
|------|--------|-------|
| Node.js | **Present** `v20.19.2` | Upstream `.nvmrc` wants `v17.1.0`; Node 20 may need `--openssl-legacy-provider` (already in `package.json` / gradle). |
| npm | **Present** `9.2.0` | — |
| yarn | **Missing** (not on PATH) | Required by project (`yarn.lock`); install via `npm i -g yarn` or corepack when building. |
| Java / JDK | **Missing** | `java` not found — blocks Gradle / Android builds. |
| Android SDK (`ANDROID_HOME`) | **Missing** / empty | — |
| Android NDK | **Missing** | `ANDROID_NDK` / `NDK_ROOT` unset; no NDK under `/opt` or `/usr/local`. |
| CMake | **Missing** | Scripts expect `$ANDROID_HOME/cmake/3.18.1/bin/cmake`. |
| make | **Missing** | Needed for `xmrig/lib-builder` Makefile. |
| g++ / clang++ | **Missing** (gcc present without g++) | Host C++ toolchain incomplete for native deps outside NDK. |
| python3 | **Present** `3.13.5` | Used by `toolchains_path.py` / env. |
| git / curl / wget / unzip | **Present** | — |
| Full NDK xmrig build | **Not run** | Tools absent; no fake success claimed. |

### Gaps to close before first APK / miner binary

1. Install OpenJDK 11 or 17, Android SDK 31 + build-tools, NDK (align gradle `21.4.7075529` vs BUILD.md `23.0.7599858`), CMake 3.18.1 via sdkmanager.
2. Install `make`, `g++`, `yarn`.
3. Prefer Node 17 via nvm for fidelity, or validate Node 20 + legacy OpenSSL provider.
4. Then: `cd xmrig/lib-builder && make install` → `yarn install` → `npx react-native run-android`.

---

## 6. Safe changes already applied in `continued/`

- `version.properties` → 0.2.0
- `package.json` / `src/version.ts` → 0.2.0 + Continued display metadata
- `README.md` Continued title/description
- `xmrig/lib-builder/script/xmrig-fetch.sh` → `v6.26.0`
- Display strings / navigator titles / `app.json` displayName
- This plan document

**Done this session:** UI opaque chrome + system-aware RN scheme; `xmrig.patch` refreshed for v6.26.0; high-clock preset docs.

**Not done (intentionally):** NDK build, GitHub push/fork, package id rename, MO version bump.

---

## 7. Blockers

1. No Android SDK/NDK/JDK/CMake/make/yarn on box → cannot compile xmrig or APK here.
2. ~~`xmrig.patch` refresh~~ — done for v6.26.0; donate product decision still open.
3. MO fork lag vs official v6.26.0.
4. RN 0.68 + compile/target SDK 31 is old vs Android 15/16 devices — UI fixes help; longer-term RN upgrade is out of P0 scope.
5. GitHub push deferred (token lacks create/fork) — local commit only.
