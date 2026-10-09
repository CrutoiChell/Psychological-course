import { createClient } from '@/lib/supabase/server';

export type AdminCheck =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; reason: string };

export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, status: 401, reason: 'Не авторизован' };
  }

  // Only a trusted server with the service-role key can grant app_metadata.
  // user_metadata and the user's email are not authorization sources.
  if (user.app_metadata?.role !== 'admin') {
    return {
      ok: false,
      status: 403,
      reason: 'Нет прав администратора',
    };
  }

  return { ok: true, userId: user.id, email: user.email ?? null };
}
