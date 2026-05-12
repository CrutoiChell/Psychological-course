'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');
  const isAdmin = user.user_metadata?.role === 'admin' || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) throw new Error('Нет прав администратора');
  return user;
}

function revalidateAll() {
  revalidatePath('/', 'layout');
}

// ─── Lessons ────────────────────────────────────────────────────────────────

export async function saveLessons(lessons: any[]) {
  await requireAdmin();
  const admin = createAdminClient();

  // 1. Получаем текущие ID из БД
  const { data: existing, error: getErr } = await admin
    .from('lessons_content')
    .select('id');

  if (getErr) {
    throw new Error(`Таблица lessons_content недоступна: ${getErr.message}. Создайте её по SUPABASE_SETUP.md`);
  }

  const existingIds = new Set((existing ?? []).map((r: any) => String(r.id)));
  const newIds = new Set(lessons.map(l => String(l.id)));
  const toDelete = [...existingIds].filter(id => !newIds.has(id));

  // 2. Удаляем только то, чего больше нет в списке
  if (toDelete.length > 0) {
    const { error: delErr } = await admin
      .from('lessons_content')
      .delete()
      .in('id', toDelete);
    if (delErr) throw new Error(`Ошибка удаления уроков: ${delErr.message}`);
  }

  // 3. Upsert остальные (вставка новых + обновление существующих)
  if (lessons.length > 0) {
    const rows = lessons.map(l => ({
      id: String(l.id),
      title: l.title ?? '',
      module: l.module ?? '',
      module_number: l.moduleNumber ?? 1,
      content: l.content ?? '',
      image: l.image || null,
      video_url: l.videoUrl || null,
    }));
    const { error } = await admin
      .from('lessons_content')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Ошибка сохранения уроков: ${error.message}`);
  }

  revalidateAll();
  return { success: true };
}

export async function getLessons() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lessons_content')
    .select('*')
    .order('module_number', { ascending: true })
    .order('id', { ascending: true });

  if (error || !data?.length) {
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
  await requireAdmin();
  const admin = createAdminClient();

  const { data: existing, error: getErr } = await admin
    .from('tests_content')
    .select('id');

  if (getErr) {
    throw new Error(`Таблица tests_content недоступна: ${getErr.message}. Создайте её по SUPABASE_SETUP.md`);
  }

  const existingIds = new Set((existing ?? []).map((r: any) => String(r.id)));
  const newIds = new Set(tests.map(t => String(t.id)));
  const toDelete = [...existingIds].filter(id => !newIds.has(id));

  if (toDelete.length > 0) {
    const { error: delErr } = await admin
      .from('tests_content')
      .delete()
      .in('id', toDelete);
    if (delErr) throw new Error(`Ошибка удаления тестов: ${delErr.message}`);
  }

  if (tests.length > 0) {
    const rows = tests.map(t => ({
      id: String(t.id),
      title: t.title ?? '',
      description: t.description ?? '',
      icon: t.icon ?? 'bar-chart',
      show_percent: t.showPercent ?? true,
      questions: t.questions ?? [],
      results: t.results ?? [],
    }));
    const { error } = await admin
      .from('tests_content')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Ошибка сохранения тестов: ${error.message}`);
  }

  revalidateAll();
  return { success: true };
}

export async function getTests() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tests_content')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data?.length) {
    const { tests } = await import('@/data/tests');
    return tests;
  }
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    icon: r.icon,
    showPercent: r.show_percent,
    questions: r.questions,
    results: r.results,
  }));
}

// ─── Tips ────────────────────────────────────────────────────────────────────

export async function saveTips(tips: any[]) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: existing, error: getErr } = await admin
    .from('tips_content')
    .select('id');

  if (getErr) {
    throw new Error(`Таблица tips_content недоступна: ${getErr.message}. Создайте её по SUPABASE_SETUP.md`);
  }

  const existingIds = new Set((existing ?? []).map((r: any) => String(r.id)));
  const newIds = new Set(tips.map(t => String(t.id)));
  const toDelete = [...existingIds].filter(id => !newIds.has(id));

  if (toDelete.length > 0) {
    const { error: delErr } = await admin
      .from('tips_content')
      .delete()
      .in('id', toDelete);
    if (delErr) throw new Error(`Ошибка удаления советов: ${delErr.message}`);
  }

  if (tips.length > 0) {
    const rows = tips.map(t => ({
      id: String(t.id),
      category: t.category ?? '',
      icon: t.icon ?? 'lightbulb',
      title: t.title ?? '',
      text: t.text ?? '',
    }));
    const { error } = await admin
      .from('tips_content')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Ошибка сохранения советов: ${error.message}`);
  }

  revalidateAll();
  return { success: true };
}

export async function getTips() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tips_content')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data?.length) {
    const { tips } = await import('@/data/tips');
    return tips;
  }
  return data as any[];
}

// ─── Applications ────────────────────────────────────────────────────────────

export async function updateApplicationStatus(id: string, status: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('applications').update({ status }).eq('id', id);
  if (error) throw new Error(`Не удалось обновить статус: ${error.message}`);
  revalidatePath('/admin/applications');
  return { success: true };
}

export async function deleteApplication(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('applications').delete().eq('id', id);
  if (error) throw new Error(`Не удалось удалить заявку: ${error.message}`);
  revalidatePath('/admin/applications');
  return { success: true };
}
