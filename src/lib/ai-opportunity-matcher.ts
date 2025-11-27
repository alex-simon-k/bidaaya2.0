/**
 * AI-Powered Opportunity Matching System
 * Uses DeepSeek API to intelligently match opportunities to student profiles
 */

interface StudentProfile {
  skills: string[]
  interests: string[]
  major?: string | null
  education?: string | null
  goal: string[]
  fieldOfInterest?: string // Tech, Business, Marketing, Design, Finance, Consulting, Engineering
  cvSkills?: Array<{ skillName: string }>
  cvEducation?: Array<{ degreeType: string; degreeTitle: string; fieldOfStudy: string; institution: string }>
  cvExperience?: Array<{ title: string; employer: string; location?: string | null; summary?: string | null }>
}

interface Opportunity {
  id: string
  title: string
  company: string
  description?: string | null
  category?: string | null
  location?: string | null
}

interface AIMatchResult {
  matchScore: number // 0-100
  matchReasons: string[]
  fieldAlignment: number // How well it aligns with their field of interest (0-100)
  careerRelevance: number // How relevant to their career goals (0-100)
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

/**
 * Use AI to calculate a smart match score
 */
export async function calculateAIMatchScore(
  student: StudentProfile,
  opportunity: Opportunity
): Promise<AIMatchResult> {
  
  // Build student profile summary
  const studentSummary = buildStudentSummary(student)
  
  // Build opportunity summary
  const opportunitySummary = `
Title: ${opportunity.title}
Company: ${opportunity.company}
Location: ${opportunity.location || 'Not specified'}
Description: ${opportunity.description || 'No description available'}
Category: ${opportunity.category || 'General'}
`.trim()

  // Build the prompt
  const prompt = `You are an expert career advisor analyzing job opportunities for students.

STUDENT PROFILE:
${studentSummary}

OPPORTUNITY:
${opportunitySummary}

TASK:
Analyze how well this opportunity matches the student's profile. Consider:
1. Skills alignment (do they have relevant skills?)
2. Field of interest alignment (does it match their chosen field?)
3. Career goals alignment (does it help them reach their goals?)
4. Education/major relevance
5. Experience level appropriateness

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "matchScore": <number 0-100>,
  "matchReasons": [<array of 2-4 specific reasons as strings>],
  "fieldAlignment": <number 0-100>,
  "careerRelevance": <number 0-100>
}

Be realistic - not everything is a 90+ match. Use the full 0-100 scale.`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10-second timeout

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a career matching expert. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent scoring
        max_tokens: 500,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('❌ DeepSeek API error:', response.status, response.statusText)
      return fallbackMatchScore(student, opportunity)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error('❌ No content in DeepSeek response')
      return fallbackMatchScore(student, opportunity)
    }

    // Parse JSON (handle potential markdown wrapping)
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    const result = JSON.parse(jsonContent) as AIMatchResult

    // Validate result
    if (
      typeof result.matchScore !== 'number' ||
      !Array.isArray(result.matchReasons) ||
      typeof result.fieldAlignment !== 'number' ||
      typeof result.careerRelevance !== 'number'
    ) {
      console.error('❌ Invalid AI match result structure:', result)
      return fallbackMatchScore(student, opportunity)
    }

    console.log(`✅ AI Match Score for "${opportunity.title}": ${result.matchScore}%`)
    
    return result

  } catch (error: any) {
    console.error('❌ AI matching error:', error.message)
    return fallbackMatchScore(student, opportunity)
  }
}

/**
 * Build a concise student profile summary for the AI
 */
function buildStudentSummary(student: StudentProfile): string {
  const parts: string[] = []

  // Field of Interest
  if (student.fieldOfInterest) {
    parts.push(`Field of Interest: ${student.fieldOfInterest}`)
  }

  // Education
  if (student.major) {
    parts.push(`Major: ${student.major}`)
  }
  if (student.education) {
    parts.push(`Education Level: ${student.education}`)
  }
  if (student.cvEducation && student.cvEducation.length > 0) {
    const degrees = student.cvEducation.map(e => `${e.degreeType} in ${e.fieldOfStudy} from ${e.institution}`).join(', ')
    parts.push(`Degrees: ${degrees}`)
  }

  // Skills
  const allSkills = [
    ...student.skills,
    ...(student.cvSkills?.map(s => s.skillName) || []),
  ].filter(Boolean)
  if (allSkills.length > 0) {
    parts.push(`Skills: ${allSkills.slice(0, 15).join(', ')}`)
  }

  // Interests
  if (student.interests.length > 0) {
    parts.push(`Interests: ${student.interests.join(', ')}`)
  }

  // Experience
  if (student.cvExperience && student.cvExperience.length > 0) {
    const experiences = student.cvExperience.map(e => `${e.title} at ${e.employer}`).join(', ')
    parts.push(`Experience: ${experiences}`)
  }

  // Goals
  if (student.goal.length > 0) {
    parts.push(`Career Goals: ${student.goal.join(', ')}`)
  }

  return parts.join('\n')
}

/**
 * Fallback to rule-based matching if AI fails
 */
function fallbackMatchScore(student: StudentProfile, opportunity: Opportunity): AIMatchResult {
  let score = 50 // Start at 50 as baseline
  const reasons: string[] = []

  const normalize = (str: string) => str.toLowerCase().trim()
  const oppText = normalize(`${opportunity.title} ${opportunity.company} ${opportunity.description || ''}`)

  // Check skills
  const allSkills = [
    ...student.skills,
    ...(student.cvSkills?.map(s => s.skillName) || []),
  ]
  const skillMatches = allSkills.filter(skill => oppText.includes(normalize(skill)))
  if (skillMatches.length > 0) {
    score += Math.min(20, skillMatches.length * 5)
    reasons.push(`${skillMatches.length} skill${skillMatches.length > 1 ? 's' : ''} match`)
  }

  // Check interests
  const interestMatches = student.interests.filter(interest => oppText.includes(normalize(interest)))
  if (interestMatches.length > 0) {
    score += Math.min(15, interestMatches.length * 5)
    reasons.push(`Matches your interests`)
  }

  // Check field of interest
  let fieldAlignment = 50
  if (student.fieldOfInterest && oppText.includes(normalize(student.fieldOfInterest))) {
    score += 15
    fieldAlignment = 85
    reasons.push(`Aligns with ${student.fieldOfInterest} field`)
  }

  // Check major
  if (student.major && oppText.includes(normalize(student.major))) {
    score += 10
    reasons.push(`Relevant to your major`)
  }

  if (reasons.length === 0) {
    reasons.push('General career opportunity')
  }

  return {
    matchScore: Math.min(100, Math.max(0, Math.round(score))),
    matchReasons: reasons,
    fieldAlignment,
    careerRelevance: score,
  }
}

/**
 * Batch score multiple opportunities (with caching and rate limiting)
 */
export async function batchScoreOpportunities(
  student: StudentProfile,
  opportunities: Opportunity[],
  maxConcurrent: number = 3
): Promise<Map<string, AIMatchResult>> {
  const results = new Map<string, AIMatchResult>()

  // Process in batches to avoid rate limits
  for (let i = 0; i < opportunities.length; i += maxConcurrent) {
    const batch = opportunities.slice(i, i + maxConcurrent)
    
    const batchResults = await Promise.all(
      batch.map(async (opp) => {
        const result = await calculateAIMatchScore(student, opp)
        return { id: opp.id, result }
      })
    )

    batchResults.forEach(({ id, result }) => {
      results.set(id, result)
    })

    // Small delay between batches
    if (i + maxConcurrent < opportunities.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}

/**
 * Filter opportunities by field of interest
 */
export function filterByField(
  opportunities: Opportunity[],
  fieldOfInterest: string
): Opportunity[] {
  if (!fieldOfInterest || fieldOfInterest === 'Best For You') {
    return opportunities // No filtering
  }

  const normalize = (str: string) => str.toLowerCase().trim()
  const field = normalize(fieldOfInterest)

  return opportunities.filter(opp => {
    const oppText = normalize(`${opp.title} ${opp.company} ${opp.description || ''} ${opp.category || ''}`)
    return oppText.includes(field)
  })
}
