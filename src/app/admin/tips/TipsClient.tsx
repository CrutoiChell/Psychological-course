'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Tip } from '@/data/tips';
import AdminEmptyBanner from '@/components/AdminEmptyBanner/AdminEmptyBanner';
import styles from './tips.module.scss';

const CATEGORIES = ['Восстановление', 'Сон', 'Границы', 'Энергия', 'Эмоции', 'Отношения'];

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

export default function TipsClient({ initialTips, dbEmpty }: { initialTips: Tip[]; dbEmpty?: boolean }) {
  const router = useRouter();
  const [tips, setTips] = useState(initialTips);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'Восстановление', title: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const flashOk = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = async () => {
    if (!form.title || !form.text) { setError('Заполните заголовок и текст'); return; }
    setBusy(true);
    setError(null);
    try {
      const { tip } = await apiJson('/api/admin/tips', {
        method: 'POST',
        body: JSON.stringify({ ...form, icon: 'lightbulb' }),
      });
      setTips(p => [...p, tip]);
      setForm({ category: 'Восстановление', title: '', text: '' });
      setShowAdd(false);
      flashOk();
      router.refresh();
    } catch (e: any) {
      console.error('[tips] add failed', e);
      setError(e?.message || 'Ошибка создания');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить совет?')) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson(`/api/admin/tips/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setTips(p => p.filter(t => t.id !== id));
      flashOk();
      router.refresh();
    } catch (e: any) {
      console.error('[tips] delete failed', e);
      setError(e?.message || 'Ошибка удаления');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveTip = async (id: string, updated: Partial<Tip>) => {
    setBusy(true);
    setError(null);
    try {
      const { tip } = await apiJson(`/api/admin/tips/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      });
      setTips(p => p.map(t => t.id === id ? tip : t));
      setEditId(null);
      flashOk();
      router.refresh();
    } catch (e: any) {
      console.error('[tips] patch failed', e);
      setError(e?.message || 'Ошибка обновления');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {dbEmpty && <AdminEmptyBanner type="tips" />}
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
      <div className={styles.toolbar}>
        <button className={styles.btnAdd} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Добавить совет
        </button>
        {saved && <span className={styles.savedMsg}><Check size={16} /> Сохранено</span>}
        {busy && <span className={styles.savingMsg}>Сохранение...</span>}
      </div>

      {showAdd && (
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Категория</label>
              <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Заголовок</label>
              <input className={styles.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Название совета" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Текст совета</label>
            <textarea className={styles.textarea} value={form.text} onChange={e => set('text', e.target.value)} placeholder="Текст совета..." />
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnSave} onClick={handleAdd} disabled={busy}>
              <Check size={16} /> {busy ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={16} /> Отмена</button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {tips.map(tip => (
          <TipCard
            key={tip.id}
            tip={tip}
            isEditing={editId === tip.id}
            onEdit={() => setEditId(tip.id)}
            onDelete={() => handleDelete(tip.id)}
            onSave={(u) => handleSaveTip(tip.id, u)}
            onCancel={() => setEditId(null)}
            saving={busy}
          />
        ))}
      </div>
    </div>
  );
}

function TipCard({ tip, isEditing, onEdit, onDelete, onSave, onCancel, saving }: {
  tip: Tip; isEditing: boolean; saving: boolean;
  onEdit: () => void; onDelete: () => void;
  onSave: (u: Partial<Tip>) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ category: tip.category, title: tip.title, text: tip.text });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (isEditing) {
    return (
      <div className={styles.card}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Категория</label>
            <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Заголовок</label>
            <input className={styles.input} value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Текст</label>
          <textarea className={styles.textarea} value={form.text} onChange={e => set('text', e.target.value)} />
        </div>
        <div className={styles.formActions}>
          <button className={styles.btnSave} onClick={() => onSave(form)} disabled={saving}>
            <Check size={16} /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button className={styles.btnCancel} onClick={onCancel}><X size={16} /> Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.category}>{tip.category}</span>
          <div className={styles.tipTitle}>{tip.title}</div>
        </div>
        <div className={styles.cardActions}>
          <button className={styles.btnIcon} onClick={onEdit}><Pencil size={16} /></button>
          <button className={`${styles.btnIcon} ${styles.btnIconDanger}`} onClick={onDelete}><Trash2 size={16} /></button>
        </div>
      </div>
      <p className={styles.tipText}>{tip.text}</p>
    </div>
  );
}
