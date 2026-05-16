'use client';

import { isSupabaseConfigured, SUPABASE_ENV_ERROR } from '@/lib/supabase/env';

export default function SupabaseConfigBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '0.75rem 1rem',
        background: '#7f1d1d',
        color: '#fecaca',
        fontSize: '0.8125rem',
        lineHeight: 1.45,
        textAlign: 'center',
        borderTop: '1px solid #f87171',
      }}
    >
      <strong>Supabase не настроен на этом хостинге.</strong> {SUPABASE_ENV_ERROR}
    </div>
  );
}
