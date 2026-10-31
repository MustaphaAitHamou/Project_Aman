import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { create } from 'zustand';

import { getSupabase } from '@/services/supabase/client';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface Profile {
  id: string;
  displayName: string | null;
  role: UserRole;
}

export type AuthStatus = 'unavailable' | 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setUnavailable: () => void;
}

/**
 * Session de l'utilisateur. La session elle-même est conservée par Supabase dans le stockage
 * sécurisé de l'appareil ; ce store n'en garde qu'une copie en mémoire pour l'interface.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  status: 'loading',
  session: null,
  profile: null,
  setSession: (session) =>
    set((state) => ({
      session,
      status: session ? 'signedIn' : 'signedOut',
      profile: session && state.profile?.id === session.user.id ? state.profile : null,
    })),
  setProfile: (profile) => set({ profile }),
  setUnavailable: () => set({ status: 'unavailable', session: null, profile: null }),
}));

const ROLES: readonly UserRole[] = ['user', 'moderator', 'admin'];

async function loadProfile(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return;
  const row = data as { id: string; display_name: string | null; role: string };
  if (useSessionStore.getState().session?.user.id !== row.id) return;
  useSessionStore.getState().setProfile({
    id: row.id,
    displayName: row.display_name,
    role: ROLES.includes(row.role as UserRole) ? (row.role as UserRole) : 'user',
  });
}

/** Synchronise le store avec Supabase Auth (à monter une seule fois, dans le layout racine). */
export function useAuthListener(): void {
  useEffect(() => {
    const supabase = getSupabase();
    const store = useSessionStore.getState();
    if (!supabase) {
      store.setUnavailable();
      return;
    }
    const apply = (session: Session | null) => {
      useSessionStore.getState().setSession(session);
      if (session) void loadProfile(supabase, session.user.id);
    };
    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => apply(null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => data.subscription.unsubscribe();
  }, []);
}

/** Identifiant de l'utilisateur connecté, ou `null`. */
export function useUserId(): string | null {
  return useSessionStore((state) => state.session?.user.id ?? null);
}

/** Rafraîchit le profil (ex. après modification du pseudonyme). */
export async function refreshProfile(): Promise<void> {
  const supabase = getSupabase();
  const userId = useSessionStore.getState().session?.user.id;
  if (supabase && userId) await loadProfile(supabase, userId);
}
