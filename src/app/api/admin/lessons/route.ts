import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { toEmbedUrl } from '@/lib/embed-url';

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

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lessons_content')
    .select('*')
    .order('module_number')
    .order('id');

  if (error) {
    console.error('[GET /api/admin/lessons]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ lessons: (data ?? []).map(mapRow) });
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
  if (!body?.title || !body?.content) {
    return NextResponse.json({ error: 'Обязательны title и content' }, { status: 400 });
  }

  const admin = createAdminClient();

  let id = String(body.id ?? '').trim();
  if (!id) {
    const { data: rows } = await admin.from('lessons_content').select('id');
    const numericIds = (rows ?? []).map((r: any) => parseInt(r.id)).filter(n => !isNaN(n));
    const next = numericIds.length ? Math.max(...numericIds) + 1 : 1;
    id = String(next);
  }

  const row = {
    id,
    title: body.title,
    module: body.module ?? '',
    module_number: body.moduleNumber ?? 1,
    content: body.content,
    image: body.image || null,
    video_url: body.videoUrl ? toEmbedUrl(body.videoUrl) : null,
  };

  const { data, error } = await admin
    .from('lessons_content')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[POST /api/admin/lessons]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ lesson: mapRow(data) }, { status: 201 });
}
