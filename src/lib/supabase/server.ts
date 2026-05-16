import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicSupabaseEnv, SUPABASE_ENV_ERROR } from './env';

export async function createClient() {
  const env = getPublicSupabaseEnv();
  if (!env) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component — cookies read-only
        }
      },
    },
  });
}
