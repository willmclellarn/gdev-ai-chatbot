CREATE TABLE IF NOT EXISTS "UserPreferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "chunkSize" text NOT NULL,
  "chunkOverlap" text NOT NULL,
  "chunkingStrategy" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_User_id_fk"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
