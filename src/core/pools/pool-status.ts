/**
 * Lightweight predefined-pool reachability probes (informational only).
 * Pure JS fetch — does not affect mining start/stop.
 */

export type PoolProbeStatus = 'checking' | 'online' | 'offline' | 'error';

export type PoolProbeResult = {
  id: string;
  displayName: string;
  hostname: string;
  status: PoolProbeStatus;
  latencyMs?: number;
  error?: string;
  checkedAt?: number;
};

export type PredefinedPoolProbeTarget = {
  id: string;
  displayName: string;
  hostname: string;
  /** Prefer a public HTTPS stats/API endpoint when known */
  probeUrl: string;
};

/** Hostnames/ports mirror pools/*.tsx presets. Typo key `hashvalt` kept for storage compat. */
export const PREDEFINED_POOL_TARGETS: PredefinedPoolProbeTarget[] = [
  {
    id: 'moneroocean',
    displayName: 'MoneroOcean',
    hostname: 'gulf.moneroocean.stream',
    probeUrl: 'https://api.moneroocean.stream/pool/stats',
  },
  {
    id: 'minexmr',
    displayName: 'MineXMR',
    hostname: 'pool.minexmr.com',
    probeUrl: 'https://minexmr.com/',
  },
  {
    id: 'supportxmr',
    displayName: 'SupportXMR',
    hostname: 'pool.supportxmr.com',
    probeUrl: 'https://supportxmr.com/api/pool/stats',
  },
  {
    id: 'nanopool',
    displayName: 'nanopool',
    hostname: 'xmr-eu1.nanopool.org',
    probeUrl: 'https://xmr.nanopool.org/api/v1/pool/hashrate',
  },
  {
    id: 'c3pool',
    displayName: 'C3Pool',
    hostname: 'auto.c3pool.org',
    probeUrl: 'https://api.c3pool.org/pool/stats',
  },
  {
    id: 'xmrpooleu',
    displayName: 'XMRPool EU',
    hostname: 'xmrpool.eu',
    probeUrl: 'https://web.xmrpool.eu/api/pool/stats',
  },
  {
    // Enum storage key is historically misspelled `hashvalt` — do not rename.
    id: 'hashvalt',
    displayName: 'HashVault',
    hostname: 'pool.hashvault.pro',
    probeUrl: 'https://api.hashvault.pro/v3/monero/pool/stats',
  },
  {
    id: 'hashcity',
    displayName: 'HashCity',
    hostname: 'xmr.hashcity.org',
    probeUrl: 'https://xmr.hashcity.org/',
  },
];

const DEFAULT_TIMEOUT_MS = 5000;

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const started = Date.now();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => {
    try {
      controller?.abort();
    } catch {
      // ignore
    }
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller?.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });
    const latencyMs = Date.now() - started;
    // Any HTTP response means the host is reachable for our purposes
    if (response.status > 0) {
      return { ok: true, latencyMs };
    }
    return { ok: false, latencyMs, error: `HTTP ${response.status}` };
  } catch (e: any) {
    const latencyMs = Date.now() - started;
    const message = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network error');
    return { ok: false, latencyMs, error: message };
  } finally {
    clearTimeout(timer);
  }
}

export async function probePool(
  target: PredefinedPoolProbeTarget,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<PoolProbeResult> {
  const result = await fetchWithTimeout(target.probeUrl, timeoutMs);
  if (result.ok) {
    return {
      id: target.id,
      displayName: target.displayName,
      hostname: target.hostname,
      status: 'online',
      latencyMs: result.latencyMs,
      checkedAt: Date.now(),
    };
  }
  return {
    id: target.id,
    displayName: target.displayName,
    hostname: target.hostname,
    status: result.error === 'timeout' ? 'offline' : 'error',
    latencyMs: result.latencyMs,
    error: result.error,
    checkedAt: Date.now(),
  };
}

export async function probeAllPools(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  onPartial?: (result: PoolProbeResult) => void,
): Promise<PoolProbeResult[]> {
  const results = await Promise.all(
    PREDEFINED_POOL_TARGETS.map(async (target) => {
      const result = await probePool(target, timeoutMs);
      onPartial?.(result);
      return result;
    }),
  );
  return results;
}

export function initialCheckingResults(): PoolProbeResult[] {
  return PREDEFINED_POOL_TARGETS.map((t) => ({
    id: t.id,
    displayName: t.displayName,
    hostname: t.hostname,
    status: 'checking' as const,
  }));
}
