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

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const byRole = user.user_metadata?.role === 'admin';
  const byEmail = Boolean(
    user.email &&
    adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase()
  );

  if (!byRole && !byEmail) {
    return {
      ok: false,
      status: 403,
      reason: `Не админ. email="${user.email}", ADMIN_EMAIL="${adminEmail ?? '(не задан)'}"`,
    };
  }

  return { ok: true, userId: user.id, email: user.email ?? null };
}
