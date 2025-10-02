# How to View External Opportunities as a Student

## Quick Access

### Method 1: Bottom Navigation (Mobile/All Devices)
1. Log in as a **STUDENT** account
2. Look at the **bottom navigation bar**
3. Click the **"Internships"** button (briefcase icon 💼)
4. You'll be taken to `/dashboard/browse-opportunities`

### Method 2: Direct URL
- Simply go to: **`https://bidaaya.ae/dashboard/browse-opportunities`**

### Method 3: Dashboard Navigation (Desktop)
1. From your student dashboard
2. Click "Browse Projects" or "Internships" in the navigation
3. Or type the URL directly

---

## What You'll See

### Page Layout:

```
┌─────────────────────────────────────────────┐
│ Browse Opportunities                         │
│ Discover internships and projects from      │
│ Bidaaya partners and external companies     │
└─────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ All          │ Bidaaya      │ External     │ ← Tabs
│ Opportunities│ Projects     │ Opportunities│
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────┐
│ 🔍 Search opportunities...                  │
│                                              │
│ Filters: [Category ▼] [☐ Remote Only]      │
└─────────────────────────────────────────────┘

External Opportunities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────┐
│ Marketing Intern         🟣 Premium         │
│ Google                                       │
│                                              │
│ Join Google's marketing team...             │
│                                              │
│ 📍 Dubai, UAE  🌐 Remote  💼 Marketing     │
│                                              │
│              [Apply Now →]                   │
└─────────────────────────────────────────────┘
```

---

## Tabs Explained

### 🌟 All Opportunities (Default)
- Shows **both** Bidaaya projects AND external opportunities
- Comprehensive view of everything available

### 💼 Bidaaya Projects
- Shows only Bidaaya platform projects
- Uses your application credits

### 🔗 External Opportunities  
- Shows only external opportunities (from other companies)
- **NO credits required!**
- Unlimited applications

---

## Premium Badge (🟣)

If you see a **purple "Premium" badge**:
- You need **STUDENT_PRO** subscription
- FREE and STUDENT_PREMIUM users will see it **2 days later**
- Gives PRO users early access to apply first

---

## Why Can't I See Opportunities?

### Checklist:

#### 1. **Are you logged in as a STUDENT?**
- External opportunities are only for students
- Companies can't see them

#### 2. **Are there any active opportunities?**
- Admin must have added opportunities
- Opportunities must be set to "Live" (not "Hidden")

#### 3. **Are you looking in the right place?**
- URL: `/dashboard/browse-opportunities`
- Bottom nav: "Internships" button

#### 4. **Try the "External Opportunities" tab**
- Click directly on that tab to see only external ones

#### 5. **Check filters**
- Make sure category filter isn't limiting results
- Try "All Categories"

---

## Testing Steps (For Admin)

### To verify students can see your opportunities:

1. **As Admin**: Add an opportunity and make sure it's "Live" ✅
2. **Log out** from admin account
3. **Log in** as a student account (or create test student)
4. **Navigate to** `/dashboard/browse-opportunities`
5. **Click** "External Opportunities" tab
6. **You should see** the opportunity you just added!

### Quick Test Opportunity:
```json
{
  "title": "TEST - Marketing Intern",
  "company": "Test Company",
  "applicationUrl": "https://example.com",
  "description": "This is a test opportunity to verify students can see it",
  "location": "Dubai, UAE",
  "category": "Marketing",
  "remote": false
}
```

Add this, make sure it's "Live", then check as student!

---

## Common Issues & Solutions

### Issue: "Page is blank"
**Solution:** 
- Check browser console for errors
- Make sure you're logged in as STUDENT role
- Try refreshing the page

### Issue: "No opportunities found"
**Solution:**
- Admin needs to add opportunities first
- Check that opportunities are set to "Live" (not "Hidden")
- Try removing all filters

### Issue: "I see 'Bidaaya projects coming soon'"
**Solution:**
- That's the Bidaaya Projects tab
- Click on **"External Opportunities"** tab instead
- Or stay on "All Opportunities" tab

### Issue: "Premium opportunities are locked"
**Solution:**
- Upgrade to STUDENT_PRO for early access
- OR wait 2 days for non-premium access

---

## Mobile vs Desktop

### Mobile (Bottom Navigation):
```
┌────┬────┬────┐
│ 👤 │ 🏢 │ 💼 │ ← Bottom bar
└────┴────┴────┘
Profile  Companies  Internships ← Click here!
```

### Desktop (Top Navigation):
- Look for "Browse Projects" or "Internships"
- Or type URL directly

---

## What Students Can Do

### ✅ Students CAN:
- Browse unlimited external opportunities
- Search and filter by category, location, remote
- Apply to unlimited external opportunities (**no credits used!**)
- Track which opportunities they've applied to
- See "Applied" status after applying

### ❌ Students CANNOT:
- Add opportunities (admin only)
- See hidden/inactive opportunities
- See admin notes

---

## Application Flow

When student clicks "Apply Now":

1. **Modal appears** with opportunity details
2. Student can add **optional notes** (for their own reference)
3. Student clicks **"Continue to Apply"**
4. Application is **tracked** in the system
5. Student is **redirected** to company's website in new tab
6. Opportunity shows **"✓ Applied"** badge for that student
7. **NO CREDITS** are consumed!

---

## For Premium (STUDENT_PRO) Users

### Benefits:
- See premium opportunities **2 days early**
- Indicated by 🟣 **Premium** badge
- Apply before free users can see them
- Higher chance of acceptance (fewer applicants)

### How to Upgrade:
- Go to `/pricing` page
- Select STUDENT_PRO plan
- Get early access to premium opportunities!

---

## Navigation Path Summary

```
Login → Dashboard → Bottom Nav "Internships" 
                     ↓
         Browse Opportunities Page
                     ↓
         External Opportunities Tab
                     ↓
         See Live Opportunities!
```

**Direct URL:** `/dashboard/browse-opportunities`

**Bottom Nav Icon:** 💼 Internships

**Tab:** External Opportunities (or All Opportunities)

---

That's it! If students still can't see opportunities, make sure:
1. ✅ Opportunities are added by admin
2. ✅ Opportunities are set to "Live"
3. ✅ User is logged in as STUDENT
4. ✅ User is on the correct page (`/dashboard/browse-opportunities`)

