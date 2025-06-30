CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "csv_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"glucose" double precision DEFAULT 0 NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"record_type" varchar(2) NOT NULL,
	"rapid_insulin" double precision,
	"long_insulin" double precision,
	"carbs" double precision,
	"notes" text,
	"device" varchar(255),
	"serial_number" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "glucose_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"time_period" varchar(10) NOT NULL,
	"time_in_range" double precision NOT NULL,
	"time_below_range" double precision NOT NULL,
	"time_above_range" double precision NOT NULL,
	"average_glucose" double precision NOT NULL,
	"variability" double precision,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"isf" integer DEFAULT 100 NOT NULL,
	"icr" integer DEFAULT 10 NOT NULL,
	"target_low" integer DEFAULT 70 NOT NULL,
	"target_high" integer DEFAULT 180 NOT NULL,
	"pen_increment" double precision DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploaded_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"original_filename" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"email_verified_at" timestamp with time zone DEFAULT now(),
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_records" ADD CONSTRAINT "csv_records_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glucose_metrics" ADD CONSTRAINT "glucose_metrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_settings" ADD CONSTRAINT "patient_settings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "csv_records_timestamp_type_idx" ON "csv_records" USING btree ("userId","timestamp","record_type");--> statement-breakpoint
CREATE UNIQUE INDEX "glucose_metrics_user_period_idx" ON "glucose_metrics" USING btree ("userId","time_period");