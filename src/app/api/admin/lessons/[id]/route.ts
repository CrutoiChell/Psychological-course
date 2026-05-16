import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { toEmbedUrl } from '@/lib/embed-url';

type Ctx = { params: Promise<{ id: string }> };

function mapRow(r: any) {
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
  if (typeof body.module === 'string') patch.module = body.module;
  if (typeof body.moduleNumber === 'number') patch.module_number = body.moduleNumber;
  if (typeof body.content === 'string') patch.content = body.content;
  if ('image' in body) patch.image = body.image || null;
  if ('videoUrl' in body) patch.video_url = body.videoUrl ? toEmbedUrl(body.videoUrl) : null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нет полей для обновления' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lessons_content')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/admin/lessons/:id]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ lesson: mapRow(data) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin.from('lessons_content').delete().eq('id', id);
  if (error) {
    console.error('[DELETE /api/admin/lessons/:id]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
