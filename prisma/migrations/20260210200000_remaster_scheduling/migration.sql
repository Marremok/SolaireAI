-- Step 1: Add targetSessionsPerWeek with a temporary default
ALTER TABLE "exams" ADD COLUMN "targetSessionsPerWeek" INTEGER NOT NULL DEFAULT 3;

-- Step 2: Backfill from hoursPerWeek (derive sessions from hours / session-length)
UPDATE "exams"
SET "targetSessionsPerWeek" = GREATEST(1, CEIL(COALESCE("hoursPerWeek", 5.0) / ("preferredSessionLengthMinutes" / 60.0)));

-- Step 3: Remove the temporary default
ALTER TABLE "exams" ALTER COLUMN "targetSessionsPerWeek" DROP DEFAULT;

-- Step 4: Rename preferredSessionLengthMinutes -> sessionLengthMinutes
ALTER TABLE "exams" RENAME COLUMN "preferredSessionLengthMinutes" TO "sessionLengthMinutes";

-- Step 5: Drop hoursPerWeek
ALTER TABLE "exams" DROP COLUMN "hoursPerWeek";
