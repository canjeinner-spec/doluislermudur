/**
 * Thin persistence wrapper around react-native-mmkv.
 *
 * MMKV requires the New Architecture / a native build. When ASTERA runs in an
 * environment where the native module isn't linked (e.g. a bare Expo Go
 * session), we transparently fall back to an in-memory store so the UI keeps
 * working. All callers use the same async-free API.
 */

interface KeyValue {
  getString(key: string): string | undefined;
  set(key: string, value: string | boolean | number): void;
  getBoolean(key: string): boolean | undefined;
  delete(key: string): void;
}

function createMemoryStore(): KeyValue {
  const map = new Map<string, string | boolean | number>();
  return {
    getString: (k) => {
      const v = map.get(k);
      return typeof v === 'string' ? v : undefined;
    },
    getBoolean: (k) => {
      const v = map.get(k);
      return typeof v === 'boolean' ? v : undefined;
    },
    set: (k, v) => {
      map.set(k, v);
    },
    delete: (k) => {
      map.delete(k);
    },
  };
}

let store: KeyValue;
try {
  // Lazy require so a missing native module doesn't crash the bundle at import.
  const { MMKV } = require('react-native-mmkv');
  store = new MMKV({ id: 'astera.v1' });
} catch {
  store = createMemoryStore();
}

export const storage = {
  getString: (key: string) => store.getString(key),
  setString: (key: string, value: string) => store.set(key, value),
  getBool: (key: string) => store.getBoolean(key),
  setBool: (key: string, value: boolean) => store.set(key, value),
  getJSON<T>(key: string, fallback: T): T {
    const raw = store.getString(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  setJSON<T>(key: string, value: T) {
    store.set(key, JSON.stringify(value));
  },
  remove: (key: string) => store.delete(key),
};

export const StorageKeys = {
  authedPlatforms: 'auth.platforms',
  settings: 'user.settings',
  displayName: 'user.displayName',
  onboardingDone: 'onboarding.done',
} as const;
