ALTER TABLE "csv_records" ALTER COLUMN "glucose" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "csv_records" ALTER COLUMN "glucose" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "csv_records" ALTER COLUMN "rapid_insulin" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "csv_records" ALTER COLUMN "long_insulin" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "csv_records" ALTER COLUMN "carbs" SET DATA TYPE double precision;