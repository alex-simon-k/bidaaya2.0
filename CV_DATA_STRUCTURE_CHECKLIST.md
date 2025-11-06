# CV Data Structure Checklist

## Overview
This document defines every data point we need to capture for a complete CV, categorizing fields as **RIGID** (fixed format, dropdowns, validation) or **FLEXIBLE** (free text, arrays).

---

## 1. Identity & Contact ✅ REQUIRED

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| First Name | Text | **RIGID** | Required, 2-50 chars | No special chars |
| Middle Name | Text | FLEXIBLE | Optional | - |
| Last Name | Text | **RIGID** | Required, 2-50 chars | No special chars |
| Email | Email | **RIGID** | Required, valid format | Professional preferred |
| Phone | Phone | **RIGID** | Required, E.164 format | +[country][number] |
| City | Text | FLEXIBLE | Optional but recommended | Free text |
| Country | Dropdown | **RIGID** | Required, ISO-3166-1 alpha-2 | 2-letter code |
| LinkedIn URL | URL | **RIGID** | Optional, must be linkedin.com | Validate domain |
| Portfolio URL | URL | FLEXIBLE | Optional, any valid URL | - |
| GitHub URL | URL | **RIGID** | Optional, must be github.com | Validate domain |

### Implementation Status
- ❌ Not yet implemented
- 📝 TODO: Create profile info form

---

## 2. Education 📚 MULTI-ENTRY (min 1 required)

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| Institution | Dropdown + Custom | **RIGID** | Required, exact name | Searchable dropdown with fallback |
| Country | Dropdown | **RIGID** | Required, ISO-3166-1 alpha-2 | 2-letter code |
| Level | Dropdown | **RIGID** | Required | High_School, Foundation, Bachelor, Master, PhD, Other |
| Program/Degree | Text | **RIGID** | Required | e.g., "BSc Economics" |
| Major(s) | Array | FLEXIBLE | Optional, max 3 | Free text tags |
| Minor(s) | Array | FLEXIBLE | Optional, max 2 | Free text tags |
| Start Date | Date | **RIGID** | Required, YYYY-MM | Month picker |
| End Date | Date | **RIGID** | YYYY-MM or Expected | "Currently studying" checkbox |
| GPA/Grade | Composite | FLEXIBLE | Optional | Value + scale OR percentage |
| Predicted Grade | Text | FLEXIBLE | Optional | Free text |
| Key Modules | Array | FLEXIBLE | Optional, max 6 | Comma-separated or tags |
| Awards/Scholarships | Array | FLEXIBLE | Optional | Free text array |

### Implementation Status
- ✅ **COMPLETED** - `StructuredCVEducationForm` created
- ⚠️ **NEEDS UPDATE**: 
  - Add Country dropdown (ISO-2)
  - Change degreeType to match enum (High_School, Foundation, Bachelor, Master, PhD, Other)
  - Add Major/Minor arrays
  - Improve GPA input (value + scale)

---

## 3. Experience 💼 MULTI-ENTRY (shell only)

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| Organization | Text | **RIGID** | Required, legal name | Company search/autocomplete |
| Role Title | Text | **RIGID** | Required | e.g., "Software Engineering Intern" |
| Employment Type | Dropdown | **RIGID** | Required | Internship, Part_time, Voluntary, Project, Freelance |
| Location Mode | Dropdown | **RIGID** | Required | On_site, Hybrid, Remote |
| City | Text | FLEXIBLE | Optional if Remote | Free text |
| Country | Dropdown | **RIGID** | ISO-2, optional if Remote | 2-letter code |
| Start Date | Date | **RIGID** | Required, YYYY-MM | Month picker |
| End Date | Date | **RIGID** | YYYY-MM or "Present" | "Currently working" checkbox |
| Hours per Week | Number | FLEXIBLE | Optional, 1-168 | Numeric input |

### Implementation Status
- ❌ Not yet implemented
- 📝 TODO: Create experience form
- 📝 TODO: Add location mode logic (hide city/country if Remote)

---

## 4. Projects 🚀 OPTIONAL MULTI-ENTRY

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| Project Title | Text | **RIGID** | Required | 3-100 chars |
| Context | Dropdown | **RIGID** | Required | Course, Personal, Competition, Research |
| Tools/Tech | Array | FLEXIBLE | Optional | Autocomplete from skills database |
| Start Date | Date | **RIGID** | Required, YYYY-MM | Month picker |
| End Date | Date | FLEXIBLE | Optional, YYYY-MM | "Ongoing" checkbox |

### Implementation Status
- ❌ Not yet implemented
- 📝 TODO: Create projects form
- 📝 TODO: Link to skills database for autocomplete

---

## 5. Extracurricular & Leadership 🏆 OPTIONAL MULTI-ENTRY

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| Organization/Club | Text | **RIGID** | Required | e.g., "Student Union" |
| Role/Title | Text | **RIGID** | Required | e.g., "President" |
| Start Date | Date | **RIGID** | Required, YYYY-MM | Month picker |
| End Date | Date | **RIGID** | YYYY-MM or "Present" | "Currently active" checkbox |
| Hours per Week | Number | FLEXIBLE | Optional, 1-168 | Numeric input |

### Implementation Status
- ❌ Not yet implemented
- 📝 TODO: Create extracurricular form

---

## 6. Skills ⚡ CONTROLLED VOCABULARY

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| Programming Languages | Array | **RIGID** | Controlled vocab | Python, JavaScript, Java, C++, etc. |
| Tools/Frameworks | Array | **RIGID** | Controlled vocab | React, Node.js, TensorFlow, etc. |
| Data/Analytics | Array | **RIGID** | Controlled vocab | Excel, SQL, Tableau, Power BI, etc. |
| Design/Productivity | Array | **RIGID** | Controlled vocab | Figma, Photoshop, Notion, etc. |
| Business/Finance | Array | **RIGID** | Controlled vocab | Financial Modeling, DCF, M&A, etc. |
| Proficiency Levels | Map | **RIGID** | skill → Basic/Intermediate/Advanced | For each selected skill |

### Implementation Status
- ❌ Not yet implemented
- 📝 TODO: Create skills form with categories
- 📝 TODO: Build controlled vocabulary database
- 📝 TODO: Add proficiency level selector per skill
- 💡 NOTE: Use existing `DataStandardizationService` as starting point

---

## 7. Languages 🌍 MULTI-ENTRY

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| Language | Dropdown | **RIGID** | Required, ISO 639-1 | English, Arabic, Spanish, etc. |
| Proficiency | Dropdown | **RIGID** | Required, CEFR A1–C2 | A1, A2, B1, B2, C1, C2 |

### Implementation Status
- ❌ Not yet implemented
- 📝 TODO: Create languages form
- 📝 TODO: Add ISO 639-1 language codes

---

## 8. Certifications 📜 VERY OPTIONAL

| Field | Type | Status | Validation | Notes |
|-------|------|--------|------------|-------|
| Name | Text | **RIGID** | Required | Certificate/certification name |
| Issuer | Text | FLEXIBLE | Optional | Organization name |
| Issue Date | Date | **RIGID** | YYYY-MM | Month picker |

### Implementation Status
- ✅ Partially exists in `CVCertification` schema
- 📝 TODO: Create certifications form

---

## Summary

### Rigid vs Flexible Breakdown

**RIGID Fields (Fixed format, dropdowns, validation):**
- Identity: First name, Last name, Email, Phone, Country, LinkedIn, GitHub
- Education: Institution, Country, Level, Program, Start/End dates
- Experience: Organization, Role, Employment type, Location mode, Country, Dates
- Projects: Title, Context, Dates
- Extracurricular: Organization, Role, Dates
- Skills: All categories (controlled vocabulary)
- Languages: Language, Proficiency
- Certifications: Name, Issue date

**FLEXIBLE Fields (Free text, arrays):**
- Identity: Middle name, City, Portfolio URL
- Education: Majors, Minors, GPA, Predicted grade, Modules, Awards
- Experience: City (if not remote), Hours per week
- Projects: Tools/Tech, End date
- Extracurricular: Hours per week
- Certifications: Issuer

### Priority Implementation Order

1. ✅ **Education form** (COMPLETED - needs updates)
2. ❌ **Profile info form** (Identity & Contact) - HIGH PRIORITY
3. ❌ **Experience form** - HIGH PRIORITY
4. ❌ **Skills form** (with controlled vocab) - MEDIUM PRIORITY
5. ❌ **Projects form** - MEDIUM PRIORITY
6. ❌ **Languages form** - LOW PRIORITY
7. ❌ **Extracurricular form** - LOW PRIORITY
8. ❌ **Certifications form** - VERY LOW PRIORITY

### Database Schema Alignment

All fields map to existing Prisma schema:
- `User` model → Identity & Contact
- `CVEducation` model → Education
- `CVExperience` model → Experience
- `CVProject` model → Projects
- `CVSkill` model → Skills
- `CVLanguage` model → Languages
- `CVCertification` model → Certifications
- `CVAchievement` model → Extracurricular & Leadership

### Next Steps

1. Update education form to match new spec
2. Create profile info form
3. Create experience form
4. Build controlled vocabulary for skills
5. Integrate all forms into wizard
6. Add validation and error handling
7. Test complete flow

