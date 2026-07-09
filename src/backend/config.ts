/**
 * Backend configuration. Credentials come from Expo public env vars (inlined by
 * Metro at build time when prefixed EXPO_PUBLIC_). Copy `.env.example` to `.env`
 * and fill these in after creating a Supabase project — see docs/BACKEND.md.
 *
 * When they're absent the whole backend layer stays inert and ASTERA runs
 * exactly as before on local mock data, so the app never hard-depends on a
 * network service to boot.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True once both credentials are present — gates every backend call. */
export const isBackendConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;
