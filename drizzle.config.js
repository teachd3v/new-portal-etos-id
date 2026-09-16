import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl() {
  if (process.env.LOCAL_DB_PATH) {
    return `file:${path.resolve(process.cwd(), process.env.LOCAL_DB_PATH)}`;
  }
  const miniflareDir = path.resolve(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (fs.existsSync(miniflareDir)) {
    const files = fs.readdirSync(miniflareDir);
    const sqliteFile = files.find(f => f.endsWith('.sqlite'));
    if (sqliteFile) {
      return `file:${path.join(miniflareDir, sqliteFile)}`;
    }
  }
  return `file:${path.resolve(process.cwd(), 'sqlite.db')}`;
}

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: getDatabaseUrl()
  }
});

