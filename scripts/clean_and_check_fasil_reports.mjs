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
  const res = await client.execute("SELECT * FROM reports WHERE type = 'FASIL_SELF_ASSESSMENT'");
  console.log('Fasil self reports count:', res.rows.length);
  res.rows.forEach(r => {
    console.log('Report:', r.id, r.user_id, r.period_month, r.period_year);
  });

  // If any report has period_month = 'T0', update it to 'September' or clean it
  await client.execute("UPDATE reports SET period_month = 'September' WHERE type = 'FASIL_SELF_ASSESSMENT' AND period_month = 'T0'");
  console.log('Updated legacy T0 report periods to September in reports table.');
}
run();
