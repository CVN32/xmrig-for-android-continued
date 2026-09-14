# High-clock ARM64 SoC preset (Snapdragon 8 Elite class)

Grounded in this app’s simple config → `ConfigBuilder` mapping (`src/core/xmrig-config/config-builder.ts` + defaults in `config.ts`). **No benchmarks claimed** — values are starting points for big.LITTLE / high-clock phones with ≥4 GB free RAM.

## What the simple UI already maps

| UI / property | xmrig JSON key | Default in `config.ts` |
|---------------|----------------|------------------------|
| RandomX Mode (Auto/Fast/Light) | `randomx.mode` | `"light"` |
| max threads hint (%) | `cpu.max-threads-hint` | `100` |
| Yield | `cpu.yield` | `true` |
| Priority | `cpu.priority` | `1` |
| (advanced only) | `cpu` affinity arrays | not in simple UI |

See also `edit-simple-cpu.card.tsx` for the RandomX / yield / priority / threads controls.

## Recommended “high-end AC” starting preset

Use when: arm64-v8a, many P-cores, device **plugged in**, thermal headroom, and enough free RAM for RandomX **fast** dataset (~2 GB).

Suggested simple-config property values (apply in UI or as a named configuration):

```json
{
  "cpu": {
    "random_x_mode": "fast",
    "max_threads_hint": 75,
    "yield": false,
    "priority": 3
  }
}
```

Rationale (not measured here):

- **fast** vs default **light**: better RandomX hashrate when RAM allows; light (256 MB) remains safer on mid-RAM / background pressure.
- **max_threads_hint 50–75**: on big.LITTLE, 100% often schedules work onto E-cores and raises heat; mid hint biases toward fewer, hotter P-core threads without requiring affinity JNI yet.
- **yield false + priority 2–4**: maximize hashrate on AC; keep **yield true** / lower priority on battery (existing power hooks / `PowerMonitorReceiver` already matter).

## Battery / thermal companion

- On battery or thermal event: switch RandomX to **light**, raise yield, drop `max_threads_hint` toward **50**, priority **1**.
- Huge pages (`cpu.huge-pages: true` in base config) are best-effort on Android — do not assume they succeed.
- Affinity “pin to big cores” is **not** exposed in simple UI; advanced JSON can set xmrig `cpu` thread affinity once topology is known (`/sys` or future JNI).

## Example advanced JSON fragment

For Configuration mode **Advance**, merge into the xmrig JSON (HTTP API already forced on by builder):

```json
{
  "randomx": { "mode": "fast" },
  "cpu": {
    "max-threads-hint": 75,
    "yield": false,
    "priority": 3,
    "asm": true,
    "huge-pages": true
  }
}
```

Machine-readable copy: `docs/presets/high-clock-soc.simple.json`.
