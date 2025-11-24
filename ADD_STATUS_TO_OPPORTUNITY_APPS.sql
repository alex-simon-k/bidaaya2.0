-- Migration: Add status field to ExternalOpportunityApplication
-- This allows students to track application progress (applied → interview → rejected)

-- Add status column with default value APPLIED
ALTER TABLE "ExternalOpportunityApplication" 
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'APPLIED';

-- Add check constraint to ensure valid status values
ALTER TABLE "ExternalOpportunityApplication" 
DROP CONSTRAINT IF EXISTS "ExternalOpportunityApplication_status_check";

ALTER TABLE "ExternalOpportunityApplication" 
ADD CONSTRAINT "ExternalOpportunityApplication_status_check" 
CHECK ("status" IN ('APPLIED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'WITHDRAWN', 'ACCEPTED'));

-- Add index for better query performance when filtering by status
CREATE INDEX IF NOT EXISTS "ExternalOpportunityApplication_status_idx" 
ON "ExternalOpportunityApplication"("status");

-- Verify the change
SELECT COUNT(*), status 
FROM "ExternalOpportunityApplication" 
GROUP BY status;

