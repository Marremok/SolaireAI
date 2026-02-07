-- Step 1: Add new maxHoursPerWeek column (Float)
ALTER TABLE "users" ADD COLUMN "maxHoursPerWeek" DOUBLE PRECISION;

-- Step 2: Migrate existing data (Int → Float, default 15.0 if null)
UPDATE "users" SET "maxHoursPerWeek" = COALESCE("maxStudy"::DOUBLE PRECISION, 15.0);

-- Step 3: Make NOT NULL with default
ALTER TABLE "users" ALTER COLUMN "maxHoursPerWeek" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "maxHoursPerWeek" SET DEFAULT 15.0;

-- Step 4: Drop old column
ALTER TABLE "users" DROP COLUMN "maxStudy";

-- Step 5: Add new preference fields
ALTER TABLE "users" ADD COLUMN "preferredSessionLengthMinutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "users" ADD COLUMN "restDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "studyIntensity" TEXT DEFAULT 'medium';

-- Step 6: Add check constraint for studyIntensity
ALTER TABLE "users" ADD CONSTRAINT "users_studyIntensity_check"
  CHECK ("studyIntensity" IS NULL OR "studyIntensity" IN ('low', 'medium', 'high'));

-- Step 7: Change Exam.hoursPerWeek to Float
ALTER TABLE "exams" ALTER COLUMN "hoursPerWeek" TYPE DOUBLE PRECISION;
