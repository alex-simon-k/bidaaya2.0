# Admin Company Management - Detailed Specification

## 🎯 Primary Goal
Build a comprehensive admin interface to manage ALL companies (self-serve + external) with clear visibility into their opportunities and ability to edit everything.

---

## 📊 Database Schema Updates

### Update `prisma/schema.prisma`

```prisma
model User {
  // ... existing fields ...
  
  // NEW: Track company source
  isExternalCompany Boolean @default(false)
  companySource String? // "signup", "admin_created", "bulk_upload"
  
  // NEW: Relation for external opportunities
  externalOpportunities ExternalOpportunity[] @relation("CompanyExternalOpportunities")
}

model ExternalOpportunity {
  id              String   @id @default(cuid())
  title           String
  company         String   // Display name (keep for backward compatibility)
  companyId       String?  // NEW: Link to User table
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
  companyUser     User?    @relation("CompanyExternalOpportunities", fields: [companyId], references: [id])
  
  @@index([isActive, isPremium])
  @@index([category])
  @@index([addedAt])
  @@index([deadline])
  @@index([companyId]) // NEW
}
```

**Migration command:**
```bash
npx prisma migrate dev --name add_company_linking_to_external_opportunities
```

---

## 🎨 Admin Company Management UI

### Page: `/admin/companies`
**File**: `src/app/admin/companies/page.tsx`

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Companies Management                                         │
│ ─────────────────────────────────────────────────────────── │
│                                                               │
│ [Search: ___________] [Filter: All ▼] [+ Add Company]        │
│                                        [📤 Bulk Upload]       │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Logo │ Company    │ Email      │ Type      │ Industry │   │
│ ├──────┼────────────┼────────────┼───────────┼──────────┤   │
│ │ [MS] │ Microsoft  │ contact@.. │ External  │ Tech     │   │
│ │      │            │            │ 🔴 Inactive│          │   │
│ │      │ 3 projects │ 12 opps    │           │          │   │
│ │      │ [View] [Edit]                                   │   │
│ ├──────┼────────────┼────────────┼───────────┼──────────┤   │
│ │ [ST] │ Startup XY │ ceo@start..│ Self-Serve│ FinTech  │   │
│ │      │            │            │ 🟢 Active │          │   │
│ │      │ 5 projects │ 0 opps     │           │          │   │
│ │      │ [View] [Edit]                                   │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

#### 1. **Company Table**

**Columns:**
- **Logo** - Company avatar (uploaded image or initials)
- **Company Name** - With subtitle showing project/opportunity counts
- **Email** - Contact/login email
- **Type** - Badge showing:
  - 🟢 **Self-Serve** (Active) - Signed up, can log in
  - 🔴 **External** (Inactive) - Admin-created, can't log in yet
  - 🟡 **External** (Activated) - Was external, now has Google login access
- **Industry**
- **Stats** - Projects count, Opportunities count
- **Actions** - View, Edit, Delete

**Filters:**
- All Companies
- Self-Serve Only
- External Only
- External (Activated)
- External (Inactive)
- By Industry

**Search:**
- Search by company name, email, industry

**Sort:**
- By name, creation date, project count, opportunity count

#### 2. **Add Company Modal**

**Form Fields:**
```
Company Information
├─ Company Name * (text)
├─ Email (text) - For future Google sign-in
├─ Industry (dropdown)
│  └─ Technology, Finance, Healthcare, Education, 
│      Retail, Consulting, Media, Manufacturing, Other
├─ Company Size (dropdown)
│  └─ 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
├─ Website (text)
├─ Location (text)
├─ One-liner / Description (textarea)
└─ Logo Upload (file input)
   └─ PNG, JPG, WebP (max 5MB)

Admin Fields
├─ Company Source (auto-set to "admin_created")
└─ Admin Notes (textarea)

[Cancel] [Create Company]
```

**API Endpoint:**
```
POST /api/admin/companies/create
{
  companyName: string
  email?: string
  industry?: string
  companySize?: string
  companyWebsite?: string
  location?: string
  companyOneLiner?: string
  image?: string (file upload URL)
  adminNotes?: string
}

Response:
{
  success: true
  company: { id, companyName, ... }
}
```

#### 3. **Edit Company Modal**

Same fields as Add, but pre-filled with existing data.

**Additional field:**
- **Convert to Self-Serve** (checkbox)
  - When checked, updates `isExternalCompany: false`
  - Allows company to log in with their email via Google

**API Endpoint:**
```
PUT /api/admin/companies/{companyId}
{
  // Any field from company profile
  companyName?: string
  email?: string
  image?: string
  ...
}
```

#### 4. **Company Details View**

Clicking "View" opens detailed view:

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Back to Companies                                        │
│                                                               │
│ [Logo] Microsoft                                              │
│        Technology • Redmond, WA                               │
│        🔴 External (Inactive)                                 │
│        website.com • contact@microsoft.com                    │
│                                                               │
│ [Edit Company] [Activate for Self-Serve]                     │
│                                                               │
│ ─────────────────────────────────────────────────────────── │
│                                                               │
│ [Internal Projects (3)] [External Opportunities (12)]        │
│ ═══════════════════════════════════════════════════════════ │
│                                                               │
│ Internal Projects Tab:                                        │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Software Engineering Intern                            │   │
│ │ Posted: Jun 15, 2024 • Status: Live                   │   │
│ │ 15 applications • Remote                               │   │
│ │ [View] [Edit] [Close]                                  │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ Marketing Analyst                                      │   │
│ │ Posted: Jul 2, 2024 • Status: Live                    │   │
│ │ 8 applications • Dubai, UAE                            │   │
│ │ [View] [Edit] [Close]                                  │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

External Opportunities Tab:
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Cloud Solutions Intern                                 │   │
│ │ Added: Aug 1, 2024 • Active                           │   │
│ │ 45 views, 12 clicks • Apply: microsoft.com/careers    │   │
│ │ [View] [Edit] [Deactivate]                            │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ AI Research Intern                                     │   │
│ │ Added: Aug 5, 2024 • Active                           │   │
│ │ 32 views, 8 clicks • Apply: microsoft.com/research    │   │
│ │ [View] [Edit] [Deactivate]                            │   │
│ └───────────────────────────────────────────────────────┘   │
```

**API Endpoint:**
```
GET /api/admin/companies/{companyId}/details
Response:
{
  company: { id, companyName, email, ... }
  internalProjects: [ { id, title, status, applications: count, ... } ]
  externalOpportunities: [ { id, title, viewCount, clickCount, ... } ]
  stats: {
    totalProjects: 3
    totalOpportunities: 12
    totalApplications: 23
  }
}
```

#### 5. **Bulk Upload**

**CSV Format:**
```csv
companyName,email,industry,companySize,website,location,oneLiner,logoFileName
Microsoft,contact@microsoft.com,Technology,1000+,https://microsoft.com,Redmond WA,Leading tech company,microsoft.png
Google,contact@google.com,Technology,1000+,https://google.com,Mountain View CA,Search and cloud,google.png
```

**Upload Process:**
1. Admin uploads CSV
2. Admin uploads ZIP file with logos (optional)
   - Logos named as per `logoFileName` column
3. System:
   - Parses CSV
   - Creates User records
   - Matches and uploads logos
   - Returns report of successes/failures

**API Endpoint:**
```
POST /api/admin/companies/bulk-upload
FormData:
  - csvFile: File
  - logosZip?: File

Response:
{
  success: true
  created: 45
  failed: 2
  results: {
    success: [ { companyName: "Microsoft", id: "..." }, ... ]
    failed: [ { companyName: "BadCo", error: "Invalid email" }, ... ]
  }
}
```

---

## 🔗 External Opportunity Creation Updates

### Update: `/admin/external-opportunities`

**Add Company Selection to Form:**

```
Add External Opportunity
├─ Company * (dropdown with search)
│  ├─ [Search existing companies...]
│  ├─ Microsoft
│  ├─ Google
│  ├─ ...
│  └─ [+ Create New Company]
│
├─ Title *
├─ Application URL *
├─ Location
├─ Category
├─ ... other fields
```

**When "Create New Company" selected:**
- Inline form appears
- Fill company details
- Submit creates both company AND opportunity

**API Update:**
```
POST /api/admin/external-opportunities
{
  companyId: string (required now!)
  title: string
  applicationUrl: string
  ...
}

Or create inline:
{
  company: {
    companyName: string
    email: string
    industry: string
    ...
  }
  opportunity: {
    title: string
    applicationUrl: string
    ...
  }
}
```

---

## 🔐 Google Sign-In Activation

### Process:

1. **Admin creates external company**
   - Email: `external+microsoft@bidaaya.ae` (placeholder)
   - `isExternalCompany: true`

2. **Company requests access**
   - Admin edits company
   - Updates email to real Google-auth email: `partnerships@microsoft.com`
   - Saves

3. **User signs in**
   - Goes to bidaaya.ae
   - Clicks "Sign in with Google"
   - Google SSO with `partnerships@microsoft.com`
   - System checks: User exists with this email + role COMPANY
   - Logs them in
   - They see company dashboard

**No activation link, no password setup needed!**

### Edge Case: Email Already Exists

If email is already used by a student:
- Admin sees warning: "Email already in use by student account"
- Admin must use different email or contact user to merge accounts

---

## 📁 Files to Create

### 1. Admin Companies Page
**File**: `src/app/admin/companies/page.tsx`
- Main company management UI
- Table, filters, search
- Add/edit modals
- Bulk upload

### 2. Company Details Page
**File**: `src/app/admin/companies/[id]/page.tsx`
- Detailed company view
- Internal projects tab
- External opportunities tab
- Edit functionality

### 3. API Routes

**File**: `src/app/api/admin/companies/create/route.ts`
- Create single company

**File**: `src/app/api/admin/companies/bulk-upload/route.ts`
- Bulk CSV upload

**File**: `src/app/api/admin/companies/[id]/route.ts`
- GET: Fetch company details
- PUT: Update company
- DELETE: Delete company

**File**: `src/app/api/admin/companies/[id]/details/route.ts`
- Fetch company with projects + opportunities

### 4. Components

**File**: `src/components/company-avatar.tsx`
- Reusable company logo component
- Fallback to initials

**File**: `src/components/admin/company-table.tsx`
- Reusable company table component

**File**: `src/components/admin/company-form.tsx`
- Reusable company add/edit form

---

## 📝 Files to Update

### 1. Database Schema
**File**: `prisma/schema.prisma`
- Add `User.isExternalCompany`
- Add `User.companySource`
- Add `ExternalOpportunity.companyId`
- Add relations

### 2. External Opportunities API
**File**: `src/app/api/admin/external-opportunities/route.ts`
- Require `companyId` when creating
- Support inline company creation

### 3. External Opportunities UI
**File**: `src/app/admin/external-opportunities/page.tsx`
- Add company dropdown to form
- Display company info in opportunity list

---

## ✅ Implementation Checklist

### Phase 1: Database Schema (1-2 hours)
- [ ] Update `prisma/schema.prisma`
  - [ ] Add `User.isExternalCompany` (Boolean)
  - [ ] Add `User.companySource` (String?)
  - [ ] Add `ExternalOpportunity.companyId` (String?)
  - [ ] Add `externalOpportunities` relation to User
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Test schema in dev

### Phase 2: API Endpoints (4-5 hours)
- [ ] Create `src/app/api/admin/companies/create/route.ts`
  - [ ] POST: Create company
  - [ ] Validation
  - [ ] Logo upload handling
- [ ] Create `src/app/api/admin/companies/[id]/route.ts`
  - [ ] GET: Fetch company
  - [ ] PUT: Update company
  - [ ] DELETE: Delete company
- [ ] Create `src/app/api/admin/companies/[id]/details/route.ts`
  - [ ] GET: Company with projects + opportunities
  - [ ] Aggregate stats
- [ ] Create `src/app/api/admin/companies/bulk-upload/route.ts`
  - [ ] POST: CSV + logos upload
  - [ ] Parse CSV
  - [ ] Create multiple companies
  - [ ] Return results
- [ ] Update `src/app/api/admin/external-opportunities/route.ts`
  - [ ] Add `companyId` to creation
  - [ ] Support inline company creation
- [ ] Test all APIs

### Phase 3: Shared Components (2-3 hours)
- [ ] Create `src/components/company-avatar.tsx`
  - [ ] Show image or initials
  - [ ] Size variants
- [ ] Create `src/components/admin/company-form.tsx`
  - [ ] Add/edit form
  - [ ] Validation
  - [ ] Logo upload
- [ ] Test components

### Phase 4: Admin Companies Page (6-8 hours)
- [ ] Create `src/app/admin/companies/page.tsx`
  - [ ] Company table with all columns
  - [ ] Search functionality
  - [ ] Filters (all/self-serve/external)
  - [ ] Add company modal
  - [ ] Edit company modal
  - [ ] Bulk upload modal
  - [ ] Delete confirmation
- [ ] Styling and responsiveness
- [ ] Test all features

### Phase 5: Company Details Page (4-5 hours)
- [ ] Create `src/app/admin/companies/[id]/page.tsx`
  - [ ] Company header with info
  - [ ] Tabs: Internal Projects, External Opportunities
  - [ ] Projects list with stats
  - [ ] Opportunities list with stats
  - [ ] Edit button
- [ ] Styling
- [ ] Test

### Phase 6: Update External Opportunities UI (3-4 hours)
- [ ] Update `src/app/admin/external-opportunities/page.tsx`
  - [ ] Add company dropdown to create form
  - [ ] "Create New Company" inline option
  - [ ] Display company logo in opportunity cards
  - [ ] Filter by company
- [ ] Test opportunity creation with company linking

### Phase 7: CSV Template & Documentation (1 hour)
- [ ] Create `companies-upload-template.csv`
- [ ] Update documentation
- [ ] Add instructions for bulk upload

### Phase 8: Testing & Polish (2-3 hours)
- [ ] End-to-end testing
  - [ ] Create external company
  - [ ] Upload logo
  - [ ] Bulk upload companies
  - [ ] Create opportunity linked to company
  - [ ] View company details
  - [ ] Edit company
  - [ ] Convert to self-serve
- [ ] Fix bugs
- [ ] UI polish
- [ ] Final deployment

---

## ⏱️ Total Estimated Time: 23-31 hours

Can be split across multiple sessions. Each phase can be tested and deployed independently.

---

## 🎯 Success Criteria

✅ Admin can create external companies with all profile details
✅ Admin can upload logos for companies
✅ Admin can bulk upload multiple companies via CSV
✅ Admin can see all companies in one table
✅ Admin can filter/search companies
✅ Admin can distinguish self-serve vs external companies
✅ Admin can edit any company's details
✅ Admin can view all opportunities (internal + external) per company
✅ External opportunities are linked to companies via companyId
✅ Creating opportunities requires selecting a company
✅ Company logos display consistently across platform
✅ External companies can be "activated" by updating their email to Google-auth email

---

## 🚨 Important Notes

1. **Logo Upload**: Manual only, no auto-fetch
2. **Google Sign-In**: No password system, just update email for access
3. **Company Linking**: Both projects AND external opportunities link to companies
4. **Backward Compatibility**: Existing data won't break (companyId is optional)
5. **Email Pattern**: Use `external+{slug}@bidaaya.ae` for placeholder emails

