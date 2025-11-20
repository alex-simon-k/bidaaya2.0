-- AI Categorization Fields Migration
-- Run this in your Supabase SQL Editor

-- Add AI categorization fields to ExternalOpportunity table
ALTER TABLE "ExternalOpportunity" 
ADD COLUMN IF NOT EXISTS "aiCategory" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "aiMatchKeywords" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "aiIndustryTags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "aiSkillsRequired" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "aiEducationMatch" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "aiConfidenceScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "aiLastCategorized" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "aiModel" TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "ExternalOpportunity_aiCategory_idx" ON "ExternalOpportunity"("aiCategory");
CREATE INDEX IF NOT EXISTS "ExternalOpportunity_aiLastCategorized_idx" ON "ExternalOpportunity"("aiLastCategorized");

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ExternalOpportunity' 
  AND column_name LIKE 'ai%'
ORDER BY column_name;

-- Check how many opportunities need categorization
SELECT 
  COUNT(*) as total_opportunities,
  COUNT("aiLastCategorized") as already_categorized,
  COUNT(*) - COUNT("aiLastCategorized") as needs_categorization
FROM "ExternalOpportunity"
WHERE "isActive" = true;

