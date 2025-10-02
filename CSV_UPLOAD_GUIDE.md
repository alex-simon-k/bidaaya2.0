# CSV Upload Guide for External Opportunities

## Quick Start

1. Download the template: `external-opportunities-template.csv`
2. Fill in your opportunities
3. Convert to JSON using the provided script
4. Upload via admin panel

---

## CSV Format

### Required Columns (Must Have)
- **title** - Job title (e.g., "Marketing Intern")
- **company** - Company name (e.g., "Google")
- **applicationUrl** - Full URL where students apply (e.g., "https://careers.google.com/jobs/123")

### Optional Columns
- **location** - Location (e.g., "Dubai, UAE" or "Remote")
- **category** - One of: MARKETING, BUSINESS_DEVELOPMENT, COMPUTER_SCIENCE, FINANCE, PSYCHOLOGY
- **experienceLevel** - Experience level (e.g., "Entry Level", "Internship", "Graduate")
- **remote** - TRUE/FALSE (whether it's a remote position)
- **salary** - Salary/compensation (e.g., "AED 3000/month", "Unpaid")
- **deadline** - Application deadline in YYYY-MM-DD format (e.g., "2025-12-31")
- **isPremium** - TRUE/FALSE (gives STUDENT_PRO users 2-day early access)
- **description** - Brief description of the opportunity
- **source** - Where you found it (e.g., "LinkedIn", "Company Website")
- **adminNotes** - Internal notes (not visible to students)

---

## Column Order (Use This Exact Order)

```
title,company,applicationUrl,location,category,experienceLevel,remote,salary,deadline,isPremium,description,source,adminNotes
```

---

## Example CSV Content

```csv
title,company,applicationUrl,location,category,experienceLevel,remote,salary,deadline,isPremium,description,source,adminNotes
Marketing Intern,Google,https://careers.google.com/jobs/123456,Dubai UAE,MARKETING,Entry Level,FALSE,AED 4000/month,2025-12-31,FALSE,"Join Google's marketing team in Dubai. Work on campaigns for MENA region.",LinkedIn Jobs,Found on LinkedIn - looks promising
Software Engineering Intern,Amazon,https://amazon.jobs/en/jobs/234567,Remote,COMPUTER_SCIENCE,Internship,TRUE,AED 5000/month,2025-11-30,TRUE,"Remote software engineering internship with Amazon Web Services team.",Company Website,Premium opportunity - early access
Business Development Intern,Careem,https://www.careem.com/careers/bd-intern,Dubai UAE,BUSINESS_DEVELOPMENT,Entry Level,FALSE,AED 3500/month,2025-10-15,FALSE,"Help expand Careem's services across the UAE market.",Careem Careers,Local UAE company
```

---

## Step-by-Step Upload Process

### Option 1: Direct JSON Upload (Fastest)

If you're comfortable with JSON, you can skip the CSV and directly paste JSON into the bulk upload:

```json
[
  {
    "title": "Marketing Intern",
    "company": "Google",
    "applicationUrl": "https://careers.google.com/jobs/123",
    "location": "Dubai, UAE",
    "category": "MARKETING",
    "remote": false,
    "isPremium": false
  }
]
```

### Option 2: CSV → JSON Conversion (Recommended for Bulk)

1. **Fill in the CSV template**:
   ```bash
   # Open external-opportunities-template.csv in Excel/Google Sheets
   # Add your opportunities (one per row)
   # Save as CSV
   ```

2. **Convert CSV to JSON**:
   ```bash
   node scripts/csv-to-json-opportunities.js your-opportunities.csv opportunities.json
   ```

3. **Upload via Admin Panel**:
   - Go to `/admin/external-opportunities`
   - Click "Bulk Upload" button
   - Open `opportunities.json` and copy all content
   - Paste into the text area
   - Click "Upload"

---

## Important Notes

### Boolean Values
- Use `TRUE`, `FALSE`, `YES`, `NO`, `1`, or `0`
- Case insensitive (true, TRUE, True all work)

### Dates
- Format: `YYYY-MM-DD` (e.g., `2025-12-31`)
- Don't use slashes or other formats

### URLs
- Must be complete URLs starting with `http://` or `https://`
- Examples:
  - ✅ `https://careers.google.com/jobs/123`
  - ❌ `careers.google.com/jobs/123`

### Categories
Must be EXACTLY one of these (case-sensitive):
- `MARKETING`
- `BUSINESS_DEVELOPMENT`
- `COMPUTER_SCIENCE`
- `FINANCE`
- `PSYCHOLOGY`

Leave blank if none apply.

### Descriptions with Commas
If your description has commas, wrap it in quotes:
```csv
"Work on marketing campaigns, social media, and content creation."
```

### Empty Fields
- Leave optional fields blank if you don't have the information
- Don't use "N/A" or "None" - just leave empty
- Example: `Marketing Intern,Google,https://...,,,,,,,,,`

---

## Quick Tips

### Finding Opportunities

**Best Sources**:
1. **LinkedIn Jobs** - Filter by "UAE" + "Internship" + "Entry Level"
2. **Company Career Pages** - Check direct websites:
   - Google Careers
   - Amazon Jobs
   - Careem Careers
   - Noon Careers
   - Emirates NBD Careers
3. **Job Boards**:
   - Bayt.com
   - GulfTalent
   - Indeed UAE
   - Naukri Gulf

### Bulk Workflow (10-20 opportunities in 5 minutes)

1. Open LinkedIn/job board
2. Copy job title, company, URL
3. Paste into CSV template
4. Repeat for 10-20 jobs
5. Run conversion script
6. Bulk upload

### Premium Opportunities

Mark as premium (`isPremium: TRUE`) for:
- Highly competitive positions
- Top-tier companies (FAANG, consulting, etc.)
- Limited spots
- Exclusive partnerships

This gives STUDENT_PRO users a 2-day head start!

---

## Troubleshooting

### "Invalid URL format"
- Make sure URL starts with `https://` or `http://`
- No spaces in URL
- URL must be accessible

### "Missing required fields"
- Check that title, company, and applicationUrl are filled
- No blank rows in CSV

### CSV not parsing correctly
- Make sure you have the exact column headers
- Check for extra commas or quotes
- Save as UTF-8 encoding

### Bulk upload showing errors
- Review the `failed` array in the response
- Fix issues in your CSV
- Try uploading again

---

## Example Workflow

```bash
# 1. Download template
# Already have: external-opportunities-template.csv

# 2. Fill in your data in Excel/Google Sheets
# Add 20 opportunities, save as my-opportunities.csv

# 3. Convert to JSON
node scripts/csv-to-json-opportunities.js my-opportunities.csv opportunities.json

# Output:
# ✅ Successfully converted 20 opportunities
# 📄 Input:  my-opportunities.csv
# 📄 Output: opportunities.json

# 4. Open opportunities.json, copy content

# 5. Go to /admin/external-opportunities
# 6. Click "Bulk Upload"
# 7. Paste JSON
# 8. Click "Upload"

# Result: ✅ Bulk upload complete! Created: 20, Failed: 0
```

---

## Template Files Provided

1. **`external-opportunities-template.csv`** - CSV template with examples
2. **`scripts/csv-to-json-opportunities.js`** - Conversion script
3. **`CSV_UPLOAD_GUIDE.md`** - This guide

---

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your CSV format matches the template
3. Try uploading a single opportunity first to test
4. Review the admin notes to track what's working

Happy uploading! 🎉

