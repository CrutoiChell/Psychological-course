import { createAdminClient } from '@/lib/supabase/admin';
import { getLessonsForAdmin, getTestsForAdmin, getAllUserProgress } from '@/app/actions/admin';
import UsersAdminClient from './UsersAdminClient';
import styles from '../page.module.scss';

export default async function UsersPage() {
  const adminClient = createAdminClient();

  const [{ data: { users } }, { progress, testResults }, lessons, tests] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    getAllUserProgress(),
    getLessonsForAdmin().catch(() => []),
    getTestsForAdmin().catch(() => []),
  ]);

  const lessonTitles = Object.fromEntries(lessons.map(l => [l.id, l.title]));
  const testTitles = Object.fromEntries(tests.map(t => [t.id, t.title]));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Пользователи</h1>
        <p>Всего зарегистрировано: {users?.length ?? 0}. Нажмите на строку — уроки и тесты с результатами.</p>
      </div>
      <UsersAdminClient
        users={users ?? []}
        progress={progress}
        testResults={testResults}
        lessonTitles={lessonTitles}
        testTitles={testTitles}
      />
    </div>
  );
}
