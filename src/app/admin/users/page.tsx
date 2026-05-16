import { createAdminClient } from '@/lib/supabase/admin';
import { getLessonsForAdmin, getTestsForAdmin, getAllUserProgress } from '@/app/actions/admin';
import UsersAdminClient from './UsersAdminClient';
import styles from '../page.module.scss';

export default async function UsersPage() {
  let users: any[] = [];
  let progress: any[] = [];
  let testResults: any[] = [];
  let lessons: Awaited<ReturnType<typeof getLessonsForAdmin>> = [];
  let tests: Awaited<ReturnType<typeof getTestsForAdmin>> = [];
  let loadError: string | null = null;

  try {
    const adminClient = createAdminClient();
    const [usersRes, progressRes, lessonsRes, testsRes] = await Promise.all([
      adminClient.auth.admin.listUsers({ perPage: 1000 }).catch(e => { console.error('[users] listUsers', e); return { data: { users: [] as any[] } } as any; }),
      getAllUserProgress().catch(e => { console.error('[users] getAllUserProgress', e); return { progress: [], testResults: [] }; }),
      getLessonsForAdmin().catch(e => { console.error('[users] lessons', e); return []; }),
      getTestsForAdmin().catch(e => { console.error('[users] tests', e); return []; }),
    ]);
    users = usersRes.data?.users ?? [];
    progress = progressRes.progress;
    testResults = progressRes.testResults;
    lessons = lessonsRes;
    tests = testsRes;
  } catch (e: any) {
    loadError = e?.message ?? 'Не удалось загрузить пользователей';
    console.error('[users] page failed:', e);
  }

  const lessonTitles = Object.fromEntries(lessons.map(l => [l.id, l.title]));
  const testTitles = Object.fromEntries(tests.map(t => [t.id, t.title]));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Пользователи</h1>
        <p>Всего зарегистрировано: {users.length}. Нажмите на строку — уроки и тесты с результатами.</p>
      </div>
      {loadError && (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{loadError}</p>
      )}
      <UsersAdminClient
        users={users}
        progress={progress}
        testResults={testResults}
        lessonTitles={lessonTitles}
        testTitles={testTitles}
      />
    </div>
  );
}
