'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markLessonCompleted(lessonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Пользователь не авторизован');
  }

  const { error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

  if (error) throw error;

  revalidatePath('/dashboard');
  revalidatePath('/course');
  revalidatePath(`/lesson/${lessonId}`);
  
  return { success: true };
}

export async function getUserProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('lesson_id, completed, completed_at')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching progress:', error);
    return [];
  }

  return data || [];
}
