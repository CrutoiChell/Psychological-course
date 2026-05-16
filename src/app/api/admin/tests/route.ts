import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const DEFAULT_RESULTS = [
  { minPercent: 0, maxPercent: 39, level: 'Низкий уровень', color: '#4ade80', emoji: 'green', description: '' },
  { minPercent: 40, maxPercent: 69, level: 'Средний уровень', color: '#fb923c', emoji: 'orange', description: '' },
  { minPercent: 70, maxPercent: 100, level: 'Высокий уровень', color: '#f87171', emoji: 'red', description: '' },
];

function mapRow(r: any) {
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

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tests_content')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET /api/admin/tests]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tests: (data ?? []).map(mapRow) });
}

export async function POST(req: Request) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 });
  }
  if (!body?.title) {
    return NextResponse.json({ error: 'Обязательно title' }, { status: 400 });
  }

  const admin = createAdminClient();
  const id = String(body.id ?? `test_${Date.now()}`);

  const row = {
    id,
    title: body.title,
    description: body.description ?? '',
    icon: body.icon ?? 'bar-chart',
    show_percent: body.showPercent ?? true,
    questions: body.questions ?? [],
    results: body.results ?? DEFAULT_RESULTS,
  };

  const { data, error } = await admin
    .from('tests_content')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[POST /api/admin/tests]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ test: mapRow(data) }, { status: 201 });
}
