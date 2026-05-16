'use client';

import { useState } from 'react';

export default function DebugButtons() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const push = (s: string) => setLog(l => [...l, `${new Date().toLocaleTimeString()}  ${s}`]);

  const ping = async (label: string, fn: () => Promise<any>) => {
    push(`▶ ${label}…`);
    try {
      const r = await fn();
      push(`✓ ${label}: ${JSON.stringify(r).slice(0, 300)}`);
    } catch (e: any) {
      push(`✗ ${label}: ${e?.message || e}`);
    }
  };

  const run = async () => {
    setBusy(true);
    setLog([]);

    await ping('GET /api/admin/lessons', async () => {
      const res = await fetch('/api/admin/lessons');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      return { count: body.lessons?.length ?? 0 };
    });

    let createdId: string | null = null;
    await ping('POST /api/admin/lessons (создать diag_lesson)', async () => {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `diag_${Date.now()}`,
          title: 'Diag lesson',
          module: 'Diag module',
          moduleNumber: 99,
          content: 'created from /admin/debug',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      createdId = body.lesson?.id;
      return body.lesson;
    });

    if (createdId) {
      await ping(`DELETE /api/admin/lessons/${createdId}`, async () => {
        const res = await fetch(`/api/admin/lessons/${createdId}`, { method: 'DELETE' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        return body;
      });
    }

    setBusy(false);
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{
          padding: '0.75rem 1.25rem',
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'Тестируем…' : 'Прогнать API-тесты'}
      </button>

      {log.length > 0 && (
        <pre style={{
          marginTop: '1rem',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          fontSize: '0.8125rem',
          color: '#e5e7eb',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {log.join('\n')}
        </pre>
      )}
    </div>
  );
}
