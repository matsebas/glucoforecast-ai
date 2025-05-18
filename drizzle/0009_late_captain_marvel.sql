CREATE TABLE "patient_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"isf" integer DEFAULT 100 NOT NULL,
	"icr" integer DEFAULT 10 NOT NULL,
	"target_low" integer DEFAULT 70 NOT NULL,
	"target_high" integer DEFAULT 180 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_settings" ADD CONSTRAINT "patient_settings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;