'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, FolderPlus } from 'lucide-react';
import { Lesson } from '@/data/lessons';
import { saveLessons } from '@/app/actions/admin';
import styles from './lessons.module.scss';

interface Module {
  number: number;
  title: string;
}

const DEFAULT_MODULES: Module[] = [
  { number: 1, title: 'Модуль 1: Понимание кризиса' },
  { number: 2, title: 'Модуль 2: Источники проблемы' },
  { number: 3, title: 'Модуль 3: Путь к восстановлению' },
];

function nextLessonId(lessons: Lesson[]): string {
  if (lessons.length === 0) return '1';
  // Берём только числовые ID
  const numericIds = lessons.map(l => parseInt(l.id)).filter(n => !isNaN(n));
  if (numericIds.length === 0) return '1';
  return String(Math.max(...numericIds) + 1);
}

const EMPTY_FORM = {
  title: '',
  moduleNumber: 1,
  content: '',
  image: '',
  videoUrl: null as string | null,
};

export default function LessonsAdminClient({ initialLessons }: { initialLessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initialLessons);
  const [modules, setModules] = useState<Module[]>(DEFAULT_MODULES);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Форма нового урока — без ID, он генерируется при сохранении
  const [newForm, setNewForm] = useState(EMPTY_FORM);

  const handleSaveAll = async (updated: Lesson[]) => {
    setSaving(true);
    try {
      await saveLessons(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newForm.title || !newForm.content) return;
    // ID генерируется здесь — на актуальном состоянии lessons
    const id = nextLessonId(lessons);
    const moduleObj = modules.find(m => m.number === newForm.moduleNumber) ?? modules[0];
    const lesson: Lesson = {
      id,
      title: newForm.title,
      module: moduleObj.title,
      moduleNumber: moduleObj.number,
      content: newForm.content,
      image: newForm.image,
      videoUrl: newForm.videoUrl,
    };
    const updated = [...lessons, lesson];
    setLessons(updated);
    await handleSaveAll(updated);
    setNewForm(EMPTY_FORM);
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить урок?')) return;
    const updated = lessons.filter(l => l.id !== id);
    setLessons(updated);
    await handleSaveAll(updated);
  };

  const handleSaveLesson = async (id: string, data: Lesson) => {
    const updated = lessons.map(l => l.id === id ? data : l);
    setLessons(updated);
    await handleSaveAll(updated);
    setEditId(null);
  };

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    const number = modules.length + 1;
    const title = `Модуль ${number}: ${newModuleTitle.trim()}`;
    setModules(p => [...p, { number, title }]);
    setNewModuleTitle('');
    setShowAddModule(false);
  };

  const grouped = modules.map(m => ({
    ...m,
    lessons: lessons.filter(l => l.moduleNumber === m.number),
  }));

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.btnAdd} onClick={() => { setShowAdd(!showAdd); setNewForm(EMPTY_FORM); }}>
          <Plus size={18} /> Добавить урок
        </button>
        <button className={styles.btnAddModule} onClick={() => setShowAddModule(!showAddModule)}>
          <FolderPlus size={18} /> Добавить модуль
        </button>
        {saved && <span className={styles.savedMsg}><Check size={16} /> Сохранено</span>}
        {saving && <span className={styles.savingMsg}>Сохранение...</span>}
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
          saving={saving}
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
                  <button className={`${styles.btnIcon} ${styles.btnDanger}`} onClick={() => handleDelete(lesson.id)}>
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
                  saving={saving}
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
          <label>Видео URL (YouTube embed)</label>
          <input className={styles.input} value={form.videoUrl ?? ''}
            onChange={e => onChange('videoUrl', e.target.value || null)} placeholder="https://youtube.com/embed/..." />
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
    // Синхронизируем module title при смене moduleNumber
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
            onChange={e => set('videoUrl', e.target.value || null)} />
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
