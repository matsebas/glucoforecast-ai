DROP INDEX "csv_readings_timestamp_type_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "csv_records_timestamp_type_idx" ON "csv_records" USING btree ("userId","timestamp","record_type");