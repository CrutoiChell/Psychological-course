import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Ctx = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const { id } = await ctx.params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 });
  }

  const patch: Record<string, any> = {};
  if (typeof body.title === 'string') patch.title = body.title;
  if (typeof body.description === 'string') patch.description = body.description;
  if (typeof body.icon === 'string') patch.icon = body.icon;
  if (typeof body.showPercent === 'boolean') patch.show_percent = body.showPercent;
  if (Array.isArray(body.questions)) patch.questions = body.questions;
  if (Array.isArray(body.results)) patch.results = body.results;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нет полей для обновления' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tests_content')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/admin/tests/:id]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ test: mapRow(data) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin.from('tests_content').delete().eq('id', id);
  if (error) {
    console.error('[DELETE /api/admin/tests/:id]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
