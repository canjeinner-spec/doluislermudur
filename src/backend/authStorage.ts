import { storage } from '@/storage/storage';

/**
 * Storage adapter that lets Supabase persist the auth session through our MMKV
 * wrapper (which itself falls back to in-memory when the native module isn't
 * linked, e.g. in Expo Go). Supabase's interface is async, so we resolve the
 * synchronous MMKV reads/writes into promises.
 */
export const authStorage = {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(storage.getString(key) ?? null),
  setItem: (key: string, value: string): Promise<void> => {
    storage.setString(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    storage.remove(key);
    return Promise.resolve();
  },
};
