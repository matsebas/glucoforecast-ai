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
ALTER TABLE "glucose_metrics" ADD CONSTRAINT "glucose_metrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "glucose_metrics_user_period_idx" ON "glucose_metrics" USING btree ("userId","time_period");