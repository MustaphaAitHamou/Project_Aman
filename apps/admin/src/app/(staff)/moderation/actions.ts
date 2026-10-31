'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';

const FUNCTIONS = {
  water_point: ['moderate_water_point', 'point_id'],
  report: ['moderate_report', 'report_id'],
  revision: ['moderate_revision', 'revision_id'],
  photo: ['moderate_photo', 'photo_id'],
} as const;

type Target = keyof typeof FUNCTIONS;

/** Décision de modération : exécutée avec la session du modérateur (contrôlée en SQL). */
export async function moderateAction(formData: FormData) {
  const { supabase } = await requireStaff();
  const target = String(formData.get('target')) as Target;
  const decision = String(formData.get('decision'));
  const id = String(formData.get('id'));
  const reason =
    String(formData.get('reason') ?? '')
      .trim()
      .slice(0, 500) || null;
  const entry = FUNCTIONS[target];
  if (!entry || (decision !== 'approve' && decision !== 'reject')) throw new Error('invalid');
  const [fn, idParam] = entry;
  const { error } = await supabase.rpc(fn, { [idParam]: id, decision, reason });
  if (error) throw new Error(error.message);
  revalidatePath('/moderation');
  revalidatePath('/');
}
