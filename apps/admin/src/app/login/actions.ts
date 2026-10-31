'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServer } from '@/lib/supabase/server';

export async function signInAction(formData: FormData) {
  const supabase = await createSupabaseServer();
  if (!supabase) redirect('/login?error=config');
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect('/login?error=credentials');
  const { data: role } = await supabase.rpc('current_user_role');
  if (role !== 'moderator' && role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/login?error=forbidden');
  }
  redirect('/');
}

export async function signOutAction() {
  const supabase = await createSupabaseServer();
  await supabase?.auth.signOut();
  redirect('/login');
}
