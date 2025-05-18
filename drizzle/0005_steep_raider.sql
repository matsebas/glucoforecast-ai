ALTER TABLE "csv_readings" RENAME TO "csv_records";--> statement-breakpoint
ALTER TABLE "csv_records" DROP CONSTRAINT "csv_readings_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "csv_records" ADD CONSTRAINT "csv_records_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;