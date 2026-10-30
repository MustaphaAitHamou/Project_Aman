import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env, isSupabaseConfigured } from '@/config/env';

import { secureSessionStorage } from './secure-storage';

let client: SupabaseClient | null = null;

/**
 * Client Supabase unique (clé publique « anon » uniquement : jamais la clé service_role).
 * Renvoie `null` tant que le projet n'est pas configuré (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(env.supabaseUrl as string, env.supabaseAnonKey as string, {
      auth: {
        storage: secureSessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
    // Rafraîchissement du jeton uniquement au premier plan (recommandation Supabase).
    if (Platform.OS !== 'web') {
      AppState.addEventListener('change', (state) => {
        if (state === 'active') void client?.auth.startAutoRefresh();
        else void client?.auth.stopAutoRefresh();
      });
    }
  }
  return client;
}

/** Traduit les erreurs métier levées par les fonctions SQL en clés stables pour l'interface. */
export function backendErrorCode(error: unknown): string {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : String(error);
  const known = [
    'authentication_required',
    'duplicate_nearby',
    'rate_limited',
    'already_reported',
    'invalid_coordinates',
    'field_not_editable',
    'water_point_not_found',
    'moderator_required',
    'invalid_storage_path',
  ];
  return known.find((code) => message.includes(code)) ?? 'unknown';
}
