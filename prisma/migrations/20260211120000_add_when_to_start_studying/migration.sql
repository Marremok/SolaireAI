-- Add whenToStartStudying with default "tomorrow" (backfills existing rows)
ALTER TABLE "exams" ADD COLUMN "whenToStartStudying" TEXT NOT NULL DEFAULT 'tomorrow';
