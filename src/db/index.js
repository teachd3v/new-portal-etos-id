import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

function getDatabaseUrl() {
  if (process.env.LOCAL_DB_PATH) {
    return `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.LOCAL_DB_PATH)}`;
  }

  // Check wrangler miniflare state directory
  const miniflareDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (fs.existsSync(miniflareDir)) {
    const files = fs.readdirSync(miniflareDir);
    const sqliteFile = files.find(f => f.endsWith('.sqlite'));
    if (sqliteFile) {
      return `file:${path.join(miniflareDir, sqliteFile)}`;
    }
  }

  return `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'sqlite.db')}`;
}


const client = createClient({ url: getDatabaseUrl() });
export const db = drizzle(client, { schema });

