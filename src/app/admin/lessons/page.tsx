import { getLessonsForAdmin } from '@/app/actions/admin';
import LessonsAdminClient from './LessonsAdminClient';
import styles from '../page.module.scss';

export default async function LessonsAdminPage() {
  let lessons: Awaited<ReturnType<typeof getLessonsForAdmin>> = [];
  let loadError: string | null = null;

  try {
    lessons = await getLessonsForAdmin();
  } catch (e: any) {
    loadError = e.message;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Управление уроками</h1>
        <p>Изменения сохраняются в Supabase</p>
      </div>
      {loadError && (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{loadError}</p>
      )}
      <LessonsAdminClient initialLessons={lessons} dbEmpty={lessons.length === 0 && !loadError} />
    </div>
  );
}
