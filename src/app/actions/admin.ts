'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Lesson } from '@/data/lessons';
import { Test } from '@/data/tests';
import { Tip } from '@/data/tips';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');
  const isAdmin = user.user_metadata?.role === 'admin' || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) throw new Error('Нет прав');
  return user;
}

export async function saveLessons(lessons: Lesson[]) {
  await checkAdmin();
  const path = join(process.cwd(), 'src/data/content/lessons.json');
  await writeFile(path, JSON.stringify(lessons, null, 2), 'utf-8');
  revalidatePath('/course');
  revalidatePath('/admin/lessons');
  return { success: true };
}

export async function saveTests(tests: Test[]) {
  await checkAdmin();
  const path = join(process.cwd(), 'src/data/content/tests.json');
  await writeFile(path, JSON.stringify(tests, null, 2), 'utf-8');
  revalidatePath('/test');
  revalidatePath('/admin/tests');
  return { success: true };
}

export async function saveTips(tips: Tip[]) {
  await checkAdmin();
  const path = join(process.cwd(), 'src/data/content/tips.json');
  await writeFile(path, JSON.stringify(tips, null, 2), 'utf-8');
  revalidatePath('/dashboard');
  revalidatePath('/admin/tips');
  return { success: true };
}

export async function updateApplicationStatus(id: string, status: string) {
  await checkAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('applications').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/applications');
  return { success: true };
}
