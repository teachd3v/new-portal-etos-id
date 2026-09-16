import { createClient } from '@libsql/client';

async function executeSql(url, sql) {
  const client = createClient({ url });
  try {
    await client.execute(sql);
    console.log(`Successfully executed on ${url}`);
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log(`Column already exists on ${url}`);
    } else {
      console.error(`Error on ${url}:`, err.message);
    }
  }
}

async function main() {
  const sql = 'ALTER TABLE users ADD COLUMN relasi_etoser TEXT;';
  await executeSql('file:sqlite.db', sql);
  await executeSql('file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/73dfeaebfbe0a498f076c5a56e29bd5a4dd823e32ed1d5812701eac2cff9dc9d.sqlite', sql);
}

main();
