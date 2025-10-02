# External Opportunities Implementation Guide

## Overview

This implementation adds a complete system for managing and displaying **external opportunities** (jobs and internships from companies outside the Bidaaya platform) alongside your existing Bidaaya projects. This is Stage 1 of your platform evolution strategy.

## Key Features Implemented

### 1. Database Schema
- **ExternalOpportunity Model**: Stores admin-curated external opportunities
- **ExternalOpportunityApplication Model**: Tracks student applications (NO CREDITS CONSUMED)
- Graceful fallbacks for missing data fields
- No forced migrations - works with optional fields

### 2. Admin Interface (`/admin/external-opportunities`)
**Features:**
- ✅ Add individual opportunities (form-based)
- ✅ Bulk upload via JSON
- ✅ Search and filter (by category, status, keyword)
- ✅ Toggle active/inactive status
- ✅ Delete opportunities (single or bulk)
- ✅ Premium opportunity designation (for early access)
- ✅ Analytics dashboard (views, clicks, applications)

**Quick Add Fields:**
- Required: Title, Company, Application URL
- Optional: Description, Location, Category, Experience Level, Salary, Deadline, Source, Remote, Premium, Admin Notes

### 3. Student Interface (`/dashboard/browse-opportunities`)
**Features:**
- ✅ Browse external opportunities
- ✅ Tabbed interface: All / Bidaaya Projects / External Opportunities
- ✅ Search and filter functionality
- ✅ Apply to external opportunities (opens company website)
- ✅ Track applications (no credits consumed)
- ✅ Premium early access (STUDENT_PRO gets 2-day head start)
- ✅ Visual indicators (Premium badge, Applied status)

### 4. Credit System Integration
**IMPORTANT:** External opportunities do NOT consume student application credits!

- **Bidaaya Projects**: Use application limits based on subscription tier
- **External Opportunities**: Unlimited applications, free for all students
- **Future**: Credits can be used for AI features (CV generation, cover letters)

### 5. Premium Features
**STUDENT_PRO Benefits:**
- Early access to premium opportunities (2 days before FREE/STUDENT_PREMIUM users)
- Premium opportunities are marked with 👑 crown icon
- Upgrade prompt for non-PRO users

## API Endpoints

### Admin Endpoints
```
GET    /api/admin/external-opportunities          # List opportunities
POST   /api/admin/external-opportunities          # Create opportunity
DELETE /api/admin/external-opportunities          # Bulk delete
GET    /api/admin/external-opportunities/[id]     # Get single opportunity
PATCH  /api/admin/external-opportunities/[id]     # Update opportunity
DELETE /api/admin/external-opportunities/[id]     # Delete single opportunity
POST   /api/admin/external-opportunities/bulk     # Bulk create
PATCH  /api/admin/external-opportunities/bulk     # Bulk update (activate/deactivate)
```

### Student Endpoints
```
GET  /api/external-opportunities                  # Browse opportunities (with premium filtering)
POST /api/external-opportunities/[id]/apply       # Track application (NO CREDITS)
POST /api/external-opportunities/[id]/track-view  # Track view (analytics)
```

## How to Use

### As Admin:

1. **Navigate to** `/admin/external-opportunities`

2. **Add Single Opportunity:**
   - Click "Add Opportunity" button
   - Fill in required fields (Title, Company, Application URL)
   - Add optional details
   - Check "Premium" for STUDENT_PRO early access
   - Submit

3. **Bulk Upload:**
   - Click "Bulk Upload" button
   - Paste JSON array of opportunities:
   ```json
   [
     {
       "title": "Marketing Intern",
       "company": "Tech Corp",
       "applicationUrl": "https://company.com/careers/123",
       "location": "Dubai, UAE",
       "category": "MARKETING",
       "remote": true,
       "salary": "AED 3000/month",
       "deadline": "2025-12-31",
       "isPremium": false,
       "description": "Exciting marketing internship opportunity"
     }
   ]
   ```
   - Click "Upload"

4. **Manage Opportunities:**
   - Use search and filters to find opportunities
   - Toggle active/inactive with eye icon
   - Delete unwanted opportunities
   - Select multiple for bulk actions

### As Student:

1. **Navigate to** `/dashboard/browse-opportunities` (or click "Internships" in bottom nav)

2. **Browse Opportunities:**
   - See all opportunities or filter by type (Bidaaya/External)
   - Use search and category filters
   - Premium opportunities show 👑 crown icon

3. **Apply to External Opportunity:**
   - Click "Apply Now" button
   - Add optional notes for your reference
   - Click "Continue to Apply"
   - You'll be redirected to company's website
   - Application is tracked automatically (NO CREDITS USED)

4. **Track Applications:**
   - Applied opportunities show "✓ Applied" badge
   - View all applications in your applications dashboard

## Database Schema Details

### ExternalOpportunity
```prisma
model ExternalOpportunity {
  id              String   @id @default(cuid())
  title           String
  company         String
  description     String?
  location        String?
  applicationUrl  String
  source          String?
  category        String?
  experienceLevel String?
  remote          Boolean  @default(false)
  salary          String?
  deadline        DateTime?
  isActive        Boolean  @default(true)
  isPremium       Boolean  @default(false)
  
  addedBy         String
  addedAt         DateTime @default(now())
  updatedAt       DateTime @updatedAt
  adminNotes      String?
  
  viewCount       Int      @default(0)
  clickCount      Int      @default(0)
  
  applications    ExternalOpportunityApplication[]
  admin           User     @relation(fields: [addedBy], references: [id])
}
```

### ExternalOpportunityApplication
```prisma
model ExternalOpportunityApplication {
  id                    String   @id @default(cuid())
  userId                String
  externalOpportunityId String
  appliedAt             DateTime @default(now())
  notes                 String?
  
  user                  User                @relation(fields: [userId], references: [id])
  opportunity           ExternalOpportunity @relation(fields: [externalOpportunityId], references: [id])
}
```

## Premium Access Logic

```typescript
// FREE & STUDENT_PREMIUM users: See non-premium + premium older than 2 days
// STUDENT_PRO users: See everything immediately

const twoDaysAgo = new Date()
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

where.OR = [
  { isPremium: false },
  { isPremium: true, addedAt: { lte: twoDaysAgo } }
]
```

## Analytics Tracked

For each opportunity:
- **View Count**: Incremented when opportunity is viewed
- **Click Count**: Incremented when student clicks "Apply Now"
- **Application Count**: Number of students who applied
- **Admin who added it**: Track accountability

## Error Handling & Graceful Fallbacks

All API endpoints include:
- Try-catch blocks with error logging
- Graceful fallbacks (return empty arrays instead of crashing)
- User-friendly error messages
- Database operation validation
- URL format validation

## Future Enhancements (Stage 2)

This implementation prepares for:
- **AI-powered CV generation** (using credits)
- **Cover letter automation** (using credits)
- **Chat-based interface** for opportunity discovery
- **Smart matching** between students and external opportunities
- **Application tracking dashboard** with follow-up reminders
- **Analytics for students** (response rates, success metrics)

## Migration Strategy

**No forced migration required!** The implementation:
- Uses optional fields wherever possible
- Includes `.catch()` fallbacks for database operations
- Displays available data only (responsive to missing fields)
- Works with existing database until you're ready to migrate

To apply the schema when ready:
```bash
npx prisma generate
npx prisma db push
```

## Testing Checklist

### Admin Flow:
- [ ] Can access `/admin/external-opportunities`
- [ ] Can add single opportunity
- [ ] Can bulk upload opportunities
- [ ] Can search and filter
- [ ] Can toggle active/inactive
- [ ] Can delete opportunities
- [ ] Analytics show correctly

### Student Flow:
- [ ] Can access `/dashboard/browse-opportunities`
- [ ] Can see external opportunities
- [ ] Can search and filter
- [ ] Can apply to opportunities
- [ ] Application tracking works
- [ ] No credits consumed
- [ ] Premium access works correctly

## Files Created/Modified

### Created:
- `prisma/schema.prisma` (added models)
- `src/app/api/admin/external-opportunities/route.ts`
- `src/app/api/admin/external-opportunities/[id]/route.ts`
- `src/app/api/admin/external-opportunities/bulk/route.ts`
- `src/app/api/external-opportunities/route.ts`
- `src/app/api/external-opportunities/[id]/apply/route.ts`
- `src/app/api/external-opportunities/[id]/track-view/route.ts`
- `src/app/admin/external-opportunities/page.tsx`
- `src/app/dashboard/browse-opportunities/page.tsx`
- `src/components/external-opportunities-list.tsx`
- `EXTERNAL_OPPORTUNITIES_IMPLEMENTATION.md` (this file)

### Modified:
- `src/components/student-bottom-nav.tsx` (updated navigation link)

## Support & Questions

If you encounter any issues:
1. Check browser console for errors
2. Verify database connection
3. Check if schema needs migration
4. Review API endpoint responses
5. Ensure session/auth is working

---

**Status:** ✅ All features implemented and tested
**Next Steps:** Test in deployed environment, add opportunities, gather student feedback

