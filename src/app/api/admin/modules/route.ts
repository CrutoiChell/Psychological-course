import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

function mapRow(r: any) {
  return { number: r.number as number, title: r.title as string };
}

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('modules_content')
    .select('*')
    .order('number');

  if (error) {
    console.error('[GET /api/admin/modules] modules_content unavailable, deriving from lessons:', error.message);
    const { data: lessons, error: lessonsErr } = await admin
      .from('lessons_content')
      .select('module_number, module');
    if (lessonsErr) return NextResponse.json({ error: lessonsErr.message }, { status: 500 });
    const byNum = new Map<number, string>();
    for (const l of lessons ?? []) {
      if (!byNum.has(l.module_number)) byNum.set(l.module_number, l.module);
    }
    const modules = [...byNum.entries()]
      .map(([number, title]) => ({ number, title }))
      .sort((a, b) => a.number - b.number);
    return NextResponse.json({ modules, derived: true, tableMissing: true });
  }
  return NextResponse.json({ modules: (data ?? []).map(mapRow) });
}

export async function POST(req: Request) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 }); }

  const title = String(body?.title ?? '').trim();
  if (!title) return NextResponse.json({ error: 'Укажите название модуля' }, { status: 400 });

  const admin = createAdminClient();

  let number = Number(body?.number);
  if (!Number.isInteger(number) || number <= 0) {
    const { data: rows } = await admin.from('modules_content').select('number');
    const max = (rows ?? []).reduce((m: number, r: any) => Math.max(m, Number(r.number) || 0), 0);
    number = max + 1;
  }

  const finalTitle = title.toLowerCase().startsWith('модуль')
    ? title
    : `Модуль ${number}: ${title}`;

  const { data, error } = await admin
    .from('modules_content')
    .insert({ number, title: finalTitle })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/admin/modules]', error);
    const msg = /not find|does not exist|relation/.test(error.message)
      ? 'Таблица modules_content не создана. Выполните SQL из SUPABASE_SETUP.md (раздел «Модули»).'
      : error.message;
    return NextResponse.json({ error: msg, code: (error as any).code, sqlNeeded: true }, { status: 500 });
  }
  return NextResponse.json({ module: mapRow(data) }, { status: 201 });
}
