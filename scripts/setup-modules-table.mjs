// Создаёт таблицу modules_content и сидирует её из существующих уроков.
// Запуск: node scripts/setup-modules-table.mjs
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
if (!url || !key) { console.error('Нет env'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });

const sql = `
CREATE TABLE IF NOT EXISTS modules_content (
  number INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE modules_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read modules" ON modules_content;
CREATE POLICY "Public read modules" ON modules_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write modules" ON modules_content;
CREATE POLICY "Service write modules" ON modules_content FOR ALL USING (true);
`;

console.log('SQL:\n' + sql);
console.log('\n⚠ Этот скрипт не может выполнить CREATE TABLE через PostgREST.');
console.log('   Скопируйте SQL выше и выполните в Supabase → SQL Editor → Run.');
console.log('   После этого скрипт продолжит сидирование модулей из уроков.\n');

const { data: lessons, error: lErr } = await supabase
  .from('lessons_content')
  .select('module_number, module');
if (lErr) {
  console.error('Не могу получить уроки:', lErr.message);
  process.exit(2);
}

const byNum = new Map();
for (const l of lessons ?? []) {
  if (!byNum.has(l.module_number)) byNum.set(l.module_number, l.module);
}

const rows = [...byNum.entries()].map(([number, title]) => ({ number, title }));
console.log('Модули из уроков:', rows);

if (rows.length === 0) {
  console.log('Нет уроков — нечего сидировать. Создайте таблицу и продолжайте через UI.');
  process.exit(0);
}

const { error: upErr } = await supabase
  .from('modules_content')
  .upsert(rows, { onConflict: 'number' });

if (upErr) {
  console.error('Upsert error:', upErr.message);
  console.error('Если ошибка про "relation does not exist" — выполните SQL сверху в Supabase.');
  process.exit(3);
}

console.log(`\n✓ Загружено ${rows.length} модулей.`);
