import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Next-Gen AI Talent Discovery System
export interface TalentSearchParams {
  prompt: string
  companyId: string
  tier: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'
  maxResults?: number
}

export interface TalentProfile {
  id: string
  name: string
  email: string
  university?: string | null
  major?: string | null
  graduationYear?: number | null
  bio?: string | null
  location?: string | null
  goal?: string[]
  interests?: string[]
  image?: string | null
  
  // Activity Metrics
  lastActiveAt?: Date | null
  applicationsThisMonth: number
  totalApplications: number
  profileCompletedAt?: Date | null
  firstApplicationAt?: Date | null
  
  // Engagement Score
  activityScore: number
  responseRate: number
  engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface AIMatchResult {
  candidate: TalentProfile
  aiScore: number
  activityScore: number
  relevanceScore: number
  overallScore: number
  aiExplanation: string
  strengths: string[]
  matchReasons: string[]
  contactCredits: number // Credits needed to reveal contact
}

export interface CreditSystem {
  userId: string
  availableCredits: number
  monthlyLimit: number
  contactsRevealed: number
  tier: string
}

export class NextGenAITalentMatcher {
  
  // Credit costs based on candidate quality
  private static CREDIT_COSTS = {
    HIGH_QUALITY: 2,    // Top 20% candidates
    MEDIUM_QUALITY: 1,  // Middle 60% candidates  
    BASIC_QUALITY: 1    // Bottom 20% candidates
  }
  
  // Tier limits and benefits
  private static TIER_LIMITS = {
    FREE: { credits: 15, contacts: 10, maxResults: 5 },
    PROFESSIONAL: { credits: 30, contacts: 25, maxResults: 15 },
    ENTERPRISE: { credits: 100, contacts: 75, maxResults: 50 }
  }

  /**
   * Main AI talent search with modern UX
   */
  static async searchTalent(params: TalentSearchParams): Promise<{
    matches: AIMatchResult[]
    searchMetadata: any
    creditInfo: CreditSystem
    suggestions: string[]
  }> {
    const startTime = Date.now()
    
    try {
      console.log(`🤖 Next-Gen AI Search: "${params.prompt}"`)
      
      // 1. Get company credit status
      const creditInfo = await this.getCreditStatus(params.companyId, params.tier)
      
      // 2. Parse search intent using AI (enhanced)
      const searchIntent = await this.parseModernSearchIntent(params.prompt)
      
      // 3. Get enriched candidate pool (using available data)
      const candidates = await this.getEnrichedCandidatePool(searchIntent)
      console.log(`👥 Found ${candidates.length} active candidates`)
      
      // 4. AI-powered scoring and matching
      const matches = await this.performAIMatching(candidates, searchIntent, params)
      
      // 5. Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(params.prompt, matches.length)
      
      const processingTime = Date.now() - startTime
      
      return {
        matches: matches.slice(0, this.TIER_LIMITS[params.tier].maxResults),
        searchMetadata: {
          searchIntent,
          candidatesEvaluated: candidates.length,
          processingTime,
          timestamp: new Date()
        },
        creditInfo,
        suggestions
      }
      
    } catch (error) {
      console.error('❌ AI Search Error:', error)
      throw error
    }
  }

  /**
   * Enhanced candidate pool using available data
   */
  private static async getEnrichedCandidatePool(intent: any): Promise<TalentProfile[]> {
    // Use flexible filters based on available data
    const candidates = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        // Remove strict requirements - use available data
        OR: [
          { profileCompleted: true },
          { bio: { not: null } },
          { university: { not: null } },
          { major: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        graduationYear: true,
        bio: true,
        location: true,
        goal: true,
        interests: true,
        image: true,
        lastActiveAt: true,
        applicationsThisMonth: true,
        profileCompletedAt: true,
        firstApplicationAt: true,
        applications: {
          select: { id: true },
          take: 100
        }
      },
      orderBy: [
        { lastActiveAt: 'desc' },
        { applicationsThisMonth: 'desc' },
        { profileCompletedAt: 'desc' }
      ]
    })

    // Enrich with activity metrics
    return candidates.map(candidate => {
      const totalApplications = candidate.applications?.length || 0
      const enrichedCandidate: TalentProfile = {
        id: candidate.id,
        name: candidate.name || 'Unknown',
        email: candidate.email,
        university: candidate.university,
        major: candidate.major,
        graduationYear: candidate.graduationYear,
        bio: candidate.bio,
        location: candidate.location,
        goal: candidate.goal,
        interests: candidate.interests,
        image: candidate.image,
        lastActiveAt: candidate.lastActiveAt,
        applicationsThisMonth: candidate.applicationsThisMonth,
        profileCompletedAt: candidate.profileCompletedAt,
        firstApplicationAt: candidate.firstApplicationAt,
        totalApplications,
        activityScore: 0, // Will be calculated below
        responseRate: 0, // Will be calculated below
        engagementLevel: 'LOW' // Will be calculated below
      }
      
      enrichedCandidate.activityScore = this.calculateActivityScore(enrichedCandidate)
      enrichedCandidate.responseRate = this.calculateResponseRate(enrichedCandidate)
      enrichedCandidate.engagementLevel = this.getEngagementLevel(enrichedCandidate)
      
      return enrichedCandidate
    })
  }

  /**
   * Modern AI-powered matching and scoring
   */
  private static async performAIMatching(
    candidates: TalentProfile[], 
    intent: any, 
    params: TalentSearchParams
  ): Promise<AIMatchResult[]> {
    const matches: AIMatchResult[] = []
    
    for (const candidate of candidates) {
      try {
        // Calculate comprehensive score
        const activityScore = this.calculateActivityScore(candidate)
        const relevanceScore = await this.calculateRelevanceScore(candidate, intent)
        const aiScore = await this.getAIScore(candidate, params.prompt)
        
        const overallScore = (activityScore * 0.3) + (relevanceScore * 0.4) + (aiScore * 0.3)
        
        // Only include candidates with decent scores
        if (overallScore >= 30) {
          const aiInsights = await this.generateAIInsights(candidate, params.prompt)
          
          matches.push({
            candidate,
            aiScore,
            activityScore,
            relevanceScore,
            overallScore,
            aiExplanation: aiInsights.explanation,
            strengths: aiInsights.strengths,
            matchReasons: aiInsights.reasons,
            contactCredits: this.calculateContactCost(overallScore)
          })
        }
      } catch (error) {
        console.warn(`⚠️ Error scoring candidate ${candidate.name}:`, (error as Error).message)
        continue
      }
    }
    
    return matches.sort((a, b) => b.overallScore - a.overallScore)
  }

  /**
   * Calculate activity score based on engagement
   */
  private static calculateActivityScore(candidate: TalentProfile): number {
    let score = 0
    
    // Recent activity (40 points)
    if (candidate.lastActiveAt) {
      const daysSinceActive = Math.floor(
        (Date.now() - candidate.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceActive <= 7) score += 40
      else if (daysSinceActive <= 30) score += 25
      else if (daysSinceActive <= 90) score += 10
    }
    
    // Application activity (30 points)
    score += Math.min(candidate.applicationsThisMonth * 5, 30)
    
    // Profile completion (20 points)
    if (candidate.profileCompletedAt) score += 20
    if (candidate.bio) score += 5
    if (candidate.university) score += 3
    if (candidate.major) score += 2
    
    // Total applications (10 points)
    score += Math.min(candidate.totalApplications * 2, 10)
    
    return Math.min(score, 100)
  }

  /**
   * Calculate relevance score using available profile data
   */
  private static async calculateRelevanceScore(candidate: TalentProfile, intent: any): Promise<number> {
    let score = 0
    
    // University/Education match (25 points)
    if (candidate.university && intent.keywords) {
      const universityRelevance = this.calculateTextMatch(candidate.university, intent.keywords)
      score += universityRelevance * 25
    }
    
    // Major/Field match (25 points)
    if (candidate.major && intent.keywords) {
      const majorRelevance = this.calculateTextMatch(candidate.major, intent.keywords)
      score += majorRelevance * 25
    }
    
    // Bio/Description match (30 points)
    if (candidate.bio && intent.keywords) {
      const bioRelevance = this.calculateTextMatch(candidate.bio, intent.keywords)
      score += bioRelevance * 30
    }
    
    // Goals/Interests match (20 points)
    if (candidate.goal || candidate.interests) {
      const goalsText = [...(candidate.goal || []), ...(candidate.interests || [])].join(' ')
      if (goalsText && intent.keywords) {
        const goalsRelevance = this.calculateTextMatch(goalsText, intent.keywords)
        score += goalsRelevance * 20
      }
    }
    
    return Math.min(score, 100)
  }

  /**
   * Simple text matching for relevance
   */
  private static calculateTextMatch(text: string, keywords: string[]): number {
    if (!text || !keywords.length) return 0
    
    const textLower = text.toLowerCase()
    let matches = 0
    
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matches++
      }
    }
    
    return Math.min(matches / keywords.length, 1)
  }

  /**
   * Enhanced search intent parsing
   */
  private static async parseModernSearchIntent(prompt: string): Promise<any> {
    // Extract keywords and intent from prompt
    const keywords = this.extractKeywords(prompt)
    const role = this.extractRole(prompt)
    const experience = this.extractExperience(prompt)
    
    return {
      originalPrompt: prompt,
      keywords,
      role,
      experience,
      urgency: 'MEDIUM'
    }
  }

  private static extractKeywords(prompt: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'need', 'want', 'looking', 'find', 'search']
    
    return prompt
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 10) // Top 10 keywords
  }

  private static extractRole(prompt: string): string {
    const roles = ['developer', 'designer', 'marketer', 'analyst', 'engineer', 'manager', 'intern', 'student']
    const promptLower = prompt.toLowerCase()
    
    for (const role of roles) {
      if (promptLower.includes(role)) return role
    }
    
    return 'general'
  }

  private static extractExperience(prompt: string): string {
    const promptLower = prompt.toLowerCase()
    
    if (promptLower.includes('senior') || promptLower.includes('experienced')) return 'senior'
    if (promptLower.includes('junior') || promptLower.includes('entry') || promptLower.includes('beginner')) return 'junior'
    
    return 'any'
  }

  /**
   * AI-powered candidate scoring
   */
  private static async getAIScore(candidate: TalentProfile, prompt: string): Promise<number> {
    // Simplified AI scoring based on profile completeness and relevance
    let score = 50 // Base score
    
    if (candidate.bio) score += 20
    if (candidate.university) score += 15
    if (candidate.major) score += 10
    if (candidate.goal?.length) score += 5
    
    return Math.min(score, 100)
  }

  /**
   * Generate AI insights for matches
   */
  private static async generateAIInsights(candidate: TalentProfile, prompt: string): Promise<{
    explanation: string
    strengths: string[]
    reasons: string[]
  }> {
    const strengths = []
    const reasons = []
    
    if (candidate.university) {
      strengths.push(`Studying at ${candidate.university}`)
      reasons.push('Strong educational background')
    }
    
    if (candidate.major) {
      strengths.push(`Majoring in ${candidate.major}`)
      reasons.push('Relevant academic focus')
    }
    
    if (candidate.applicationsThisMonth > 3) {
      strengths.push('Highly active on platform')
      reasons.push('Demonstrates strong engagement')
    }
    
    if (candidate.bio) {
      strengths.push('Detailed profile with clear goals')
      reasons.push('Well-articulated professional interests')
    }
    
    const explanation = `${candidate.name} is a ${candidate.engagementLevel.toLowerCase()}-engagement candidate with ${candidate.activityScore}/100 activity score. They have been active on the platform and show genuine interest in opportunities.`
    
    return {
      explanation,
      strengths: strengths.slice(0, 3),
      reasons: reasons.slice(0, 3)
    }
  }

  /**
   * Calculate contact reveal cost based on candidate quality
   */
  private static calculateContactCost(overallScore: number): number {
    if (overallScore >= 80) return this.CREDIT_COSTS.HIGH_QUALITY
    if (overallScore >= 60) return this.CREDIT_COSTS.MEDIUM_QUALITY
    return this.CREDIT_COSTS.BASIC_QUALITY
  }

  /**
   * Get user's credit status
   */
  private static async getCreditStatus(companyId: string, tier: string): Promise<CreditSystem> {
    // This would be stored in database - for now return based on tier
    const limits = this.TIER_LIMITS[tier as keyof typeof this.TIER_LIMITS]
    
    return {
      userId: companyId,
      availableCredits: limits.credits,
      monthlyLimit: limits.credits,
      contactsRevealed: 0,
      tier
    }
  }

  /**
   * Calculate engagement level
   */
  private static getEngagementLevel(candidate: TalentProfile): 'HIGH' | 'MEDIUM' | 'LOW' {
    const score = this.calculateActivityScore(candidate)
    
    if (score >= 70) return 'HIGH'
    if (score >= 40) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Calculate response rate estimation
   */
  private static calculateResponseRate(candidate: TalentProfile): number {
    // Estimate based on activity
    const activityScore = this.calculateActivityScore(candidate)
    return Math.min(activityScore * 0.8, 95) // Max 95% response rate
  }

  /**
   * Generate search suggestions for better results
   */
  private static async generateSearchSuggestions(prompt: string, resultsCount: number): Promise<string[]> {
    const suggestions = []
    
    if (resultsCount < 5) {
      suggestions.push("Try broader terms like 'motivated students' or 'recent graduates'")
      suggestions.push("Search by university or field of study")
      suggestions.push("Look for 'active users' or 'highly engaged candidates'")
    }
    
    suggestions.push("Try: 'Computer Science students at AUD'")
    suggestions.push("Try: 'Marketing interns with high activity'")
    suggestions.push("Try: 'Business students ready for internships'")
    
    return suggestions.slice(0, 3)
  }
}

// Credit management functions
export class CreditManager {
  
  static async deductCredits(companyId: string, amount: number): Promise<boolean> {
    // Implementation for credit deduction
    return true
  }
  
  static async revealContact(companyId: string, candidateId: string): Promise<{
    success: boolean
    contact?: { email: string; whatsapp?: string }
    creditsRemaining?: number
  }> {
    // Implementation for contact reveal
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { email: true, whatsapp: true }
    })
    
    return {
      success: true,
      contact: candidate ? { email: candidate.email, whatsapp: candidate.whatsapp || undefined } : undefined,
      creditsRemaining: 15
    }
  }
} 