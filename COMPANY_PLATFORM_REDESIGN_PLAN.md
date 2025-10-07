# Company Platform Redesign - Technical Plan

## Overview
This document outlines the technical changes needed to transform the company side of Bidaaya to support both self-serve companies AND externally-added companies in a unified way.

---

## 🎯 Core Goals

1. **Simplify Project Creation**: Remove 6-option template selector, make all projects "custom" by default
2. **Unified Company System**: External companies (from scraped opportunities) should have real company accounts
3. **Profile Pictures**: Companies need proper logo storage and display
4. **Seamless Transition**: External companies can later activate self-serve access if they reach out

---

## 📋 Change #1: Simplify Project Creation Page

### Current State
- File: `src/app/dashboard/projects/new/page.tsx`
- Has 6 project templates (MARKETING, BUSINESS_DEVELOPMENT, COMPUTER_SCIENCE, FINANCE, PSYCHOLOGY, CUSTOM)
- Users select template first (Step 1), then fill details (Step 2)
- Each template has pre-defined subcategories, requirements, deliverables, etc.

### New State
- **Remove Step 1 entirely** (template selection)
- **Go directly to the project details form** (current Step 2)
- The form should default to `category: 'CUSTOM'` behavior
- Keep all the flexible form fields (title, description, category dropdown, requirements, deliverables, etc.)

### Technical Changes Required

#### 1. Update `src/app/dashboard/projects/new/page.tsx`
- Remove `currentStep` state logic
- Remove `selectedTemplate` state
- Remove the entire template selection UI (lines ~200-575)
- Make the form the default/only view
- Update category selection to be a simple dropdown (already exists for CUSTOM projects)
- Remove template-based pre-fills

#### 2. Database Schema (No changes needed)
- `ProjectCategory` enum already has `CUSTOM`
- Projects already support custom categories via `customCategory` field
- Schema is already flexible enough

#### 3. Navigation & UI Updates
- Update "Create Project" button text/messaging across dashboard
- Remove any references to "6 project types" in:
  - `src/components/company-onboarding-checklist.tsx` (lines 417-425)
  - Any marketing/help text

---

## 📋 Change #2: Unified Company System

### Current State

#### Self-Serve Companies
- Stored in `User` table with `role: 'COMPANY'`
- They sign up, create accounts, manage profiles
- Post projects through dashboard
- Fields: `companyName`, `industry`, `companySize`, `companyWebsite`, `image`, etc.

#### External Companies (from External Opportunities)
- Stored in `ExternalOpportunity` table
- `company` field is just a **String** (not related to User table)
- No actual company account exists
- No profile, no authentication, no way to log in

### New State

#### Unified Approach
All companies (self-serve AND external) exist as `User` records with `role: 'COMPANY'`

**For External Companies:**
- When admin adds external opportunities, admin can:
  1. Create a new company User account (if doesn't exist)
  2. Link to existing company User account (if already exists)
- Company account is created with:
  - `email`: Admin sets a placeholder email (e.g., `contact@microsoft.com` or `external+microsoft@bidaaya.ae`)
  - `role: 'COMPANY'`
  - `profileCompleted: false` (they haven't set it up themselves)
  - No password initially (account is "inactive" for login)
  - `companyName`, `industry`, `companyWebsite`, `image` (logo URL)
- External opportunities link to the company via `companyId` (foreign key to User table)

**Activation Flow:**
When an external company reaches out to get self-serve access:
1. Admin sends them a password reset/setup link
2. They set a password and log in
3. They can now complete their profile and start posting projects
4. Their existing external opportunities remain associated with their account

### Technical Changes Required

#### 1. Update Database Schema (`prisma/schema.prisma`)

```prisma
model ExternalOpportunity {
  id              String   @id @default(cuid())
  title           String
  companyId       String?  // NEW: Link to User table (optional for backward compatibility)
  company         String   // Keep as fallback/display name
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
  
  // Admin fields
  addedBy         String
  addedAt         DateTime @default(now())
  updatedAt       DateTime @updatedAt
  adminNotes      String?
  
  // Analytics
  viewCount       Int      @default(0)
  clickCount      Int      @default(0)
  
  // Relations
  applications    ExternalOpportunityApplication[]
  admin           User     @relation("ExternalOpportunitiesCreated", fields: [addedBy], references: [id])
  companyUser     User?    @relation("CompanyExternalOpportunities", fields: [companyId], references: [id]) // NEW
  
  @@index([isActive, isPremium])
  @@index([category])
  @@index([addedAt])
  @@index([deadline])
  @@index([companyId]) // NEW
}

model User {
  // ... existing fields ...
  
  // NEW: Add relation for external opportunities
  companyExternalOpportunities ExternalOpportunity[] @relation("CompanyExternalOpportunities")
  
  // NEW: Track if this is an externally-created company account
  isExternalCompany Boolean @default(false)
  externalCompanySource String? // "admin_created", "csv_import", etc.
}
```

#### 2. Create Admin Company Management API

New file: `src/app/api/admin/companies/create-external/route.ts`

Purpose: Allow admin to create company accounts for external companies

```typescript
POST /api/admin/companies/create-external
{
  companyName: string
  email: string (optional - generate if not provided)
  industry?: string
  companyWebsite?: string
  companySize?: string
  image?: string (logo URL)
  location?: string
}

Response:
{
  success: true,
  company: { id, companyName, email, ... }
}
```

#### 3. Update External Opportunity Creation

Update `src/app/api/admin/external-opportunities/route.ts`:
- Add option to select/create company when adding opportunity
- Link opportunity to company via `companyId`
- If company doesn't exist, create it first

#### 4. Bulk Company Upload System

Create new file: `src/app/api/admin/companies/bulk-upload/route.ts`

Accepts CSV/JSON with:
```json
[
  {
    "companyName": "Microsoft",
    "email": "contact@microsoft.com",
    "industry": "Technology",
    "companyWebsite": "https://microsoft.com",
    "logoUrl": "https://logo.clearbit.com/microsoft.com",
    "location": "Dubai, UAE"
  }
]
```

#### 5. Admin UI Updates

Update `src/app/admin/external-opportunities/page.tsx`:
- Add company selection dropdown when creating opportunities
- Add "Create New Company" button
- Show company logo/info when viewing opportunities

Create new admin page: `src/app/admin/companies/page.tsx`
- List all companies (self-serve + external)
- Bulk upload companies
- Edit company profiles
- Generate activation links for external companies

---

## 📋 Change #3: Company Profile Pictures / Logos

### Current State
- `User.image` field exists but is underutilized
- Upload system exists at `src/app/api/upload/route.ts`
- Saves to `/public/uploads/` directory
- Company profile page has logo upload UI but it's basic

### Issues
1. Logos not consistently displayed across platform
2. No way to bulk upload logos for external companies
3. No integration with logo APIs (Clearbit, Brandfetch, etc.)

### New State

#### Logo Storage Strategy
1. **Primary**: Store in `User.image` field as URL
2. **Sources**:
   - User upload (via dashboard)
   - Admin upload (when creating external company)
   - Auto-fetch from logo APIs (Clearbit, Brandfetch)
   - Default: Generated initials avatar

#### Logo Fetching Service
Create `src/lib/company-logo.ts`:
```typescript
export async function fetchCompanyLogo(websiteUrl: string): Promise<string | null> {
  // Try Clearbit first
  const domain = new URL(websiteUrl).hostname
  const clearbitUrl = `https://logo.clearbit.com/${domain}`
  
  // Validate if logo exists
  try {
    const response = await fetch(clearbitUrl, { method: 'HEAD' })
    if (response.ok) return clearbitUrl
  } catch {}
  
  // Fallback: Brandfetch, Google S2, etc.
  // Return null if nothing found
  return null
}
```

### Technical Changes Required

#### 1. Update Company Creation API
In `src/app/api/admin/companies/create-external/route.ts`:
- If `image` not provided but `companyWebsite` is, auto-fetch logo
- Store fetched logo URL in `User.image`

#### 2. Company Profile Display Component
Create `src/components/company-avatar.tsx`:
```tsx
interface CompanyAvatarProps {
  companyName: string
  image?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function CompanyAvatar({ companyName, image, size = 'md' }: CompanyAvatarProps) {
  // Show image if exists, otherwise show initials avatar
  // Consistent styling across platform
}
```

Use this component everywhere companies are displayed:
- Project cards
- External opportunity cards
- Admin panels
- Company profiles
- Application lists

#### 3. Bulk Logo Upload
Add to bulk company upload:
- Accept `logoUrl` field
- Or accept base64 encoded image
- Auto-fetch if only website provided

---

## 📋 Change #4: Company Activation System

### Purpose
Allow external companies to "activate" their accounts and start self-serving

### Flow
1. External company reaches out to Bidaaya
2. Admin generates activation link
3. Company clicks link, sets password
4. Company can now log in and:
   - Complete their profile
   - Post projects
   - Manage applications
   - View analytics

### Technical Changes Required

#### 1. Create Activation API
New file: `src/app/api/admin/companies/[id]/activate/route.ts`

```typescript
POST /api/admin/companies/{companyId}/activate
{
  email?: string (optional - update email if needed)
}

Response:
{
  success: true,
  activationLink: "https://bidaaya.ae/auth/activate?token=..."
}
```

#### 2. Activation Page
New file: `src/app/auth/activate/page.tsx`
- User clicks link from email
- Sets password
- Redirected to company onboarding

#### 3. Company Profile Completion Flow
Update `src/app/onboarding/company/page.tsx`:
- Detect if company is externally created (`isExternalCompany: true`)
- Show slightly different onboarding (some fields pre-filled)
- Mark `profileCompleted: true` when done

---

## 📊 Data Migration Plan

### Phase 1: Schema Updates
1. Add new fields to `User` model (`isExternalCompany`, `externalCompanySource`)
2. Add `companyId` to `ExternalOpportunity` model
3. Add new relation `companyExternalOpportunities`
4. Run migration: `npx prisma migrate dev --name unified_company_system`

### Phase 2: Data Migration
1. For existing external opportunities:
   - Extract unique company names
   - Create `User` records for each (role: COMPANY)
   - Try to fetch logos
   - Link opportunities to companies via `companyId`
2. Script: `scripts/migrate-external-companies.js`

### Phase 3: Testing
1. Test external company creation
2. Test activation flow
3. Test project creation (simplified flow)
4. Test logo display across platform

---

## 🎨 UI/UX Changes Summary

### Project Creation
- **Before**: Select from 6 templates → Fill details
- **After**: Directly fill custom project details

### Admin Panel
- **New**: Companies management page
- **New**: Bulk company upload
- **New**: Generate activation links
- **Updated**: External opportunities now link to companies

### Company Display
- **Everywhere**: Show company logos consistently
- **Fallback**: Initials avatar with brand colors

---

## 📁 New Files to Create

1. `src/app/api/admin/companies/create-external/route.ts` - Create external company accounts
2. `src/app/api/admin/companies/bulk-upload/route.ts` - Bulk upload companies
3. `src/app/api/admin/companies/[id]/activate/route.ts` - Generate activation links
4. `src/app/admin/companies/page.tsx` - Admin companies management UI
5. `src/app/auth/activate/page.tsx` - Company activation flow
6. `src/lib/company-logo.ts` - Logo fetching service
7. `src/components/company-avatar.tsx` - Reusable company avatar component
8. `scripts/migrate-external-companies.js` - Migration script

---

## 📝 Existing Files to Update

1. `prisma/schema.prisma` - Add new fields and relations
2. `src/app/dashboard/projects/new/page.tsx` - Simplify to one form
3. `src/app/api/admin/external-opportunities/route.ts` - Link to companies
4. `src/app/admin/external-opportunities/page.tsx` - Add company selection
5. `src/components/company-onboarding-checklist.tsx` - Remove 6 templates reference
6. `src/app/onboarding/company/page.tsx` - Handle external company onboarding

---

## 🚀 Implementation Order

### Phase 1: Simplify Project Creation (Quick Win)
1. Update `src/app/dashboard/projects/new/page.tsx`
2. Remove template selection
3. Test project creation flow
4. Deploy ✅

### Phase 2: Company Logo Infrastructure
1. Create `company-avatar.tsx` component
2. Create `company-logo.ts` service
3. Update all company display locations
4. Test logo display
5. Deploy ✅

### Phase 3: Unified Company System
1. Update database schema
2. Create admin APIs for company management
3. Create migration script
4. Run migration on production
5. Deploy ✅

### Phase 4: Activation System
1. Create activation API
2. Create activation page
3. Update company onboarding
4. Test full flow
5. Deploy ✅

### Phase 5: Admin UI Polish
1. Create admin companies page
2. Update external opportunities UI
3. Add bulk upload features
4. Deploy ✅

---

## ⚠️ Risks & Considerations

### 1. Email Conflicts
- External companies may have email already used by self-serve company
- **Solution**: Use pattern like `external+{companyname}@bidaaya.ae` if conflict exists

### 2. Duplicate Companies
- Multiple external opportunities from same company
- **Solution**: Admin UI shows matching companies, allows merging

### 3. Logo Fetching Rate Limits
- Clearbit/Brandfetch APIs may have rate limits
- **Solution**: Cache logos, fetch async, have fallback

### 4. Backward Compatibility
- Existing external opportunities have no `companyId`
- **Solution**: Make `companyId` optional, migration script backfills

### 5. Company Authentication
- External companies shouldn't be able to log in until activated
- **Solution**: Check if account has password set, show appropriate error

---

## 📈 Success Metrics

1. **Project Creation**: Time to create project reduces (no template selection)
2. **Company Onboarding**: External companies can activate in < 5 minutes
3. **Data Quality**: 90%+ companies have logos
4. **Admin Efficiency**: Bulk upload saves hours of manual entry
5. **User Experience**: Consistent company branding across platform

---

## 🎯 Summary

This redesign creates a **unified company system** where:
- ✅ All companies (self-serve + external) are in the same database structure
- ✅ External companies can seamlessly transition to self-serve
- ✅ Project creation is simplified and flexible
- ✅ Company branding (logos) is consistent and professional
- ✅ Admin can efficiently manage company data at scale

The changes are **backward compatible** and can be **deployed incrementally**.

