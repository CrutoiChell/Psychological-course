import TipsClient from './TipsClient';
import { getTipsForAdmin } from '@/app/actions/admin';
import styles from '../page.module.scss';

export default async function TipsAdminPage() {
  let tips: Awaited<ReturnType<typeof getTipsForAdmin>> = [];
  let loadError: string | null = null;

  try {
    tips = await getTipsForAdmin();
  } catch (e: any) {
    loadError = e.message;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Советы дня</h1>
        <p>Управление советами, которые показываются в личном кабинете</p>
      </div>
      {loadError && (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{loadError}</p>
      )}
      <TipsClient initialTips={tips} dbEmpty={tips.length === 0 && !loadError} />
    </div>
  );
}
