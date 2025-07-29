-- Safe migration to add structured application fields
-- Run this on production database after testing

BEGIN;

-- Add new structured fields to Application table
ALTER TABLE "Application" 
ADD COLUMN IF NOT EXISTS "whyInterested" TEXT,
ADD COLUMN IF NOT EXISTS "personalStatement" TEXT,
ADD COLUMN IF NOT EXISTS "relevantExperience" TEXT,
ADD COLUMN IF NOT EXISTS "projectUnderstanding" TEXT,
ADD COLUMN IF NOT EXISTS "proposedApproach" TEXT,
ADD COLUMN IF NOT EXISTS "weeklyAvailability" TEXT,
ADD COLUMN IF NOT EXISTS "startDate" TEXT,
ADD COLUMN IF NOT EXISTS "commitmentLevel" TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Application' 
  AND column_name IN (
    'whyInterested', 'personalStatement', 'relevantExperience',
    'projectUnderstanding', 'proposedApproach', 'weeklyAvailability',
    'startDate', 'commitmentLevel'
  );

-- Optional: Migrate existing data from concatenated motivation field
-- UPDATE "Application" SET 
--   "whyInterested" = CASE 
--     WHEN "motivation" IS NOT NULL THEN split_part("motivation", E'\n', 1)
--     ELSE NULL 
--   END
-- WHERE "whyInterested" IS NULL;

COMMIT; 