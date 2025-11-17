-- ========================================
-- URGENT: RUN THIS NOW TO FIX DASHBOARD
-- ========================================
-- This will make your 327 opportunities visible to students

-- 1. ACTIVATE ALL OPPORTUNITIES
UPDATE "ExternalOpportunity"
SET "isActive" = true
WHERE "isActive" = false;

-- 2. VERIFY IT WORKED
SELECT 
  "isActive", 
  COUNT(*) as count
FROM "ExternalOpportunity"
GROUP BY "isActive";

-- Expected output: You should see "true" with count 327

-- ========================================
-- OPTIONAL: Enable Early Access (Uncomment to use)
-- ========================================
-- This makes opportunities show with "Unlock for 7 credits" prompt
-- Uncomment the lines below if you want to test early access:

/*
UPDATE "ExternalOpportunity"
SET 
  "isNewOpportunity" = true,
  "publishedAt" = NOW(),
  "earlyAccessUntil" = NOW() + INTERVAL '24 hours',
  "unlockCredits" = 7
WHERE "isActive" = true
LIMIT 10;  -- Start with just 10 to test
*/

-- ========================================
-- What This Does:
-- ========================================
-- 1. Makes all inactive opportunities active
-- 2. Dashboard will now show opportunities with logos and match scores
-- 3. If you enable early access (optional), some opportunities will have unlock prompts

-- ========================================
-- After Running This:
-- ========================================
-- 1. Refresh your dashboard
-- 2. Toggle "AI Agent" ON
-- 3. You should see opportunities in the grid
-- 4. If you enabled early access, you'll see blur overlays with unlock buttons

