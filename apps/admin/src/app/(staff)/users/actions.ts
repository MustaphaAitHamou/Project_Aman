'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';

export async function setRoleAction(formData: FormData) {
  const { supabase } = await requireStaff('admin');
  const role = String(formData.get('role'));
  if (!['user', 'moderator', 'admin'].includes(role)) throw new Error('invalid');
  const { error } = await supabase.rpc('set_user_role', {
    target_user: String(formData.get('user')),
    new_role: role,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/users');
}
