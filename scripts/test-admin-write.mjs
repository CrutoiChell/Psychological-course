// Прямой smoke-тест: пишем урок в Supabase через service_role.
// Запуск: node scripts/test-admin-write.mjs
// Читает .env.local вручную (без зависимостей).

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('MISSING env: NEXT_PUBLIC_SUPABASE_URL=', !!url, ' SUPABASE_SERVICE_ROLE_KEY=', !!key);
  process.exit(1);
}

console.log('URL:', url);
console.log('SERVICE_ROLE prefix:', key.slice(0, 40), '...');

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log('\n[1] SELECT count(lessons_content)');
  const { count, error: selErr } = await supabase
    .from('lessons_content')
    .select('*', { count: 'exact', head: true });
  if (selErr) {
    console.error('SELECT error:', selErr);
    process.exit(2);
  }
  console.log('  rows in lessons_content:', count);

  console.log('\n[2] UPSERT diag_test');
  const { error: upErr, data: upData } = await supabase
    .from('lessons_content')
    .upsert({
      id: 'diag_test',
      title: 'Диагностический урок',
      module: 'Диагностика',
      module_number: 99,
      content: 'Создан через scripts/test-admin-write.mjs',
      image: null,
      video_url: null,
    }, { onConflict: 'id' })
    .select();
  if (upErr) {
    console.error('UPSERT error:', upErr);
    process.exit(3);
  }
  console.log('  upsert ok, returned rows:', upData?.length);

  console.log('\n[3] SELECT diag_test');
  const { data: row, error: rowErr } = await supabase
    .from('lessons_content')
    .select('*')
    .eq('id', 'diag_test')
    .maybeSingle();
  if (rowErr) {
    console.error('  SELECT error:', rowErr);
  } else {
    console.log('  found:', row ? 'YES' : 'NO');
  }

  console.log('\n[4] DELETE diag_test');
  const { error: delErr } = await supabase
    .from('lessons_content')
    .delete()
    .eq('id', 'diag_test');
  if (delErr) {
    console.error('  DELETE error:', delErr);
    process.exit(4);
  }
  console.log('  deleted.');

  console.log('\nALL GOOD');
}

main().catch(e => { console.error('FATAL:', e); process.exit(99); });
