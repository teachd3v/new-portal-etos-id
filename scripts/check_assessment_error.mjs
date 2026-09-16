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
  const assessments = await client.execute("SELECT * FROM reli_assessments");
  console.log('Assessments in DB:', assessments.rows.length);
  assessments.rows.forEach(a => {
    console.log('ID:', a.id, 'User:', a.user_id, 'Score:', a.overall_score, 'Raw answers type:', typeof a.raw_answers);
    try {
      if (typeof a.raw_answers === 'string') {
        JSON.parse(a.raw_answers);
        console.log('JSON parse raw_answers OK');
      }
    } catch(e) {
      console.error('JSON parse ERROR on raw_answers:', e.message);
    }
  });

  const consolidated = await client.execute("SELECT * FROM reli_consolidated");
  console.log('Consolidated in DB:', consolidated.rows.length);
  consolidated.rows.forEach(c => {
    console.log('Consolidated:', c.user_id, c.periode_kode, c.final_reli, c.maturity_level);
  });
}
run();
