import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_URL, SUPABASE_ANON_KEY, isBackendConfigured } from './config';
import { authStorage } from './authStorage';
import type { Database } from './types';

/**
 * The shared Supabase client, or `null` when the backend isn't configured. Every
 * caller must handle the null case (the app runs on mock data without it).
 */
export const supabase: SupabaseClient<Database> | null = isBackendConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        // React Native has no URL to parse an OAuth redirect out of.
        detectSessionInUrl: false,
      },
      // Cap realtime throughput — playback heartbeats are a few per second.
      realtime: { params: { eventsPerSecond: 20 } },
    })
  : null;

// Only auto-refresh the token while the app is foregrounded.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
