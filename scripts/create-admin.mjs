// Создаёт/обновляет пользователя-админа в Supabase Auth.
// Запуск:
//   node scripts/create-admin.mjs <email> <password>
//   node scripts/create-admin.mjs                 # email берётся из ADMIN_EMAIL, пароль из ADMIN_PASSWORD
//
// Скрипт идемпотентен: если пользователь уже есть, обновляются пароль/роль/подтверждение.

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
  console.error('✗ Нет NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env.local');
  process.exit(1);
}

const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim();
const password = (process.argv[3] || process.env.ADMIN_PASSWORD || '').trim();
const name = process.env.ADMIN_NAME || 'Администратор';

if (!email || !password) {
  console.error('✗ Укажите email и пароль:  node scripts/create-admin.mjs <email> <password>');
  process.exit(1);
}
if (password.length < 6) {
  console.error('✗ Пароль должен быть не короче 6 символов');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const userMeta = { name, role: 'admin' };

let existing = null;
let page = 1;
while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error('✗ listUsers:', error.message); process.exit(2); }
  const found = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (found) { existing = found; break; }
  if (data.users.length < 200) break;
  page += 1;
}

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { ...(existing.user_metadata || {}), ...userMeta },
  });
  if (error) { console.error('✗ updateUser:', error.message); process.exit(3); }
  console.log(`✓ Обновлён существующий пользователь ${email}`);
  console.log(`  id:   ${existing.id}`);
  console.log(`  роль: admin (в user_metadata)`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMeta,
  });
  if (error) { console.error('✗ createUser:', error.message); process.exit(4); }
  console.log(`✓ Создан новый администратор ${email}`);
  console.log(`  id:   ${data.user?.id}`);
}

console.log('\nВход: /sign_in');
console.log(`  email:    ${email}`);
console.log(`  password: ${password}`);
console.log('\nПосле входа админка доступна по /admin');
