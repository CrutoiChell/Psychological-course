'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { Test } from '@/data/tests';
import { saveTests } from '@/app/actions/admin';
import styles from './tests.module.scss';

const DEFAULT_OPTIONS = ['Никогда', 'Редко', 'Иногда', 'Часто', 'Почти всегда'];

const emptyTest = (): Test => ({
  id: `test_${Date.now()}`,
  title: '',
  description: '',
  icon: 'bar-chart',
  showPercent: true,
  questions: [],
  results: [
    { minPercent: 0, maxPercent: 39, level: 'Низкий уровень', color: '#4ade80', emoji: 'green', description: '' },
    { minPercent: 40, maxPercent: 69, level: 'Средний уровень', color: '#fb923c', emoji: 'orange', description: '' },
    { minPercent: 70, maxPercent: 100, level: 'Высокий уровень', color: '#f87171', emoji: 'red', description: '' },
  ],
});

export default function TestsAdminClient({ initialTests }: { initialTests: Test[] }) {
  const [tests, setTests] = useState(initialTests);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editTest, setEditTest] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTest, setNewTest] = useState<Test>(emptyTest());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => setExpanded(p => p === id ? null : id);

  const handleSaveAll = async (updated: Test[]) => {
    setSaving(true);
    try {
      await saveTests(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(`Ошибка: ${e.message}\n\nСоздайте таблицу tests_content в Supabase (см. SUPABASE_SETUP.md)`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTest = async () => {
    if (!newTest.title) return;
    const updated = [...tests, newTest];
    setTests(updated);
    await handleSaveAll(updated);
    setNewTest(emptyTest());
    setShowAdd(false);
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Удалить тест?')) return;
    const updated = tests.filter(t => t.id !== id);
    setTests(updated);
    await handleSaveAll(updated);
  };

  const updateTest = async (id: string, updates: Partial<Test>) => {
    const updated = tests.map(t => t.id === id ? { ...t, ...updates } : t);
    setTests(updated);
    await handleSaveAll(updated);
    setEditTest(null);
  };

  const updateQuestion = (testId: string, qId: number, text: string) => {
    setTests(p => p.map(t => t.id === testId ? {
      ...t, questions: t.questions.map(q => q.id === qId ? { ...q, question: text } : q)
    } : t));
  };

  const deleteQuestion = async (testId: string, qId: number) => {
    const updated = tests.map(t => t.id === testId ? {
      ...t, questions: t.questions.filter(q => q.id !== qId)
    } : t);
    setTests(updated);
    await handleSaveAll(updated);
  };

  const addQuestion = async (testId: string) => {
    const updated = tests.map(t => t.id === testId ? {
      ...t, questions: [...t.questions, { id: Date.now(), question: 'Новый вопрос', options: DEFAULT_OPTIONS }]
    } : t);
    setTests(updated);
    await handleSaveAll(updated);
  };

  const saveQuestions = async (testId: string) => {
    await handleSaveAll(tests);
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.btnAdd} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Добавить тест
        </button>
        {saved && <span className={styles.savedMsg}><Check size={16} /> Сохранено</span>}
        {saving && <span className={styles.savingMsg}>Сохранение...</span>}
      </div>

      {showAdd && (
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>ID теста (уникальный)</label>
              <input className={styles.input} value={newTest.id}
                onChange={e => setNewTest(p => ({ ...p, id: e.target.value }))} placeholder="my_test" />
            </div>
            <div className={styles.formGroup}>
              <label>Название</label>
              <input className={styles.input} value={newTest.title}
                onChange={e => setNewTest(p => ({ ...p, title: e.target.value }))} placeholder="Название теста" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Описание</label>
            <input className={styles.input} value={newTest.description}
              onChange={e => setNewTest(p => ({ ...p, description: e.target.value }))} placeholder="Краткое описание" />
          </div>
          <div className={styles.formGroup}>
            <label>
              <input type="checkbox" checked={newTest.showPercent}
                onChange={e => setNewTest(p => ({ ...p, showPercent: e.target.checked }))} />
              {' '}Показывать проценты в результате
            </label>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnSave} onClick={handleAddTest} disabled={saving}>
              <Check size={16} /> Создать тест
            </button>
            <button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={16} /> Отмена</button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {tests.map(test => (
          <div key={test.id} className={styles.testCard}>
            <div className={styles.testHeader} onClick={() => toggle(test.id)}>
              <div className={styles.testInfo}>
                <div className={styles.testTitle}>{test.title || <span style={{ opacity: 0.4 }}>Без названия</span>}</div>
                <div className={styles.testMeta}>
                  {test.questions.length} вопросов · {test.showPercent ? 'С процентами' : 'Без процентов'}
                </div>
              </div>
              <div className={styles.testActions} onClick={e => e.stopPropagation()}>
                <button className={styles.btnIcon} onClick={() => setEditTest(editTest === test.id ? null : test.id)}>
                  <Pencil size={15} />
                </button>
                <button className={`${styles.btnIcon} ${styles.btnDanger}`} onClick={() => handleDeleteTest(test.id)}>
                  <Trash2 size={15} />
                </button>
                {expanded === test.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {editTest === test.id && (
              <div className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label>Название</label>
                  <input className={styles.input} defaultValue={test.title}
                    onBlur={e => updateTest(test.id, { title: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Описание</label>
                  <input className={styles.input} defaultValue={test.description}
                    onBlur={e => updateTest(test.id, { description: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    <input type="checkbox" defaultChecked={test.showPercent}
                      onChange={e => updateTest(test.id, { showPercent: e.target.checked })} />
                    {' '}Показывать проценты
                  </label>
                </div>
              </div>
            )}

            {expanded === test.id && (
              <div className={styles.questions}>
                {test.questions.map((q, qi) => (
                  <div key={q.id} className={styles.question}>
                    <div className={styles.questionNum}>{qi + 1}</div>
                    <div className={styles.questionContent}>
                      <input
                        className={styles.questionInput}
                        defaultValue={q.question}
                        onBlur={e => updateQuestion(test.id, q.id, e.target.value)}
                      />
                      <div className={styles.options}>
                        {q.options.map((opt, oi) => (
                          <span key={oi} className={styles.option}>{opt}</span>
                        ))}
                      </div>
                    </div>
                    <button className={`${styles.btnIcon} ${styles.btnDanger}`}
                      onClick={() => deleteQuestion(test.id, q.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className={styles.questionsFooter}>
                  <button className={styles.btnAddQuestion} onClick={() => addQuestion(test.id)}>
                    <Plus size={16} /> Добавить вопрос
                  </button>
                  <button className={styles.btnSaveQuestions} onClick={() => saveQuestions(test.id)} disabled={saving}>
                    <Check size={16} /> Сохранить вопросы
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
