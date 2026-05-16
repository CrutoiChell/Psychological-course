import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { lessons as templateLessons } from '@/data/lessons';
import { tests as templateTests } from '@/data/tests';
import { tips as templateTips } from '@/data/tips';

export async function POST() {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const admin = createAdminClient();

  const lessonRows = templateLessons.map(l => ({
    id: String(l.id),
    title: l.title,
    module: l.module,
    module_number: l.moduleNumber,
    content: l.content,
    image: l.image || null,
    video_url: l.videoUrl || null,
  }));
  const { error: e1 } = await admin.from('lessons_content').upsert(lessonRows, { onConflict: 'id' });
  if (e1) {
    console.error('[seed] lessons:', e1);
    return NextResponse.json({ error: `lessons: ${e1.message}` }, { status: 500 });
  }

  const testRows = templateTests.map(t => ({
    id: String(t.id),
    title: t.title,
    description: t.description ?? '',
    icon: t.icon ?? 'bar-chart',
    show_percent: t.showPercent ?? true,
    questions: t.questions,
    results: t.results,
  }));
  const { error: e2 } = await admin.from('tests_content').upsert(testRows, { onConflict: 'id' });
  if (e2) {
    console.error('[seed] tests:', e2);
    return NextResponse.json({ error: `tests: ${e2.message}` }, { status: 500 });
  }

  const tipRows = templateTips.map(t => ({
    id: String(t.id),
    category: t.category,
    icon: t.icon,
    title: t.title,
    text: t.text,
  }));
  const { error: e3 } = await admin.from('tips_content').upsert(tipRows, { onConflict: 'id' });
  if (e3) {
    console.error('[seed] tips:', e3);
    return NextResponse.json({ error: `tips: ${e3.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    lessons: lessonRows.length,
    tests: testRows.length,
    tips: tipRows.length,
  });
}
