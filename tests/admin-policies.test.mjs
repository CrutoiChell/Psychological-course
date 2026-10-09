import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('database policies block direct anonymous/user writes while preserving public reads and service writes', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    const tables = ['lessons_content', 'tests_content', 'tips_content', 'modules_content'];
    for (const table of [...tables, 'applications']) {
      await db.exec(`CREATE TABLE ${table} (id int PRIMARY KEY, value text);
        ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ${table} TO anon, authenticated, service_role;
        INSERT INTO ${table} VALUES (1, 'original');`);
    }
    const names = ['Admin write lessons', 'Admin write tests', 'Admin write tips', 'Service write modules'];
    for (const [index, table] of tables.entries()) {
      await db.exec(`CREATE POLICY "Public read" ON ${table} FOR SELECT USING (true);
        CREATE POLICY "${names[index]}" ON ${table} FOR ALL USING (true);`);
    }
    await db.exec(`CREATE POLICY "Admins can read applications" ON applications FOR SELECT USING (true);
      CREATE POLICY "Anyone can insert applications" ON applications FOR INSERT WITH CHECK (true);`);
    // Reproduce the old policy bypass before applying the actual migration.
    await db.exec(`SET ROLE anon; UPDATE lessons_content SET value = 'unauthorized' WHERE id = 1; RESET ROLE;`);
    assert.equal((await db.query('SELECT value FROM lessons_content')).rows[0].value, 'unauthorized');
    await db.exec(`UPDATE lessons_content SET value = 'original';`);
    await db.exec(await readFile(new URL('../scripts/restrict-admin-policies.sql', import.meta.url), 'utf8'));
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role};`);
      for (const table of tables) {
        assert.equal((await db.query(`SELECT value FROM ${table} WHERE id = 1`)).rows[0].value, 'original');
        await assert.rejects(db.exec(`INSERT INTO ${table} VALUES (2, 'attack')`), /row-level security/);
        await db.exec(`UPDATE ${table} SET value = 'attack' WHERE id = 1; DELETE FROM ${table} WHERE id = 1;`);
        assert.equal((await db.query(`SELECT value FROM ${table} WHERE id = 1`)).rows[0].value, 'original');
      }
      assert.equal((await db.query('SELECT * FROM applications')).rows.length, 0);
      await db.exec(`INSERT INTO applications VALUES (${role === 'anon' ? 2 : 3}, 'public submission'); RESET ROLE;`);
    }
    await db.exec('SET ROLE service_role;');
    for (const table of tables) {
      await db.exec(`INSERT INTO ${table} VALUES (2, 'admin'); UPDATE ${table} SET value = 'updated' WHERE id = 1; DELETE FROM ${table} WHERE id = 2;`);
      assert.equal((await db.query(`SELECT value FROM ${table} WHERE id = 1`)).rows[0].value, 'updated');
    }
    assert.equal((await db.query('SELECT * FROM applications')).rows.length, 3);
  } finally {
    await db.close();
  }
});
