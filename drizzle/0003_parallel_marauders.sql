CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_settings_key_unique` ON `app_settings` (`key`);--> statement-breakpoint
CREATE TABLE `instrumen_etoser` (
	`id` text PRIMARY KEY NOT NULL,
	`tahun_pembinaan` text NOT NULL,
	`variabel` text NOT NULL,
	`kode` text NOT NULL,
	`jenis_skala` text NOT NULL,
	`indikator` text NOT NULL,
	`item_pernyataan` text NOT NULL,
	`pertanyaan_validasi` text
);
--> statement-breakpoint
CREATE TABLE `instrumen_fasil` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`kode` text NOT NULL,
	`jenis_skala` text NOT NULL,
	`item_pernyataan` text NOT NULL,
	`pertanyaan_validasi` text
);
--> statement-breakpoint
CREATE TABLE `instrumen_peer` (
	`id` text PRIMARY KEY NOT NULL,
	`indikator` text NOT NULL,
	`kode` text NOT NULL,
	`jenis_skala` text NOT NULL,
	`item_pernyataan` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `katalog_sanksi` (
	`id` text PRIMARY KEY NOT NULL,
	`kategori` text NOT NULL,
	`detail_pelanggaran` text NOT NULL,
	`masa_perbaikan` text NOT NULL,
	`poin` integer NOT NULL,
	`credit_perform` text NOT NULL
);
