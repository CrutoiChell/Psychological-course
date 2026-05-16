import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLessons } from '@/app/actions/admin';
import CourseClient from './CourseClient';

export default async function CoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign_in');

  const [lessons, { data: progressData }] = await Promise.all([
    getLessons(),
    supabase.from('user_progress').select('lesson_id').eq('user_id', user.id).eq('completed', true),
  ]);
  const completedIds = (progressData ?? []).map(p => p.lesson_id);
  return <CourseClient lessons={lessons} completedIds={completedIds} />;
}
