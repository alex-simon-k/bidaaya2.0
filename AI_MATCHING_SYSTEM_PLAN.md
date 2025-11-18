# AI-Powered Smart Matching System Implementation Plan

## Overview
Implement intelligent opportunity matching using GPT/DeepSeek API to match students with opportunities based on their:
- Major/Field of Study (e.g., Economics → Finance/Banking roles)
- Fields of Interest (e.g., Consulting, Engineering)
- Location preferences
- Experience level

---

## Phase 1: Database Schema Enhancement

### Add to `ExternalOpportunity` Model:
```prisma
model ExternalOpportunity {
  // ... existing fields ...
  
  // AI-Generated Categorization Fields
  aiCategory          String[]  @default([])  // ["Finance", "Banking", "Investment"]
  aiMatchKeywords     String[]  @default([])  // Keywords for matching
  aiIndustryTags      String[]  @default([])  // Industry classifications
  aiSkillsRequired    String[]  @default([])  // Required skills
  aiEducationMatch    String[]  @default([])  // Matching education fields
  aiConfidenceScore   Float?                  // AI confidence (0-1)
  aiLastCategorized   DateTime?               // When last categorized
  
  @@index([aiCategory])
  @@index([aiMatchKeywords])
}
```

---

## Phase 2: AI Categorization Service

### File: `src/lib/ai-opportunity-matcher.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : undefined
})

interface OpportunityCategorization {
  category: string[]
  matchKeywords: string[]
  industryTags: string[]
  skillsRequired: string[]
  educationMatch: string[]
  confidenceScore: number
}

export async function categorizeOpportunity(
  title: string,
  company: string,
  description?: string
): Promise<OpportunityCategorization> {
  const prompt = `Analyze this job opportunity and categorize it for student matching:

Title: ${title}
Company: ${company}
Description: ${description || 'N/A'}

Provide JSON output with:
1. category: Primary categories (e.g., ["Finance", "Banking", "Consulting"])
2. matchKeywords: Keywords for matching (e.g., ["investment", "wealth management", "private banking"])
3. industryTags: Industry classifications (e.g., ["Financial Services", "Professional Services"])
4. skillsRequired: Key skills needed (e.g., ["Excel", "Financial Analysis", "Communication"])
5. educationMatch: Relevant fields of study (e.g., ["Economics", "Finance", "Business"])
6. confidenceScore: Confidence level (0-1)

Example Output:
{
  "category": ["Finance", "Banking"],
  "matchKeywords": ["investment banking", "financial analyst", "mergers acquisitions"],
  "industryTags": ["Financial Services", "Investment Banking"],
  "skillsRequired": ["Financial Modeling", "Excel", "Valuation"],
  "educationMatch": ["Finance", "Economics", "Business", "Accounting"],
  "confidenceScore": 0.92
}`

  const response = await openai.chat.completions.create({
    model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert job categorization assistant. Analyze job opportunities and provide structured categorization for student matching. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return result as OpportunityCategorization
}

export async function calculateMatchScore(
  studentProfile: {
    major?: string
    fieldsOfInterest?: string[]
    skills?: string[]
    location?: string
  },
  opportunity: {
    aiCategory?: string[]
    aiMatchKeywords?: string[]
    aiEducationMatch?: string[]
    aiSkillsRequired?: string[]
    location?: string
  }
): Promise<number> {
  let score = 0
  let factors = 0

  // Match major/education (40% weight)
  if (studentProfile.major && opportunity.aiEducationMatch) {
    const majorMatch = opportunity.aiEducationMatch.some(field =>
      field.toLowerCase().includes(studentProfile.major!.toLowerCase()) ||
      studentProfile.major!.toLowerCase().includes(field.toLowerCase())
    )
    if (majorMatch) score += 40
    factors++
  }

  // Match interests (30% weight)
  if (studentProfile.fieldsOfInterest && opportunity.aiCategory) {
    const interestMatch = studentProfile.fieldsOfInterest.some(interest =>
      opportunity.aiCategory!.some(cat =>
        cat.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(cat.toLowerCase())
      )
    )
    if (interestMatch) score += 30
    factors++
  }

  // Match skills (20% weight)
  if (studentProfile.skills && opportunity.aiSkillsRequired) {
    const skillMatches = studentProfile.skills.filter(skill =>
      opportunity.aiSkillsRequired!.some(req =>
        req.toLowerCase().includes(skill.toLowerCase())
      )
    )
    const skillScore = (skillMatches.length / opportunity.aiSkillsRequired.length) * 20
    score += skillScore
    factors++
  }

  // Match location (10% weight)
  if (studentProfile.location && opportunity.location) {
    const locationMatch = opportunity.location.toLowerCase().includes(studentProfile.location.toLowerCase())
    if (locationMatch) score += 10
    factors++
  }

  return Math.round(score)
}
```

---

## Phase 3: Admin Categorization Tool

### File: `src/app/admin/categorize-opportunities/page.tsx`

Create a new admin page with:
1. **"Categorize All Uncategorized"** button - Processes all opportunities without AI categorization
2. **"Re-categorize All"** button - Re-processes all opportunities
3. Progress bar showing categorization status
4. Preview of categorizations

### API Endpoint: `src/app/api/admin/categorize-opportunities/route.ts`

```typescript
import { categorizeOpportunity } from '@/lib/ai-opportunity-matcher'

export async function POST(request: NextRequest) {
  // Admin auth check...
  
  const { mode } = await request.json() // 'uncategorized' or 'all'
  
  const opportunities = await prisma.externalOpportunity.findMany({
    where: mode === 'uncategorized' ? {
      aiLastCategorized: null
    } : {},
    take: 100 // Process in batches
  })

  const results = []
  for (const opp of opportunities) {
    try {
      const categorization = await categorizeOpportunity(
        opp.title,
        opp.company,
        opp.description
      )

      await prisma.externalOpportunity.update({
        where: { id: opp.id },
        data: {
          aiCategory: categorization.category,
          aiMatchKeywords: categorization.matchKeywords,
          aiIndustryTags: categorization.industryTags,
          aiSkillsRequired: categorization.skillsRequired,
          aiEducationMatch: categorization.educationMatch,
          aiConfidenceScore: categorization.confidenceScore,
          aiLastCategorized: new Date()
        }
      })

      results.push({ id: opp.id, title: opp.title, success: true })
    } catch (error) {
      results.push({ id: opp.id, title: opp.title, success: false, error })
    }
  }

  return NextResponse.json({ results, total: opportunities.length })
}
```

---

## Phase 4: Auto-Categorize on Upload

### Update CSV Upload Route

In `src/app/api/admin/external-opportunities/csv-upload/route.ts`:

```typescript
import { categorizeOpportunity } from '@/lib/ai-opportunity-matcher'

// After creating opportunities...
for (const createdOpp of createdOpportunities) {
  try {
    const categorization = await categorizeOpportunity(
      createdOpp.title,
      createdOpp.company,
      createdOpp.description
    )

    await prisma.externalOpportunity.update({
      where: { id: createdOpp.id },
      data: {
        aiCategory: categorization.category,
        aiMatchKeywords: categorization.matchKeywords,
        // ... other fields
        aiLastCategorized: new Date()
      }
    })
  } catch (error) {
    console.error(`Failed to categorize ${createdOpp.id}:`, error)
    // Continue even if categorization fails
  }
}
```

---

## Phase 5: Smart Dashboard Matching

### Update Dashboard API: `src/app/api/opportunities/dashboard-simple/route.ts`

```typescript
import { calculateMatchScore } from '@/lib/ai-opportunity-matcher'

// After fetching opportunities...
const scoredOpportunities = await Promise.all(
  regularOpps.map(async (opp) => {
    const score = await calculateMatchScore(
      {
        major: user.major,
        fieldsOfInterest: user.interests,
        skills: user.skills,
        location: user.location
      },
      {
        aiCategory: opp.aiCategory,
        aiMatchKeywords: opp.aiMatchKeywords,
        aiEducationMatch: opp.aiEducationMatch,
        aiSkillsRequired: opp.aiSkillsRequired,
        location: opp.location
      }
    )

    return {
      ...opp,
      matchScore: score
    }
  })
)

// Sort by match score
const sortedOpportunities = scoredOpportunities.sort((a, b) => b.matchScore - a.matchScore)
```

---

## Implementation Strategy

### Option A: Pre-categorize (Recommended)
✅ **Pros:**
- Fast dashboard loading
- Lower API costs
- Better user experience

❌ **Cons:**
- Batch processing needed
- Initial categorization takes time

### Option B: Real-time Matching
✅ **Pros:**
- Always up-to-date
- No batch processing needed

❌ **Cons:**
- Slower dashboard loading
- Higher API costs
- Complex caching needed

---

## Cost Estimation

### Using GPT-4:
- ~500 tokens per categorization
- 327 opportunities ×$0.01 per 1K tokens = ~$1.64
- Monthly new opportunities: ~100 × $0.50 = **~$2-3/month**

### Using DeepSeek:
- Same token usage
- 20x cheaper
- **~$0.10-0.15/month**

---

## Next Steps

1. ✅ Run Prisma migration to add AI fields
2. ✅ Implement `ai-opportunity-matcher.ts` service
3. ✅ Create admin categorization page
4. ✅ Update CSV upload to auto-categorize
5. ✅ Integrate matching into dashboard
6. ✅ Test with sample opportunities

---

## Field of Interest Dropdown Fix

### Update Profile Page
The scrolling issue is likely in the profile page modal/dropdown. Need to:

```css
/* In the modal/dropdown container */
.fields-of-interest-modal {
  max-height: 60vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* OR use a proper Select component with virtualization */
```

Update the component to use a scrollable container with proper overflow handling.

