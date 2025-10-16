# 📄 CV Word Export - Customization Guide

## Overview

The system now exports CVs as **editable Word documents (.docx)** that students can:
- ✅ Download directly from chat
- ✅ Edit and customize before applying
- ✅ Use for any application (internal or external)

---

## 🎨 Current CV Template Structure

### Layout

```
═══════════════════════════════════════════════════════════
                    FULL NAME
              Professional Headline
     Email | Phone | Location | LinkedIn
═══════════════════════════════════════════════════════════

PROFESSIONAL SUMMARY
───────────────────────────────────────────────────────────
2-3 sentence career summary highlighting education, 
experience, and career goals.


EDUCATION
───────────────────────────────────────────────────────────
University Name                                 Dates
Degree Title | Field of Study | Grade
• Relevant module 1
• Relevant module 2
• Honors and awards


EXPERIENCE
───────────────────────────────────────────────────────────
Job Title | Company Name                        Dates
Location
• Achievement with metrics (Reduced X by 40%)
• Achievement 2
• Key responsibility


PROJECTS
───────────────────────────────────────────────────────────
Project Name | Role                             Dates
Technologies: React, Node.js, MongoDB
• Outcome 1 (Grew to 8,000 users)
• Outcome 2


SKILLS
───────────────────────────────────────────────────────────
Technical: Python, R, JavaScript, SQL
Tools & Platforms: React, Node.js, MongoDB
Soft Skills: Leadership, Communication


CERTIFICATIONS  (if applicable)
───────────────────────────────────────────────────────────
Certification Name | Issuer                      Date


LANGUAGES  (if applicable)
───────────────────────────────────────────────────────────
English (Fluent), Arabic (Native), French (Intermediate)


LEADERSHIP & ACHIEVEMENTS  (if applicable)
───────────────────────────────────────────────────────────
Achievement Name                                 Date
• Description and impact
```

---

## 🔧 How to Customize the Template

### Method 1: Modify `cv-word-export.ts`

**File:** `src/lib/cv-word-export.ts`

**Common Customizations:**

#### Change Section Order

Currently:
1. Professional Summary
2. Education
3. Experience
4. Projects
5. Skills
6. Certifications
7. Languages
8. Achievements

To reorder, change line ~50 in the `generateWordDocument` method:
```typescript
children: [
  ...this.createHeader(cv.profile),
  
  // Change order here:
  ...this.createEducationSection(cv.education),
  ...this.createExperienceSection(cv.experience),  
  ...this.createProjectsSection(cv.projects),
  ...this.createSkillsSection(cv.skills),
]
```

#### Change Fonts & Sizing

In each section method, modify:
```typescript
new TextRun({
  text: 'Text content',
  bold: true,
  size: 24,  // 12pt (size is in half-points)
  font: 'Calibri',  // Add this for specific font
  color: '000000',   // Add this for color (hex)
})
```

#### Change Spacing

```typescript
new Paragraph({
  text: 'Content',
  spacing: {
    before: 200,  // Space before (in twentieths of a point)
    after: 100,   // Space after
  },
})
```

#### Change Margins

Line ~27:
```typescript
margin: {
  top: convertInchesToTwip(0.5),     // 0.5 inch
  right: convertInchesToTwip(0.75),  // 0.75 inch
  bottom: convertInchesToTwip(0.5),
  left: convertInchesToTwip(0.75),
}
```

---

### Method 2: Use Your Own Template

If you have a specific .docx template you want to use:

**Option A: docxtemplater (Template-based)**

1. Install library:
```bash
npm install docxtemplater pizzip
```

2. Create template with placeholders:
```
{{name}}
{{headline}}
{{#education}}
  {{institution}} - {{degree}}
{{/education}}
```

3. Use template:
```typescript
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import fs from 'fs'

const template = fs.readFileSync('path/to/template.docx')
const zip = new PizZip(template)
const doc = new Docxtemplater(zip)

doc.render({
  name: cv.profile.name,
  headline: cv.profile.headline,
  education: cv.education,
  // ... more data
})

const buffer = doc.getZip().generate({ type: 'nodebuffer' })
```

---

## 📋 To Use Your Own CV Template

### Step 1: Share Your Template

You can share your template in 3 ways:

**Option 1: Upload Template File**
```
Place your template in: public/cv-templates/default.docx
```

**Option 2: Describe the Format**
Tell me:
- Section order you want
- Font preferences (e.g., Arial 11pt)
- Spacing preferences (tight, normal, spacious)
- Special formatting (bold titles, italic dates, etc.)
- Color scheme (if any)

**Option 3: Screenshot**
Share a screenshot of your ideal CV layout

---

## 🎯 Current Export Features

### What Works Now

✅ **One-Click Download**
```typescript
// In chat, when CV is 60%+ complete:
[Download CV Button]
→ Generates and downloads CV_Alexander_Simon_K.docx
```

✅ **Fully Editable**
- Students can open in Word/Google Docs
- Edit any section
- Adjust formatting
- Add/remove content

✅ **Professional Format**
- Clean, ATS-friendly layout
- Clear section headers
- Bullet points for achievements
- Proper spacing and margins

✅ **Smart Content**
- Only includes sections with data
- Highlights relevant skills
- Orders by relevance (for custom CVs)
- Includes metrics and achievements

---

## 📦 API Endpoints

### Download Generic CV
```bash
GET /api/cv/export/docx
→ Returns: CV_FirstName_LastName.docx
```

### Download Custom CV for Opportunity
```bash
POST /api/cv/export/docx
Body: {
  "opportunityId": "ext_opp_123",
  "opportunityType": "external"
}
→ Returns: CV_FirstName_LastName_OpportunityTitle.docx
```

---

## 🎨 Recommended Template Formats

### Format 1: Classic Professional (Current)
- Times New Roman or Calibri
- Black text only
- Section headers with underline
- Bullet points for achievements
- **Best for:** Traditional industries (finance, consulting, law)

### Format 2: Modern Minimal
- Sans-serif font (Arial, Helvetica)
- Subtle color accents
- Clean section dividers
- **Best for:** Tech, startups, creative roles

### Format 3: Academic
- Detailed education section first
- Publications and research
- Conference presentations
- **Best for:** Research roles, PhD applications

---

## 💡 Next Steps

### To Customize Your Template:

**Option 1: Quick Tweaks**
- Tell me specific changes (fonts, spacing, order)
- I'll update `cv-word-export.ts`

**Option 2: Use Your Own Template**
- Share your template file or screenshot
- I'll adapt the code to match your format exactly

**Option 3: Multiple Templates**
- We can create several templates
- Let students choose their preferred style
- Different templates for different industries

---

## 🧪 Test the Export

Once deployed (2-3 minutes):

1. **Build your CV through chat** (60%+ completeness)
2. **Click "Download CV"** button in progress bar
3. **Open the .docx file** in Word/Google Docs
4. **Edit as needed** and apply!

---

## 📝 What Gets Exported

### Mandatory Sections (Always Included)
- Name and contact info
- Education
- Skills

### Optional Sections (Only If Data Exists)
- Professional Summary
- Work Experience
- Projects
- Certifications
- Languages
- Leadership & Achievements

### Smart Features
- **Metrics preserved**: "Reduced by 40%" stays quantified
- **Dates formatted**: "Jun 2024 - Aug 2024"
- **Bullet points**: Clean, scannable format
- **ATS-friendly**: No tables, images, or complex formatting

---

## 🎉 Ready to Use!

The Word export is **fully functional**. Tell me what template format you prefer and I'll customize it!

**Want me to:**
1. Analyze a screenshot of your ideal CV layout?
2. Match a specific company's CV format?
3. Create multiple template options?

Just share your preferred format and I'll adapt the system! 📄✨

