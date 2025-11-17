# Fix Opportunities Display Issues

## Problem
You have 327 opportunities uploaded but they're not showing on the student dashboard.

## Root Cause
Opportunities uploaded **before the recent fix** were created with `isActive = false`. The dashboard only shows active opportunities.

---

## 🚨 CRITICAL: Run This SQL in Supabase Now

Copy and paste this entire SQL block into your Supabase SQL Editor:

```sql
-- ============================================
-- FIX ALL OPPORTUNITIES DISPLAY
-- ============================================

-- 1. Activate ALL opportunities that are currently inactive
UPDATE "ExternalOpportunity"
SET "isActive" = true
WHERE "isActive" = false;

-- 2. Add missing fields (if migration wasn't run yet)
ALTER TABLE "ExternalOpportunity" 
ADD COLUMN IF NOT EXISTS "requiredDegrees" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "preferredMajors" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "requiredSkills" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "industries" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "matchingTags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "requiresWorkAuth" TEXT,
ADD COLUMN IF NOT EXISTS "minGPA" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "targetedUniversities" TEXT[] DEFAULT '{}';

-- 3. Update default unlock credits from 5 to 7
ALTER TABLE "ExternalOpportunity" 
ALTER COLUMN "unlockCredits" SET DEFAULT 7;

-- 4. OPTIONAL: Enable early access for current opportunities (24 hour window)
-- Uncomment if you want existing opportunities to have early access
/*
UPDATE "ExternalOpportunity"
SET 
  "isNewOpportunity" = true,
  "publishedAt" = NOW(),
  "earlyAccessUntil" = NOW() + INTERVAL '24 hours',
  "unlockCredits" = 7
WHERE "isNewOpportunity" = false OR "isNewOpportunity" IS NULL;
*/

-- 5. Verify the changes
SELECT 
  "isActive",
  "isNewOpportunity",
  COUNT(*) as count
FROM "ExternalOpportunity"
GROUP BY "isActive", "isNewOpportunity"
ORDER BY "isActive" DESC, "isNewOpportunity" DESC;
```

---

## After Running SQL

### Expected Results:
You should see output like:
```
isActive | isNewOpportunity | count
---------|------------------|-------
true     | true             | 327   (if you enabled early access)
true     | false            | 327   (if you didn't)
```

### Immediate Changes:
1. ✅ All 327 opportunities now visible on dashboard
2. ✅ Opportunities will show with company logos
3. ✅ Match scores will calculate for each student
4. ✅ Early access unlock will work (if enabled)
5. ✅ Admin can see all 1000+ opportunities (not just 50)

---

## Test the Fixes

### As Student:
1. Go to dashboard
2. **Enable AI Agent** toggle at top
3. Should see opportunities in grid (with logos and match %)
4. If early access enabled, should see blur overlay with "Unlock for 7 credits"

### As Admin:
1. Go to `/admin/external-opportunities`
2. Should see ALL opportunities (not just 50)
3. Can manage, activate/deactivate any opportunity

---

## Why This Happened

**Before Fix (Your Current Data):**
- Opportunities created with `isActive: false`
- Required manual activation

**After Fix (New Uploads):**
- Opportunities created with `isActive: true`
- Immediately visible to students

**This SQL updates your existing 327 opportunities to be active.**

---

## Settings Navigation - Fixed ✅

The settings link now correctly goes to `/student/settings` which shows:
- Credit balance
- Subscription management
- Upgrade options

---

## Early Access Unlock

Once opportunities are active and have `isNewOpportunity = true`:
1. Students will see blur overlay
2. "Unlock for 7 credits" button appears
3. Clicking it deducts credits and reveals opportunity
4. Pro members get free unlock

**Note:** If you DON'T want early access yet, skip step 4 in the SQL (leave it commented out). Opportunities will just show normally without the unlock requirement.

---

## Quick Fix Summary

```bash
# 1. Run SQL in Supabase (above)
# 2. Wait for Vercel deployment (2 minutes)
# 3. Test dashboard as student
# 4. Enable AI agent toggle
# 5. See opportunities!
```

---

**Run the SQL now and your opportunities will appear!** 🚀

