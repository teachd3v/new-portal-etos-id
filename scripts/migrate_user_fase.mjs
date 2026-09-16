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
    await client.execute("ALTER TABLE users ADD COLUMN fase TEXT DEFAULT 'T0'");
    console.log("Added fase column to users table");
  } catch (e) {
    console.log("fase column notice:", e.message);
  }

  // Populate fase for existing users based on tahun_pembinaan if any
  await client.execute("UPDATE users SET fase = 'T0' WHERE fase IS NULL OR fase = ''");
  await client.execute("UPDATE users SET fase = 'T0' WHERE tahun_pembinaan = '1' AND (fase IS NULL OR fase = '' OR fase = 'T0')");
  await client.execute("UPDATE users SET fase = 'T1' WHERE tahun_pembinaan = '2'");
  await client.execute("UPDATE users SET fase = 'T2' WHERE tahun_pembinaan = '3'");
  await client.execute("UPDATE users SET fase = 'T3' WHERE tahun_pembinaan = '4'");

  const res = await client.execute("SELECT id, name, role, angkatan, tahun_pembinaan, fase FROM users WHERE role = 'Etoser' OR role = 'PM' LIMIT 5");
  console.log("MIGRATED USERS SAMPLE:", res.rows);
}
run();
