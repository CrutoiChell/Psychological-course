'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');
  const isAdmin = user.user_metadata?.role === 'admin' || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) throw new Error('Нет прав');
  return user;
}

// ─── Lessons ────────────────────────────────────────────────────────────────

export async function saveLessons(lessons: any[]) {
  await checkAdmin();
  const supabase = await createClient();

  const { error: delError } = await supabase.from('lessons_content').delete().neq('id', '');
  if (delError) {
    throw new Error(`Таблица lessons_content не найдена. Создайте её в Supabase: ${delError.message}`);
  }

  if (lessons.length > 0) {
    const rows = lessons.map(l => ({
      id: l.id,
      title: l.title,
      module: l.module,
      module_number: l.moduleNumber,
      content: l.content,
      image: l.image || null,
      video_url: l.videoUrl || null,
    }));
    const { error } = await supabase.from('lessons_content').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/course');
  revalidatePath('/admin/lessons');
  return { success: true };
}

export async function getLessons() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons_content')
    .select('*')
    .order('module_number', { ascending: true })
    .order('id', { ascending: true });

  if (error || !data?.length) {
    // Fallback к JSON если таблица пустая
    const { lessons } = await import('@/data/lessons');
    return lessons;
  }
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    module: r.module,
    moduleNumber: r.module_number,
    content: r.content,
    image: r.image,
    videoUrl: r.video_url,
  }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

export async function saveTests(tests: any[]) {
  await checkAdmin();
  const supabase = await createClient();

  const { error: delError } = await supabase.from('tests_content').delete().neq('id', '');
  if (delError) {
    console.error('saveTests delete error:', delError.message);
    throw new Error(`Таблица tests_content не найдена. Создайте её в Supabase: ${delError.message}`);
  }

  if (tests.length > 0) {
    const rows = tests.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon,
      show_percent: t.showPercent ?? true,
      questions: t.questions,
      results: t.results,
    }));
    const { error } = await supabase.from('tests_content').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/test');
  revalidatePath('/admin/tests');
  return { success: true };
}

// ─── Tips ────────────────────────────────────────────────────────────────────

export async function saveTips(tips: any[]) {
  await checkAdmin();
  const supabase = await createClient();

  const { error: delError } = await supabase.from('tips_content').delete().neq('id', '');
  if (delError) {
    throw new Error(`Таблица tips_content не найдена. Создайте её в Supabase: ${delError.message}`);
  }

  if (tips.length > 0) {
    const { error } = await supabase.from('tips_content').insert(tips);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin/tips');
  return { success: true };
}

// ─── Applications ────────────────────────────────────────────────────────────

export async function updateApplicationStatus(id: string, status: string) {
  await checkAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('applications').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/applications');
  return { success: true };
}
