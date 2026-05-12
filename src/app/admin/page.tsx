import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, ClipboardList, BookOpen, BarChart2, TrendingUp, Star } from 'lucide-react';
import styles from './page.module.scss';

export default async function AdminPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [
    { data: { users: authUsers } },
    { count: applicationsCount },
    { count: testResultsCount },
    { count: progressCount },
    { data: recentApps },
    { data: ratingsData },
  ] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('test_results').select('*', { count: 'exact', head: true }),
    supabase.from('user_progress').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('name, email, type, created_at, status').order('created_at', { ascending: false }).limit(5),
    supabase.from('ratings').select('rating'),
  ]);

  const usersCount = authUsers?.length ?? 0;

  const avgRating = ratingsData?.length
    ? (ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length).toFixed(1)
    : '—';

  const stats = [
    { icon: Users, label: 'Пользователей', value: usersCount ?? 0, color: '#a78bfa' },
    { icon: ClipboardList, label: 'Заявок', value: applicationsCount ?? 0, color: '#ec4899' },
    { icon: BarChart2, label: 'Тестов пройдено', value: testResultsCount ?? 0, color: '#fb923c' },
    { icon: BookOpen, label: 'Уроков пройдено', value: progressCount ?? 0, color: '#4ade80' },
    { icon: Star, label: 'Средний рейтинг', value: avgRating, color: '#f59e0b', suffix: '/5' },
    { icon: TrendingUp, label: 'Оценок оставлено', value: ratingsData?.length ?? 0, color: '#22d3ee' },
  ];

  const typeLabels: Record<string, string> = {
    individual: 'Инд. курс',
    consultation: 'Консультация',
    corporate: 'Корпоратив',
    other: 'Другое',
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Дашборд</h1>
        <p>Общая статистика платформы</p>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} className={styles.statCard} style={{ '--card-color': s.color } as any}>
            <div className={styles.statIcon} style={{ background: `${s.color}18`, color: s.color }}>
              <s.icon size={24} />
            </div>
            <div className={styles.statValue}>
              {s.value}{s.suffix ?? ''}
            </div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Последние заявки</h2>
          <Link href="/admin/applications" className={styles.sectionLink}>Все заявки →</Link>
        </div>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Имя</span>
            <span>Email</span>
            <span>Тип</span>
            <span>Дата</span>
          </div>
          {recentApps?.length ? recentApps.map((app, i) => (
            <div key={i} className={styles.tableRow}>
              <span className={styles.tableName}>{app.name}</span>
              <span className={styles.tableEmail}>{app.email}</span>
              <span className={styles.tableBadge}>{typeLabels[app.type] ?? app.type}</span>
              <span className={styles.tableDate}>
                {new Date(app.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
          )) : (
            <div className={styles.tableEmpty}>Заявок пока нет</div>
          )}
        </div>
      </div>
    </div>
  );
}
