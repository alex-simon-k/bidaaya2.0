# Company Platform Redesign - Quick Reference

## 🎯 What We're Changing (TL;DR)

### 1. Project Creation: From 6 Templates → 1 Flexible Form
```
BEFORE:
User clicks "Create Project" 
  → Sees 6 template cards (Marketing, Business Dev, CS, Finance, Psychology, Custom)
  → Selects one
  → Fills form with template pre-fills
  
AFTER:
User clicks "Create Project"
  → Directly sees flexible form
  → Fills whatever they want (no templates)
  → All projects are effectively "custom"
```

### 2. Company Data: From Split Systems → Unified Database
```
BEFORE:
Self-Serve Companies                External Companies
└─ In User table                    └─ Just a string in ExternalOpportunity
   ├─ Can log in                       ├─ No account
   ├─ Post projects                    ├─ No profile
   └─ Have profiles                    └─ Can't log in

AFTER:
All Companies
└─ In User table (role: COMPANY)
   ├─ Self-serve: Created by signup
   ├─ External: Created by admin
   │  ├─ Inactive until activated
   │  └─ Can be activated later for self-serve
   └─ All have profiles, logos, consistent data
```

### 3. Company Logos: From Missing → Everywhere
```
BEFORE:
└─ Some companies have logos
   └─ Inconsistent display
   └─ No bulk upload
   └─ No auto-fetching

AFTER:
└─ All companies have logos
   ├─ Auto-fetch from Clearbit/Brandfetch
   ├─ Bulk upload supported
   ├─ Consistent display component
   └─ Fallback: Branded initials avatar
```

---

## 📊 Database Changes

### Current Schema
```
User (companies)
├─ companyName
├─ industry
├─ image (underutilized)
└─ ... other fields

ExternalOpportunity
├─ company (String - not linked!)
└─ ... other fields
```

### New Schema
```
User (companies)
├─ companyName
├─ industry
├─ image (logo URL)
├─ isExternalCompany (NEW) ⭐
└─ externalCompanySource (NEW) ⭐

ExternalOpportunity
├─ company (String - display name)
├─ companyId (NEW - FK to User) ⭐
└─ companyUser (NEW - relation) ⭐
```

---

## 🔄 Data Flow Examples

### Example 1: Admin Adds External Company + Opportunity

```
1. Admin finds job posting on LinkedIn: "Microsoft - Software Engineering Intern"

2. Admin goes to Admin Panel → External Opportunities → Add New

3. Admin enters:
   ✓ Company: "Microsoft" (dropdown shows existing OR "Create New")
   ✓ If new, admin provides:
     - Company name: Microsoft
     - Website: https://microsoft.com
     - Email: contact@microsoft.com (or auto-generated)
   
4. System:
   ✓ Creates User record:
     - role: COMPANY
     - companyName: "Microsoft"
     - companyWebsite: "https://microsoft.com"
     - image: (auto-fetched from Clearbit)
     - isExternalCompany: true
     - No password (inactive for login)
   
   ✓ Creates ExternalOpportunity record:
     - title: "Software Engineering Intern"
     - companyId: (links to Microsoft User record)
     - company: "Microsoft"
     - ... other fields

5. Students see:
   ✓ Opportunity with Microsoft logo
   ✓ Click through to apply on Microsoft's site
```

### Example 2: External Company Wants Self-Serve Access

```
1. Microsoft emails Bidaaya: "We want to post our own internships"

2. Admin:
   ✓ Goes to Admin Panel → Companies
   ✓ Finds "Microsoft" (already exists from previous external opportunities)
   ✓ Clicks "Generate Activation Link"
   ✓ Sends link to Microsoft contact

3. Microsoft contact:
   ✓ Clicks activation link
   ✓ Sets password
   ✓ Completes company profile (some fields pre-filled)
   
4. Microsoft can now:
   ✓ Log in to Bidaaya
   ✓ Post projects directly
   ✓ Manage applications
   ✓ Previous external opportunities still linked to their account
```

### Example 3: Bulk Upload 50 External Companies

```
1. Admin prepares CSV:
   companyName,email,website,industry,logoUrl
   Microsoft,contact@microsoft.com,https://microsoft.com,Technology,
   Google,contact@google.com,https://google.com,Technology,
   Amazon,contact@amazon.com,https://amazon.com,Technology,
   ...

2. Admin:
   ✓ Goes to Admin Panel → Companies → Bulk Upload
   ✓ Uploads CSV
   
3. System:
   ✓ Creates 50 User records (role: COMPANY)
   ✓ Auto-fetches logos for each (from Clearbit)
   ✓ Sets isExternalCompany: true
   ✓ Generates placeholder emails if needed
   
4. Admin can now:
   ✓ Quickly create opportunities for these companies
   ✓ All opportunities have proper company links and logos
```

---

## 🎨 UI Changes

### Project Creation Page
**File**: `src/app/dashboard/projects/new/page.tsx`

**Before** (~1000 lines):
- Step 1: Template selection grid (6 cards)
- Step 2: Form with template pre-fills

**After** (~500 lines):
- One page: Flexible form
- Category dropdown instead of template selection
- All fields customizable

### Admin Panel - New: Companies Page
**New File**: `src/app/admin/companies/page.tsx`

Features:
- Table of all companies (self-serve + external)
- Filter: All / Self-Serve / External
- Search by name, industry
- Bulk upload button
- Per-company actions:
  - View profile
  - Edit details
  - Generate activation link (for external)
  - View associated opportunities/projects

### External Opportunities Page (Updated)
**File**: `src/app/admin/external-opportunities/page.tsx`

New features:
- Company dropdown when creating opportunity
- "Create New Company" button
- Display company logo in opportunity cards
- Filter by company

---

## 📁 File Structure

```
New Files to Create:
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  └─ admin/
│  │  │     └─ companies/
│  │  │        ├─ create-external/
│  │  │        │  └─ route.ts ⭐ NEW
│  │  │        ├─ bulk-upload/
│  │  │        │  └─ route.ts ⭐ NEW
│  │  │        └─ [id]/
│  │  │           └─ activate/
│  │  │              └─ route.ts ⭐ NEW
│  │  ├─ admin/
│  │  │  └─ companies/
│  │  │     └─ page.tsx ⭐ NEW
│  │  └─ auth/
│  │     └─ activate/
│  │        └─ page.tsx ⭐ NEW
│  ├─ components/
│  │  └─ company-avatar.tsx ⭐ NEW
│  └─ lib/
│     └─ company-logo.ts ⭐ NEW
└─ scripts/
   └─ migrate-external-companies.js ⭐ NEW

Files to Update:
├─ prisma/
│  └─ schema.prisma ✏️ UPDATE
├─ src/
│  ├─ app/
│  │  ├─ dashboard/
│  │  │  └─ projects/
│  │  │     └─ new/
│  │  │        └─ page.tsx ✏️ UPDATE (simplify)
│  │  ├─ admin/
│  │  │  └─ external-opportunities/
│  │  │     └─ page.tsx ✏️ UPDATE (add company link)
│  │  └─ api/
│  │     └─ admin/
│  │        └─ external-opportunities/
│  │           └─ route.ts ✏️ UPDATE (add companyId)
│  └─ components/
│     └─ company-onboarding-checklist.tsx ✏️ UPDATE (remove templates ref)
```

---

## ✅ Implementation Checklist

### Phase 1: Simplify Project Creation (2-3 hours)
- [ ] Update `src/app/dashboard/projects/new/page.tsx`
  - [ ] Remove `currentStep` state
  - [ ] Remove `selectedTemplate` state
  - [ ] Remove template selection UI (Step 1)
  - [ ] Make form default view
  - [ ] Update category to simple dropdown
- [ ] Update `src/components/company-onboarding-checklist.tsx`
  - [ ] Remove "Choose from 5 categories" text
  - [ ] Update to "Create flexible custom projects"
- [ ] Test project creation flow
- [ ] Git commit + push
- [ ] Test in deployed environment

### Phase 2: Company Logo Infrastructure (3-4 hours)
- [ ] Create `src/lib/company-logo.ts`
  - [ ] Clearbit logo fetching function
  - [ ] Brandfetch fallback
  - [ ] Error handling
- [ ] Create `src/components/company-avatar.tsx`
  - [ ] Show image if exists
  - [ ] Fallback to initials avatar
  - [ ] Size variants (sm, md, lg, xl)
- [ ] Update components to use `CompanyAvatar`:
  - [ ] Project cards
  - [ ] External opportunity cards
  - [ ] Company profile pages
  - [ ] Admin panels
- [ ] Test logo display
- [ ] Git commit + push

### Phase 3: Database Schema (1-2 hours)
- [ ] Update `prisma/schema.prisma`
  - [ ] Add `User.isExternalCompany` field
  - [ ] Add `User.externalCompanySource` field
  - [ ] Add `ExternalOpportunity.companyId` field
  - [ ] Add `companyExternalOpportunities` relation
- [ ] Run migration: `npx prisma migrate dev --name unified_company_system`
- [ ] Test on dev environment
- [ ] Git commit + push

### Phase 4: Admin APIs (4-5 hours)
- [ ] Create `src/app/api/admin/companies/create-external/route.ts`
  - [ ] Create company account
  - [ ] Auto-fetch logo
  - [ ] Validation
- [ ] Create `src/app/api/admin/companies/bulk-upload/route.ts`
  - [ ] Parse CSV/JSON
  - [ ] Create multiple companies
  - [ ] Auto-fetch logos
  - [ ] Return success/failure report
- [ ] Update `src/app/api/admin/external-opportunities/route.ts`
  - [ ] Add company selection
  - [ ] Link to `companyId`
- [ ] Test APIs with Postman/curl
- [ ] Git commit + push

### Phase 5: Admin UI (5-6 hours)
- [ ] Create `src/app/admin/companies/page.tsx`
  - [ ] Company list table
  - [ ] Filters (all/self-serve/external)
  - [ ] Search functionality
  - [ ] Bulk upload button + modal
  - [ ] Edit company modal
  - [ ] Generate activation link button
- [ ] Update `src/app/admin/external-opportunities/page.tsx`
  - [ ] Add company dropdown to create form
  - [ ] Display company logos
  - [ ] Filter by company
- [ ] Test admin workflows
- [ ] Git commit + push

### Phase 6: Activation System (3-4 hours)
- [ ] Create `src/app/api/admin/companies/[id]/activate/route.ts`
  - [ ] Generate secure token
  - [ ] Send activation email
  - [ ] Return activation link
- [ ] Create `src/app/auth/activate/page.tsx`
  - [ ] Token validation
  - [ ] Password setup form
  - [ ] Redirect to onboarding
- [ ] Update `src/app/onboarding/company/page.tsx`
  - [ ] Detect external company
  - [ ] Pre-fill fields
  - [ ] Mark as activated
- [ ] Test full activation flow
- [ ] Git commit + push

### Phase 7: Data Migration (2-3 hours)
- [ ] Create `scripts/migrate-external-companies.js`
  - [ ] Extract unique companies from ExternalOpportunity
  - [ ] Create User records
  - [ ] Fetch logos
  - [ ] Link opportunities to companies
- [ ] Test migration script on dev data
- [ ] Run on production
- [ ] Verify data integrity
- [ ] Git commit + push

### Phase 8: Testing & Polish (2-3 hours)
- [ ] End-to-end testing
  - [ ] Create project (simplified flow)
  - [ ] Add external company
  - [ ] Bulk upload companies
  - [ ] Create external opportunity (linked to company)
  - [ ] Activate external company
  - [ ] Verify logo display
- [ ] Fix any bugs
- [ ] Update documentation
- [ ] Final deployment

---

## ⏱️ Estimated Timeline

| Phase | Time | Can Start |
|-------|------|-----------|
| Phase 1: Simplify Project Creation | 2-3 hours | Immediately |
| Phase 2: Logo Infrastructure | 3-4 hours | After Phase 1 |
| Phase 3: Database Schema | 1-2 hours | After Phase 2 |
| Phase 4: Admin APIs | 4-5 hours | After Phase 3 |
| Phase 5: Admin UI | 5-6 hours | After Phase 4 |
| Phase 6: Activation System | 3-4 hours | After Phase 3 |
| Phase 7: Data Migration | 2-3 hours | After Phase 4 |
| Phase 8: Testing & Polish | 2-3 hours | After all phases |

**Total: ~23-30 hours of work**

Can be split across multiple days/sessions. Each phase can be deployed independently.

---

## 🎯 Quick Wins (Do These First)

1. **Phase 1** (Project Creation Simplification) - Immediate UX improvement, no database changes
2. **Phase 2** (Company Avatars) - Visual polish, better branding
3. Then build out the rest incrementally

---

## 🚨 Important Notes

1. **Backward Compatibility**: All changes maintain existing functionality
2. **Incremental Deployment**: Each phase can be deployed separately
3. **Data Safety**: Migration script is non-destructive (adds, doesn't delete)
4. **Testing**: Test each phase in deployed environment before continuing
5. **Email Strategy**: Use `external+{slug}@bidaaya.ae` pattern for generated emails

---

## 📞 Questions to Answer Before Starting

1. **Email Pattern**: Confirm email pattern for external companies (e.g., `external+microsoft@bidaaya.ae`)
2. **Logo Service**: Clearbit is free for low volume - do we need paid plan?
3. **Activation Email**: Who sends it? What's the template?
4. **Default Industries**: Do we have a standard list of industries for dropdowns?
5. **Migration Timing**: Run migration during low-traffic hours? Schedule downtime?

