'use client';

import { useState, useTransition } from 'react';
import { updateApplicationStatus, deleteApplication } from '@/app/actions/admin';
import { CheckCircle, Clock, Mail, Phone, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import styles from './applications.module.scss';

const TYPE_LABELS: Record<string, string> = {
  individual: 'Инд. курс',
  consultation: 'Консультация',
  corporate: 'Корпоратив',
  other: 'Другое',
};

export default function ApplicationsClient({ applications: initial }: { applications: any[] }) {
  const [apps, setApps] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'done' ? 'new' : 'done';
    setBusy(id);
    try {
      await updateApplicationStatus(id, next);
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: next } : a));
    } catch (e: any) {
      alert(`Ошибка обновления статуса: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить заявку? Это действие необратимо.')) return;
    setBusy(id);
    try {
      await deleteApplication(id);
      setApps(prev => prev.filter(a => a.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (e: any) {
      alert(`Ошибка удаления: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
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
  );
}
