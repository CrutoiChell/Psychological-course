import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLessons } from '@/app/actions/admin';
import CourseClient from './CourseClient';

export default async function CoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign_in');

  const lessons = await getLessons();
  return <CourseClient lessons={lessons} />;
}
