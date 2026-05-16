import { getTestsForAdmin } from '@/app/actions/admin';
import TestsAdminClient from './TestsAdminClient';
import styles from '../page.module.scss';

export default async function TestsAdminPage() {
  let tests: Awaited<ReturnType<typeof getTestsForAdmin>> = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsForAdmin();
  } catch (e: any) {
    loadError = e.message;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Управление тестами</h1>
        <p>Изменения сохраняются в Supabase</p>
      </div>
      {loadError && (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{loadError}</p>
      )}
      <TestsAdminClient initialTests={tests} dbEmpty={tests.length === 0 && !loadError} />
    </div>
  );
}
