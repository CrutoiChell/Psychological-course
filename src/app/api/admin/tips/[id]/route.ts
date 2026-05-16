import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Ctx = { params: Promise<{ id: string }> };

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
  if (typeof body.category === 'string') patch.category = body.category;
  if (typeof body.icon === 'string') patch.icon = body.icon;
  if (typeof body.title === 'string') patch.title = body.title;
  if (typeof body.text === 'string') patch.text = body.text;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нет полей для обновления' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tips_content')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/admin/tips/:id]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ tip: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin.from('tips_content').delete().eq('id', id);
  if (error) {
    console.error('[DELETE /api/admin/tips/:id]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
