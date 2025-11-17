# Credit System & Early Access Implementation Guide

## Overview
This document details the implementation of the comprehensive credit system, early access opportunities, and subscription management features.

## 🎯 Features Implemented

### 1. Credit System
- **Early Access**: 7 credits for accessing 2 early opportunities (24 hours before public)
- **Custom CV**: 5 credits (ready for future implementation)
- **Custom Cover Letter**: 3 credits (ready for future implementation)
- **Monthly Allocations**:
  - Free: 20 credits/month
  - Premium: 100 credits/month
  - Pro: 200 credits/month + unlimited early access

### 2. Early Access System
- Opportunities marked as "new" are locked for 24 hours
- Students can unlock with credits OR have free access with Pro membership
- Beautiful blur overlay with unlock prompt
- Once unlocked, opportunity remains visible until marked as applied
- After marking as applied, new early access opportunities can be unlocked

### 3. Student Settings & Subscription Page
- New `/student/settings` page showing:
  - Current credit balance
  - Lifetime credits used
  - Next refresh date
  - Credit cost breakdown
  - Subscription management
  - Upgrade prompts

### 4. Opportunity Categorization (For Future Matching)
Added fields to `ExternalOpportunity` for AI/GPT-based student matching:
- `requiredDegrees[]` - Degree requirements
- `preferredMajors[]` - Specific fields of study
- `requiredSkills[]` - Technical/soft skills
- `industries[]` - Industry tags
- `matchingTags[]` - General flexible tags
- `requiresWorkAuth` - Work authorization requirements
- `minGPA` - Minimum GPA if applicable
- `targetedUniversities[]` - Target universities

## 📁 New Files Created

### Backend APIs
1. `/src/app/api/student/credits/route.ts`
   - GET endpoint to fetch user credit information
   
2. `/src/app/api/student/early-access/unlock/route.ts`
   - POST endpoint to unlock early access opportunities
   - Handles credit deduction and Pro member free access

### Frontend Pages
3. `/src/app/student/settings/page.tsx`
   - Comprehensive settings page with credit overview
   - Subscription management integration
   - Credit cost reference

### Library Files
4. `/src/lib/credits.ts`
   - Credit cost constants
   - Monthly credit allocations
   - Helper functions for credit operations

## 🔄 Modified Files

### Components
1. `/src/components/external-opportunities-list.tsx`
   - Added early access blur overlay UI
   - Unlock button with credit display
   - Pro member free unlock
   - Integration with unlock API

2. `/src/components/subscription-management.tsx`
   - Already existed, now integrated into settings page

### API Routes
3. `/src/app/api/external-opportunities/route.ts`
   - Added early access fields to response
   - Check for unlocked opportunities per user
   - Include `isNewOpportunity`, `earlyAccessUntil`, `unlockCredits`

### Database
4. `/prisma/schema.prisma`
   - Updated `ExternalOpportunity.unlockCredits` default from 5 to 7
   - Added student matching fields for future AI categorization

## 🗄️ Database Migration Required

Run this SQL in your Supabase SQL Editor:

```sql
-- Add categorization fields to ExternalOpportunity
ALTER TABLE "ExternalOpportunity" 
ADD COLUMN IF NOT EXISTS "requiredDegrees" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "preferredMajors" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "requiredSkills" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "industries" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "matchingTags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "requiresWorkAuth" TEXT,
ADD COLUMN IF NOT EXISTS "minGPA" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "targetedUniversities" TEXT[] DEFAULT '{}';

-- Update default unlock credits from 5 to 7 (won't affect existing records)
ALTER TABLE "ExternalOpportunity" 
ALTER COLUMN "unlockCredits" SET DEFAULT 7;

-- Verify the schema
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ExternalOpportunity'
ORDER BY ordinal_position;
```

## 🚀 How to Use

### For Admins (OctoParse Upload)
1. Go to `/admin/octoparse-upload`
2. Upload opportunities with the CSV conversion process
3. Check "Enable 24-Hour Early Access" when uploading
4. Opportunities will be marked as `isNewOpportunity = true`
5. After 24 hours, they become public automatically

### For Students
1. Navigate to "Opportunities" page
2. See early access opportunities with blur overlay
3. Click "Unlock Now" to spend 7 credits
4. Pro members see "Unlock Free" button
5. Once unlocked, opportunity is visible until marked as applied
6. Check credits anytime at `/student/settings`

### Student Settings Page
- Access via navigation menu or directly at `/student/settings`
- Shows:
  - Current credit balance
  - Lifetime usage stats
  - Next refresh date
  - How credits work (breakdown of costs)
  - Subscription management (upgrade/downgrade/pause/cancel)
  - Low credit warnings for free users

## 🎨 UI/UX Features

### Early Access Blur Overlay
- Beautiful gradient blur effect
- Clear unlock prompt with icon
- Shows credit cost and user's current balance
- Prevents interaction with locked opportunity
- Smooth reveal animation after unlock

### Credit Display
- Prominent credit counter on settings page
- Visual indicators for Pro members
- Low balance warnings
- Upgrade prompts when credits are low

### Subscription Integration
- Seamlessly integrated existing subscription management
- Shows current plan and status
- Direct links to upgrade/manage subscription
- Stripe portal integration for billing

## 🔮 Future Implementation (Ready for you)

### 1. AI-Powered Student Matching
The schema now includes fields for categorizing opportunities. You can:
- Use GPT API to automatically tag opportunities during upload
- Match students based on their education/skills
- Filter opportunities by degree, major, skills
- Implement smart recommendations

Example GPT prompt for categorization:
```
Given this job opportunity:
Title: {title}
Company: {company}
Description: {description}

Extract and return JSON:
{
  "requiredDegrees": ["Business", "Marketing"],
  "preferredMajors": ["Digital Marketing", "Business Administration"],
  "requiredSkills": ["SEO", "Content Marketing", "Analytics"],
  "industries": ["Technology", "E-commerce"],
  "matchingTags": ["entry-level", "marketing", "remote"],
  "requiresWorkAuth": "UAE"
}
```

### 2. Custom CV Generation (5 credits)
- Add API endpoint similar to early access unlock
- Deduct 5 credits
- Call GPT API to generate tailored CV
- Return formatted CV data

### 3. Custom Cover Letter (3 credits)
- Similar flow to CV generation
- Deduct 3 credits
- Generate personalized cover letter
- Integrate into application flow

## 📝 Testing Checklist

Before going live:
- [ ] Run database migration in Supabase
- [ ] Test early access unlock with free tier user
- [ ] Test early access unlock with Pro member
- [ ] Verify credit deduction after unlock
- [ ] Test insufficient credits scenario
- [ ] Verify opportunity remains visible after unlock
- [ ] Test marking as applied
- [ ] Check settings page displays correctly
- [ ] Verify subscription management works
- [ ] Test OctoParse upload with early access enabled

## 🐛 Known Considerations

1. **Credit Refresh**: Currently credits refresh monthly based on `creditsRefreshDate`. You may want to add a cron job to automate this.

2. **Early Access Expiry**: The `earlyAccessUntil` field is set during upload. You might want a background job to automatically mark opportunities as public after this date.

3. **Matching Algorithm**: The categorization fields are ready but need implementation of the actual matching logic.

## 💡 Tips for Admins

### Managing Early Access
- Use early access sparingly for high-value opportunities
- 24-hour window is enough for Pro members to get advantage
- Monitor unlock rates to adjust credit costs if needed

### Credit Economy
- Current costs are balanced for engagement
- Free users get 20 credits = ~2-3 early unlocks per month
- Premium users get 100 credits = ~14 early unlocks
- Pro users get unlimited + 200 credits for other features

## 🎓 Student Flow Example

1. **Free User Journey**:
   - Sees blurred early access opportunity
   - Has 20 credits from free plan
   - Clicks "Unlock Now" (-7 credits)
   - Opportunity revealed, can apply
   - After applying, marks as applied
   - Opportunity stays in "Applied" tab
   - New early access opportunity can be unlocked

2. **Pro User Journey**:
   - Sees blurred early access opportunity
   - Clicks "Unlock Free (Pro Member)"
   - No credits spent
   - Can unlock unlimited early opportunities
   - 200 credits saved for CV/cover letter generation

## 📊 Analytics to Track

Consider adding tracking for:
- Early access unlock rate
- Credit spend patterns
- Conversion from free to paid after hitting credit limit
- Most valuable opportunities (high unlock rate)
- Average time from unlock to application

## 🔐 Security Considerations

- All unlock operations require authentication
- Credit deductions are atomic (database transactions)
- User can't unlock same opportunity twice
- Credit balance verified before deduction
- Pro status verified server-side

---

**Need Help?** This system is ready to deploy. Just run the migration and test thoroughly before pushing to production!

