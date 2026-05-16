'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminByRole = user.user_metadata?.role === 'admin';
  const isAdminByEmail = Boolean(
    user.email &&
    adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase()
  );
  const isAdmin = isAdminByRole || isAdminByEmail;
  if (!isAdmin) {
    throw new Error(
      `Нет прав администратора. Вы вошли как "${user.email}", а ADMIN_EMAIL="${adminEmail ?? '(не задан)'}".`
    );
  }
  return user;
}

function revalidateAll() {
  revalidatePath('/', 'layout');
}

// ─── Lessons ────────────────────────────────────────────────────────────────

export async function saveLessons(lessons: any[]) {
  try {
    await requireAdmin();
  } catch (e: any) {
    console.error('[saveLessons] requireAdmin failed:', e?.message);
    throw e;
  }
  const admin = createAdminClient();
  console.log('[saveLessons] start: count =', lessons.length);

  const { data: existing, error: getErr } = await admin
    .from('lessons_content')
    .select('id');

  if (getErr) {
    console.error('[saveLessons] select error:', getErr);
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
    if (delErr) {
      console.error('[saveLessons] delete error:', delErr);
      throw new Error(`Ошибка удаления уроков: ${delErr.message}`);
    }
  }

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
    if (error) {
      console.error('[saveLessons] upsert error:', error);
      throw new Error(`Ошибка сохранения уроков: ${error.message} (code=${(error as any).code ?? '—'})`);
    }
  }

  revalidateAll();
  console.log('[saveLessons] done');
  return { success: true };
}

function mapLessonRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    module: r.module,
    moduleNumber: r.module_number,
    content: r.content,
    image: r.image,
    videoUrl: r.video_url,
  };
}

function mapTestRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    icon: r.icon,
    showPercent: r.show_percent,
    questions: r.questions,
    results: r.results,
  };
}

/** Для публичных страниц: анонимный клиент + fallback на статику при любой ошибке */
export async function getLessons() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('lessons_content')
      .select('*')
      .order('module_number', { ascending: true })
      .order('id', { ascending: true });

    if (error || !data?.length) {
      const { lessons } = await import('@/data/lessons');
      return lessons;
    }
    return data.map(mapLessonRow);
  } catch (e) {
    console.error('[getLessons] fallback to static:', e);
    const { lessons } = await import('@/data/lessons');
    return lessons;
  }
}

/** Для админки: только данные из БД, без подстановки статики */
export async function getLessonsForAdmin() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lessons_content')
    .select('*')
    .order('module_number', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw new Error(`Таблица lessons_content: ${error.message}`);
  return (data ?? []).map(mapLessonRow);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

export async function saveTests(tests: any[]) {
  try {
    await requireAdmin();
  } catch (e: any) {
    console.error('[saveTests] requireAdmin failed:', e?.message);
    throw e;
  }
  const admin = createAdminClient();
  console.log('[saveTests] start: count =', tests.length);

  const { data: existing, error: getErr } = await admin
    .from('tests_content')
    .select('id');

  if (getErr) {
    console.error('[saveTests] select error:', getErr);
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
    if (delErr) {
      console.error('[saveTests] delete error:', delErr);
      throw new Error(`Ошибка удаления тестов: ${delErr.message}`);
    }
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
    if (error) {
      console.error('[saveTests] upsert error:', error);
      throw new Error(`Ошибка сохранения тестов: ${error.message} (code=${(error as any).code ?? '—'})`);
    }
  }

  revalidateAll();
  console.log('[saveTests] done');
  return { success: true };
}

export async function getTests() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tests_content')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data?.length) {
      const { tests } = await import('@/data/tests');
      return tests;
    }
    return data.map(mapTestRow);
  } catch (e) {
    console.error('[getTests] fallback to static:', e);
    const { tests } = await import('@/data/tests');
    return tests;
  }
}

export async function getTestsForAdmin() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tests_content')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Таблица tests_content: ${error.message}`);
  return (data ?? []).map(mapTestRow);
}

// ─── Tips ────────────────────────────────────────────────────────────────────

export async function saveTips(tips: any[]) {
  try {
    await requireAdmin();
  } catch (e: any) {
    console.error('[saveTips] requireAdmin failed:', e?.message);
    throw e;
  }
  const admin = createAdminClient();
  console.log('[saveTips] start: count =', tips.length);

  const { data: existing, error: getErr } = await admin
    .from('tips_content')
    .select('id');

  if (getErr) {
    console.error('[saveTips] select error:', getErr);
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
    if (delErr) {
      console.error('[saveTips] delete error:', delErr);
      throw new Error(`Ошибка удаления советов: ${delErr.message}`);
    }
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
    if (error) {
      console.error('[saveTips] upsert error:', error);
      throw new Error(`Ошибка сохранения советов: ${error.message} (code=${(error as any).code ?? '—'})`);
    }
  }

  revalidateAll();
  console.log('[saveTips] done');
  return { success: true };
}

export async function getTips() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tips_content')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data?.length) {
      const { tips } = await import('@/data/tips');
      return tips;
    }
    return data as any[];
  } catch (e) {
    console.error('[getTips] fallback to static:', e);
    const { tips } = await import('@/data/tips');
    return tips;
  }
}

export async function getTipsForAdmin() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tips_content')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Таблица tips_content: ${error.message}`);
  return data ?? [];
}

/** Первичная загрузка контента из шаблона в Supabase */
export async function seedContentFromDefaults() {
  await requireAdmin();
  const { lessons } = await import('@/data/lessons');
  const { tests } = await import('@/data/tests');
  const { tips } = await import('@/data/tips');
  await saveLessons(lessons);
  await saveTests(tests);
  await saveTips(tips);
  revalidateAll();
  return { success: true, lessons: lessons.length, tests: tests.length, tips: tips.length };
}

// ─── User progress (admin view) ──────────────────────────────────────────────

export async function getAllUserProgress() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: progress }, { data: testResults }] = await Promise.all([
    admin.from('user_progress').select('user_id, lesson_id, completed, completed_at').eq('completed', true),
    admin.from('test_results').select('user_id, test_type, score, result_text, created_at').order('created_at', { ascending: false }),
  ]);
  return { progress: progress ?? [], testResults: testResults ?? [] };
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
