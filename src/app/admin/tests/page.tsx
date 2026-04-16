import { createClient } from '@/lib/supabase/server';
import TestsAdminClient from './TestsAdminClient';
import { tests as fallbackTests } from '@/data/tests';
import styles from '../page.module.scss';

export default async function TestsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('tests_content').select('*').order('created_at');

  const tests = data?.length
    ? data.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        icon: r.icon,
        showPercent: r.show_percent,
        questions: r.questions,
        results: r.results,
      }))
    : fallbackTests;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Управление тестами</h1>
        <p>Изменения сохраняются в Supabase</p>
      </div>
      <TestsAdminClient initialTests={tests} />
    </div>
  );
}
