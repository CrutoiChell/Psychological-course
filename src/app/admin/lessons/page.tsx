import { createClient } from '@/lib/supabase/server';
import LessonsAdminClient from './LessonsAdminClient';
import { lessons as fallbackLessons } from '@/data/lessons';
import styles from '../page.module.scss';

export default async function LessonsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lessons_content')
    .select('*')
    .order('module_number')
    .order('id');

  const lessons = data?.length
    ? data.map((r: any) => ({
        id: r.id,
        title: r.title,
        module: r.module,
        moduleNumber: r.module_number,
        content: r.content,
        image: r.image,
        videoUrl: r.video_url,
      }))
    : fallbackLessons;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Управление уроками</h1>
        <p>Изменения сохраняются в Supabase</p>
      </div>
      <LessonsAdminClient initialLessons={lessons} />
    </div>
  );
}
