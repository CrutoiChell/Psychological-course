import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Ctx = { params: Promise<{ number: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const { number: numStr } = await ctx.params;
  const number = parseInt(numStr, 10);
  if (!Number.isInteger(number)) return NextResponse.json({ error: 'Невалидный номер' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 }); }

  const title = String(body?.title ?? '').trim();
  if (!title) return NextResponse.json({ error: 'Укажите название' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('modules_content')
    .update({ title })
    .eq('number', number)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/admin/modules/:number]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from('lessons_content').update({ module: title }).eq('module_number', number);

  return NextResponse.json({ module: { number: data.number, title: data.title } });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const { number: numStr } = await ctx.params;
  const number = parseInt(numStr, 10);
  if (!Number.isInteger(number)) return NextResponse.json({ error: 'Невалидный номер' }, { status: 400 });

  const admin = createAdminClient();

  const { count: lessonCount, error: cntErr } = await admin
    .from('lessons_content')
    .select('*', { count: 'exact', head: true })
    .eq('module_number', number);
  if (cntErr) {
    console.error('[DELETE /api/admin/modules/:number] count', cntErr);
    return NextResponse.json({ error: cntErr.message }, { status: 500 });
  }
  if ((lessonCount ?? 0) > 0) {
    return NextResponse.json({
      error: `В модуле есть ${lessonCount} уроков. Сначала перенесите или удалите их.`,
    }, { status: 400 });
  }

  const { error } = await admin.from('modules_content').delete().eq('number', number);
  if (error) {
    console.error('[DELETE /api/admin/modules/:number]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
