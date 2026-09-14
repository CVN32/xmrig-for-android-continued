import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@xmrig_continued/recent_wallets';
const MAX_RECENT = 5;

/** Strip common pool username suffixes (difficulty / worker) for storage. */
export function normalizeWalletCandidate(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return '';
  }
  // Keep only the address-like prefix before + . /
  const base = trimmed.split(/[+./]/)[0] || trimmed;
  return base.trim();
}

export async function loadRecentWallets(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((x) => typeof x === 'string' && x.length > 0).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function rememberWallet(address: string): Promise<string[]> {
  const normalized = normalizeWalletCandidate(address);
  if (!normalized || normalized.length < 20) {
    return loadRecentWallets();
  }
  const prev = await loadRecentWallets();
  const next = [normalized, ...prev.filter((w) => w !== normalized)].slice(0, MAX_RECENT);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}
