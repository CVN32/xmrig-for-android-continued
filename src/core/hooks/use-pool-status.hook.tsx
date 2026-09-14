import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initialCheckingResults,
  PoolProbeResult,
  probeAllPools,
} from '../pools/pool-status';

const REFRESH_INTERVAL_MS = 20000;

/**
 * Live predefined-pool status. Refresh on mount, AppState focus, and interval.
 * Cancels in-flight work on unmount. Informational only — never blocks mining.
 */
export const usePoolStatus = (enabled: boolean = true) => {
  const [results, setResults] = React.useState<PoolProbeResult[]>(initialCheckingResults);
  const [refreshing, setRefreshing] = React.useState(false);
  const mountedRef = React.useRef(true);
  const runIdRef = React.useRef(0);

  const refresh = React.useCallback(async () => {
    if (!enabled) {
      return;
    }
    const runId = ++runIdRef.current;
    setRefreshing(true);
    setResults((prev) => prev.map((r) => ({ ...r, status: 'checking' as const })));

    try {
      await probeAllPools(5000, (partial) => {
        if (!mountedRef.current || runId !== runIdRef.current) {
          return;
        }
        setResults((prev) => {
          const next = [...prev];
          const idx = next.findIndex((p) => p.id === partial.id);
          if (idx >= 0) {
            next[idx] = partial;
          } else {
            next.push(partial);
          }
          return next;
        });
      });
    } finally {
      if (mountedRef.current && runId === runIdRef.current) {
        setRefreshing(false);
      }
    }
  }, [enabled]);

  React.useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      refresh();
    }
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
    };
  }, [enabled, refresh]);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const id = setInterval(() => {
      refresh();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        refresh();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      // RN 0.68 may return subscription with remove()
      // @ts-ignore
      if (sub?.remove) {
        sub.remove();
      } else {
        // older API
        // @ts-ignore
        AppState.removeEventListener?.('change', onChange);
      }
    };
  }, [enabled, refresh]);

  return { results, refreshing, refresh };
};
