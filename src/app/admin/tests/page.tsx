import TestsAdminClient from './TestsAdminClient';
import { tests } from '@/data/tests';
import styles from '../page.module.scss';

export default function TestsAdminPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Управление тестами</h1>
        <p>Редактирование тестов, вопросов и вариантов ответов</p>
      </div>
      <TestsAdminClient initialTests={tests} />
    </div>
  );
}
