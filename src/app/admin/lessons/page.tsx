import LessonsAdminClient from './LessonsAdminClient';
import { lessons } from '@/data/lessons';
import styles from '../page.module.scss';

export default function LessonsAdminPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Управление уроками</h1>
        <p>Редактирование уроков курса. Изменения сохраняются в lessons.json</p>
      </div>
      <LessonsAdminClient initialLessons={lessons} />
    </div>
  );
}
