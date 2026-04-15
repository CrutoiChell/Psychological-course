import { createClient } from '@/lib/supabase/server';
import ApplicationsClient from './ApplicationsClient';
import styles from '../page.module.scss';

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Заявки</h1>
        <p>Все заявки на консультацию и индивидуальный курс</p>
      </div>
      <ApplicationsClient applications={applications ?? []} />
    </div>
  );
}
