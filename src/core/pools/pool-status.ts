import { NativeModules } from 'react-native';

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

type NativeProbeResult = {
  online?: boolean;
  latencyMs?: number | null;
};

const DEFAULT_TIMEOUT_MS = 3500;
const { XMRigForAndroid } = NativeModules;

export async function probePool(
  hostname: string,
  port: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<PoolProbeResult> {
  const checkedAt = Date.now();

  if (!XMRigForAndroid?.probeTcp) {
    return {
      online: false,
      latencyMs: null,
      checkedAt,
    };
  }

  try {
    const result: NativeProbeResult = await XMRigForAndroid.probeTcp(
      hostname,
      port,
      timeoutMs,
    );
    return {
      online: result.online === true,
      latencyMs: typeof result.latencyMs === 'number' ? result.latencyMs : null,
      checkedAt,
    };
  } catch {
    return {
      online: false,
      latencyMs: null,
      checkedAt,
    };
  }
}

export async function probePools(
  targets: PoolProbeTarget[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Record<string, PoolProbeResult>> {
  const entries = await Promise.all(
    targets.map(async (target) => {
      const result = await probePool(target.hostname, target.port, timeoutMs);
      return [target.key, result] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function formatPoolStatusChip(result?: PoolProbeResult | null): string {
  if (!result) {
    return 'Checking…';
  }
  if (!result.online) {
    return 'Offline';
  }
  if (result.latencyMs == null) {
    return 'Online';
  }
  return `Online · ${Math.round(result.latencyMs)}ms`;
}
