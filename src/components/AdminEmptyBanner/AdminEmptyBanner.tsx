'use client';

import { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import styles from './AdminEmptyBanner.module.scss';

interface Props {
  type: 'lessons' | 'tests' | 'tips';
}

const labels = {
  lessons: 'уроков',
  tests: 'тестов',
  tips: 'советов',
};

export default function AdminEmptyBanner({ type }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    if (!confirm(`Загрузить шаблонные ${labels[type]} в базу?`)) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.banner}>
      <Database size={20} />
      <div className={styles.text}>
        <strong>База пуста</strong>
        <span>Добавьте контент вручную или импортируйте шаблон из проекта.</span>
      </div>
      <button type="button" className={styles.btn} onClick={handleSeed} disabled={loading}>
        {loading ? <Loader2 size={16} className={styles.spin} /> : <Database size={16} />}
        Импортировать шаблон
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
