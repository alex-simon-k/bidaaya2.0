# OctoParse Opportunity Upload Workflow Guide

## Overview

This guide explains the complete workflow for uploading and managing external opportunities scraped via OctoParse.

## Prerequisites

1. Admin access to the Bidaaya platform
2. OctoParse configured to scrape opportunities
3. Node.js installed (for running conversion scripts)

---

## Phase 1: Initial Opportunity Upload

### Step 1: Run OctoParse Scraping

Configure OctoParse to scrape opportunities with the following data fields:

| Column Name | Description | Example |
|------------|-------------|---------|
| `Title` | Job title | "Marketing Intern" |
| `Title_URL` | Original listing URL | "https://www.glassdoor.com/job/..." |
| `Image` | Company logo URL | "https://media.glassdoor.com/..." |
| `Name` | Company name | "Al Tamimi & Company" |
| `Location` | Job location | "Dubai, United Arab Emirates" |
| `Description` | Job description (optional) | "Join our team..." |

### Step 2: Export CSV from OctoParse

1. Export your scraping results as CSV
2. Save the file (e.g., `opportunities-nov-2025.csv`)

### Step 3: Convert CSV to JSON

Run the conversion script:

```bash
cd /path/to/bidaaya2.0-main
node scripts/convert-octoparse-csv.js opportunities-nov-2025.csv output.json
```

**What this does:**
- Parses your CSV file
- Converts it to JSON format compatible with the API
- Handles column name variations (case-insensitive)
- Validates required fields

### Step 4: Upload via Admin Panel

1. Go to: **`/admin/octoparse-upload`**
2. Select the **"Phase 1: Upload Opportunities"** tab
3. Open `output.json` and copy all content
4. Paste into the text area
5. *(Optional)* Check **"Enable 24-Hour Early Access"** for premium users
6. Click **"Upload Opportunities"**

**Result:**
- Opportunities are created as **INACTIVE** (not visible to students yet)
- Company logos are automatically stored
- Duplicate detection prevents re-uploading the same opportunity

### Step 5: Review and Activate

1. Go to: **`/admin/external-opportunities`**
2. Review the newly uploaded opportunities
3. Verify titles, companies, and URLs are correct
4. Click **"Show"** to activate each opportunity for students

---

## Phase 2: Update True URLs

### Why This Step?

Many job listings (especially on Glassdoor) don't have direct application URLs. OctoParse can do a second pass to:
1. Open each opportunity link
2. Extract the **actual** application URL
3. Update your database with the correct URL

### Step 1: Run Second OctoParse Workflow

Configure OctoParse to:
1. Take the original CSV as input
2. Visit each `Title_URL`
3. Extract the true application URL
4. Export with these columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| `Title` | Job title (for matching) | "Marketing Intern" |
| `OldURL` | Original listing URL | "https://www.glassdoor.com/..." |
| `TrueURL` | Actual application URL | "https://careers.altamimi.com/..." |

**Note:** Leave `TrueURL` blank if no direct URL exists (e.g., Easy Apply)

### Step 2: Convert URLs CSV to JSON

```bash
node scripts/convert-octoparse-csv.js --urls url-updates-nov-2025.csv output-urls.json
```

### Step 3: Upload URL Updates

1. Go to: **`/admin/octoparse-upload`**
2. Select the **"Phase 2: Update URLs"** tab
3. Open `output-urls.json` and copy all content
4. Paste into the text area
5. Click **"Update URLs"**

**Result:**
- Opportunities with matching title + old URL are updated
- Opportunities without a true URL are automatically skipped
- Update timestamp is logged in admin notes

---

## Phase 3: Early Access Management

### What is Early Access?

- Premium (STUDENT_PRO) users get **24-hour exclusive access** to new opportunities
- After 24 hours, opportunities become public to all students
- This incentivizes premium subscriptions

### Manage Early Access

1. Go to: **`/admin/octoparse-upload`**
2. Select the **"Early Access Management"** tab
3. View all opportunities currently in early access
4. See countdown timer for each opportunity
5. Click **"Release Now"** to manually make an opportunity public early

### Automatic Release

Opportunities automatically become public after:
- 24 hours (if uploaded with early access enabled)
- Manual activation in the main admin panel

---

## Complete Workflow Example

```bash
# ============================================
# PHASE 1: INITIAL UPLOAD
# ============================================

# 1. Scrape opportunities via OctoParse
# 2. Export as CSV: opportunities-nov-16-2025.csv

# 3. Convert to JSON
node scripts/convert-octoparse-csv.js opportunities-nov-16-2025.csv phase1-output.json

# 4. Upload via admin panel: /admin/octoparse-upload
#    - Paste JSON content
#    - Enable early access: YES
#    - Click "Upload Opportunities"
#    Result: 47 opportunities created, 3 failed (duplicates)

# 5. Review and activate
#    Go to: /admin/external-opportunities
#    - Review opportunities
#    - Click "Show" to activate selected ones

# ============================================
# PHASE 2: URL UPDATES (6-12 hours later)
# ============================================

# 1. Run second OctoParse workflow to get true URLs
# 2. Export as CSV: url-updates-nov-16-2025.csv

# 3. Convert to JSON
node scripts/convert-octoparse-csv.js --urls url-updates-nov-16-2025.csv phase2-output.json

# 4. Upload URL updates: /admin/octoparse-upload
#    - Go to "Phase 2: Update URLs" tab
#    - Paste JSON content
#    - Click "Update URLs"
#    Result: 35 updated, 12 skipped (no true URL), 0 failed

# ============================================
# PHASE 3: MONITOR EARLY ACCESS
# ============================================

# 1. Monitor early access releases
#    Go to: /admin/octoparse-upload > "Early Access Management"
#    - See 47 opportunities in early access
#    - 5 expiring in next 6 hours
#    - Manually release high-priority ones if needed

# 2. After 24 hours
#    - All opportunities automatically become public
#    - Premium users had exclusive access
```

---

## Admin Panel Navigation

### Quick Links

| Page | URL | Purpose |
|------|-----|---------|
| **Admin Dashboard** | `/admin/dashboard` | Overview of platform stats |
| **OctoParse Upload** | `/admin/octoparse-upload` | Upload and manage scraped opportunities |
| **External Opportunities** | `/admin/external-opportunities` | Manage all external opportunities |
| **Company Projects** | `/admin/projects` | Review internal company-posted projects |
| **User Management** | `/admin/users` | View and manage all users |
| **Student View** | `/dashboard/browse-opportunities` | See how students view opportunities |

---

## Troubleshooting

### "Duplicate opportunity" error
**Solution:** The opportunity already exists. Check `/admin/external-opportunities` to see if it's already uploaded.

### "Invalid JSON format" error
**Solution:** Make sure you ran the conversion script first. Don't upload raw CSV.

### Company logos not showing
**Solution:** 
1. Check if `Image` column has valid URLs in your CSV
2. If URLs are broken, opportunities will show a building icon instead
3. You can manually edit `companyLogoUrl` in the database if needed

### URL updates not working
**Solution:**
1. Ensure `Title` and `OldURL` match existing opportunities
2. Check spelling and capitalization (title matching is case-insensitive)
3. Review failed updates in the response message

### Early access not working
**Solution:**
1. Ensure you checked "Enable 24-Hour Early Access" during upload
2. Check that opportunities are ACTIVE (not just uploaded)
3. Verify user subscription plan is STUDENT_PRO

---

## Database Migration Required

**IMPORTANT:** Before using this system, run the Prisma migration:

```bash
npx prisma migrate dev --name add_company_logo_to_external_opportunities
```

This adds the `companyLogoUrl` field to the `ExternalOpportunity` table.

---

## API Endpoints

### For Admin Use

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/external-opportunities/csv-upload` | POST | Upload CSV opportunities |
| `/api/admin/external-opportunities/update-urls` | POST | Update opportunity URLs |
| `/api/admin/external-opportunities` | GET | List all opportunities |
| `/api/admin/external-opportunities` | POST | Create single opportunity |
| `/api/admin/external-opportunities/:id` | PATCH | Update opportunity |
| `/api/admin/external-opportunities/:id` | DELETE | Delete opportunity |

---

## Student Experience

### What Students See

1. **Browse Opportunities Page** (`/dashboard/browse-opportunities`)
   - See all active external opportunities
   - Company logos displayed prominently
   - Filter by category, location, remote
   - Search by keywords

2. **Premium Early Access**
   - STUDENT_PRO users see new opportunities 24 hours early
   - "Premium" badge indicates early access opportunities
   - Countdown timer shows time remaining

3. **Application Flow**
   - Click "Apply Now"
   - Opportunity tracked in their applications
   - Opens external company website in new tab
   - **No credits consumed** for external opportunities

---

## Best Practices

### 1. Upload Timing
- Run OctoParse scraping during off-peak hours
- Upload opportunities in the evening (before students wake up)
- Enable early access for competitive positions

### 2. Quality Control
- Review opportunities before activating
- Check for duplicate titles/companies
- Verify company logos are displaying correctly
- Test URLs to ensure they're not broken

### 3. Early Access Strategy
- Mark highly competitive roles as early access
- FAANG companies, consulting firms → Early Access
- Entry-level local roles → Public immediately

### 4. URL Updates
- Run URL updates 6-12 hours after initial upload
- This gives time for Glassdoor/job boards to load properly
- Don't worry about opportunities without true URLs (they'll be skipped)

### 5. Monitoring
- Check admin dashboard daily for stats
- Monitor early access expiration
- Track application rates to see which opportunities are popular

---

## Migration Script (If Needed)

If you already have external opportunities without logos:

```sql
-- Add companyLogoUrl column (already in schema)
-- No data migration needed - logos will be added with new uploads
```

---

## Support

If you encounter issues:

1. Check browser console for error messages
2. Verify Prisma migration has run
3. Check that your admin user has the ADMIN role
4. Review the API response for detailed error messages

---

## Future Enhancements

Potential improvements:
- Auto-detect company from URL and fetch logo from Clearbit/Brandfetch
- Scheduled auto-refresh of opportunities
- Webhook integration with OctoParse for real-time uploads
- Opportunity expiration based on deadline dates
- Email notifications to premium users for new early access opportunities

---

**Happy uploading! 🚀**

