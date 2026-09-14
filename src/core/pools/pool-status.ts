/**
 * Lightweight pool reachability / latency probes for Pool Presets UI.
 * Stratum ports rarely speak HTTP; a fast connect+fail still counts as online.
 */

export type PoolProbeResult = {
  online: boolean;
  latencyMs: number | null;
  checkedAt: number;
};

export type PoolProbeTarget = {
  key: string;
  hostname: string;
  port: number;
};

const DEFAULT_TIMEOUT_MS = 3500;

export async function probePool(
  hostname: string,
  port: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<PoolProbeResult> {
  const checkedAt = Date.now();
  const start = Date.now();
  const controller = typeof AbortController !== 'undefined'
    ? new AbortController()
    : null;
  const timer = setTimeout(() => {
    if (controller) {
      controller.abort();
    }
  }, timeoutMs);

  try {
    // HEAD to stratum host:port — success or immediate non-timeout failure ⇒ reachable.
    await fetch(`http://${hostname}:${port}/`, {
      method: 'HEAD',
      signal: controller ? controller.signal : undefined,
    } as RequestInit);
    return {
      online: true,
      latencyMs: Date.now() - start,
      checkedAt,
    };
  } catch (err) {
    const ms = Date.now() - start;
    const name = (err as { name?: string })?.name;
    const aborted = name === 'AbortError';
    if (aborted || ms >= timeoutMs - 80) {
      return { online: false, latencyMs: null, checkedAt };
    }
    // TCP open then HTTP error (typical for stratum) → treat as online.
    return { online: true, latencyMs: ms, checkedAt };
  } finally {
    clearTimeout(timer);
  }
}

export async function probePools(
  targets: PoolProbeTarget[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Record<string, PoolProbeResult>> {
  const entries = await Promise.all(
    targets.map(async (t) => {
      const result = await probePool(t.hostname, t.port, timeoutMs);
      return [t.key, result] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Format chip label: Online·42ms / Offline / … */
export function formatPoolStatusChip(result?: PoolProbeResult | null): string {
  if (!result) {
    return '…';
  }
  if (!result.online) {
    return 'Offline';
  }
  if (result.latencyMs == null) {
    return 'Online';
  }
  return `Online·${result.latencyMs}ms`;
}
