'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { q, now } from '@/lib/db';
import { allow, clientIp } from '@/lib/ratelimit';
import { lookupFamily } from '@/lib/signup';
import type { ActionState } from '@/lib/accounts';

export async function linkChildAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('parent');
  if (!allow('code:' + await clientIp(), 40, 600_000)) return { error: 'Too many tries. Wait 10 minutes.' };
  const kid = lookupFamily(form.get('code'));
  if (!kid) return { error: 'No student has this family code. Your child finds it on their dashboard.' };
  if (q.get('SELECT 1 FROM parent_links WHERE parent_id = ? AND student_id = ?', user.id, kid.id)) return { error: `${kid.name} is already linked to your account.` };
  if ((q.get<{ n: number }>('SELECT COUNT(*) AS n FROM parent_links WHERE parent_id = ?', user.id)!).n >= 6) return { error: 'You can follow up to 6 children.' };
  q.run('INSERT INTO parent_links (parent_id, student_id, created_at) VALUES (?, ?, ?)', user.id, kid.id, now());
  revalidatePath('/parent');
  return { ok: `${kid.name} is now linked to your account.` };
}
