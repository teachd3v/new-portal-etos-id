import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

async function migrateDb(dbPath) {
  if (!fs.existsSync(dbPath)) return;
  const c = createClient({ url: 'file:' + dbPath });
  const tables = await c.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('post_test_questions', 'post_test_attempts')"
  );
  if (tables.rows.length === 0) return;
  console.log('Migrating:', dbPath);
  for (const tbl of ['post_test_questions', 'post_test_attempts']) {
    const info = await c.execute(`PRAGMA table_info(${tbl})`);
    if (!info.rows.some((r) => r.name === 'test_type')) {
      await c.execute(`ALTER TABLE ${tbl} ADD COLUMN test_type TEXT NOT NULL DEFAULT 'POST_TEST'`);
      console.log(`  + Added test_type column to ${tbl}`);
    } else {
      console.log(`  = test_type already exists on ${tbl}`);
    }
  }
}

async function inspectDb(dbPath) {
  if (!fs.existsSync(dbPath)) return;
  const c = createClient({ url: 'file:' + dbPath });
  const tables = await c.execute("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.rows.some(r => r.name === 'users')) {
    await c.execute({
      sql: "UPDATE users SET password = ? WHERE id = 'ADM001'",
      args: ['mha2026']
    });
    const admins = await c.execute("SELECT id, name, role, password FROM users WHERE role LIKE '%Admin%'");
    console.log('DB:', path.basename(dbPath), 'Admins:', admins.rows);
  }
}

async function run() {
  await inspectDb(path.resolve('sqlite.db'));
  const mf = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (fs.existsSync(mf)) {
    for (const f of fs.readdirSync(mf).filter((x) => x.endsWith('.sqlite'))) {
      await inspectDb(path.join(mf, f));
    }
  }
  await migrateDb(path.resolve('sqlite.db'));
  if (fs.existsSync(mf)) {
    for (const f of fs.readdirSync(mf).filter((x) => x.endsWith('.sqlite'))) {
      await migrateDb(path.join(mf, f));
    }
  }
}

run();
