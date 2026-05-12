import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLessons } from '@/app/actions/admin';
import CertificateClient from './CertificateClient';

export default async function CertificatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign_in');

  const lessons = await getLessons();

  const [{ data: progressData }, { data: resultsData }] = await Promise.all([
    supabase.from('user_progress').select('lesson_id, completed').eq('user_id', user.id).eq('completed', true),
    supabase.from('test_results').select('test_type').eq('user_id', user.id),
  ]);

  const uniqueCompletedLessons = new Set((progressData ?? []).map(p => p.lesson_id)).size;
  const uniqueTests = new Set((resultsData ?? []).map(r => r.test_type)).size;

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Участник курса';

  return (
    <CertificateClient
      userName={userName}
      totalLessons={lessons.length}
      completedLessons={uniqueCompletedLessons}
      completedTests={uniqueTests}
    />
  );
}
