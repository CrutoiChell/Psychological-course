import TipsClient from './TipsClient';
import { tips } from '@/data/tips';
import styles from '../page.module.scss';

export default function TipsPage() {
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
