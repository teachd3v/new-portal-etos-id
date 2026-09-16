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

const items = [
  { id: 'ETS-T1-01', tahun_pembinaan: '1', variabel: 'Integritas', kode: 'ETS-01', jenis_skala: '1-4', indikator: 'Kedisiplinan Spiritual', item_pernyataan: 'Saya menjalankan ibadah wajib dan sunnah harian secara tertib dan terjadwal.', pertanyaan_validasi: 'Tuliskan capaian target ibadah Anda bulan ini.' },
  { id: 'ETS-T1-02', tahun_pembinaan: '1', variabel: 'Integritas', kode: 'ETS-02', jenis_skala: '1-4', indikator: 'Kehadiran Pembinaan', item_pernyataan: 'Saya menghadiri seluruh agenda pembinaan Etos ID tepat waktu.', pertanyaan_validasi: 'Sebutkan agenda pembinaan yang Anda ikuti bulan ini.' },
  { id: 'ETS-T1-03', tahun_pembinaan: '1', variabel: 'Profesional', kode: 'ETS-03', jenis_skala: '1-4', indikator: 'Manajemen Waktu & Akademik', item_pernyataan: 'Saya mengatur waktu belajar mandiri dan pengerjaan tugas kuliah secara optimal.', pertanyaan_validasi: 'Tuliskan progres target akademik/IPK Anda.' },
  { id: 'ETS-T1-04', tahun_pembinaan: '1', variabel: 'Adaptif', kode: 'ETS-04', jenis_skala: '1-4', indikator: 'Adaptasi Lingkungan', item_pernyataan: 'Saya mampu beradaptasi dan membangun hubungan positif dengan lingkungan kampus dan asrama.', pertanyaan_validasi: 'Ceritakan adaptasi positif yang Anda lakukan.' },
  { id: 'ETS-T1-05', tahun_pembinaan: '1', variabel: 'Transformatif', kode: 'ETS-05', jenis_skala: '1-4', indikator: 'Kontribusi Sosial', item_pernyataan: 'Saya aktif berpartisipasi dalam program sosial kemasyarakatan atau proyek pembinaan.', pertanyaan_validasi: 'Tuliskan aksi kontribusi sosial yang Anda lakukan.' }
];

async function run() {
  const existing = await client.execute("SELECT count(*) as count FROM instrumen_etoser");
  if (existing.rows[0].count === 0) {
    for (const item of items) {
      await client.execute({
        sql: "INSERT INTO instrumen_etoser (id, tahun_pembinaan, variabel, kode, jenis_skala, indikator, item_pernyataan, pertanyaan_validasi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [item.id, item.tahun_pembinaan, item.variabel, item.kode, item.jenis_skala, item.indikator, item.item_pernyataan, item.pertanyaan_validasi]
      });
    }
    console.log(`Successfully seeded ${items.length} items into instrumen_etoser!`);
  } else {
    console.log('instrumen_etoser already contains items:', existing.rows[0].count);
  }
}
run();
