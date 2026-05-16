'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Mail, Phone, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import styles from './applications.module.scss';

const TYPE_LABELS: Record<string, string> = {
  individual: 'Инд. курс',
  consultation: 'Консультация',
  corporate: 'Корпоратив',
  other: 'Другое',
};

async function apiJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* no body */ }
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}

export default function ApplicationsClient({ applications: initial }: { applications: any[] }) {
  const router = useRouter();
  const [apps, setApps] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'done' ? 'new' : 'done';
    setBusy(id);
    setError(null);
    try {
      await apiJson(`/api/admin/applications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: next } : a));
      router.refresh();
    } catch (e: any) {
      console.error('[applications] toggle failed', e);
      setError(e?.message || 'Ошибка обновления');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить заявку? Это действие необратимо.')) return;
    setBusy(id);
    setError(null);
    try {
      await apiJson(`/api/admin/applications/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setApps(prev => prev.filter(a => a.id !== id));
      if (expanded === id) setExpanded(null);
      router.refresh();
    } catch (e: any) {
      console.error('[applications] delete failed', e);
      setError(e?.message || 'Ошибка удаления');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.12)',
          border: '1px solid rgba(248,113,113,0.4)',
          color: '#fecaca',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
        }}>
          <strong>Ошибка:</strong> {error}
          <button type="button" onClick={() => setError(null)} style={{ float: 'right', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>
      )}
      <div className={styles.list}>
        {apps.length === 0 && (
          <div className={styles.empty}>Заявок пока нет</div>
        )}
        {apps.map(app => (
          <div key={app.id} className={`${styles.card} ${app.status === 'done' ? styles.done : ''}`}>
            <div className={styles.cardHeader} onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
              <div className={styles.cardLeft}>
                <div className={styles.cardName}>{app.name}</div>
                <div className={styles.cardMeta}>
                  <span><Mail size={13} /> {app.email}</span>
                  {app.phone && <span><Phone size={13} /> {app.phone}</span>}
                </div>
              </div>
              <div className={styles.cardRight}>
                <span className={styles.typeBadge}>{TYPE_LABELS[app.type] ?? app.type}</span>
                <span className={`${styles.statusBadge} ${app.status === 'done' ? styles.statusDone : styles.statusNew}`}>
                  {app.status === 'done' ? <><CheckCircle size={13} /> Обработана</> : <><Clock size={13} /> Новая</>}
                </span>
                <span className={styles.date}>{new Date(app.created_at).toLocaleDateString('ru-RU')}</span>
                {expanded === app.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expanded === app.id && (
              <div className={styles.cardBody}>
                <p className={styles.message}>{app.message}</p>
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.btnStatus} ${app.status === 'done' ? styles.btnUndo : styles.btnDone}`}
                    onClick={() => toggleStatus(app.id, app.status ?? 'new')}
                    disabled={busy === app.id}
                  >
                    {busy === app.id ? 'Подождите...' : (app.status === 'done' ? 'Вернуть в новые' : 'Отметить обработанной')}
                  </button>
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDelete(app.id)}
                    disabled={busy === app.id}
                    title="Удалить заявку"
                  >
                    <Trash2 size={14} /> Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
