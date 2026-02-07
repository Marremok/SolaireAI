-- Add preferredSessionLengthMinutes to Exam model
-- This allows each exam to have its own session length preference

-- Step 1: Add column (nullable first)
ALTER TABLE "exams" ADD COLUMN "preferredSessionLengthMinutes" INTEGER;

-- Step 2: Migrate existing data from User table
-- Copy user's preference to all their exams
UPDATE "exams" e
SET "preferredSessionLengthMinutes" = u."preferredSessionLengthMinutes"
FROM "users" u
WHERE e."userId" = u.id;

-- Step 3: Set NOT NULL constraint with default
ALTER TABLE "exams" ALTER COLUMN "preferredSessionLengthMinutes" SET NOT NULL;
ALTER TABLE "exams" ALTER COLUMN "preferredSessionLengthMinutes" SET DEFAULT 60;

-- Step 4: Add check constraint for valid session lengths
ALTER TABLE "exams" ADD CONSTRAINT "exams_preferredSessionLengthMinutes_check"
  CHECK ("preferredSessionLengthMinutes" IN (30, 45, 60, 90, 120));
