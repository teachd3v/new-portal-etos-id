import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

function findSqliteFile(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findSqliteFile(fullPath);
      if (found) return found;
    } else if (file.endsWith('.sqlite')) {
      return fullPath;
    }
  }
  return null;
}

const miniflareDir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const sqlitePath = findSqliteFile(miniflareDir);
const client = createClient({ url: 'file:' + sqlitePath });

async function run() {
  const updateRes = await client.execute(
    "UPDATE users SET fase = 'T4' WHERE angkatan = '2023' AND (role = 'Etoser' OR role = 'PM' OR role = 'ETOSER')"
  );
  console.log('Affected rows:', updateRes.rowsAffected);

  const check = await client.execute(
    "SELECT id, name, role, angkatan, fase FROM users WHERE angkatan = '2023'"
  );
  console.log('Total etosers angkatan 2023:', check.rows.length);
  console.log('Sample rows:', check.rows.slice(0, 5));
}
run();
