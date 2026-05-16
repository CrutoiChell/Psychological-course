import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tips_content')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET /api/admin/tips]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tips: data ?? [] });
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
  if (!body?.title || !body?.text) {
    return NextResponse.json({ error: 'Обязательны title и text' }, { status: 400 });
  }

  const admin = createAdminClient();
  const row = {
    id: String(body.id ?? Date.now()),
    category: body.category ?? 'Восстановление',
    icon: body.icon ?? 'lightbulb',
    title: body.title,
    text: body.text,
  };

  const { data, error } = await admin
    .from('tips_content')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[POST /api/admin/tips]', error);
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
  }
  return NextResponse.json({ tip: data }, { status: 201 });
}
