import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import ts from 'typescript';

process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.NEXT_PUBLIC_ADMIN_EMAIL = 'admin@example.test';

async function loadBoundary(user, error = null) {
  let mutations = 0;
  const source = await readFile(new URL('../src/lib/admin-auth.ts', import.meta.url), 'utf8');
  const auth = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText);
  const server = new SyntheticModule(['createClient'], function () {
    this.setExport('createClient', async () => ({ auth: { getUser: async () => ({ data: { user }, error }) } }));
  });
  await auth.link(() => server);
  await auth.evaluate();
  const actionSource = await readFile(new URL('../src/app/actions/admin.ts', import.meta.url), 'utf8');
  const actions = new SourceTextModule(ts.transpileModule(actionSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText);
  await actions.link(specifier => {
    if (specifier === '@/lib/admin-auth') return auth;
    if (specifier === '@/lib/supabase/server') return server;
    const exports = specifier === 'next/cache' ? { revalidatePath() {} } : {
      createAdminClient: () => ({ from: () => ({ update: () => ({ eq: async () => { mutations++; return { error: null }; } }) }) }),
    };
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    });
  });
  await actions.evaluate();
  return { auth: auth.namespace, actions: actions.namespace, mutations: () => mutations };
}

test('editable metadata, matching email and misleading top-level role never grant admin', async () => {
  for (const extra of [{ user_metadata: { role: 'admin' } }, { email: 'admin@example.test', email_confirmed_at: '2026-01-01' }, { role: 'admin' }, { app_metadata: { role: 'ADMIN' } }]) {
    const boundary = await loadBoundary({ id: 'ordinary-user', email: 'user@example.test', app_metadata: {}, ...extra });
    const result = await boundary.auth.checkAdmin();
    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.reason, 'Нет прав администратора');
    await assert.rejects(boundary.actions.updateApplicationStatus('application-1', 'accepted'), /Нет прав администратора/);
    assert.equal(boundary.mutations(), 0);
    for (const name of ['getLessonsForAdmin', 'getTestsForAdmin', 'getTipsForAdmin']) {
      await assert.rejects(boundary.actions[name](), /Нет прав администратора/);
    }
  }
});

test('a trusted app_metadata administrator retains API and Server Action access', async () => {
  const boundary = await loadBoundary({ id: 'trusted-admin', email: 'owner@example.test', app_metadata: { role: 'admin', provider: 'email' }, user_metadata: { role: 'user' } });
  const result = await boundary.auth.checkAdmin();
  assert.equal(result.ok, true);
  assert.equal(result.userId, 'trusted-admin');
  assert.equal(result.email, 'owner@example.test');
  assert.equal((await boundary.actions.updateApplicationStatus('application-1', 'accepted')).success, true);
  assert.equal(boundary.mutations(), 1);
});

test('missing or invalid sessions fail closed before service-role writes', async () => {
  for (const [user, error] of [[null, null], [{ id: 'admin', app_metadata: { role: 'admin' } }, new Error('invalid token')]]) {
    const boundary = await loadBoundary(user, error);
    const result = await boundary.auth.checkAdmin();
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    await assert.rejects(boundary.actions.updateApplicationStatus('application-1', 'accepted'), /Не авторизован/);
    assert.equal(boundary.mutations(), 0);
  }
});
