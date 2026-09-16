CREATE TABLE IF NOT EXISTS `profil_user` (
  `id` TEXT PRIMARY KEY NOT NULL REFERENCES `users`(`id`),
  `universitas` TEXT,
  `fakultas` TEXT,
  `jurusan` TEXT,
  `semester_berjalan` TEXT,
  `ipk_terakhir` REAL,
  `no_hp` TEXT,
  `alamat_domisili` TEXT
);

CREATE TABLE IF NOT EXISTS `portofolio` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `user_id` TEXT REFERENCES `users`(`id`),
  `kategori` TEXT NOT NULL,
  `judul_karya` TEXT NOT NULL,
  `tahun` TEXT NOT NULL,
  `deskripsi_singkat` TEXT,
  `link_bukti` TEXT
);

CREATE TABLE IF NOT EXISTS `periode_penilaian` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `bulan` TEXT NOT NULL,
  `tahun` TEXT NOT NULL,
  `tipe_instrumen` TEXT NOT NULL,
  `is_open` INTEGER DEFAULT 0
);
