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

function checkDateWindow(currentDay, start, end) {
  if (start <= end) {
    return currentDay >= start && currentDay <= end;
  } else {
    return currentDay >= start || currentDay <= end;
  }
}

async function run() {
  const etoStart = await client.execute("SELECT value FROM app_settings WHERE key = 'periode_etoser_start'");
  const etoEnd = await client.execute("SELECT value FROM app_settings WHERE key = 'periode_etoser_end'");
  
  const start = parseInt(etoStart.rows[0].value, 10);
  const end = parseInt(etoEnd.rows[0].value, 10);

  console.log(`Setting Database: Tanggal Mulai = ${start}, Tanggal Selesai = ${end}`);
  
  // Test cases
  const testDates = [1, 2, 3, 4, 15, 24, 25, 28, 30];
  console.log('\n--- Hasil Audit Logika Tanggal (Setting: 25 s.d 3) ---');
  testDates.forEach(day => {
    const isOpen = checkDateWindow(day, start, end);
    console.log(`Tanggal ${day.toString().padStart(2, ' ')} September -> Status: ${isOpen ? '✅ DIBUKA (Bisa Mengisi)' : '🔒 DITUTUP (Terkunci)'}`);
  });
}
run();
