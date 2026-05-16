'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Пользователь не авторизован');
  return { supabase, user };
}

export async function markLessonCompleted(lessonId: string) {
  const { supabase, user } = await getUser();

  const { data: existing } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from('user_progress').update(payload).eq('id', existing.id)
    : await supabase.from('user_progress').insert(payload);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  revalidatePath('/course');
  revalidatePath(`/lesson/${lessonId}`);
  return { success: true };
}

export async function unmarkLessonCompleted(lessonId: string) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from('user_progress')
    .update({ completed: false, completed_at: null })
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  revalidatePath('/course');
  revalidatePath(`/lesson/${lessonId}`);
  return { success: true };
}

export async function getUserProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

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
