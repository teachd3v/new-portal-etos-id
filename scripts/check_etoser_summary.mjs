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
  const res = await client.execute(
    "SELECT angkatan, fase, count(id) as total FROM users WHERE role = 'Etoser' OR role = 'PM' OR role = 'ETOSER' GROUP BY angkatan, fase ORDER BY angkatan"
  );
  console.log('REKAP ETOSER PER ANGKATAN & FASE:');
  console.table(res.rows);
}
run();
