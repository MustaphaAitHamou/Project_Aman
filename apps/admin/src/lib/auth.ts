import { redirect } from 'next/navigation';

import { createSupabaseServer } from '@/lib/supabase/server';

export type StaffRole = 'moderator' | 'admin';

/**
 * Exige un modérateur (ou administrateur) connecté ; sinon renvoie vers /login.
 * Le rôle est lu en base (fonction current_user_role), jamais depuis le jeton côté client.
 */
export async function requireStaff(minimum: StaffRole = 'moderator') {
  const supabase = await createSupabaseServer();
  if (!supabase) redirect('/login?error=config');
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/login');
  const { data: role } = await supabase.rpc('current_user_role');
  const allowed = minimum === 'admin' ? role === 'admin' : role === 'admin' || role === 'moderator';
  if (!allowed) redirect('/login?error=forbidden');
  return { supabase, user: userData.user, role: role as StaffRole };
}
