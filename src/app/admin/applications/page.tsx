import { createAdminClient } from '@/lib/supabase/admin';
import ApplicationsClient from './ApplicationsClient';
import styles from '../page.module.scss';

export default async function ApplicationsPage() {
  let applications: any[] = [];
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    applications = data ?? [];
  } catch (e: any) {
    loadError = e?.message ?? 'Не удалось загрузить заявки';
    console.error('[applications] page failed:', e);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Заявки</h1>
        <p>Все заявки на консультацию и индивидуальный курс</p>
      </div>
      {loadError && (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{loadError}</p>
      )}
      <ApplicationsClient applications={applications} />
    </div>
  );
}
