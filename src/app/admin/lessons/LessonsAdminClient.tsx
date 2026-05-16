'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, FolderPlus } from 'lucide-react';
import { Lesson } from '@/data/lessons';
import { VIDEO_URL_HINT } from '@/lib/embed-url';
import AdminEmptyBanner from '@/components/AdminEmptyBanner/AdminEmptyBanner';
import styles from './lessons.module.scss';

interface Module {
  number: number;
  title: string;
}

const EMPTY_FORM = {
  title: '',
  moduleNumber: 1,
  content: '',
  image: '',
  videoUrl: null as string | null,
};

async function apiJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    const msg = body?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export default function LessonsAdminClient({ initialLessons, dbEmpty }: { initialLessons: Lesson[]; dbEmpty?: boolean }) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesTableMissing, setModulesTableMissing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newForm, setNewForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/modules');
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setModules(body.modules ?? []);
          setModulesTableMissing(Boolean(body.tableMissing));
        }
      } catch (e) {
        console.error('[lessons] modules load failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const flashOk = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = async () => {
    if (!newForm.title || !newForm.content) {
      setError('Заполните название и содержание урока');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const moduleObj = modules.find(m => m.number === newForm.moduleNumber) ?? modules[0];
      const { lesson } = await apiJson('/api/admin/lessons', {
        method: 'POST',
        body: JSON.stringify({
          title: newForm.title,
          module: moduleObj.title,
          moduleNumber: moduleObj.number,
          content: newForm.content,
          image: newForm.image || null,
          videoUrl: newForm.videoUrl || null,
        }),
      });
      setLessons(p => [...p, lesson]);
      flashOk();
      setNewForm(EMPTY_FORM);
      setShowAdd(false);
      router.refresh();
    } catch (e: any) {
      console.error('[lessons] add failed', e);
      setError(e?.message || 'Ошибка создания');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить урок?')) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson(`/api/admin/lessons/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setLessons(p => p.filter(l => l.id !== id));
      flashOk();
      router.refresh();
    } catch (e: any) {
      console.error('[lessons] delete failed', e);
      setError(e?.message || 'Ошибка удаления');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveLesson = async (id: string, data: Lesson) => {
    setBusy(true);
    setError(null);
    try {
      const { lesson } = await apiJson(`/api/admin/lessons/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setLessons(p => p.map(l => l.id === id ? lesson : l));
      flashOk();
      setEditId(null);
      router.refresh();
    } catch (e: any) {
      console.error('[lessons] update failed', e);
      setError(e?.message || 'Ошибка обновления');
    } finally {
      setBusy(false);
    }
  };

  const handleAddModule = async () => {
    const title = newModuleTitle.trim();
    if (!title) return;
    setBusy(true);
    setError(null);
    try {
      const { module } = await apiJson('/api/admin/modules', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setModules(p => [...p, module].sort((a, b) => a.number - b.number));
      setNewModuleTitle('');
      setShowAddModule(false);
      flashOk();
      router.refresh();
    } catch (e: any) {
      console.error('[modules] add failed', e);
      setError(e?.message || 'Ошибка создания модуля');
    } finally {
      setBusy(false);
    }
  };

  const grouped = modules.map(m => ({
    ...m,
    lessons: lessons.filter(l => l.moduleNumber === m.number),
  }));

  return (
    <div>
      {modulesTableMissing && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          color: '#fde68a',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>
          <strong>Таблица модулей ещё не создана.</strong> Чтобы можно было сохранять новые модули,
          откройте Supabase → SQL Editor и выполните:
          <pre style={{ marginTop: 8, padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 6, overflowX: 'auto', fontSize: '0.78rem' }}>
{`CREATE TABLE IF NOT EXISTS modules_content (
  number INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE modules_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read modules" ON modules_content FOR SELECT USING (true);
CREATE POLICY "Service write modules" ON modules_content FOR ALL USING (true);`}
          </pre>
          А затем в терминале: <code>node scripts/setup-modules-table.mjs</code>
        </div>
      )}
      {dbEmpty && <AdminEmptyBanner type="lessons" />}
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
          <button
            type="button"
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      )}
      <div className={styles.toolbar}>
        <button className={styles.btnAdd} onClick={() => { setShowAdd(!showAdd); setNewForm(EMPTY_FORM); }}>
          <Plus size={18} /> Добавить урок
        </button>
        <button className={styles.btnAddModule} onClick={() => setShowAddModule(!showAddModule)}>
          <FolderPlus size={18} /> Добавить модуль
        </button>
        {saved && <span className={styles.savedMsg}><Check size={16} /> Сохранено</span>}
        {busy && <span className={styles.savingMsg}>Сохранение...</span>}
      </div>

      {showAddModule && (
        <div className={styles.addModuleForm}>
          <div className={styles.formGroup}>
            <label>Название модуля</label>
            <div className={styles.moduleInputRow}>
              <input
                className={styles.input}
                value={newModuleTitle}
                onChange={e => setNewModuleTitle(e.target.value)}
                placeholder="Например: Профилактика и поддержка"
                onKeyDown={e => e.key === 'Enter' && handleAddModule()}
              />
              <button className={styles.btnSave} onClick={handleAddModule}>
                <Check size={16} /> Добавить
              </button>
              <button className={styles.btnCancel} onClick={() => setShowAddModule(false)}>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <LessonForm
          form={newForm}
          modules={modules}
          onChange={(k, v) => setNewForm(p => ({ ...p, [k]: v }))}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={busy}
        />
      )}

      {grouped.map(module => (
        <div key={module.number} className={styles.moduleGroup}>
          <div className={styles.moduleTitle}>
            <span className={styles.moduleNum}>{module.number}</span>
            {module.title}
            <span className={styles.moduleCount}>{module.lessons.length} уроков</span>
          </div>

          {module.lessons.length === 0 && (
            <div className={styles.empty}>Нет уроков в этом модуле</div>
          )}

          {module.lessons.map(lesson => (
            <div key={lesson.id} className={styles.lessonCard}>
              <div className={styles.lessonHeader} onClick={() => setExpanded(expanded === lesson.id ? null : lesson.id)}>
                <div className={styles.lessonMeta}>
                  <span className={styles.lessonId}>#{lesson.id}</span>
                  <span className={styles.lessonTitle}>{lesson.title || <span style={{ opacity: 0.4 }}>Без названия</span>}</span>
                </div>
                <div className={styles.lessonActions} onClick={e => e.stopPropagation()}>
                  <button className={styles.btnIcon} onClick={() => setEditId(editId === lesson.id ? null : lesson.id)}>
                    <Pencil size={15} />
                  </button>
                  <button className={`${styles.btnIcon} ${styles.btnDanger}`} onClick={() => handleDelete(lesson.id)} disabled={busy}>
                    <Trash2 size={15} />
                  </button>
                  {expanded === lesson.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {editId === lesson.id && (
                <EditLessonForm
                  lesson={lesson}
                  modules={modules}
                  onSave={(data) => handleSaveLesson(lesson.id, data)}
                  onCancel={() => setEditId(null)}
                  saving={busy}
                />
              )}

              {expanded === lesson.id && editId !== lesson.id && (
                <div className={styles.lessonPreview}>
                  {lesson.image && <img src={lesson.image} alt={lesson.title} className={styles.lessonImg} />}
                  <p className={styles.lessonContent}>{lesson.content.slice(0, 300)}{lesson.content.length > 300 ? '...' : ''}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function LessonForm({ form, modules, onChange, onSave, onCancel, saving }: {
  form: typeof EMPTY_FORM;
  modules: Module[];
  onChange: (k: string, v: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className={styles.form}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Название урока *</label>
          <input className={styles.input} value={form.title}
            onChange={e => onChange('title', e.target.value)} placeholder="Название урока" />
        </div>
        <div className={styles.formGroup}>
          <label>Модуль</label>
          <select className={styles.select} value={form.moduleNumber}
            onChange={e => onChange('moduleNumber', parseInt(e.target.value))}>
            {modules.map(m => <option key={m.number} value={m.number}>{m.title}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Картинка (путь в /public)</label>
          <input className={styles.input} value={form.image ?? ''}
            onChange={e => onChange('image', e.target.value)} placeholder="/image_0.jpg" />
        </div>
        <div className={styles.formGroup}>
          <label>Видео URL</label>
          <input className={styles.input} value={form.videoUrl ?? ''}
            onChange={e => onChange('videoUrl', e.target.value || null)}
            placeholder="https://rutube.ru/video/..." title={VIDEO_URL_HINT} />
          <span className={styles.fieldHint}>{VIDEO_URL_HINT}</span>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label>Содержание урока *</label>
        <textarea className={styles.textarea} value={form.content}
          onChange={e => onChange('content', e.target.value)} placeholder="Текст урока..." />
      </div>
      <div className={styles.formActions}>
        <button className={styles.btnSave} onClick={onSave} disabled={saving}>
          <Check size={16} /> {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button className={styles.btnCancel} onClick={onCancel}><X size={16} /> Отмена</button>
      </div>
    </div>
  );
}

function EditLessonForm({ lesson, modules, onSave, onCancel, saving }: {
  lesson: Lesson;
  modules: Module[];
  onSave: (data: Lesson) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [data, setData] = useState({ ...lesson });
  const set = (k: string, v: any) => setData(p => {
    const updated = { ...p, [k]: v };
    if (k === 'moduleNumber') {
      const m = modules.find(x => x.number === v);
      if (m) updated.module = m.title;
    }
    return updated;
  });

  return (
    <div className={styles.form}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Название урока *</label>
          <input className={styles.input} value={data.title}
            onChange={e => set('title', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Модуль</label>
          <select className={styles.select} value={data.moduleNumber}
            onChange={e => set('moduleNumber', parseInt(e.target.value))}>
            {modules.map(m => <option key={m.number} value={m.number}>{m.title}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Картинка</label>
          <input className={styles.input} value={data.image ?? ''}
            onChange={e => set('image', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>Видео URL</label>
          <input className={styles.input} value={data.videoUrl ?? ''}
            onChange={e => set('videoUrl', e.target.value || null)}
            placeholder="https://rutube.ru/video/..." title={VIDEO_URL_HINT} />
          <span className={styles.fieldHint}>{VIDEO_URL_HINT}</span>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label>Содержание *</label>
        <textarea className={styles.textarea} value={data.content}
          onChange={e => set('content', e.target.value)} />
      </div>
      <div className={styles.formActions}>
        <button className={styles.btnSave} onClick={() => onSave(data)} disabled={saving}>
          <Check size={16} /> {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button className={styles.btnCancel} onClick={onCancel}><X size={16} /> Отмена</button>
      </div>
    </div>
  );
}
