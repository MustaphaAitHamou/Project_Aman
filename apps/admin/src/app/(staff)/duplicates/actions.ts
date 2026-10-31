'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';

/** Fusion : le doublon est marqué « fusionné » vers le point conservé (favoris transférés). */
export async function mergeAction(formData: FormData) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc('merge_water_points', {
    duplicate_id: String(formData.get('duplicate')),
    target_id: String(formData.get('target')),
    reason: 'Doublon fusionné depuis l’administration',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/duplicates');
}
