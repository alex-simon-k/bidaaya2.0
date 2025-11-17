-- ========================================
-- DEBUG: Check Opportunity Status
-- ========================================

-- 1. Count opportunities by status
SELECT 
  "isActive",
  "isNewOpportunity",
  COUNT(*) as count
FROM "ExternalOpportunity"
GROUP BY "isActive", "isNewOpportunity"
ORDER BY "isActive", "isNewOpportunity";

-- 2. Check recent opportunities (should show in dashboard)
SELECT 
  "id",
  "title",
  "company",
  "isActive",
  "isNewOpportunity",
  "earlyAccessUntil",
  "addedAt"
FROM "ExternalOpportunity"
WHERE "isActive" = true
  AND ("isNewOpportunity" = false OR "earlyAccessUntil" < NOW())
ORDER BY "addedAt" DESC
LIMIT 20;

-- 3. Check early access opportunities
SELECT 
  "id",
  "title",
  "company",
  "isActive",
  "isNewOpportunity",
  "earlyAccessUntil",
  "addedAt"
FROM "ExternalOpportunity"
WHERE "isActive" = true
  AND "isNewOpportunity" = true
  AND "earlyAccessUntil" >= NOW()
ORDER BY "publishedAt" DESC
LIMIT 10;

-- ========================================
-- FIX: Release ALL opportunities to regular dashboard
-- ========================================
-- Run this to make ALL opportunities visible:

UPDATE "ExternalOpportunity"
SET 
  "isNewOpportunity" = false,
  "earlyAccessUntil" = NULL
WHERE "isActive" = true;

-- Then verify:
SELECT 
  "isActive",
  "isNewOpportunity",
  COUNT(*) as count
FROM "ExternalOpportunity"
GROUP BY "isActive", "isNewOpportunity";

-- Expected: All should be isActive=true, isNewOpportunity=false

