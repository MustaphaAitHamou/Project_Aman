import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { supabaseConfig } from '@/lib/env';

/**
 * Client Supabase côté serveur, lié à la session de l'utilisateur (cookies). Les requêtes
 * s'exécutent avec SES droits : RLS et fonctions SQL vérifient le rôle de modérateur.
 */
export async function createSupabaseServer() {
  const config = supabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet)
            cookieStore.set(name, value, options);
        } catch {
          // Appel depuis un composant serveur : le rafraîchissement est fait par proxy.ts.
        }
      },
    },
  });
}
