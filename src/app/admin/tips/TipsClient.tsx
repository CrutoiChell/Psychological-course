'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Tip } from '@/data/tips';
import { saveTips } from '@/app/actions/admin';
import styles from './tips.module.scss';

const CATEGORIES = ['Восстановление', 'Сон', 'Границы', 'Энергия', 'Эмоции', 'Отношения'];

export default function TipsClient({ initialTips }: { initialTips: Tip[] }) {
  const [tips, setTips] = useState(initialTips);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'Восстановление', title: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSaveAll = async (updated: Tip[]) => {
    setSaving(true);
    try {
      await saveTips(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!form.title || !form.text) return;
    const newTip: Tip = { id: Date.now().toString(), icon: 'lightbulb', ...form };
    const updated = [...tips, newTip];
    setTips(updated);
    await handleSaveAll(updated);
    setForm({ category: 'Восстановление', title: '', text: '' });
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить совет?')) return;
    const updated = tips.filter(t => t.id !== id);
    setTips(updated);
    await handleSaveAll(updated);
  };

  const handleSaveTip = async (id: string, updated: Partial<Tip>) => {
    const newTips = tips.map(t => t.id === id ? { ...t, ...updated } : t);
    setTips(newTips);
    await handleSaveAll(newTips);
    setEditId(null);
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.btnAdd} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Добавить совет
        </button>
        {saved && <span className={styles.savedMsg}><Check size={16} /> Сохранено</span>}
        {saving && <span className={styles.savingMsg}>Сохранение...</span>}
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
            <button className={styles.btnSave} onClick={handleAdd} disabled={saving}>
              <Check size={16} /> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={16} /> Отмена</button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {tips.map(tip => (
          <TipCard key={tip.id} tip={tip} isEditing={editId === tip.id}
            onEdit={() => setEditId(tip.id)}
            onDelete={() => handleDelete(tip.id)}
            onSave={(u) => handleSaveTip(tip.id, u)}
            onCancel={() => setEditId(null)}
            saving={saving}
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
              {['Восстановление', 'Сон', 'Границы', 'Энергия', 'Эмоции', 'Отношения'].map(c => <option key={c}>{c}</option>)}
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
