'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseEnv } from './env';

let browserClient: SupabaseClient | null = null;

/** Возвращает клиент или null, если env не заданы (прод без переменных Vercel). */
export function createClient(): SupabaseClient | null {
  const env = getPublicSupabaseEnv();
  if (!env) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey);
  }
  return browserClient;
}

export { isSupabaseConfigured, SUPABASE_ENV_ERROR } from './env';
