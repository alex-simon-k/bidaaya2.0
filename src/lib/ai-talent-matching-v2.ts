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
  subjects?: string | null  // Add subjects field
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
  
  // Tier limits and benefits - INCREASED RESULTS
  private static TIER_LIMITS = {
    FREE: { credits: 15, contacts: 10, maxResults: 9 },        // Increased from 5 to 9
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
      console.log('⏱️ Performance Tracking Started')
      
      // 1. Get company credit status
      const creditStart = Date.now()
      const creditInfo = await this.getCreditStatus(params.companyId, params.tier)
      console.log(`💳 Credit check: ${Date.now() - creditStart}ms`)
      
      // 2. TRY VECTOR SEARCH FIRST (if vectors available)
      const vectorStart = Date.now()
      console.log('🔮 Attempting vector-based search...')
      let candidates = await this.tryVectorSearch(params.prompt, params.companyId)
      console.log(`🔮 Vector search: ${Date.now() - vectorStart}ms`)
      
      // Initialize search intent variable
      let searchIntent: any = null
      
      if (candidates.length === 0) {
        console.log('⚠️ Vector search found no results, falling back to keyword search...')
        
        // 3. Parse search intent using AI (enhanced with strict filtering)
        const intentStart = Date.now()
        searchIntent = await this.parseModernSearchIntent(params.prompt)
        console.log(`🎯 Intent parsing: ${Date.now() - intentStart}ms`)
      console.log('🎯 Parsed search intent with filters:', searchIntent)
      
        // 4. Get STRICTLY FILTERED candidate pool (hard filtering first!)
        const strictStart = Date.now()
        candidates = await this.getStrictlyFilteredCandidatePool(searchIntent)
        console.log(`👥 Strict filtering: ${Date.now() - strictStart}ms`)
      console.log(`👥 Found ${candidates.length} FILTERED candidates (after hard filtering)`)
      
        // 🚨 FALLBACK: If strict filtering returns 0 results, use relaxed filtering
        if (candidates.length === 0) {
          console.log('⚠️ Strict filtering returned 0 results, applying relaxed filtering...')
          candidates = await this.getRelaxedCandidatePool(searchIntent)
          console.log(`👥 Found ${candidates.length} candidates with relaxed filtering`)
          
          // 🚨 EMERGENCY FALLBACK: If even relaxed filtering fails, get any active students
          if (candidates.length === 0) {
            const keywordStart = Date.now()
            console.log('⚠️ Even relaxed filtering returned 0 results, trying keyword-specific search...')
            candidates = await this.getKeywordSpecificCandidates(params.prompt)
            console.log(`🔍 Keyword search: ${Date.now() - keywordStart}ms`)
            console.log(`👥 Keyword-specific search found ${candidates.length} candidates`)
            
            // Final fallback: Get any active students
            if (candidates.length === 0) {
              const emergencyStart = Date.now()
              console.log('⚠️ Keyword search failed, getting any active students...')
              candidates = await this.getEmergencyFallbackCandidates()
              console.log(`🆘 Emergency fallback: ${Date.now() - emergencyStart}ms`)
              console.log(`👥 Emergency fallback found ${candidates.length} candidates`)
            }
          }
        }
      } else {
        console.log(`✅ Vector search found ${candidates.length} candidates`)
        // Create basic search intent for vector results
        searchIntent = {
          originalPrompt: params.prompt,
          keywords: [],
          role: null,
          experience: null,
          strictFilters: { universities: [], majors: [], skills: [] }
        }
      }
      
      // 5. AI-powered scoring and matching (now relevance-first)
      const matchingStart = Date.now()
      const matches = await this.performRelevanceFirstMatching(candidates, searchIntent, params)
      console.log(`🎯 Relevance matching: ${Date.now() - matchingStart}ms`)
      
      // 6. Generate search suggestions
      const suggestionsStart = Date.now()
      const suggestions = await this.generateSearchSuggestions(params.prompt, matches.length)
      console.log(`💡 Suggestions generation: ${Date.now() - suggestionsStart}ms`)
      
      const processingTime = Date.now() - startTime
      
      console.log(`🏁 Total search time: ${processingTime}ms`)
      console.log(`📊 Final result: ${matches.length} matches (showing ${Math.min(matches.length, this.TIER_LIMITS[params.tier].maxResults)})`)
      
      return {
        matches: matches.slice(0, this.TIER_LIMITS[params.tier].maxResults), // Now shows 9 for FREE
        searchMetadata: {
          searchIntent,
          candidatesEvaluated: candidates.length,
          strictFiltersApplied: searchIntent.strictFilters || [],
          processingTime,
          timestamp: new Date()
        },
        creditInfo,
        suggestions
      }
      
    } catch (error) {
      console.error('❌ AI Search Error:', error)
      
      // Don't throw error - return empty results with helpful suggestions
      return {
        matches: [],
        searchMetadata: {
          searchIntent: { originalPrompt: params.prompt, keywords: [], role: null, experience: null },
          candidatesEvaluated: 0,
          strictFiltersApplied: [],
          processingTime: Date.now() - startTime,
          timestamp: new Date(),
          error: (error as Error).message
        },
        creditInfo: await this.getCreditStatus(params.companyId, params.tier),
        suggestions: [
          'Try using broader search terms',
          'Remove specific university requirements',
          'Search for general skills instead of specific technologies',
          'Try searching for "business students" or "computer science students"'
        ]
      }
    }
  }

  /**
   * TRY VECTOR SEARCH FIRST - Use vector embeddings if available
   */
  private static async tryVectorSearch(prompt: string, companyId: string): Promise<TalentProfile[]> {
    try {
      const { VectorMatchingService } = await import('./vector-matching-service')
      
      console.log('🔮 Attempting vector-based talent search...')
      
      // Check if we have student vectors
      const vectorCount = await prisma.studentVector.count()
      console.log(`📊 Found ${vectorCount} student vectors in database`)
      
      if (vectorCount === 0) {
        console.log('⚠️ No student vectors available, skipping vector search')
        return []
      }
      
      // Check if OpenAI API key is configured (required for search embeddings)
      if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️ OpenAI API key not configured, skipping vector search')
        return []
      }
      
      // Perform vector search
      console.log('🔍 Calling VectorMatchingService.searchTalentWithVectors...')
      const vectorResult = await VectorMatchingService.searchTalentWithVectors({
        searchQuery: prompt,
        companyId: companyId,
        limit: 50, // Get more results from vector search
        threshold: 0.5 // Lower threshold for more results
      })
      
      console.log(`📊 Vector search result:`, {
        matchesFound: vectorResult.vectorMatches?.length || 0,
        fallbackUsed: vectorResult.fallbackUsed,
        hasError: !vectorResult.vectorMatches
      })
      
      if (vectorResult.vectorMatches.length > 0) {
        console.log(`🎯 Vector search found ${vectorResult.vectorMatches.length} matches`)
        
        // Convert vector matches to TalentProfile format
        return vectorResult.vectorMatches.map(match => ({
          id: match.student.id,
          name: match.student.name,
          email: match.student.email,
          university: match.student.university,
          major: match.student.major,
          graduationYear: match.student.graduationYear,
          bio: match.student.bio,
          location: match.student.location,
          goal: match.student.goals || [],
          interests: match.student.interests || [],
          image: match.student.image,
          lastActiveAt: new Date(match.student.lastActiveAt || Date.now()),
          applicationsThisMonth: match.student.applicationsThisMonth || 0,
          totalApplications: 0,
          profileCompletedAt: new Date(),
          firstApplicationAt: null,
          activityScore: Math.round(match.overallScore), // Use overallScore as activity
          responseRate: 0,
          engagementLevel: match.vectorSimilarity > 0.8 ? 'HIGH' : 
                          match.vectorSimilarity > 0.6 ? 'MEDIUM' : 'LOW'
        }))
      } else {
        console.log('🔮 Vector search returned 0 matches, proceeding to fallbacks')
      }
      
      return []
      
    } catch (error) {
      console.error('❌ Error in vector search:', (error as Error).message)
      console.log('🔄 Continuing to keyword-based fallbacks...')
      return []
    }
  }

  /**
   * KEYWORD-SPECIFIC SEARCH - Direct search for common keywords
   */
  private static async getKeywordSpecificCandidates(prompt: string): Promise<TalentProfile[]> {
    console.log('🔍 Trying keyword-specific search...')
    
    const lowerPrompt = prompt.toLowerCase()
    let whereConditions: any = {
      role: 'STUDENT',
      profileCompleted: true
    }
    
    // Direct keyword matching for common search terms
    if (lowerPrompt.includes('marketing')) {
      whereConditions.OR = [
        { major: { contains: 'marketing', mode: 'insensitive' } },
        { major: { contains: 'business', mode: 'insensitive' } },
        { bio: { contains: 'marketing', mode: 'insensitive' } },
        { interests: { hasSome: ['Marketing & Digital Media'] } }
      ]
    } else if (lowerPrompt.includes('computer') || lowerPrompt.includes('programming') || lowerPrompt.includes('tech')) {
      whereConditions.OR = [
        { major: { contains: 'computer', mode: 'insensitive' } },
        { major: { contains: 'software', mode: 'insensitive' } },
        { major: { contains: 'engineering', mode: 'insensitive' } },
        { interests: { hasSome: ['Technology & Software Development'] } }
      ]
    } else if (lowerPrompt.includes('business')) {
      whereConditions.OR = [
        { major: { contains: 'business', mode: 'insensitive' } },
        { major: { contains: 'management', mode: 'insensitive' } },
        { interests: { hasSome: ['Sales & Business Development', 'Consulting & Strategy'] } }
      ]
    } else {
      // Generic search - just get students with any useful data
      whereConditions.OR = [
        { bio: { not: null } },
        { interests: { not: { equals: [] } } },
        { major: { not: null } }
      ]
    }
    
    const candidates = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        bio: true,
        skills: true,
        interests: true,
        goal: true,
        location: true,
        graduationYear: true,
        applicationsThisMonth: true,
        lastActiveAt: true,
        profileCompletedAt: true,
        updatedAt: true,
        applications: {
          select: { createdAt: true },
          take: 5
        }
      },
      take: 30,
      orderBy: [
        { updatedAt: 'desc' }
      ]
    })
    
    return candidates.map(candidate => this.transformToTalentProfile(candidate))
  }

  /**
   * EMERGENCY FALLBACK - Get any active students when all filtering fails
   */
  private static async getEmergencyFallbackCandidates(): Promise<TalentProfile[]> {
    console.log('🆘 Emergency fallback: Getting any active students...')
    
    // Get any students with basic profile data, ordered by activity
    const candidates = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profileCompleted: true, // Base requirement
        OR: [
          { lastActiveAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }, // Active in last 90 days
          { applicationsThisMonth: { gt: 0 } }, // Has applications this month
          { updatedAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } }, // Updated in last 180 days
          { createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } // Created in last year (very lenient)
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        bio: true,
        skills: true,
        interests: true,
        goal: true,
        location: true,
        graduationYear: true,
        applicationsThisMonth: true,
        lastActiveAt: true,
        profileCompletedAt: true,
        updatedAt: true,
        applications: {
          select: { createdAt: true },
          take: 5
        }
      },
      take: 50, // Larger emergency pool to ensure results
      orderBy: [
        { lastActiveAt: 'desc' },
        { applicationsThisMonth: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return candidates.map(candidate => this.transformToTalentProfile(candidate))
  }

  /**
   * Transform database user to TalentProfile format
   */
  private static transformToTalentProfile(candidate: any): TalentProfile {
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
      lastActiveAt: candidate.lastActiveAt || candidate.updatedAt,
      applicationsThisMonth: candidate.applicationsThisMonth,
      profileCompletedAt: candidate.profileCompletedAt,
      firstApplicationAt: totalApplications > 0 ? candidate.updatedAt : null,
      totalApplications,
      activityScore: 0, // Will be calculated below
      responseRate: 0, // Will be calculated below
      engagementLevel: 'LOW' // Will be calculated below
    }
    
    enrichedCandidate.activityScore = this.calculateActivityScore(enrichedCandidate)
    enrichedCandidate.responseRate = this.calculateResponseRate(enrichedCandidate)
    enrichedCandidate.engagementLevel = this.getEngagementLevel(enrichedCandidate)
    
    return enrichedCandidate
  }

  /**
   * RELAXED FILTERING - When strict filtering returns 0 results
   */
  private static async getRelaxedCandidatePool(intent: any): Promise<TalentProfile[]> {
    console.log('🔄 Applying RELAXED filters for broader search...')
    
    // Much more relaxed WHERE conditions
    const whereConditions: any = {
      role: 'STUDENT',
      // Don't require profile completion for relaxed search
      OR: [
        { university: { not: null } },
        { major: { not: null } },
        { bio: { not: null } },
        { skills: { not: { equals: [] } } },
        { interests: { not: { equals: [] } } }
      ]
    }

    // Only apply university filter if specific ones mentioned
    if (intent.strictFilters?.universities?.length > 0) {
      whereConditions.OR.push({
        university: {
          in: intent.strictFilters.universities,
          mode: 'insensitive'
        }
      })
    }

    // More flexible major matching
    if (intent.strictFilters?.majors?.length > 0) {
      whereConditions.OR.push({
        major: {
          in: intent.strictFilters.majors,
          mode: 'insensitive'
        }
      })
    }

    // Skills can match interests too in relaxed mode
    if (intent.strictFilters?.skills?.length > 0) {
      whereConditions.OR.push({
        OR: [
          { skills: { hasSome: intent.strictFilters.skills } },
          { interests: { hasSome: intent.strictFilters.skills } }
        ]
      })
    }

    // Get relaxed candidates with basic selection
    const candidates = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        bio: true,
        skills: true,
        interests: true,
        goal: true,
        location: true,
        graduationYear: true,
        applicationsThisMonth: true,
        lastActiveAt: true,
        profileCompletedAt: true,
        updatedAt: true,
        applications: {
          select: { createdAt: true },
          take: 5
        }
      },
      take: 100, // Larger pool for relaxed search
      orderBy: [
        { lastActiveAt: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return candidates.map(candidate => this.transformToTalentProfile(candidate))
  }

  /**
   * STRICT FILTERING - Hard filters BEFORE any scoring
   */
  private static async getStrictlyFilteredCandidatePool(intent: any): Promise<TalentProfile[]> {
    console.log('🔍 Applying STRICT filters:', intent.strictFilters)
    
    // Build strict WHERE conditions - RELAXED profile requirements
    const whereConditions: any = {
      role: 'STUDENT',
      // Don't require profile completion - too restrictive
      // Just require SOME basic data
          OR: [
            { university: { not: null } },
            { major: { not: null } },
        { bio: { not: null } },
        { skills: { not: { equals: [] } } },
        { interests: { not: { equals: [] } } }
      ]
    }

    // 🎯 STRICT UNIVERSITY FILTERING - Only apply if specific universities mentioned
    if (intent.strictFilters?.universities?.length > 0) {
      console.log('🏛️ Applying university filter:', intent.strictFilters.universities)
      // Add university filter to AND conditions instead of replacing OR
      whereConditions.AND = whereConditions.AND || []
      whereConditions.AND.push({
        university: {
        in: intent.strictFilters.universities,
        mode: 'insensitive'
      }
      })
    }

    // 🎯 STRICT MAJOR/FIELD FILTERING - Only apply if specific majors mentioned
    if (intent.strictFilters?.majors?.length > 0) {
      console.log('📚 Applying major filter:', intent.strictFilters.majors)
      whereConditions.AND = whereConditions.AND || []
      whereConditions.AND.push({
        major: {
        in: intent.strictFilters.majors,
        mode: 'insensitive'
      }
      })
    }

    // 🎯 SKILLS/INTERESTS FILTERING - More flexible
    if (intent.strictFilters?.skills?.length > 0) {
      console.log('🛠️ Applying skills filter:', intent.strictFilters.skills)
      whereConditions.AND = whereConditions.AND || []
      whereConditions.AND.push({
        OR: intent.strictFilters.skills.map((skill: string) => ({
        OR: [
            { skills: { hasSome: [skill] } },
          { interests: { hasSome: [skill] } },
          { goal: { hasSome: [skill] } },
            { bio: { contains: skill, mode: 'insensitive' } },
            { major: { contains: skill, mode: 'insensitive' } }
        ]
      }))
      })
    } else {
      // If no specific skills mentioned, don't filter by skills at all
      console.log('ℹ️ No specific skills in query, searching all students with basic data')
    }

    // Get strictly filtered candidates
    console.log('🗃️ Database query conditions:', JSON.stringify(whereConditions, null, 2))
    
    const candidates = await prisma.user.findMany({
      where: whereConditions,
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
         applicationsThisMonth: true,
         profileCompleted: true,
         createdAt: true,
         applications: {
           select: { id: true },
           take: 100
         }
       },
             // Order by RELEVANCE first, then activity
       orderBy: [
         { profileCompleted: 'desc' },    // Complete profiles first
         { createdAt: 'desc' },           // Then by recent signups
         { applicationsThisMonth: 'desc' } // Then by engagement
       ]
    })

    console.log(`✅ Strict filtering returned ${candidates.length} candidates`)

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
        lastActiveAt: candidate.createdAt, // Use createdAt as proxy for activity
        applicationsThisMonth: candidate.applicationsThisMonth,
        profileCompletedAt: candidate.profileCompleted ? candidate.createdAt : null,
        firstApplicationAt: totalApplications > 0 ? candidate.createdAt : null,
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
   * RELEVANCE-FIRST matching (prioritizes accuracy over activity)
   */
  private static async performRelevanceFirstMatching(
    candidates: TalentProfile[], 
    intent: any, 
    params: TalentSearchParams
  ): Promise<AIMatchResult[]> {
    const matches: AIMatchResult[] = []
    
    for (const candidate of candidates) {
      try {
        // NEW SCORING: Relevance-first approach
        const relevanceScore = await this.calculateStrictRelevanceScore(candidate, intent)
        const activityScore = this.calculateActivityScore(candidate)
        const aiScore = await this.getAIScore(candidate, params.prompt)
        
        // 🎯 NEW WEIGHTING: Relevance dominates (60%), then AI (25%), then activity (15%)
        const overallScore = (relevanceScore * 0.60) + (aiScore * 0.25) + (activityScore * 0.15)
        
        // Higher threshold for matches (must be truly relevant)
        if (overallScore >= 40) {
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
    
    // Sort by RELEVANCE first, then overall score
    return matches.sort((a, b) => {
      // First priority: relevance score
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 10) {
        return b.relevanceScore - a.relevanceScore
      }
      // Second priority: overall score
      return b.overallScore - a.overallScore
    })
  }

  /**
   * STRICT relevance scoring - exact matches get high scores
   */
  private static async calculateStrictRelevanceScore(candidate: TalentProfile, intent: any): Promise<number> {
    let score = 0
    
    // 🎯 MAJOR/SUBJECT STUDIES MATCH (50 points) - HIGHEST PRIORITY
    if (intent.strictFilters?.majors?.length > 0) {
      let majorSubjectMatch = false
      
      // Check major field
      if (candidate.major) {
        majorSubjectMatch = intent.strictFilters.majors.some((major: string) => 
          candidate.major!.toLowerCase().includes(major.toLowerCase()) ||
          major.toLowerCase().includes(candidate.major!.toLowerCase())
        )
      }
      
      // Check subjects field (this is where "studies law" information is stored)
      if (!majorSubjectMatch && candidate.subjects) {
        majorSubjectMatch = intent.strictFilters.majors.some((major: string) => 
          candidate.subjects!.toLowerCase().includes(major.toLowerCase()) ||
          major.toLowerCase().includes(candidate.subjects!.toLowerCase())
        )
      }
      
      // Check interests and goals for subject alignment
      if (!majorSubjectMatch) {
        const allInterests = [...(candidate.goal || []), ...(candidate.interests || [])].join(' ').toLowerCase()
        majorSubjectMatch = intent.strictFilters.majors.some((major: string) => 
          allInterests.includes(major.toLowerCase())
        )
      }
      
      if (majorSubjectMatch) {
        score += 50  // Increased from 35 to 50
        console.log(`✅ Major/Subject match: ${candidate.major || candidate.subjects}`)
      }
    }
    
    // 🎯 SKILLS/INTERESTS ALIGNMENT (30 points)
    if (intent.strictFilters?.skills?.length > 0) {
      const skillsText = [...(candidate.goal || []), ...(candidate.interests || []), candidate.bio || '', candidate.subjects || ''].join(' ').toLowerCase()
      let skillMatches = 0
      
      for (const skill of intent.strictFilters.skills) {
        if (skillsText.includes(skill.toLowerCase())) {
          skillMatches++
        }
      }
      
      if (skillMatches > 0) {
        score += (skillMatches / intent.strictFilters.skills.length) * 30  // Increased from 25 to 30
        console.log(`✅ Skills match: ${skillMatches}/${intent.strictFilters.skills.length}`)
      }
    }
    
    // 🎯 UNIVERSITY MATCH (15 points) - LOWER PRIORITY than subject relevance
    if (intent.strictFilters?.universities?.length > 0 && candidate.university) {
      const universityMatch = intent.strictFilters.universities.some((uni: string) => 
        candidate.university!.toLowerCase().includes(uni.toLowerCase()) ||
        uni.toLowerCase().includes(candidate.university!.toLowerCase())
      )
      if (universityMatch) {
        score += 15  // Decreased from 30 to 15
        console.log(`✅ University match: ${candidate.university}`)
      }
    }
    
    // 🎯 GENERAL KEYWORD MATCH (5 points) - Minimal impact
    if (intent.keywords?.length > 0) {
      const profileText = [candidate.university, candidate.major, candidate.subjects, candidate.bio, ...(candidate.goal || []), ...(candidate.interests || [])].join(' ').toLowerCase()
      let keywordMatches = 0
      
      for (const keyword of intent.keywords) {
        if (profileText.includes(keyword.toLowerCase())) {
          keywordMatches++
        }
      }
      
      if (keywordMatches > 0) {
        score += (keywordMatches / intent.keywords.length) * 5  // Decreased from 10 to 5
      }
    }
    
    console.log(`📊 Candidate ${candidate.name} relevance score: ${score}/100`)
    return Math.min(score, 100)
  }

  /**
   * Enhanced search intent parsing with STRICT filtering
   */
  private static async parseModernSearchIntent(prompt: string): Promise<any> {
    const keywords = this.extractKeywords(prompt)
    const role = this.extractRole(prompt)
    const experience = this.extractExperience(prompt)
    
    // 🎯 EXTRACT STRICT FILTERS
    const strictFilters = this.extractStrictFilters(prompt)
    
    return {
      originalPrompt: prompt,
      keywords,
      role,
      experience,
      strictFilters, // NEW: Hard filtering criteria
      urgency: 'MEDIUM'
    }
  }

  /**
   * NEW: Extract strict filtering criteria from search prompt
   */
  private static extractStrictFilters(prompt: string): any {
    const promptLower = prompt.toLowerCase()
    const filters: any = {}

    // 🏛️ UNIVERSITY EXTRACTION
    const universities = []
    const universityPatterns = [
      'american university of dubai', 'aud',
      'american university of sharjah', 'aus', 
      'canadian university dubai', 'cud',
      'heriot watt', 'heriot-watt',
      'university of dubai', 'ud',
      'zayed university',
      'khalifa university',
      'uae university',
      'ajman university',
      'university of sharjah'
    ]
    
    for (const pattern of universityPatterns) {
      if (promptLower.includes(pattern)) {
        // Map abbreviations to full names
        if (pattern === 'aud') universities.push('American University of Dubai')
        else if (pattern === 'aus') universities.push('American University of Sharjah')
        else if (pattern === 'cud') universities.push('Canadian University Dubai')
        else universities.push(pattern)
      }
    }

    // 📚 MAJOR/FIELD EXTRACTION
    const majors = []
    const majorPatterns = [
      'computer science', 'cs', 'software engineering',
      'business', 'business administration', 'mba',
      'marketing', 'digital marketing',
      'engineering', 'mechanical engineering', 'civil engineering',
      'design', 'graphic design', 'ui/ux',
      'finance', 'accounting',
      'international business',
      'psychology',
      'communications'
    ]
    
    for (const pattern of majorPatterns) {
      if (promptLower.includes(pattern)) {
        if (pattern === 'cs') majors.push('Computer Science')
        else majors.push(pattern)
      }
    }

    // 🛠️ SKILLS EXTRACTION  
    const skills = []
    const skillPatterns = [
      'javascript', 'python', 'react', 'node.js',
      'marketing', 'social media', 'content creation',
      'design', 'photoshop', 'figma',
      'data analysis', 'excel', 'sql',
      'project management',
      'communication skills'
    ]
    
    for (const pattern of skillPatterns) {
      if (promptLower.includes(pattern)) {
        skills.push(pattern)
      }
    }

    // Only add filters if we found specific criteria
    if (universities.length > 0) filters.universities = universities
    if (majors.length > 0) filters.majors = majors  
    if (skills.length > 0) filters.skills = skills

    console.log('🎯 Extracted strict filters:', filters)
    return filters
  }

  /**
   * Calculate activity score based on engagement (REDUCED weight)
   */
  private static calculateActivityScore(candidate: TalentProfile): number {
    let score = 0
    
    // Recent activity (30 points - reduced from 40)
    if (candidate.lastActiveAt) {
      const daysSinceActive = Math.floor(
        (Date.now() - candidate.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceActive <= 7) score += 30
      else if (daysSinceActive <= 30) score += 20
      else if (daysSinceActive <= 90) score += 10
    }
    
    // Application activity (25 points - reduced from 30)
    score += Math.min(candidate.applicationsThisMonth * 4, 25)
    
    // Profile completion (25 points)
    if (candidate.profileCompletedAt) score += 25
    if (candidate.bio) score += 10
    if (candidate.university) score += 5
    if (candidate.major) score += 5
    
    // Total applications (20 points)
    score += Math.min(candidate.totalApplications * 2, 20)
    
    return Math.min(score, 100)
  }

  /**
   * Calculate relevance score using available profile data
   */
  private static async calculateRelevanceScore(candidate: TalentProfile, intent: any): Promise<number> {
    // This is the old method - now using calculateStrictRelevanceScore
    return this.calculateStrictRelevanceScore(candidate, intent)
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
    
    const explanation = `${candidate.name} is a strong match with ${candidate.university || 'their university'} background in ${candidate.major || 'their field'}. They show ${candidate.engagementLevel.toLowerCase()} engagement and have a ${candidate.activityScore}/100 activity score.`
    
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
      suggestions.push("Search by university: 'Computer Science students at AUD'")
      suggestions.push("Look for 'active users' or 'highly engaged candidates'")
    }
    
    suggestions.push("Try: 'Business students at American University of Dubai'")
    suggestions.push("Try: 'Computer Science students with high activity'")
    suggestions.push("Try: 'Marketing students ready for internships'")
    
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