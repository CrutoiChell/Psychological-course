'use client';

import { useEffect } from 'react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[admin/error.tsx]', error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', maxWidth: 720 }}>
      <h1 style={{ color: '#f87171', marginBottom: '0.5rem' }}>В админке упало что-то на сервере</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
        Это означает либо отсутствие переменных окружения, либо проблема с Supabase. Подробности — ниже.
      </p>
      <pre style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(248,113,113,0.4)',
        borderRadius: 8,
        padding: '0.875rem 1rem',
        color: '#fecaca',
        fontSize: '0.85rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
{error.message}
{error.digest ? `\n\ndigest: ${error.digest}` : ''}
      </pre>
      <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
        Чек-лист для прода (Vercel → Project → Settings → Environment Variables): NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY, <strong>SUPABASE_SERVICE_ROLE_KEY</strong>, ADMIN_EMAIL,
        NEXT_PUBLIC_ADMIN_EMAIL. После изменения переменных — Redeploy.
      </p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: '1rem',
          padding: '0.55rem 1rem',
          borderRadius: 8,
          background: '#a78bfa',
          border: 'none',
          color: '#0b0c10',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Попробовать ещё раз
      </button>
    </div>
  );
}
