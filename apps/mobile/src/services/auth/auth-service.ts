import * as Linking from 'expo-linking';

import { getSupabase } from '@/services/supabase/client';

import { refreshProfile, useSessionStore } from './session';

/** Erreurs d'authentification traduites en clés d'interface stables (`auth.errors.*`). */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'weak_password'
  | 'invalid_email'
  | 'rate_limited'
  | 'network'
  | 'unavailable'
  | 'unknown';

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

/** Correspondance des codes d'erreur Supabase Auth (champ `code`, puis message) vers nos codes. */
export function toAuthErrorCode(error: unknown): AuthErrorCode {
  const code =
    typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined;
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String(error.message).toLowerCase()
      : String(error).toLowerCase();
  if (code === 'invalid_credentials' || message.includes('invalid login credentials'))
    return 'invalid_credentials';
  if (code === 'email_not_confirmed' || message.includes('email not confirmed'))
    return 'email_not_confirmed';
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message.includes('already registered')
  )
    return 'user_already_exists';
  if (code === 'weak_password' || message.includes('password should')) return 'weak_password';
  if (code === 'email_address_invalid' || message.includes('invalid email')) return 'invalid_email';
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    message.includes('rate limit')
  )
    return 'rate_limited';
  if (message.includes('network') || message.includes('fetch')) return 'network';
  return 'unknown';
}

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new AuthError('unavailable');
  return supabase;
}

const fail = (error: unknown): never => {
  throw error instanceof AuthError ? error : new AuthError(toAuthErrorCode(error));
};

/** Longueur minimale imposée côté application (le projet Supabase doit appliquer la même règle). */
export const MIN_PASSWORD_LENGTH = 8;

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
  if (error) fail(error);
}

/**
 * Inscription. Si la confirmation d'adresse est activée (recommandé), aucune session n'est ouverte
 * avant le clic sur le lien reçu par e-mail : `needsConfirmation` vaut alors `true`.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await client().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: displayName.trim() || null },
      emailRedirectTo: Linking.createURL('/sign-in'),
    },
  });
  if (error) fail(error);
  return { needsConfirmation: !data.session };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await client().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('/sign-in'),
  });
  if (error) fail(error);
}

export async function signOut(): Promise<void> {
  const { error } = await client().auth.signOut();
  if (error) fail(error);
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const supabase = client();
  const userId = useSessionStore.getState().session?.user.id;
  if (!userId) throw new AuthError('unknown');
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() || null })
    .eq('id', userId);
  if (error) fail(error);
  await refreshProfile();
}

/**
 * Suppression définitive du compte (droit à l'effacement) : le profil, les favoris, les
 * notifications et les préférences sont supprimés en cascade ; les contributions publiées
 * restent, anonymisées.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = client();
  const { error } = await supabase.rpc('delete_my_account');
  if (error) fail(error);
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  useSessionStore.getState().setSession(null);
}
