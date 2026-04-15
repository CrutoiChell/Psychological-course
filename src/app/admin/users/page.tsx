import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { User, BookOpen, BarChart2 } from 'lucide-react';
import styles from '../page.module.scss';
import userStyles from './users.module.scss';

export default async function UsersPage() {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

  // Прогресс и тесты для каждого пользователя
  const [{ data: progress }, { data: testResults }] = await Promise.all([
    supabase.from('user_progress').select('user_id'),
    supabase.from('test_results').select('user_id'),
  ]);

  const progressByUser = (progress ?? []).reduce((acc: Record<string, number>, p) => {
    acc[p.user_id] = (acc[p.user_id] || 0) + 1;
    return acc;
  }, {});

  const testsByUser = (testResults ?? []).reduce((acc: Record<string, number>, t) => {
    acc[t.user_id] = (acc[t.user_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Пользователи</h1>
        <p>Всего зарегистрировано: {users?.length ?? 0}</p>
      </div>

      <div className={userStyles.table}>
        <div className={userStyles.tableHead}>
          <span>Пользователь</span>
          <span>Email</span>
          <span><BookOpen size={14} /> Уроков</span>
          <span><BarChart2 size={14} /> Тестов</span>
          <span>Дата регистрации</span>
        </div>
        {users?.map(user => (
          <div key={user.id} className={userStyles.tableRow}>
            <div className={userStyles.userCell}>
              <div className={userStyles.avatar}>
                {(user.user_metadata?.name || user.email || '?')[0].toUpperCase()}
              </div>
              <span className={userStyles.userName}>
                {user.user_metadata?.name || '—'}
              </span>
            </div>
            <span className={userStyles.email}>{user.email}</span>
            <span className={userStyles.count}>{progressByUser[user.id] ?? 0}</span>
            <span className={userStyles.count}>{testsByUser[user.id] ?? 0}</span>
            <span className={userStyles.date}>
              {new Date(user.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
