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
  try {
    await client.execute("ALTER TABLE periode_penilaian ADD COLUMN start_date TEXT");
    console.log("Added start_date column");
  } catch (e) {
    console.log("start_date notice:", e.message);
  }

  try {
    await client.execute("ALTER TABLE periode_penilaian ADD COLUMN end_date TEXT");
    console.log("Added end_date column");
  } catch (e) {
    console.log("end_date notice:", e.message);
  }

  // Populate default start_date and end_date
  await client.execute("UPDATE periode_penilaian SET start_date = '2026-09-01', end_date = '2026-09-30' WHERE kode_periode = 'T0'");
  await client.execute("UPDATE periode_penilaian SET start_date = '2027-06-01', end_date = '2027-06-30' WHERE kode_periode = 'T1'");
  await client.execute("UPDATE periode_penilaian SET start_date = '2028-06-01', end_date = '2028-06-30' WHERE kode_periode = 'T2'");
  await client.execute("UPDATE periode_penilaian SET start_date = '2029-06-01', end_date = '2029-06-30' WHERE kode_periode = 'T3'");
  await client.execute("UPDATE periode_penilaian SET start_date = '2030-06-01', end_date = '2030-06-30' WHERE kode_periode = 'T4'");

  const res = await client.execute("SELECT * FROM periode_penilaian");
  console.log("SUCCESS! ROWS:", res.rows);
}
run();
