import { VectorEmbeddingService } from './vector-embedding-service'
import { VectorMatchingService } from './vector-matching-service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface UnifiedMatchParams {
  // Company search context
  companyId: string
  searchPrompt: string
  
  // Project context (for shortlisting)
  projectId?: string
  projectDescription?: string
  projectRequirements?: string[]
  
  // Matching options
  includeApplicationData?: boolean
  limit?: number
  threshold?: number
  matchingMode: 'company_search' | 'project_shortlisting' | 'hybrid'
}

export interface UnifiedMatchResult {
  userId: string
  student: any
  application?: any // Only included for project shortlisting
  
  // Unified scoring
  overallScore: number
  profileMatchScore: number
  skillsMatchScore: number
  projectAlignmentScore: number
  applicationQualityScore?: number
  
  // Vector scores
  vectorSimilarity: number
  promptMatchScore: number
  projectMatchScore?: number
  
  // Explanation
  matchReasons: string[]
  confidenceLevel: 'high' | 'medium' | 'low'
  recommendedAction: 'shortlist' | 'consider' | 'review' | 'pass'
}

/**
 * Unified Matching Service
 * 
 * This service provides consistent matching logic across:
 * 1. Company talent search (search bar)
 * 2. Project application shortlisting 
 * 3. Hybrid matching (prompt + project)
 */
export class UnifiedMatchingService {
  
  /**
   * Main unified matching function
   */
  static async findMatches(params: UnifiedMatchParams): Promise<{
    matches: UnifiedMatchResult[]
    searchMetadata: any
    usesCreditSystem: boolean
  }> {
    const startTime = Date.now()
    
    try {
      console.log(`🎯 Unified matching: ${params.matchingMode}`)
      console.log(`🔍 Search prompt: "${params.searchPrompt}"`)
      if (params.projectId) {
        console.log(`📋 Project context: ${params.projectId}`)
      }

      // Step 1: Create combined matching context
      const matchingContext = await this.createMatchingContext(params)
      
      // Step 2: Get candidate pool based on mode
      const candidates = await this.getCandidatePool(params)
      
      // Step 3: Generate unified embeddings for matching
      const matchingVectors = await this.generateMatchingVectors(matchingContext)
      
      // Step 4: Score candidates using unified approach
      const matches = await this.scoreAndRankCandidates(
        candidates, 
        matchingVectors, 
        matchingContext,
        params
      )
      
      // Step 5: Apply filtering and limits
      const filteredMatches = matches
        .filter(match => match.overallScore >= (params.threshold || 60))
        .slice(0, params.limit || 20)

      const processingTime = Date.now() - startTime
      
      // Determine if this uses credit system (only for company search, not shortlisting)
      const usesCreditSystem = params.matchingMode === 'company_search'
      
      console.log(`✅ Unified matching complete: ${filteredMatches.length} matches in ${processingTime}ms`)

      return {
        matches: filteredMatches,
        searchMetadata: {
          processingTime,
          candidatesEvaluated: candidates.length,
          matchingMode: params.matchingMode,
          usesCreditSystem,
          vectorsUsed: !!matchingVectors,
          timestamp: new Date()
        },
        usesCreditSystem
      }

    } catch (error) {
      console.error('❌ Unified matching error:', error)
      throw error
    }
  }

  /**
   * Specific method for company talent search (search bar)
   */
  static async searchTalent(params: {
    companyId: string
    searchPrompt: string
    limit?: number
    threshold?: number
  }) {
    return await this.findMatches({
      ...params,
      matchingMode: 'company_search'
    })
  }

  /**
   * Specific method for project shortlisting
   */
  static async shortlistForProject(params: {
    companyId: string
    projectId: string
    searchPrompt?: string
    limit?: number
    threshold?: number
  }) {
    // Get project details to create comprehensive matching context
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: {
        title: true,
        description: true,
        skillsRequired: true,
        requirements: true,
        category: true,
        experienceLevel: true
      }
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Create enhanced prompt combining search query + project details
    const enhancedPrompt = params.searchPrompt 
      ? `${params.searchPrompt}. Project: ${project.title}. ${project.description}. Required skills: ${project.skillsRequired?.join(', ')}`
      : `Find candidates for: ${project.title}. ${project.description}. Required skills: ${project.skillsRequired?.join(', ')}. Requirements: ${project.requirements?.join(', ')}`

    return await this.findMatches({
      companyId: params.companyId,
      searchPrompt: enhancedPrompt,
      projectId: params.projectId,
      projectDescription: project.description,
      projectRequirements: project.requirements || [],
      includeApplicationData: true,
      matchingMode: 'project_shortlisting',
      limit: params.limit,
      threshold: params.threshold
    })
  }

  /**
   * Create comprehensive matching context
   */
  private static async createMatchingContext(params: UnifiedMatchParams): Promise<{
    searchPrompt: string
    projectContext?: any
    companyContext: any
    enhancedPrompt: string
  }> {
    // Get company context
    const company = await prisma.user.findUnique({
      where: { id: params.companyId },
      select: {
        companyName: true,
        industry: true,
        companySize: true,
        companyGoals: true,
        companyOneLiner: true
      }
    })

    let projectContext = null
    if (params.projectId) {
      projectContext = await prisma.project.findUnique({
        where: { id: params.projectId },
        select: {
          title: true,
          description: true,
          skillsRequired: true,
          requirements: true,
          category: true,
          experienceLevel: true,
          timeCommitment: true,
          location: true
        }
      })
    }

    // Create enhanced prompt that combines everything
    let enhancedPrompt = params.searchPrompt

    if (company) {
      enhancedPrompt += ` Company: ${company.companyName || 'Company'} in ${company.industry || 'various industries'}.`
      if (company.companyOneLiner) {
        enhancedPrompt += ` ${company.companyOneLiner}.`
      }
    }

    if (projectContext) {
      enhancedPrompt += ` Project: ${projectContext.title}. ${projectContext.description}.`
      if (projectContext.skillsRequired?.length) {
        enhancedPrompt += ` Required skills: ${projectContext.skillsRequired.join(', ')}.`
      }
      if (projectContext.requirements?.length) {
        enhancedPrompt += ` Requirements: ${projectContext.requirements.join(', ')}.`
      }
    }

    return {
      searchPrompt: params.searchPrompt,
      projectContext,
      companyContext: company,
      enhancedPrompt
    }
  }

  /**
   * Get candidate pool based on matching mode
   */
  private static async getCandidatePool(params: UnifiedMatchParams): Promise<any[]> {
    let whereClause: any = { role: 'STUDENT' }

    if (params.matchingMode === 'project_shortlisting' && params.projectId) {
      // For shortlisting, only get students who applied to this project
      const applications = await prisma.application.findMany({
        where: { projectId: params.projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              bio: true,
              skills: true,
              university: true,
              major: true,
              interests: true,
              goal: true,
              location: true,
              graduationYear: true,
              linkedin: true,
            }
          }
        }
      })

      return applications.map(app => ({
        ...app.user,
        application: {
          id: app.id,
          status: app.status,
          createdAt: app.createdAt,
          coverLetter: app.coverLetter,
          whyInterested: app.whyInterested,
          proposedApproach: app.proposedApproach,
          relevantExperience: app.relevantExperience,
          compatibilityScore: app.compatibilityScore
        }
      }))
    } else {
      // For company search, get all students
      return await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          skills: true,
          university: true,
          major: true,
          interests: true,
          goal: true,
          location: true,
          graduationYear: true,
          linkedin: true,
          profileCompleted: true,
          createdAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 500 // Reasonable limit for processing
      })
    }
  }

  /**
   * Generate vectors for matching
   */
  private static async generateMatchingVectors(context: any): Promise<{
    promptVector: number[]
    projectVector?: number[]
  } | null> {
    try {
      // Generate vector for the enhanced prompt
      const promptSearchVector = await VectorEmbeddingService.generateSearchEmbedding(
        context.enhancedPrompt,
        'unified-matching'
      )

      if (!promptSearchVector) {
        return null
      }

      const result: any = {
        promptVector: promptSearchVector.queryVector
      }

      // If we have project context, generate a separate project vector
      if (context.projectContext) {
        const projectText = `${context.projectContext.title}. ${context.projectContext.description}. Skills: ${context.projectContext.skillsRequired?.join(', ') || 'General skills'}. Experience: ${context.projectContext.experienceLevel || 'Any level'}.`
        
        const projectSearchVector = await VectorEmbeddingService.generateSearchEmbedding(
          projectText,
          'project-matching'
        )

        if (projectSearchVector) {
          result.projectVector = projectSearchVector.queryVector
        }
      }

      return result
    } catch (error) {
      console.warn('⚠️ Vector generation failed, falling back to rule-based matching:', error)
      return null
    }
  }

  /**
   * Score and rank candidates using unified approach
   */
  private static async scoreAndRankCandidates(
    candidates: any[],
    matchingVectors: any,
    context: any,
    params: UnifiedMatchParams
  ): Promise<UnifiedMatchResult[]> {
    const results: UnifiedMatchResult[] = []

    for (const candidate of candidates) {
      try {
        const unifiedScore = await this.calculateUnifiedScore(
          candidate,
          matchingVectors,
          context,
          params
        )

        if (unifiedScore) {
          results.push(unifiedScore)
        }
      } catch (error) {
        console.warn(`⚠️ Error scoring candidate ${candidate.name}:`, error)
        continue
      }
    }

    // Sort by overall score (highest first)
    return results.sort((a, b) => b.overallScore - a.overallScore)
  }

  /**
   * Calculate unified score for a candidate
   */
  private static async calculateUnifiedScore(
    candidate: any,
    matchingVectors: any,
    context: any,
    params: UnifiedMatchParams
  ): Promise<UnifiedMatchResult | null> {
    
    // 1. Vector-based scoring (if available)
    let vectorSimilarity = 0
    let promptMatchScore = 0
    let projectMatchScore = 0

    if (matchingVectors) {
      // Get candidate's vectors
      const candidateVector = await prisma.studentVector.findUnique({
        where: { userId: candidate.id }
      })

      if (candidateVector) {
        const profileVector = candidateVector.profileVector as number[]
        
        // Calculate similarity with prompt
        promptMatchScore = VectorEmbeddingService.calculateCosineSimilarity(
          matchingVectors.promptVector,
          profileVector
        ) * 100

        // Calculate similarity with project (if available)
        if (matchingVectors.projectVector) {
          projectMatchScore = VectorEmbeddingService.calculateCosineSimilarity(
            matchingVectors.projectVector,
            profileVector
          ) * 100
        }

        vectorSimilarity = matchingVectors.projectVector 
          ? (promptMatchScore * 0.6 + projectMatchScore * 0.4)
          : promptMatchScore
      }
    }

    // 2. Rule-based scoring (fallback and supplement)
    const ruleBasedScores = this.calculateRuleBasedScores(candidate, context, params)

    // 3. Application quality scoring (for shortlisting)
    let applicationQualityScore = 0
    if (candidate.application && params.includeApplicationData) {
      applicationQualityScore = this.calculateApplicationQuality(candidate.application)
    }

    // 4. Combine scores with weights
    const weights = this.getScoreWeights(params.matchingMode, !!matchingVectors)
    
    const overallScore = Math.round(
      (vectorSimilarity * weights.vector) +
      (ruleBasedScores.profile * weights.profile) +
      (ruleBasedScores.skills * weights.skills) +
      (ruleBasedScores.project * weights.project) +
      (applicationQualityScore * weights.application)
    )

    // 5. Generate match reasons and confidence
    const matchReasons = this.generateMatchReasons(
      candidate,
      vectorSimilarity,
      ruleBasedScores,
      applicationQualityScore,
      context
    )

    const confidenceLevel = this.determineConfidenceLevel(overallScore, vectorSimilarity > 0)
    const recommendedAction = this.getRecommendedAction(overallScore, confidenceLevel)

    return {
      userId: candidate.id,
      student: candidate,
      application: candidate.application || undefined,
      
      overallScore,
      profileMatchScore: ruleBasedScores.profile,
      skillsMatchScore: ruleBasedScores.skills,
      projectAlignmentScore: ruleBasedScores.project,
      applicationQualityScore: applicationQualityScore || undefined,
      
      vectorSimilarity,
      promptMatchScore,
      projectMatchScore: projectMatchScore || undefined,
      
      matchReasons,
      confidenceLevel,
      recommendedAction
    }
  }

  /**
   * Calculate rule-based scores for backward compatibility
   */
  private static calculateRuleBasedScores(candidate: any, context: any, params: UnifiedMatchParams): {
    profile: number
    skills: number
    project: number
  } {
    const searchTerms: string[] = context.enhancedPrompt.toLowerCase().split(/\s+/)
    
    // Profile matching
    const profileText = `${candidate.bio || ''} ${candidate.university || ''} ${candidate.major || ''}`.toLowerCase()
    const profileMatches = searchTerms.filter((term: string) => profileText.includes(term)).length
    const profileScore = Math.min(100, (profileMatches / searchTerms.length) * 100 + 20)

    // Skills matching
    const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase())
    const skillMatches = searchTerms.filter((term: string) => 
      candidateSkills.some((skill: string) => skill.includes(term) || term.includes(skill))
    ).length
    const skillsScore = Math.min(100, (skillMatches / Math.max(searchTerms.length * 0.3, 1)) * 100 + 10)

    // Project-specific matching (if in shortlisting mode)
    let projectScore = 70 // Default
    if (context.projectContext) {
      const projectSkills = (context.projectContext.skillsRequired || []).map((s: string) => s.toLowerCase())
      const projectSkillMatches = projectSkills.filter((projSkill: string) =>
        candidateSkills.some((candSkill: string) => 
          candSkill.includes(projSkill) || projSkill.includes(candSkill)
        )
      ).length
      
      if (projectSkills.length > 0) {
        projectScore = Math.min(100, (projectSkillMatches / projectSkills.length) * 80 + 20)
      }
    }

    return {
      profile: Math.round(profileScore),
      skills: Math.round(skillsScore),
      project: Math.round(projectScore)
    }
  }

  /**
   * Calculate application quality for shortlisting
   */
  private static calculateApplicationQuality(application: any): number {
    let score = 50 // Base score

    // Cover letter quality
    if (application.coverLetter) {
      const length = application.coverLetter.length
      if (length > 200) score += 15
      else if (length > 100) score += 10
      else if (length > 50) score += 5
    }

    // Specific responses
    if (application.whyInterested) score += 10
    if (application.proposedApproach) score += 15
    if (application.relevantExperience) score += 10

    // Application recency
    const daysOld = (Date.now() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysOld < 7) score += 10
    else if (daysOld < 30) score += 5

    return Math.min(100, score)
  }

  /**
   * Get score weights based on matching mode
   */
  private static getScoreWeights(mode: string, hasVectors: boolean): {
    vector: number
    profile: number
    skills: number
    project: number
    application: number
  } {
    if (mode === 'project_shortlisting') {
      return hasVectors ? {
        vector: 0.35,      // Vector similarity
        profile: 0.20,     // Profile match
        skills: 0.20,      // Skills match
        project: 0.15,     // Project alignment
        application: 0.10  // Application quality
      } : {
        vector: 0,
        profile: 0.30,
        skills: 0.30,
        project: 0.25,
        application: 0.15
      }
    } else {
      // Company search mode
      return hasVectors ? {
        vector: 0.50,      // Vector similarity
        profile: 0.25,     // Profile match
        skills: 0.25,      // Skills match
        project: 0,        // Not applicable
        application: 0     // Not applicable
      } : {
        vector: 0,
        profile: 0.40,
        skills: 0.40,
        project: 0.20,
        application: 0
      }
    }
  }

  /**
   * Generate human-readable match reasons
   */
  private static generateMatchReasons(
    candidate: any,
    vectorSimilarity: number,
    ruleBasedScores: any,
    applicationQuality: number,
    context: any
  ): string[] {
    const reasons: string[] = []

    if (vectorSimilarity > 80) {
      reasons.push('Excellent semantic match with search criteria')
    } else if (vectorSimilarity > 70) {
      reasons.push('Strong profile alignment')
    }

    if (ruleBasedScores.skills > 80) {
      reasons.push('Highly relevant skills')
    } else if (ruleBasedScores.skills > 70) {
      reasons.push('Good skills match')
    }

    if (candidate.university) {
      reasons.push(`University education: ${candidate.university}`)
    }

    if (candidate.major && context.enhancedPrompt.toLowerCase().includes(candidate.major.toLowerCase())) {
      reasons.push(`Relevant major: ${candidate.major}`)
    }

    if (applicationQuality > 80) {
      reasons.push('High-quality application')
    } else if (applicationQuality > 70) {
      reasons.push('Well-written application')
    }

    if (candidate.skills && candidate.skills.length > 5) {
      reasons.push('Diverse skill set')
    }

    return reasons.length > 0 ? reasons : ['Basic profile match']
  }

  /**
   * Determine confidence level
   */
  private static determineConfidenceLevel(score: number, hasVectors: boolean): 'high' | 'medium' | 'low' {
    const threshold = hasVectors ? 10 : 5 // Higher confidence with vectors
    
    if (score >= 85 + threshold) return 'high'
    if (score >= 70 + threshold) return 'medium'
    return 'low'
  }

  /**
   * Get recommended action
   */
  private static getRecommendedAction(score: number, confidence: string): 'shortlist' | 'consider' | 'review' | 'pass' {
    if (score >= 85 && confidence === 'high') return 'shortlist'
    if (score >= 75) return 'consider'
    if (score >= 60) return 'review'
    return 'pass'
  }
}
