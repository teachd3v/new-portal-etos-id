import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let localDbInstance = null;

function getLocalDb() {
  if (localDbInstance) return localDbInstance;

  let dbUrl = `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'sqlite.db')}`;
  if (process.env.LOCAL_DB_PATH) {
    dbUrl = `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.LOCAL_DB_PATH)}`;
  } else {
    // Check wrangler miniflare state directory
    const miniflareDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    if (fs.existsSync(miniflareDir)) {
      const files = fs.readdirSync(miniflareDir);
      const sqliteFile = files.find(f => f.endsWith('.sqlite'));
      if (sqliteFile) {
        dbUrl = `file:${path.join(miniflareDir, sqliteFile)}`;
      }
    }
  }

  const client = createClient({ url: dbUrl });
  localDbInstance = drizzleLibsql(client, { schema });
  return localDbInstance;
}

export function getDb() {
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && ctx.env.DB) {
      return drizzleD1(ctx.env.DB, { schema });
    }
  } catch {
    // Ignore when running outside Cloudflare Workers context
  }

  return getLocalDb();
}

export const db = new Proxy({}, {
  get(target, prop) {
    const instance = getDb();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

