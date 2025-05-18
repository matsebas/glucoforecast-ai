ALTER TABLE "csv_readings" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "uploaded_files" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "csv_readings" DROP CONSTRAINT "csv_readings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "uploaded_files" DROP CONSTRAINT "uploaded_files_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "csv_readings_timestamp_type_idx";--> statement-breakpoint
ALTER TABLE "csv_readings" ADD CONSTRAINT "csv_readings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "csv_readings_timestamp_type_idx" ON "csv_readings" USING btree ("userId","timestamp","record_type");