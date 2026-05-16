import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLessons, getTests, getTips } from '@/app/actions/admin';
import DashboardClient from './DashboardClient';

async function safeQuery<T = any>(p: any): Promise<T[]> {
  try {
    const { data, error } = await p;
    if (error) {
      console.error('[dashboard] supabase query error:', error.message);
      return [];
    }
    return (data as T[]) ?? [];
  } catch (e) {
    console.error('[dashboard] supabase query threw:', e);
    return [];
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign_in');

  const [lessons, tests, tips, progressData, resultsData] = await Promise.all([
    getLessons(),
    getTests(),
    getTips(),
    safeQuery<{ lesson_id: string; completed: boolean }>(
      supabase.from('user_progress').select('lesson_id, completed').eq('user_id', user.id)
    ),
    safeQuery<{ test_type: string; score: number; result_text: string }>(
      supabase
        .from('test_results')
        .select('test_type, score, result_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ),
  ]);

  const testResults: Record<string, { score: number; level: string }> = {};
  resultsData.forEach(r => {
    if (!(r.test_type in testResults)) testResults[r.test_type] = { score: r.score, level: r.result_text };
  });

  return (
    <DashboardClient
      userName={user.user_metadata?.name || 'Студент'}
      lessons={lessons}
      tests={tests}
      tips={tips}
      progress={progressData}
      testResults={testResults}
    />
  );
}
