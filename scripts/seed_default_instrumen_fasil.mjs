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

const defaultItems = [
  {
    id: 'FASIL-01',
    role: 'Reguler',
    kode: 'FSL-01',
    jenis_skala: '1-4',
    item_pernyataan: 'Saya rutin melakukan pendampingan dan sesi pembinaan berkala kepada seluruh Etoser binaan.',
    pertanyaan_validasi: 'Berapa sesi pembinaan yang telah terlaksana bulan ini?'
  },
  {
    id: 'FASIL-02',
    role: 'Reguler',
    kode: 'FSL-02',
    jenis_skala: '1-4',
    item_pernyataan: 'Saya memantau kehadiran dan keaktifan Etoser dalam setiap agenda pembinaan wilayah dan pusat.',
    pertanyaan_validasi: 'Tuliskan catatan kehadiran atau kendala etoser binaan Anda.'
  },
  {
    id: 'FASIL-03',
    role: 'Reguler',
    kode: 'FSL-03',
    jenis_skala: '1-4',
    item_pernyataan: 'Saya memberikan bimbingan dan umpan balik (feedback) yang konstruktif terhadap perkembangan perilaku dan akademik Etoser.',
    pertanyaan_validasi: 'Tuliskan contoh umpan balik yang telah diberikan kepada etoser.'
  },
  {
    id: 'FASIL-04',
    role: 'Reguler',
    kode: 'FSL-04',
    jenis_skala: '1-4',
    item_pernyataan: 'Saya berkoordinasi secara aktif dengan Pengelola Wilayah dan Tim Pusat mengenai dinamika pembinaan.',
    pertanyaan_validasi: 'Tuliskan poin koordinasi penting bulan ini.'
  },
  {
    id: 'FASIL-05',
    role: 'Reguler',
    kode: 'FSL-05',
    jenis_skala: '1-4',
    item_pernyataan: 'Saya menyelesaikan pengisian administrasi monev, presensi, dan penilaian tepat waktu sesuai jadwal.',
    pertanyaan_validasi: 'Tuliskan kendala administrasi jika ada.'
  }
];

async function run() {
  const existing = await client.execute("SELECT count(*) as count FROM instrumen_fasil");
  if (existing.rows[0].count === 0) {
    for (const item of defaultItems) {
      await client.execute({
        sql: "INSERT INTO instrumen_fasil (id, role, kode, jenis_skala, item_pernyataan, pertanyaan_validasi) VALUES (?, ?, ?, ?, ?, ?)",
        args: [item.id, item.role, item.kode, item.jenis_skala, item.item_pernyataan, item.pertanyaan_validasi]
      });
    }
    console.log(`Successfully seeded ${defaultItems.length} default items into instrumen_fasil!`);
  } else {
    console.log('instrumen_fasil already contains', existing.rows[0].count, 'items.');
  }
}
run();
