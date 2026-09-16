CREATE TABLE `agendas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`activity_type` text,
	`theme` text,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`agenda_id` text,
	`fasil_id` text,
	`pm_id` text,
	`execution_date` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`agenda_id`) REFERENCES `agendas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pm_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `report_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text,
	`question_code` text NOT NULL,
	`score` real,
	`value` text,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text,
	`period_year` text,
	`period_month` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`password` text,
	`angkatan` text,
	`wilayah` text,
	`relasi_pm` text
);
