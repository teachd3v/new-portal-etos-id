import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';

function getDatabaseUrl() {
  if (process.env.LOCAL_DB_PATH) {
    return 'file:' + path.resolve(process.cwd(), process.env.LOCAL_DB_PATH);
  }
  const miniflareDir = path.resolve(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (fs.existsSync(miniflareDir)) {
    const files = fs.readdirSync(miniflareDir);
    const sqliteFile = files.find(f => f.endsWith('.sqlite'));
    if (sqliteFile) {
      return 'file:' + path.join(miniflareDir, sqliteFile);
    }
  }
  return 'file:' + path.resolve(process.cwd(), 'sqlite.db');
}

async function run() {
  const url = getDatabaseUrl();
  console.log('Connecting to database:', url);
  const client = createClient({ url });

  // 1. Create tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reli_instrumen (
      id TEXT PRIMARY KEY,
      kode TEXT NOT NULL,
      dimensi TEXT NOT NULL,
      subdimensi TEXT NOT NULL,
      order_num INTEGER NOT NULL,
      judul TEXT NOT NULL,
      pernyataan_self TEXT NOT NULL,
      pernyataan_fasil TEXT NOT NULL,
      bar_level_1 TEXT NOT NULL,
      bar_level_2 TEXT NOT NULL,
      bar_level_3 TEXT NOT NULL,
      bar_level_4 TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS reli_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      evaluator_id TEXT NOT NULL,
      evaluator_type TEXT NOT NULL,
      periode_kode TEXT NOT NULL,
      periode_id TEXT,
      tahun TEXT,
      raw_answers TEXT NOT NULL,
      vr_score REAL NOT NULL,
      sr_score REAL NOT NULL,
      sor_score REAL NOT NULL,
      cr_score REAL NOT NULL,
      subdimensions_json TEXT NOT NULL,
      overall_score REAL NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS reli_consolidated (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      periode_kode TEXT NOT NULL,
      tahun TEXT,
      self_score REAL,
      facil_score REAL,
      final_reli REAL,
      gap_score REAL,
      gap_category TEXT,
      maturity_level TEXT,
      dimensions_json TEXT,
      subdimensions_json TEXT,
      growth_delta REAL,
      growth_rate REAL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Try adding columns to periode_penilaian
  const alterQueries = [
    'ALTER TABLE periode_penilaian ADD COLUMN kode_periode TEXT;',
    'ALTER TABLE periode_penilaian ADD COLUMN label TEXT;',
    'ALTER TABLE periode_penilaian ADD COLUMN angkatan TEXT;'
  ];
  for (const q of alterQueries) {
    try { await client.execute(q); } catch(e) { /* ignore */ }
  }

  // 2. Seed 64 items
  const items = JSON.parse(fs.readFileSync('scripts/reli_items_data.json', 'utf-8'));
  console.log('Seeding', items.length, 'RELI items...');

  for (const item of items) {
    await client.execute({
      sql: `INSERT INTO reli_instrumen (id, kode, dimensi, subdimensi, order_num, judul, pernyataan_self, pernyataan_fasil, bar_level_1, bar_level_2, bar_level_3, bar_level_4)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              kode=excluded.kode,
              dimensi=excluded.dimensi,
              subdimensi=excluded.subdimensi,
              order_num=excluded.order_num,
              judul=excluded.judul,
              pernyataan_self=excluded.pernyataan_self,
              pernyataan_fasil=excluded.pernyataan_fasil,
              bar_level_1=excluded.bar_level_1,
              bar_level_2=excluded.bar_level_2,
              bar_level_3=excluded.bar_level_3,
              bar_level_4=excluded.bar_level_4;`,
      args: [
        item.id, item.kode, item.dimensi, item.subdimensi, item.order_num,
        item.judul, item.pernyataan_self, item.pernyataan_fasil,
        item.bar_level_1, item.bar_level_2, item.bar_level_3, item.bar_level_4
      ]
    });
  }

  // 3. Seed default periods T0 - T4
  const defaultPeriods = [
    { id: 'T0-2026', kode: 'T0', label: 'T0 - Baseline (Awal Tahun 1)', bulan: 'T0', tahun: '2026', angkatan: 'Semua', is_open: 1 },
    { id: 'T1-2026', kode: 'T1', label: 'T1 - Year 1 Endline (Akhir Tahun 1)', bulan: 'T1', tahun: '2026', angkatan: 'Semua', is_open: 0 },
    { id: 'T2-2026', kode: 'T2', label: 'T2 - Year 2 Endline (Akhir Tahun 2)', bulan: 'T2', tahun: '2026', angkatan: 'Semua', is_open: 0 },
    { id: 'T3-2026', kode: 'T3', label: 'T3 - Year 3 Endline (Akhir Tahun 3)', bulan: 'T3', tahun: '2026', angkatan: 'Semua', is_open: 0 },
    { id: 'T4-2026', kode: 'T4', label: 'T4 - Final Endline (Akhir Tahun 4)', bulan: 'T4', tahun: '2026', angkatan: 'Semua', is_open: 0 }
  ];

  for (const p of defaultPeriods) {
    await client.execute({
      sql: `INSERT INTO periode_penilaian (id, kode_periode, label, bulan, tahun, angkatan, tipe_instrumen, is_open)
            VALUES (?, ?, ?, ?, ?, ?, 'RELI', ?)
            ON CONFLICT(id) DO UPDATE SET
              kode_periode=excluded.kode_periode,
              label=excluded.label,
              bulan=excluded.bulan,
              tahun=excluded.tahun,
              angkatan=excluded.angkatan,
              tipe_instrumen=excluded.tipe_instrumen;`,
      args: [p.id, p.kode, p.label, p.bulan, p.tahun, p.angkatan, p.is_open]
    });
  }

  console.log('Seeding & migration completed successfully!');
}

run().catch(console.error);
