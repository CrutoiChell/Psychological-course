/** Публичные переменные Supabase (доступны и на сервере, и в браузере). */
export function getPublicSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseEnv() !== null;
}

export const SUPABASE_ENV_ERROR =
  'Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
  'Добавьте их в Vercel → Settings → Environment Variables и сделайте Redeploy.';
