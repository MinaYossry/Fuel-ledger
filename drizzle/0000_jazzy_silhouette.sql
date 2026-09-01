CREATE TABLE `ledger_state` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`etag` text NOT NULL,
	`updated_at` integer NOT NULL
);
