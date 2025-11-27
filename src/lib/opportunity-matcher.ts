/**
 * Opportunity Matching Algorithm
 * Scores how well an opportunity matches a student's profile
 */

interface StudentProfile {
  skills: string[]
  interests: string[]
  major?: string | null
  education?: string | null
  goal: string[]
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
  addedAt: Date
  
  // AI fields
  aiCategory: string[]
  aiMatchKeywords: string[]
  aiSkillsRequired: string[]
  aiEducationMatch: string[]
  aiIndustryTags: string[]
  
  // Manual fields
  requiredDegrees: string[]
  preferredMajors: string[]
  requiredSkills: string[]
  industries: string[]
  matchingTags: string[]
}

interface ScoredOpportunity extends Opportunity {
  matchScore: number
  matchReasons: string[]
}

/**
 * Calculate match score between student and opportunity (0-100)
 */
export function calculateMatchScore(
  student: StudentProfile,
  opportunity: Opportunity
): ScoredOpportunity {
  let score = 0
  const matchReasons: string[] = []
  const maxScore = 100

  // Normalize strings for comparison
  const normalize = (str: string) => str.toLowerCase().trim()
  const normalizeArray = (arr: string[]) => arr.map(normalize)

  // Combine all student data
  const studentSkills = normalizeArray([
    ...student.skills,
    ...(student.cvSkills?.map(s => s.skillName) || []),
  ])
  
  const studentInterests = normalizeArray(student.interests)
  
  const studentEducation = normalizeArray([
    student.major || '',
    student.education || '',
    ...(student.cvEducation?.map(e => e.fieldOfStudy) || []),
    ...(student.cvEducation?.map(e => e.degreeType) || []),
    ...(student.cvEducation?.map(e => e.degreeTitle) || []),
    ...(student.cvEducation?.map(e => e.institution) || []),
  ]).filter(Boolean)

  const studentExperience = normalizeArray([
    ...(student.cvExperience?.map(e => e.title) || []),
    ...(student.cvExperience?.map(e => e.employer) || []),
  ])

  // Opportunity data
  const oppSkills = normalizeArray([
    ...opportunity.aiSkillsRequired,
    ...opportunity.requiredSkills,
    ...opportunity.aiMatchKeywords,
  ])

  const oppCategories = normalizeArray([
    ...opportunity.aiCategory,
    ...opportunity.industries,
    ...opportunity.aiIndustryTags,
    opportunity.category || '',
  ]).filter(Boolean)

  const oppEducation = normalizeArray([
    ...opportunity.aiEducationMatch,
    ...opportunity.requiredDegrees,
    ...opportunity.preferredMajors,
  ])

  const oppKeywords = normalizeArray([
    ...opportunity.matchingTags,
    ...opportunity.aiMatchKeywords,
  ])

  // Text content for semantic matching
  const oppText = normalize([
    opportunity.title,
    opportunity.company,
    opportunity.description || '',
  ].join(' '))

  // 1. Skills Match (35 points)
  const skillMatches = studentSkills.filter(skill => 
    oppSkills.some(oppSkill => 
      oppSkill.includes(skill) || skill.includes(oppSkill)
    ) || oppText.includes(skill)
  )
  
  if (skillMatches.length > 0) {
    const skillScore = Math.min(35, skillMatches.length * 12)
    score += skillScore
    matchReasons.push(`${skillMatches.length} skill${skillMatches.length > 1 ? 's' : ''} match`)
  }

  // 2. Interest/Category Match (25 points)
  const interestMatches = studentInterests.filter(interest =>
    oppCategories.some(cat => 
      cat.includes(interest) || interest.includes(cat)
    ) || oppText.includes(interest)
  )
  
  if (interestMatches.length > 0) {
    const interestScore = Math.min(25, interestMatches.length * 13)
    score += interestScore
    matchReasons.push(`${interestMatches.length} interest${interestMatches.length > 1 ? 's' : ''} match`)
  }

  // 3. Education Match (20 points)
  const educationMatches = studentEducation.filter(edu =>
    oppEducation.some(oppEdu => 
      oppEdu.includes(edu) || edu.includes(oppEdu)
    ) || oppText.includes(edu)
  )
  
  if (educationMatches.length > 0) {
    const eduScore = Math.min(20, educationMatches.length * 10)
    score += eduScore
    matchReasons.push(`Education background matches`)
  }

  // 4. Experience/Keyword Match (10 points)
  const experienceMatches = studentExperience.filter(exp =>
    oppKeywords.some(keyword => 
      keyword.includes(exp) || exp.includes(keyword)
    ) || oppText.includes(exp)
  )
  
  if (experienceMatches.length > 0) {
    const expScore = Math.min(10, experienceMatches.length * 5)
    score += expScore
    matchReasons.push(`Related experience`)
  }

  // 5. Recency Bonus (10 points)
  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(opportunity.addedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysSinceAdded <= 7) {
    const recencyScore = 10 - daysSinceAdded
    score += recencyScore
    if (daysSinceAdded <= 2) {
      matchReasons.push(`Posted recently`)
    }
  }

  // Ensure score is between 0-100
  score = Math.min(maxScore, Math.max(0, score))

  // If no matches found, give a baseline score
  if (matchReasons.length === 0) {
    score = 30 // Baseline score
    matchReasons.push('General opportunity')
    
    // Debug logging to understand why no matches
    console.log(`⚠️ No matches for "${opportunity.title}":`)
    console.log(`  Student skills: ${studentSkills.slice(0, 5).join(', ')}...`)
    console.log(`  Student interests: ${studentInterests.slice(0, 5).join(', ')}...`)
    console.log(`  Opp text: ${oppText.substring(0, 100)}...`)
  }

  return {
    ...opportunity,
    matchScore: Math.round(score),
    matchReasons,
  }
}

/**
 * Get top N opportunities for a student
 */
export function rankOpportunities(
  student: StudentProfile,
  opportunities: Opportunity[],
  topN: number = 10
): ScoredOpportunity[] {
  // Score all opportunities
  const scored = opportunities.map(opp => calculateMatchScore(student, opp))

  // Sort by match score (descending)
  scored.sort((a, b) => b.matchScore - a.matchScore)

  // Return top N
  return scored.slice(0, topN)
}

/**
 * Get daily picks: 1 early access (if available) + 2 regular
 */
export function selectDailyPicks(
  student: StudentProfile,
  allOpportunities: Opportunity[],
  appliedIds: string[]
): {
  earlyAccess: ScoredOpportunity | null
  regular: ScoredOpportunity[]
} {
  // Filter out already applied
  const available = allOpportunities.filter(opp => !appliedIds.includes(opp.id))

  // Score all available opportunities
  const scored = rankOpportunities(student, available, 50)

  // Separate early access and regular
  const earlyAccessOpps = scored.filter(opp => {
    const isNew = (opp as any).isNewOpportunity === true
    const hasEarlyAccess = (opp as any).earlyAccessUntil && new Date((opp as any).earlyAccessUntil) > new Date()
    return isNew && hasEarlyAccess
  })

  const regularOpps = scored.filter(opp => {
    const isNew = (opp as any).isNewOpportunity === true
    const hasEarlyAccess = (opp as any).earlyAccessUntil && new Date((opp as any).earlyAccessUntil) > new Date()
    return !(isNew && hasEarlyAccess)
  })

  // Pick top early access (if available)
  const earlyAccess = earlyAccessOpps.length > 0 ? earlyAccessOpps[0] : null

  // Pick top 2 regular opportunities
  const regular = regularOpps.slice(0, 2)

  return {
    earlyAccess,
    regular,
  }
}

