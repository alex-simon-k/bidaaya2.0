# Quick Start: Adding External Opportunities

## 🚀 Fast Track for Admin

### Method 1: Add Single Opportunity (Recommended for beginners)

1. Go to: `/admin/external-opportunities`
2. Click **"Add Opportunity"** button
3. Fill in **required fields**:
   - **Title**: e.g., "Marketing Intern"
   - **Company**: e.g., "Microsoft"
   - **Application URL**: e.g., "https://careers.microsoft.com/job/123"
4. Add optional details (location, salary, deadline, etc.)
5. Click **"Add Opportunity"**

### Method 2: Bulk Upload (Fastest for multiple opportunities)

1. Go to: `/admin/external-opportunities`
2. Click **"Bulk Upload"** button
3. Paste JSON array like this:

```json
[
  {
    "title": "Software Engineering Intern",
    "company": "Google",
    "applicationUrl": "https://careers.google.com/jobs/123",
    "location": "Dubai, UAE",
    "category": "COMPUTER_SCIENCE",
    "remote": false,
    "salary": "AED 5000/month",
    "deadline": "2025-12-31",
    "isPremium": false,
    "description": "Work on cutting-edge projects with Google's Dubai team"
  },
  {
    "title": "Marketing Intern",
    "company": "Amazon",
    "applicationUrl": "https://amazon.jobs/en/jobs/456",
    "location": "Remote",
    "category": "MARKETING",
    "remote": true,
    "salary": "AED 4000/month",
    "deadline": "2025-11-30",
    "isPremium": true,
    "description": "Join Amazon's global marketing team"
  }
]
```

4. Click **"Upload"**

## 📋 Field Reference

### Required Fields
- `title` - Job title (e.g., "Marketing Intern")
- `company` - Company name (e.g., "Google")
- `applicationUrl` - Full URL where students apply

### Optional Fields
- `description` - Brief description
- `location` - City/Country (e.g., "Dubai, UAE")
- `category` - One of: MARKETING, BUSINESS_DEVELOPMENT, COMPUTER_SCIENCE, FINANCE, PSYCHOLOGY
- `experienceLevel` - e.g., "Entry Level", "Internship"
- `remote` - true/false
- `salary` - e.g., "AED 3000/month"
- `deadline` - Date in format: "2025-12-31"
- `isPremium` - true/false (gives STUDENT_PRO users 2-day early access)
- `source` - Where you found it (e.g., "LinkedIn", "Company Website")
- `adminNotes` - Internal notes (not visible to students)

## 🎯 Pro Tips

### Finding Opportunities
- **LinkedIn Jobs**: Search for "UAE internships" or "remote internships MENA"
- **Company Career Pages**: Check major companies' careers sections
- **Job Boards**: Indeed, Bayt, GulfTalent, Naukri Gulf

### Quick Workflow
1. Find opportunity on LinkedIn/website
2. Copy title, company name, and application URL
3. Use bulk upload JSON format
4. Paste and upload 10-20 opportunities at once

### Categories Guide
- **MARKETING**: Social media, content, advertising, PR
- **BUSINESS_DEVELOPMENT**: Sales, partnerships, growth
- **COMPUTER_SCIENCE**: Software, data, AI, web development
- **FINANCE**: Accounting, investment, banking, analysis
- **PSYCHOLOGY**: HR, counseling, research, UX research

### Premium Opportunities
Mark as premium (`isPremium: true`) for:
- Highly competitive positions
- Top-tier companies
- Limited spots available
- Exclusive partnerships

This gives STUDENT_PRO users early access (2 days before others)

## 📊 Managing Opportunities

### Deactivate Old Opportunities
- Click the eye icon to toggle active/inactive
- Deactivate when deadline passes or position is filled

### Track Performance
- View analytics: views, clicks, applications
- See which opportunities are most popular
- Use data to find similar opportunities

### Bulk Actions
- Select multiple opportunities using checkboxes
- Delete multiple at once
- Activate/deactivate in bulk

## 🎓 Student Experience

When students apply:
1. They see the opportunity in `/dashboard/browse-opportunities`
2. Click "Apply Now"
3. Add optional notes
4. Get redirected to company website
5. Application is tracked (no credits used!)
6. Can see "Applied" status

## ⚡ Example: Adding 5 Opportunities in 2 Minutes

```json
[
  {
    "title": "Digital Marketing Intern",
    "company": "Careem",
    "applicationUrl": "https://www.careem.com/en-ae/careers/digital-marketing-intern",
    "location": "Dubai, UAE",
    "category": "MARKETING",
    "remote": false
  },
  {
    "title": "Software Engineering Intern",
    "company": "Noon",
    "applicationUrl": "https://careers.noon.com/job/software-intern",
    "location": "Dubai, UAE",
    "category": "COMPUTER_SCIENCE",
    "remote": false
  },
  {
    "title": "Finance Intern",
    "company": "Emirates NBD",
    "applicationUrl": "https://emiratesnbd.com/careers/finance-intern",
    "location": "Dubai, UAE",
    "category": "FINANCE",
    "remote": false
  },
  {
    "title": "Business Development Intern",
    "company": "Talabat",
    "applicationUrl": "https://careers.talabat.com/bd-intern",
    "location": "Dubai, UAE",
    "category": "BUSINESS_DEVELOPMENT",
    "remote": false
  },
  {
    "title": "UX Research Intern",
    "company": "Dubizzle",
    "applicationUrl": "https://dubizzle.com/careers/ux-intern",
    "location": "Remote",
    "category": "PSYCHOLOGY",
    "remote": true
  }
]
```

Copy, paste, upload - Done! ✅

## 🔍 Where to Start

### Recommended First Steps:
1. Add 10-20 opportunities from major UAE companies
2. Include mix of remote and on-site
3. Cover different categories
4. Mark 2-3 as premium to test early access feature
5. Monitor analytics to see what students like

### Popular UAE Companies for Internships:
- Tech: Careem, noon, Fetchr, Dubizzle, Property Finder
- Finance: Emirates NBD, ADIB, Mashreq, FAB
- Consulting: McKinsey, BCG, Deloitte (UAE offices)
- E-commerce: Amazon (UAE), Noon, Namshi
- Hospitality: Jumeirah, Emaar Hospitality

---

**Ready to start?** Go to `/admin/external-opportunities` and add your first opportunity! 🎉

