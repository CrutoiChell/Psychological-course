import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTests } from '@/app/actions/admin';
import TestsListClient from './TestsListClient';

export default async function TestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign_in');

  const [tests, { data: resultsData }] = await Promise.all([
    getTests(),
    supabase
      .from('test_results')
      .select('test_type, score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const results: Record<string, number> = {};
  resultsData?.forEach(r => { if (!(r.test_type in results)) results[r.test_type] = r.score; });

  return <TestsListClient tests={tests} completedTests={results} />;
}
