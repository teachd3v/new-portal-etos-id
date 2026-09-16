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
    const usersCols = await client.execute("PRAGMA table_info(users)");
    if (!usersCols.rows.some(r => r.name === 'avatar_url')) {
      await client.execute("ALTER TABLE users ADD COLUMN avatar_url text");
      console.log('Added avatar_url to users table');
    }

    const profilCols = await client.execute("PRAGMA table_info(profil_user)");
    if (!profilCols.rows.some(r => r.name === 'foto_profil')) {
      await client.execute("ALTER TABLE profil_user ADD COLUMN foto_profil text");
      console.log('Added foto_profil to profil_user table');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  }
}
run();
