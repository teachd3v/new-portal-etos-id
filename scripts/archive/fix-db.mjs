import { createClient } from '@libsql/client';

async function main() {
  const client = createClient({ url: 'file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/73dfeaebfbe0a498f076c5a56e29bd5a4dd823e32ed1d5812701eac2cff9dc9d.sqlite' });
  try {
    await client.execute('ALTER TABLE instrumen_peer RENAME COLUMN indikator TO variabel');
    console.log('Successfully renamed column in instrumen_peer (Wrangler DB)');
  } catch (err) {
    console.error('Error renaming column:', err.message);
  }
}

main();
