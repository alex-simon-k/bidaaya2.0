-- ========================================
-- RELEASE ALL OPPORTUNITIES TO REGULAR DASHBOARD
-- ========================================
-- Run this in Supabase SQL Editor to make ALL 327 opportunities visible

-- Step 1: Check current status
SELECT 
  "isActive",
  "isNewOpportunity",
  COUNT(*) as count
FROM "ExternalOpportunity"
GROUP BY "isActive", "isNewOpportunity";

-- Step 2: Release ALL opportunities (except we'll keep 2 for early access)
UPDATE "ExternalOpportunity"
SET 
  "isNewOpportunity" = false,
  "earlyAccessUntil" = NULL
WHERE "isActive" = true;

-- Step 3: Mark 2 newest as early access
UPDATE "ExternalOpportunity"
SET 
  "isNewOpportunity" = true,
  "publishedAt" = NOW(),
  "earlyAccessUntil" = NOW() + INTERVAL '24 hours',
  "unlockCredits" = 7
WHERE "id" IN (
  SELECT "id" 
  FROM "ExternalOpportunity" 
  WHERE "isActive" = true
  ORDER BY "addedAt" DESC
  LIMIT 2
);

-- Step 4: Verify the changes
SELECT 
  "isActive",
  "isNewOpportunity",
  COUNT(*) as count
FROM "ExternalOpportunity"
GROUP BY "isActive", "isNewOpportunity"
ORDER BY "isActive", "isNewOpportunity";

-- Expected result:
-- isActive | isNewOpportunity | count
-- true     | false            | 325   (all regular opportunities)
-- true     | true             | 2     (early access)

