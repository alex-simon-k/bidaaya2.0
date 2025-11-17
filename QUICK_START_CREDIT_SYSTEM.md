# Quick Start: Credit System & Early Access

## ✅ What's Been Completed

### 1. Credit System Implementation
- **7 credits** for early access (2 opportunities, 24 hours before public)
- **5 credits** for custom CV (structure ready for implementation)
- **3 credits** for custom cover letter (structure ready for implementation)
- Pro members get **unlimited early access** for free

### 2. New Pages & Features
- `/student/settings` - Student settings with credit overview and subscription management
- Beautiful blur/reveal UI for locked early access opportunities
- Credit balance display and usage tracking
- Subscription management integration

### 3. API Endpoints
- `GET /api/student/credits` - Fetch user credit info
- `POST /api/student/early-access/unlock` - Unlock opportunities with credits

### 4. Database Schema Updates
- Added student matching fields to `ExternalOpportunity`
- Updated default unlock credits from 5 to 7
- Added categorization fields for future AI matching

## 🚨 REQUIRED: Database Migration

**You MUST run this SQL in Supabase before testing:**

```sql
-- Add categorization fields
ALTER TABLE "ExternalOpportunity" 
ADD COLUMN IF NOT EXISTS "requiredDegrees" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "preferredMajors" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "requiredSkills" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "industries" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "matchingTags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "requiresWorkAuth" TEXT,
ADD COLUMN IF NOT EXISTS "minGPA" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "targetedUniversities" TEXT[] DEFAULT '{}';

-- Update default unlock credits
ALTER TABLE "ExternalOpportunity" 
ALTER COLUMN "unlockCredits" SET DEFAULT 7;
```

## 📝 How to Test

### 1. After Migration
Once Vercel deploys the new code:

1. Go to `/admin/octoparse-upload`
2. Upload opportunities with "Enable 24-Hour Early Access" checked
3. Log in as a **free student** and go to opportunities page
4. You should see blurred opportunities with unlock buttons
5. Check credit balance at `/student/settings`
6. Try unlocking an opportunity (costs 7 credits)
7. Log in as a **Pro student** and verify free unlock

### 2. Student Flow
- Free users start with **20 credits**
- Can unlock ~2-3 early opportunities per month
- Pro users get **unlimited early access** + 200 credits for other features
- Credits display at `/student/settings`

## 🔄 What Happens Next (Automatic)

Once you run the migration and Vercel deploys:
1. ✅ Credit system will be live
2. ✅ Early access unlocking will work
3. ✅ Student settings page will show
4. ✅ Subscription management will be accessible

## 🎯 What You Still Need to Build

### 1. AI Opportunity Categorization (High Priority)
The schema is ready. You need to:
- Add GPT API call during OctoParse upload
- Automatically extract: degrees, majors, skills, industries
- Use this for student matching/filtering

Example implementation location: `/src/app/api/admin/external-opportunities/csv-upload/route.ts`

```typescript
// After creating opportunity, call GPT to categorize
const categorization = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: `Analyze this job and extract matching criteria as JSON:
        Title: ${title}
        Company: ${company}
        Description: ${description}
        
        Return ONLY JSON with: requiredDegrees, preferredMajors, requiredSkills, industries, matchingTags`
    }]
  })
})

// Update opportunity with categorization
await prisma.externalOpportunity.update({
  where: { id: opportunity.id },
  data: categorization
})
```

### 2. Custom CV Generation (Medium Priority)
- Create `/api/student/generate-cv` endpoint
- Deduct 5 credits
- Call GPT with student profile + opportunity
- Return formatted CV

### 3. Custom Cover Letter (Medium Priority)
- Similar to CV generation
- Deduct 3 credits
- Generate personalized cover letter

### 4. Credit Refresh Automation (Low Priority)
Add a cron job (Vercel Cron or similar) to:
- Check users with `creditsRefreshDate < now()`
- Reset credits based on subscription plan
- Update `creditsRefreshDate` to +1 month

## 🐛 Current Known Issues

### Scrolling Issue (FIXED ✅)
The scrolling issue on admin pages has been fixed in the previous commit.

### Database Migration Pending
The new fields won't work until you run the SQL migration above.

## 📚 Full Documentation
See `CREDIT_SYSTEM_IMPLEMENTATION.md` for comprehensive details.

## 🎉 Summary

**What works NOW (after migration):**
- ✅ Credit tracking and display
- ✅ Early access unlock system
- ✅ Blur/reveal UI
- ✅ Student settings page
- ✅ Subscription management
- ✅ Pro member free access

**What needs implementation:**
- ⏳ AI opportunity categorization (high priority)
- ⏳ Student matching based on education
- ⏳ Custom CV generation (5 credits)
- ⏳ Custom cover letter (3 credits)
- ⏳ Credit refresh automation

---

**Next Steps:**
1. Run the SQL migration in Supabase
2. Wait for Vercel deployment to complete
3. Test the early access flow
4. Start implementing AI categorization

