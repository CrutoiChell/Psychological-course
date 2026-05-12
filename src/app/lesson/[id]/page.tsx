import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLessons } from '@/app/actions/admin';
import LessonClient from './LessonClient';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign_in');

  const lessons = await getLessons();
  const index = lessons.findIndex(l => l.id === id);
  if (index === -1) redirect('/course');

  const lesson = lessons[index];
  const prevLesson = index > 0 ? lessons[index - 1] : null;
  const nextLesson = index < lessons.length - 1 ? lessons[index + 1] : null;

  return <LessonClient lesson={lesson} prevLesson={prevLesson} nextLesson={nextLesson} />;
}
