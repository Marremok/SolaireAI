-- Remove studyIntensity and preferredSessionLengthMinutes from User model
-- These fields are no longer needed:
-- - studyIntensity: Removed (using pure math instead of subjective intensity)
-- - preferredSessionLengthMinutes: Moved to Exam model (per-exam customization)

-- Step 1: Drop studyIntensity constraint and column
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_studyIntensity_check";
ALTER TABLE "users" DROP COLUMN IF EXISTS "studyIntensity";

-- Step 2: Drop preferredSessionLengthMinutes column
ALTER TABLE "users" DROP COLUMN IF EXISTS "preferredSessionLengthMinutes";
