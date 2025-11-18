import OpenAI from 'openai'

// Initialize OpenAI client with DeepSeek or OpenAI
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : undefined
})

const AI_MODEL = process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4'

export interface OpportunityCategorization {
  category: string[]
  matchKeywords: string[]
  industryTags: string[]
  skillsRequired: string[]
  educationMatch: string[]
  confidenceScore: number
}

export interface StudentProfile {
  major?: string
  university?: string
  fieldsOfInterest?: string[]
  skills?: string[]
  location?: string
  educationLevel?: string
  graduationYear?: number
}

export interface OpportunityData {
  title: string
  company: string
  description?: string
  location?: string
  aiCategory?: string[]
  aiMatchKeywords?: string[]
  aiEducationMatch?: string[]
  aiSkillsRequired?: string[]
  aiIndustryTags?: string[]
}

/**
 * Categorize an opportunity using AI
 */
export async function categorizeOpportunity(
  title: string,
  company: string,
  description?: string,
  location?: string
): Promise<OpportunityCategorization> {
  const prompt = `Analyze this internship/job opportunity and categorize it for student matching:

Title: ${title}
Company: ${company}
Location: ${location || 'Not specified'}
Description: ${description || 'N/A'}

Provide JSON output with:
1. category: Primary categories (e.g., ["Finance", "Banking", "Consulting"])
2. matchKeywords: Keywords for matching (e.g., ["investment", "wealth management", "private banking"])
3. industryTags: Industry classifications (e.g., ["Financial Services", "Professional Services"])
4. skillsRequired: Key skills needed (e.g., ["Excel", "Financial Analysis", "Communication"])
5. educationMatch: Relevant fields of study (e.g., ["Economics", "Finance", "Business"])
6. confidenceScore: Confidence level (0-1)

IMPORTANT RULES:
- For Finance/Banking roles, always include economics, finance, business in educationMatch
- For Tech roles, include computer science, engineering, mathematics
- For Consulting roles, include business, economics, management
- For Marketing roles, include marketing, business, communications
- Be generous with educationMatch - students can learn!
- confidenceScore should be between 0.7-0.95 for most roles

Example Output:
{
  "category": ["Finance", "Banking"],
  "matchKeywords": ["investment banking", "financial analyst", "mergers acquisitions"],
  "industryTags": ["Financial Services", "Investment Banking"],
  "skillsRequired": ["Financial Modeling", "Excel", "Valuation"],
  "educationMatch": ["Finance", "Economics", "Business", "Accounting"],
  "confidenceScore": 0.92
}`

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
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
    
    // Ensure we have the required fields with defaults
    return {
      category: result.category || [],
      matchKeywords: result.matchKeywords || [],
      industryTags: result.industryTags || [],
      skillsRequired: result.skillsRequired || [],
      educationMatch: result.educationMatch || [],
      confidenceScore: result.confidenceScore || 0.75
    } as OpportunityCategorization
  } catch (error) {
    console.error('Error categorizing opportunity:', error)
    // Return default categorization if AI fails
    return {
      category: ['General'],
      matchKeywords: [title.toLowerCase()],
      industryTags: ['General'],
      skillsRequired: [],
      educationMatch: [],
      confidenceScore: 0.5
    }
  }
}

/**
 * Calculate match score between student profile and opportunity
 */
export function calculateMatchScore(
  student: StudentProfile,
  opportunity: OpportunityData
): {
  score: number
  reasons: string[]
  warnings: string[]
} {
  let score = 0
  const reasons: string[] = []
  const warnings: string[] = []

  // 1. Education/Major Match (40% weight)
  if (student.major && opportunity.aiEducationMatch && opportunity.aiEducationMatch.length > 0) {
    const majorLower = student.major.toLowerCase()
    const educationMatches = opportunity.aiEducationMatch.filter(field =>
      field.toLowerCase().includes(majorLower) ||
      majorLower.includes(field.toLowerCase())
    )
    
    if (educationMatches.length > 0) {
      score += 40
      reasons.push(`${student.major} matches this ${opportunity.aiCategory?.join('/')} role`)
    } else {
      // Partial match - still give some points
      score += 15
      warnings.push(`Your major may not directly match, but skills can transfer`)
    }
  } else {
    // No major or no categorization - give benefit of doubt
    score += 20
  }

  // 2. Field of Interest Match (30% weight)
  if (student.fieldsOfInterest && student.fieldsOfInterest.length > 0 && 
      opportunity.aiCategory && opportunity.aiCategory.length > 0) {
    const interestMatches = student.fieldsOfInterest.filter(interest =>
      opportunity.aiCategory!.some(cat =>
        cat.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(cat.toLowerCase())
      )
    )
    
    if (interestMatches.length > 0) {
      score += 30
      reasons.push(`Aligns with your interest in ${interestMatches.join(', ')}`)
    } else {
      // Check keywords for softer match
      const keywordMatches = student.fieldsOfInterest.filter(interest =>
        opportunity.aiMatchKeywords?.some(keyword =>
          keyword.toLowerCase().includes(interest.toLowerCase())
        )
      )
      if (keywordMatches.length > 0) {
        score += 15
        reasons.push(`Related to your interests`)
      } else {
        score += 5
      }
    }
  } else {
    score += 15
  }

  // 3. Skills Match (20% weight)
  if (student.skills && student.skills.length > 0 && 
      opportunity.aiSkillsRequired && opportunity.aiSkillsRequired.length > 0) {
    const skillMatches = student.skills.filter(skill =>
      opportunity.aiSkillsRequired!.some(req =>
        req.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(req.toLowerCase())
      )
    )
    
    if (skillMatches.length > 0) {
      const skillScore = Math.min(20, (skillMatches.length / opportunity.aiSkillsRequired.length) * 20)
      score += skillScore
      reasons.push(`${skillMatches.length} of your skills match`)
    } else {
      score += 5
      warnings.push(`May need to develop new skills`)
    }
  } else {
    score += 10
  }

  // 4. Location Match (10% weight)
  if (student.location && opportunity.location) {
    const studentLoc = student.location.toLowerCase()
    const oppLoc = opportunity.location.toLowerCase()
    
    if (oppLoc.includes(studentLoc) || studentLoc.includes(oppLoc)) {
      score += 10
      reasons.push(`Location matches: ${opportunity.location}`)
    } else if (oppLoc.includes('remote') || oppLoc.includes('hybrid')) {
      score += 10
      reasons.push('Remote/Hybrid work available')
    } else {
      score += 3
      warnings.push(`Location: ${opportunity.location}`)
    }
  } else {
    score += 5
  }

  // Ensure score is within 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  // Ensure we always have at least one reason
  if (reasons.length === 0) {
    reasons.push('New opportunity available')
  }

  return {
    score,
    reasons,
    warnings
  }
}

/**
 * Batch categorize multiple opportunities
 */
export async function batchCategorizeOpportunities(
  opportunities: Array<{
    id: string
    title: string
    company: string
    description?: string
    location?: string
  }>,
  onProgress?: (current: number, total: number, title: string) => void
): Promise<Array<{
  id: string
  categorization: OpportunityCategorization
  success: boolean
  error?: string
}>> {
  const results = []
  
  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i]
    
    if (onProgress) {
      onProgress(i + 1, opportunities.length, opp.title)
    }

    try {
      const categorization = await categorizeOpportunity(
        opp.title,
        opp.company,
        opp.description,
        opp.location
      )
      
      results.push({
        id: opp.id,
        categorization,
        success: true
      })
    } catch (error) {
      results.push({
        id: opp.id,
        categorization: {
          category: [],
          matchKeywords: [],
          industryTags: [],
          skillsRequired: [],
          educationMatch: [],
          confidenceScore: 0
        },
        success: false,
        error: (error as Error).message
      })
    }

    // Small delay to avoid rate limiting
    if (i < opportunities.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

