import TipsClient from './TipsClient';
import { getTips } from '@/app/actions/admin';
import styles from '../page.module.scss';

export default async function TipsPage() {
  const tips = await getTips();
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Советы дня</h1>
        <p>Управление советами, которые показываются в личном кабинете</p>
      </div>
      <TipsClient initialTips={tips} />
    </div>
  );
}
