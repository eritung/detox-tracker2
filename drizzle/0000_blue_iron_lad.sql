CREATE TABLE `checkins` (
	`user_id` text NOT NULL,
	`day` integer NOT NULL,
	`completed_json` text DEFAULT '[]' NOT NULL,
	`sleep_at` text DEFAULT '' NOT NULL,
	`wake_at` text DEFAULT '' NOT NULL,
	`morning_mood` text DEFAULT '' NOT NULL,
	`morning_note` text DEFAULT '' NOT NULL,
	`evening_mood` text DEFAULT '' NOT NULL,
	`evening_note` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE INDEX `idx_checkins_user_day` ON `checkins` (`user_id`,`day`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`toxin_type` text NOT NULL,
	`start_date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
