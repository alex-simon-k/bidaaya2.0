import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DeepSeek AI Configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

interface CompanySearchParams {
  prompt: string
  companyId: string
  tier: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'
  maxResults?: number
}

interface ParsedSearchIntent {
  requiredSkills: string[]
  preferredSkills: string[]
  experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR' | 'ANY'
  educationRequirements: string[]
  locationPreferences: string[]
  industryAlignment: string[]
  roleType: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  budgetRange?: string
  companySize?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE'
  remotePolicy?: 'REMOTE' | 'HYBRID' | 'ONSITE' | 'FLEXIBLE'
}

interface MatchScore {
  overallScore: number
  profileMatchScore: number
  engagementScore: number
  behavioralScore: number
  breakdown: {
    skillsAlignment: number
    experienceMatch: number
    educationMatch: number
    locationMatch: number
    interestAlignment: number
    responseLikelihood: number
  }
  insights: {
    explanation: string
    strengths: string[]
    concerns: string[]
    recommendedApproach: string
  }
}

export class AITalentMatcher {
  
  /**
   * Main entry point for AI-powered talent matching
   */
  static async searchTalent(params: CompanySearchParams) {
    const startTime = Date.now()
    
    try {
      console.log(`🔍 Starting AI talent search for company ${params.companyId}`)
      
      // 1. Parse the company's natural language prompt
      const parsedIntent = await this.parseSearchIntent(params.prompt)
      console.log('🧠 Parsed search intent:', parsedIntent)
      
      // 2. Create search record
      const search = await prisma.companySearch.create({
        data: {
          companyId: params.companyId,
          searchPrompt: params.prompt,
          parsedIntent: parsedIntent as any,
          requiredSkills: parsedIntent.requiredSkills,
          experienceLevel: parsedIntent.experienceLevel,
          educationReq: parsedIntent.educationRequirements,
          locationPref: parsedIntent.locationPreferences,
          industryFit: parsedIntent.industryAlignment,
          tier: params.tier,
          maxResults: this.getMaxResultsForTier(params.tier)
        }
      })
      
      // 3. Get candidate pool based on parsed intent
      const candidates = await this.getCandidatePool(parsedIntent)
      console.log(`👥 Found ${candidates.length} potential candidates`)
      
      // 4. Score each candidate using AI
      const matches: any[] = []
      const maxResults = params.maxResults || this.getMaxResultsForTier(params.tier)
      
      for (const candidate of candidates.slice(0, Math.min(50, maxResults * 3))) {
        const score = await this.calculateMatchScore(candidate, parsedIntent, search.id)
        
        if (score.overallScore >= this.getMinScoreForTier(params.tier)) {
          matches.push({
            searchId: search.id,
            studentId: candidate.id,
            overallScore: score.overallScore,
            profileMatchScore: score.profileMatchScore,
            engagementScore: score.engagementScore,
            behavioralScore: score.behavioralScore,
            skillsAlignment: score.breakdown.skillsAlignment,
            experienceMatch: score.breakdown.experienceMatch,
            educationMatch: score.breakdown.educationMatch,
            locationMatch: score.breakdown.locationMatch,
            interestAlignment: score.breakdown.interestAlignment,
            responselikelihood: score.breakdown.responseLikelihood,
            aiExplanation: score.insights.explanation,
            strengthsHighlight: score.insights.strengths,
            potentialConcerns: score.insights.concerns,
            recommendedApproach: score.insights.recommendedApproach,
            processingTime: Date.now() - startTime
          })
        }
      }
      
      // 5. Sort by score and limit results
      const topMatches = matches
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, maxResults)
      
      // 6. Save matches to database
      if (topMatches.length > 0) {
        await prisma.aIMatch.createMany({
          data: topMatches
        })
      }
      
      // 7. Update search with results count
      await prisma.companySearch.update({
        where: { id: search.id },
        data: { resultsCount: topMatches.length }
      })
      
      const totalTime = Date.now() - startTime
      console.log(`✅ AI search completed in ${totalTime}ms. Found ${topMatches.length} matches`)
      
      return {
        searchId: search.id,
        matches: topMatches,
        totalCandidatesEvaluated: candidates.length,
        processingTime: totalTime,
        parsedIntent
      }
      
    } catch (error) {
      console.error('❌ Error in AI talent search:', error)
      throw error
    }
  }
  
  /**
   * Parse company search prompt using DeepSeek AI
   */
  private static async parseSearchIntent(prompt: string): Promise<ParsedSearchIntent> {
    try {
      const systemPrompt = `You are an expert recruitment AI. Parse the following company search prompt and extract structured hiring requirements.

Return ONLY valid JSON with this exact structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "experienceLevel": "JUNIOR|MID|SENIOR|ANY",
  "educationRequirements": ["degree1", "degree2"],
  "locationPreferences": ["location1", "location2"],
  "industryAlignment": ["industry1", "industry2"],
  "roleType": "extracted job title",
  "urgency": "LOW|MEDIUM|HIGH",
  "budgetRange": "extracted or null",
  "companySize": "STARTUP|SMALL|MEDIUM|LARGE",
  "remotePolicy": "REMOTE|HYBRID|ONSITE|FLEXIBLE"
}

Extract information conservatively. If not explicitly mentioned, use sensible defaults.`

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })
      
      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      const parsedIntent = JSON.parse(data.choices[0].message.content)
      
      return parsedIntent
      
    } catch (error) {
      console.error('Error parsing search intent:', error)
      // Fallback to basic parsing
      return this.fallbackParseIntent(prompt)
    }
  }
  
  /**
   * Fallback parsing when AI fails
   */
  private static fallbackParseIntent(prompt: string): ParsedSearchIntent {
    const skillKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes']
    const expKeywords = { 'junior': 'JUNIOR', 'senior': 'SENIOR', 'mid': 'MID', 'experienced': 'SENIOR' }
    
    const lowerPrompt = prompt.toLowerCase()
    const foundSkills = skillKeywords.filter(skill => lowerPrompt.includes(skill))
    
    let experienceLevel: any = 'ANY'
    for (const [keyword, level] of Object.entries(expKeywords)) {
      if (lowerPrompt.includes(keyword)) {
        experienceLevel = level
        break
      }
    }
    
    return {
      requiredSkills: foundSkills,
      preferredSkills: [],
      experienceLevel,
      educationRequirements: [],
      locationPreferences: [],
      industryAlignment: [],
      roleType: 'General Role',
      urgency: 'MEDIUM'
    }
  }
  
  /**
   * Get candidate pool based on search criteria
   */
  private static async getCandidatePool(intent: ParsedSearchIntent) {
    const query: any = {
      where: {
        role: 'STUDENT',
        profileCompleted: true
      },
      include: {
        behavioralInsights: true,
        chatQueries: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        },
        applicationSessions: {
          take: 5,
          orderBy: { startedAt: 'desc' }
        }
      }
    }
    
    // Add skill filtering if specific skills required
    if (intent.requiredSkills.length > 0) {
      query.where.skills = {
        hasSome: intent.requiredSkills
      }
    }
    
    // Add location filtering
    if (intent.locationPreferences.length > 0) {
      query.where.location = {
        in: intent.locationPreferences
      }
    }
    
    const candidates = await prisma.user.findMany(query)
    return candidates
  }
  
  /**
   * Calculate comprehensive match score for a candidate
   */
  private static async calculateMatchScore(
    candidate: any, 
    intent: ParsedSearchIntent, 
    searchId: string
  ): Promise<MatchScore> {
    
    // 1. Profile Match Score (40% weight)
    const profileScore = this.calculateProfileScore(candidate, intent)
    
    // 2. Engagement Score (35% weight)  
    const engagementScore = this.calculateEngagementScore(candidate)
    
    // 3. Behavioral Score (25% weight)
    const behavioralScore = this.calculateBehavioralScore(candidate, intent)
    
    // 4. Detailed breakdown
    const breakdown = {
      skillsAlignment: this.calculateSkillsAlignment(candidate.skills || [], intent.requiredSkills),
      experienceMatch: this.calculateExperienceMatch(candidate, intent.experienceLevel),
      educationMatch: this.calculateEducationMatch(candidate, intent.educationRequirements),
      locationMatch: this.calculateLocationMatch(candidate.location, intent.locationPreferences),
      interestAlignment: this.calculateInterestAlignment(candidate, intent),
      responseLikelihood: this.calculateResponseLikelihood(candidate)
    }
    
    // 5. Generate AI insights
    const insights = await this.generateMatchInsights(candidate, intent, {
      profileScore, engagementScore, behavioralScore, breakdown
    })
    
    const overallScore = (profileScore * 0.4) + (engagementScore * 0.35) + (behavioralScore * 0.25)
    
    return {
      overallScore: Math.round(overallScore * 100) / 100,
      profileMatchScore: Math.round(profileScore * 100) / 100,
      engagementScore: Math.round(engagementScore * 100) / 100,
      behavioralScore: Math.round(behavioralScore * 100) / 100,
      breakdown,
      insights
    }
  }
  
  /**
   * Calculate profile-based matching score
   */
  private static calculateProfileScore(candidate: any, intent: ParsedSearchIntent): number {
    let score = 0
    let factors = 0
    
    // Skills match (50% of profile score)
    if (intent.requiredSkills.length > 0) {
      const skillsMatch = this.calculateSkillsAlignment(candidate.skills || [], intent.requiredSkills)
      score += skillsMatch * 0.5
      factors += 0.5
    }
    
    // Education match (25% of profile score)
    if (intent.educationRequirements.length > 0) {
      const educationMatch = this.calculateEducationMatch(candidate, intent.educationRequirements)
      score += educationMatch * 0.25
      factors += 0.25
    }
    
    // Location match (25% of profile score)
    if (intent.locationPreferences.length > 0) {
      const locationMatch = this.calculateLocationMatch(candidate.location, intent.locationPreferences)
      score += locationMatch * 0.25
      factors += 0.25
    }
    
    // If no specific criteria, give base score
    if (factors === 0) return 0.7
    
    return score / factors
  }
  
  /**
   * Calculate engagement-based score
   */
  private static calculateEngagementScore(candidate: any): number {
    let score = 0.5 // Base score
    
    // Recent chat activity (40% of engagement)
    const recentQueries = candidate.chatQueries?.filter((q: any) => {
      const daysSince = (Date.now() - new Date(q.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 30
    }) || []
    
    if (recentQueries.length > 0) {
      score += Math.min(recentQueries.length / 10, 1) * 0.4
    }
    
    // Application activity (30% of engagement)
    const recentApps = candidate.applicationSessions?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.startedAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 30
    }) || []
    
    if (recentApps.length > 0) {
      score += Math.min(recentApps.length / 5, 1) * 0.3
    }
    
    // Profile completeness (30% of engagement)
    const completeness = this.calculateProfileCompleteness(candidate)
    score += completeness * 0.3
    
    return Math.min(score, 1)
  }
  
  /**
   * Calculate behavioral insights score
   */
  private static calculateBehavioralScore(candidate: any, intent: ParsedSearchIntent): number {
    const insights = candidate.behavioralInsights?.[0]
    if (!insights) return 0.5 // Default score if no behavioral data
    
    let score = 0
    
    // Learning velocity (25% of behavioral)
    score += (insights.learningVelocity / 100) * 0.25
    
    // Interest depth (25% of behavioral)
    score += (insights.interestDepth / 100) * 0.25
    
    // Market awareness (20% of behavioral)
    score += (insights.marketAwareness / 100) * 0.2
    
    // Career ambition (20% of behavioral)
    score += (insights.careerAmbition / 100) * 0.2
    
    // Overall engagement (10% of behavioral)
    score += (insights.overallEngagement / 100) * 0.1
    
    return score
  }
  
  // Helper calculation methods
  private static calculateSkillsAlignment(candidateSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1
    
    const matches = requiredSkills.filter(skill => 
      candidateSkills.some(cSkill => 
        cSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cSkill.toLowerCase())
      )
    ).length
    
    return matches / requiredSkills.length
  }
  
  private static calculateExperienceMatch(candidate: any, requiredLevel: string): number {
    // Simple heuristic based on graduation year and applications
    const currentYear = new Date().getFullYear()
    const yearsExperience = candidate.graduationYear ? 
      Math.max(0, currentYear - candidate.graduationYear) : 0
    
    switch (requiredLevel) {
      case 'JUNIOR': return yearsExperience <= 2 ? 1 : 0.5
      case 'MID': return yearsExperience >= 2 && yearsExperience <= 5 ? 1 : 0.7
      case 'SENIOR': return yearsExperience >= 5 ? 1 : 0.3
      default: return 1 // ANY
    }
  }
  
  private static calculateEducationMatch(candidate: any, requirements: string[]): number {
    if (requirements.length === 0) return 1
    
    const candidateEducation = [
      candidate.major,
      candidate.university,
      candidate.education
    ].filter(Boolean).join(' ').toLowerCase()
    
    const matches = requirements.filter(req => 
      candidateEducation.includes(req.toLowerCase())
    ).length
    
    return matches / requirements.length
  }
  
  private static calculateLocationMatch(candidateLocation: string | null, preferences: string[]): number {
    if (preferences.length === 0) return 1
    if (!candidateLocation) return 0.5
    
    return preferences.some(pref => 
      candidateLocation.toLowerCase().includes(pref.toLowerCase())
    ) ? 1 : 0.3
  }
  
  private static calculateInterestAlignment(candidate: any, intent: ParsedSearchIntent): number {
    // Match based on goals, interests, recent queries
    const candidateInterests = [
      ...(candidate.goal || []),
      ...(candidate.interests || []),
      ...(candidate.chatQueries?.slice(0, 5).map((q: any) => q.query) || [])
    ].join(' ').toLowerCase()
    
    const intentTerms = [
      intent.roleType,
      ...intent.industryAlignment,
      ...intent.requiredSkills
    ].join(' ').toLowerCase()
    
    // Simple text similarity
    const commonWords = intentTerms.split(' ').filter(word => 
      word.length > 3 && candidateInterests.includes(word)
    ).length
    
    return Math.min(commonWords / 5, 1)
  }
  
  private static calculateResponseLikelihood(candidate: any): number {
    // Based on recent activity and historical response patterns
    let likelihood = 0.5
    
    // Recent activity boost
    const recentActivity = candidate.chatQueries?.filter((q: any) => {
      const daysSince = (Date.now() - new Date(q.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    })?.length || 0
    
    likelihood += Math.min(recentActivity / 10, 0.3)
    
    // Profile completeness boost
    likelihood += this.calculateProfileCompleteness(candidate) * 0.2
    
    return Math.min(likelihood, 1)
  }
  
  private static calculateProfileCompleteness(candidate: any): number {
    const fields = [
      'name', 'bio', 'skills', 'major', 'university', 
      'location', 'goal', 'interests'
    ]
    
    const completed = fields.filter(field => {
      const value = candidate[field]
      return value && (typeof value === 'string' ? value.length > 0 : value.length > 0)
    }).length
    
    return completed / fields.length
  }
  
  /**
   * Generate AI-powered insights for a match
   */
  private static async generateMatchInsights(
    candidate: any, 
    intent: ParsedSearchIntent, 
    scores: any
  ): Promise<{explanation: string, strengths: string[], concerns: string[], recommendedApproach: string}> {
    
    try {
      const prompt = `Analyze this candidate match and provide hiring insights:

CANDIDATE PROFILE:
- Name: ${candidate.name}
- Skills: ${candidate.skills?.join(', ') || 'Not specified'}
- Education: ${candidate.major} at ${candidate.university}
- Location: ${candidate.location || 'Not specified'}
- Bio: ${candidate.bio || 'Not provided'}
- Goals: ${candidate.goal?.join(', ') || 'Not specified'}

COMPANY REQUIREMENTS:
- Required Skills: ${intent.requiredSkills.join(', ')}
- Role Type: ${intent.roleType}
- Experience Level: ${intent.experienceLevel}

MATCH SCORES:
- Overall: ${scores.profileScore}/1.0
- Skills Alignment: ${scores.breakdown.skillsAlignment}/1.0
- Engagement: ${scores.engagementScore}/1.0

Provide a JSON response with:
{
  "explanation": "2-3 sentence explanation of why this is/isn't a good match",
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "recommendedApproach": "specific advice on how to reach out to this candidate"
}`

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const insights = JSON.parse(data.choices[0].message.content)
        return insights
      }
      
    } catch (error) {
      console.error('Error generating match insights:', error)
    }
    
    // Fallback insights
    return {
      explanation: `This candidate shows ${scores.breakdown.skillsAlignment > 0.7 ? 'strong' : 'moderate'} skills alignment with your requirements.`,
      strengths: candidate.skills?.slice(0, 3) || ['Relevant skills'],
      concerns: scores.breakdown.skillsAlignment < 0.5 ? ['Limited skill overlap'] : [],
      recommendedApproach: 'Reach out with a personalized message highlighting specific projects that match their interests.'
    }
  }
  
  /**
   * Get tier-based limits
   */
  private static getMaxResultsForTier(tier: string): number {
    switch (tier) {
      case 'FREE': return 3
      case 'PROFESSIONAL': return 10
      case 'ENTERPRISE': return 50
      default: return 3
    }
  }
  
  private static getMinScoreForTier(tier: string): number {
    switch (tier) {
      case 'FREE': return 0.6 // Only show high-quality matches
      case 'PROFESSIONAL': return 0.4
      case 'ENTERPRISE': return 0.2
      default: return 0.6
    }
  }
} 