ALTER TABLE "email_campaigns" ADD COLUMN "archived_at" timestamp with time zone;
ALTER TABLE "profiles" ADD COLUMN "email_signature" text;
