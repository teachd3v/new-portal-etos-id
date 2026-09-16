import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // ID_Etoser / ID_Fasil
  name: text('name').notNull(),
  role: text('role').notNull(), // 'PM', 'FASIL', 'ADMIN'
  password: text('password'), // Custom JWT login password hash/plain
  angkatan: text('angkatan'),
  wilayah: text('wilayah'),
  tahun_pembinaan: text('tahun_pembinaan'), // Legacy 1, 2, 3, 4 (Etoser)
  fase: text('fase').default('T0'), // 'T0', 'T1', 'T2', 'T3', 'T4'
  fasil_role: text('fasil_role'), // Double Job, Team Leader, Adminkeu, Reguler
  relasi_pm: text('relasi_pm'), // Khusus Fasil
  relasi_etoser: text('relasi_etoser'), // Comma separated IDs Etoser untuk Fasil
  avatar_url: text('avatar_url'),
});


export const agendas = sqliteTable('agendas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'Nasional' atau 'Wilayah'
  activity_type: text('activity_type'),
  theme: text('theme'),
  start_date: text('start_date'),
  end_date: text('end_date'),
  start_time: text('start_time'),
  end_time: text('end_time'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  target_role: text('target_role').default('ETOSER'),
});

export const app_settings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updated_at: text('updated_at'),
});

export const instrumen_etoser = sqliteTable('instrumen_etoser', {
  id: text('id').primaryKey(),
  tahun_pembinaan: text('tahun_pembinaan').notNull(), // 1, 2, 3, 4
  variabel: text('variabel').notNull(),
  kode: text('kode').notNull(),
  jenis_skala: text('jenis_skala').notNull(),
  indikator: text('indikator').notNull(),
  item_pernyataan: text('item_pernyataan').notNull(),
  pertanyaan_validasi: text('pertanyaan_validasi'),
});

export const instrumen_fasil = sqliteTable('instrumen_fasil', {
  id: text('id').primaryKey(),
  role: text('role').notNull(), // Reguler, Team Leader, dll
  kode: text('kode').notNull(),
  jenis_skala: text('jenis_skala').notNull(),
  item_pernyataan: text('item_pernyataan').notNull(),
  pertanyaan_validasi: text('pertanyaan_validasi'),
});

export const instrumen_peer = sqliteTable('instrumen_peer', {
  id: text('id').primaryKey(),
  variabel: text('variabel').notNull(),
  kode: text('kode').notNull(),
  jenis_skala: text('jenis_skala').notNull(),
  item_pernyataan: text('item_pernyataan').notNull(),
});

export const katalog_sanksi = sqliteTable('katalog_sanksi', {
  id: text('id').primaryKey(),
  kategori: text('kategori').notNull(),
  detail_pelanggaran: text('detail_pelanggaran').notNull(),
  masa_perbaikan: text('masa_perbaikan').notNull(),
  poin: integer('poin').notNull(),
  credit_perform: text('credit_perform').notNull(),
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  agenda_id: text('agenda_id').references(() => agendas.id),
  fasil_id: text('fasil_id'),
  pm_id: text('pm_id').references(() => users.id),
  execution_date: text('execution_date'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id),
  type: text('type'), // 'ETOSER_SELF_ASSESSMENT', 'FASIL_PEER_ASSESSMENT', 'FASIL_SELF_ASSESSMENT'
  period_year: text('period_year'),
  period_month: text('period_month'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const report_answers = sqliteTable('report_answers', {
  id: text('id').primaryKey(),
  report_id: text('report_id').references(() => reports.id),
  question_code: text('question_code').notNull(),
  score: real('score'),
  value: text('value'),
});

export const profil_user = sqliteTable('profil_user', {
  id: text('id').primaryKey().references(() => users.id),
  universitas: text('universitas'),
  fakultas: text('fakultas'),
  jurusan: text('jurusan'),
  semester_berjalan: text('semester_berjalan'),
  ipk_terakhir: real('ipk_terakhir'),
  no_hp: text('no_hp'),
  alamat_domisili: text('alamat_domisili'),
  foto_profil: text('foto_profil'),
});


export const portofolio = sqliteTable('portofolio', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id),
  kategori: text('kategori').notNull(),
  judul_karya: text('judul_karya').notNull(),
  tahun: text('tahun').notNull(),
  deskripsi_singkat: text('deskripsi_singkat'),
  link_bukti: text('link_bukti'),
});

export const periode_penilaian = sqliteTable('periode_penilaian', {
  id: text('id').primaryKey(),
  kode_periode: text('kode_periode'), // 'T0', 'T1', 'T2', 'T3', 'T4'
  label: text('label'), // e.g. 'T0 - Baseline (Awal Tahun 1)'
  angkatan: text('angkatan'), // e.g. '2024', '2025', 'Semua'
  bulan: text('bulan'),
  tahun: text('tahun').notNull(),
  start_date: text('start_date'), // YYYY-MM-DD
  end_date: text('end_date'),     // YYYY-MM-DD
  tipe_instrumen: text('tipe_instrumen'), // 'RELI'
  is_open: integer('is_open', { mode: 'boolean' }).default(false),
});


export const reli_instrumen = sqliteTable('reli_instrumen', {
  id: text('id').primaryKey(), // e.g. 'VR-S1', 'CR-L4'
  kode: text('kode').notNull(),
  dimensi: text('dimensi').notNull(), // 'Value Resilience', 'Self Resilience', 'Social Resilience', 'Change Resilience'
  subdimensi: text('subdimensi').notNull(), // e.g. 'Spirituality', 'Integrity', etc.
  order_num: integer('order_num').notNull(), // 1 - 64
  judul: text('judul').notNull(), // e.g. 'Menjaga ibadah di tengah kesibukan'
  pernyataan_self: text('pernyataan_self').notNull(),
  pernyataan_fasil: text('pernyataan_fasil').notNull(),
  bar_level_1: text('bar_level_1').notNull(), // Emerging Leader
  bar_level_2: text('bar_level_2').notNull(), // Developing Leader
  bar_level_3: text('bar_level_3').notNull(), // Transformative Leader
  bar_level_4: text('bar_level_4').notNull(), // Resilient Leader
});

export const reli_assessments = sqliteTable('reli_assessments', {
  id: text('id').primaryKey(), // UUID or `${user_id}_${evaluator_type}_${periode_kode}`
  user_id: text('user_id').references(() => users.id).notNull(), // Etoser being evaluated
  evaluator_id: text('evaluator_id').references(() => users.id).notNull(), // Who is evaluating (same as user_id for SELF, or fasil_id)
  evaluator_type: text('evaluator_type').notNull(), // 'SELF' or 'FACILITATOR'
  periode_kode: text('periode_kode').notNull(), // 'T0', 'T1', 'T2', 'T3', 'T4'
  periode_id: text('periode_id'),
  tahun: text('tahun'),
  raw_answers: text('raw_answers').notNull(), // JSON string { "VR-S1": 4, "VR-S2": 3, ... }
  vr_score: real('vr_score').notNull(), // Value Resilience (1.00 - 4.00)
  sr_score: real('sr_score').notNull(), // Self Resilience (1.00 - 4.00)
  sor_score: real('sor_score').notNull(), // Social Resilience (1.00 - 4.00)
  cr_score: real('cr_score').notNull(), // Change Resilience (1.00 - 4.00)
  subdimensions_json: text('subdimensions_json').notNull(), // JSON { "Spirituality": 3.75, ... }
  overall_score: real('overall_score').notNull(), // mean of 4 dimensions (1.00 - 4.00)
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const reli_consolidated = sqliteTable('reli_consolidated', {
  id: text('id').primaryKey(), // `${user_id}_${periode_kode}`
  user_id: text('user_id').references(() => users.id).notNull(),
  periode_kode: text('periode_kode').notNull(), // 'T0', 'T1', 'T2', 'T3', 'T4'
  tahun: text('tahun'),
  self_score: real('self_score'),
  facil_score: real('facil_score'),
  final_reli: real('final_reli'), // (50% self + 50% facil) or self_score if facil not yet evaluated
  gap_score: real('gap_score'), // self_score - facil_score
  gap_category: text('gap_category'), // 'Selaras', 'Perlu refleksi', 'Significant Awareness Gap', 'Critical Awareness Gap'
  maturity_level: text('maturity_level'), // 'Emerging Leader', 'Developing Leader', 'Transformative Leader', 'Resilient Leader'
  dimensions_json: text('dimensions_json'), // JSON { vr: { self: 3.69, facil: 3.25, final: 3.47 }, ... }
  subdimensions_json: text('subdimensions_json'), // JSON { "Spirituality": { self: 3.75, facil: 3.25, final: 3.50, gap: 0.50 }, ... }
  growth_delta: real('growth_delta'), // Tn - T0
  growth_rate: real('growth_rate'), // % growth vs T0
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sanksi_user = sqliteTable('sanksi_user', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id).notNull(),
  fasil_id: text('fasil_id').references(() => users.id).notNull(),
  katalog_sanksi_id: text('katalog_sanksi_id').references(() => katalog_sanksi.id).notNull(),
  poin: integer('poin').notNull(),
  keterangan: text('keterangan'),
  status: text('status').default('PENDING'),
  period_month: text('period_month').notNull(),
  period_year: text('period_year').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const catatan_admin = sqliteTable('catatan_admin', {
  id: text('id').primaryKey(),
  target_user_id: text('target_user_id').references(() => users.id).notNull(),
  period_month: text('period_month').notNull(),
  period_year: text('period_year').notNull(),
  catatan: text('catatan').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const post_test_questions = sqliteTable('post_test_questions', {
  id: text('id').primaryKey(),
  agenda_id: text('agenda_id').references(() => agendas.id, { onDelete: 'cascade' }).notNull(),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON stringified array of choices: ["A", "B", "C", "D"]
  correct_option: text('correct_option').notNull(), // index or option text: "A", "B", "C", "D"
});

export const post_test_attempts = sqliteTable('post_test_attempts', {
  id: text('id').primaryKey(),
  agenda_id: text('agenda_id').references(() => agendas.id, { onDelete: 'cascade' }).notNull(),
  user_id: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  score: real('score').notNull(),
  answers: text('answers').notNull(), // JSON stringified answer dictionary: {"questionId": "A"}
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

