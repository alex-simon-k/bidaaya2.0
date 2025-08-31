import { VectorEmbeddingService, StudentVector, SearchVector } from './vector-embedding-service'
import { PrismaClient } from '@prisma/client'
import { NextGenAITalentMatcher } from './ai-talent-matching-v2'

const prisma = new PrismaClient()

export interface VectorMatchResult {
  userId: string
  student: any
  vectorSimilarity: number
  profileMatch: number
  skillsMatch: number
  academicMatch: number
  overallScore: number
  matchReasons: string[]
  confidenceLevel: 'high' | 'medium' | 'low'
}

export interface VectorSearchParams {
  companyId: string
  searchQuery: string
  limit?: number
  threshold?: number
  includeRuleBasedBackup?: boolean
}

export class VectorMatchingService {
  private static readonly DEFAULT_THRESHOLD = 0.6
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.8
  private static readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.7

  /**
   * Main vector-based talent search
   */
  static async searchTalentWithVectors(params: VectorSearchParams): Promise<{
    vectorMatches: VectorMatchResult[]
    searchMetadata: any
    fallbackUsed: boolean
  }> {
    const startTime = Date.now()
    
    try {
      console.log(`🔮 Vector-based talent search: "${params.searchQuery}"`)

      // Generate search embedding
      const searchVector = await VectorEmbeddingService.generateSearchEmbedding(
        params.searchQuery, 
        params.companyId
      )

      if (!searchVector) {
        throw new Error('Failed to generate search embedding')
      }

      // Get all student vectors (in production, this would be optimized with a vector database)
      const studentVectors = await this.getAllStudentVectors()
      
      if (studentVectors.length === 0) {
        console.log('⚠️ No student vectors found, falling back to rule-based matching')
        return await this.fallbackToRuleBasedMatching(params)
      }

      // Calculate similarities and rank
      const vectorMatches = await this.calculateVectorMatches(
        searchVector.queryVector,
        studentVectors,
        params
      )

      // Filter by threshold
      const filteredMatches = vectorMatches.filter(
        match => match.vectorSimilarity >= (params.threshold || this.DEFAULT_THRESHOLD)
      )

      // Limit results
      const limitedMatches = filteredMatches.slice(0, params.limit || 20)

      const processingTime = Date.now() - startTime
      
      console.log(`✅ Vector search complete: ${limitedMatches.length} matches found in ${processingTime}ms`)

      return {
        vectorMatches: limitedMatches,
        searchMetadata: {
          processingTime,
          totalVectors: studentVectors.length,
          matchesFound: filteredMatches.length,
          threshold: params.threshold || this.DEFAULT_THRESHOLD,
          searchQuery: params.searchQuery,
          searchVector: searchVector,
        },
        fallbackUsed: false
      }

    } catch (error) {
      console.error('❌ Vector search failed:', error)
      
      if (params.includeRuleBasedBackup !== false) {
        console.log('🔄 Falling back to rule-based matching')
        return await this.fallbackToRuleBasedMatching(params)
      } else {
        throw error
      }
    }
  }

  /**
   * Hybrid search combining vector and rule-based matching
   */
  static async hybridTalentSearch(params: VectorSearchParams): Promise<{
    hybridMatches: any[]
    vectorContribution: number
    ruleBasedContribution: number
    searchMetadata: any
  }> {
    try {
      console.log(`🔀 Hybrid talent search: "${params.searchQuery}"`)

      // Run both vector and rule-based searches in parallel
      const [vectorResult, ruleBasedResult] = await Promise.all([
        this.searchTalentWithVectors({
          ...params,
          includeRuleBasedBackup: false
        }).catch(error => {
          console.warn('Vector search failed in hybrid mode:', error)
          return { vectorMatches: [], searchMetadata: {}, fallbackUsed: false }
        }),
        this.runRuleBasedSearch(params).catch(error => {
          console.warn('Rule-based search failed in hybrid mode:', error)
          return { matches: [] }
        })
      ])

      // Combine and deduplicate results
      const hybridMatches = this.combineSearchResults(
        vectorResult.vectorMatches || [],
        ruleBasedResult.matches || []
      )

      // Calculate contribution percentages
      const vectorContribution = vectorResult.vectorMatches?.length || 0
      const ruleBasedContribution = ruleBasedResult.matches?.length || 0
      const totalResults = hybridMatches.length

      return {
        hybridMatches,
        vectorContribution: totalResults > 0 ? (vectorContribution / totalResults) * 100 : 0,
        ruleBasedContribution: totalResults > 0 ? (ruleBasedContribution / totalResults) * 100 : 0,
        searchMetadata: {
          ...vectorResult.searchMetadata,
          hybridApproach: true,
          vectorResults: vectorContribution,
          ruleBasedResults: ruleBasedContribution,
          totalHybridResults: totalResults
        }
      }

    } catch (error) {
      console.error('❌ Hybrid search failed:', error)
      throw error
    }
  }

  /**
   * Generate embeddings for a new student
   */
  static async onboardNewStudent(userId: string): Promise<boolean> {
    try {
      console.log(`🎓 Onboarding new student with vector embeddings: ${userId}`)

      const studentVector = await VectorEmbeddingService.generateStudentEmbeddings(userId)
      
      if (studentVector) {
        await this.storeStudentVector(studentVector)
        console.log(`✅ Student ${userId} onboarded with vectors`)
        return true
      } else {
        console.log(`❌ Failed to generate vectors for student ${userId}`)
        return false
      }

    } catch (error) {
      console.error('❌ Error onboarding student:', error)
      return false
    }
  }

  /**
   * Update student vectors when profile changes
   */
  static async updateStudentVectors(userId: string): Promise<boolean> {
    try {
      console.log(`🔄 Updating vectors for student: ${userId}`)

      // Check if student has significant profile changes
      const needsUpdate = await this.checkIfStudentNeedsVectorUpdate(userId)
      
      if (needsUpdate) {
        const updatedVector = await VectorEmbeddingService.generateStudentEmbeddings(userId)
        
        if (updatedVector) {
          await this.storeStudentVector(updatedVector)
          console.log(`✅ Updated vectors for student ${userId}`)
          return true
        }
      } else {
        console.log(`ℹ️ Student ${userId} vectors are up to date`)
        return true
      }

      return false

    } catch (error) {
      console.error('❌ Error updating student vectors:', error)
      return false
    }
  }

  /**
   * Calculate vector matches between search query and student profiles
   */
  private static async calculateVectorMatches(
    queryVector: number[],
    studentVectors: StudentVector[],
    params: VectorSearchParams
  ): Promise<VectorMatchResult[]> {
    const matches: VectorMatchResult[] = []

    // Get full student data for matched students
    const studentIds = studentVectors.map(v => v.userId)
    const students = await prisma.user.findMany({
      where: { 
        id: { in: studentIds },
        role: 'STUDENT'
      },
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
        profileCompleted: true,
        createdAt: true,
      }
    })

    const studentMap = new Map(students.map(s => [s.id, s]))

    for (const vector of studentVectors) {
      try {
        const student = studentMap.get(vector.userId)
        if (!student) continue

        // Calculate different similarity scores
        const profileSimilarity = VectorEmbeddingService.calculateCosineSimilarity(
          queryVector, 
          vector.profileVector
        )
        const skillsSimilarity = VectorEmbeddingService.calculateCosineSimilarity(
          queryVector, 
          vector.skillsVector
        )
        const academicSimilarity = VectorEmbeddingService.calculateCosineSimilarity(
          queryVector, 
          vector.academicVector
        )

        // Weighted overall score (profile is most important)
        const overallScore = (profileSimilarity * 0.5) + (skillsSimilarity * 0.3) + (academicSimilarity * 0.2)

        // Determine confidence level
        const confidenceLevel = this.determineConfidenceLevel(overallScore)

        // Generate match reasons
        const matchReasons = this.generateMatchReasons(
          profileSimilarity,
          skillsSimilarity,
          academicSimilarity,
          student
        )

        matches.push({
          userId: vector.userId,
          student,
          vectorSimilarity: overallScore,
          profileMatch: profileSimilarity,
          skillsMatch: skillsSimilarity,
          academicMatch: academicSimilarity,
          overallScore: overallScore * 100, // Convert to percentage
          matchReasons,
          confidenceLevel
        })

      } catch (error) {
        console.warn(`⚠️ Error calculating match for student ${vector.userId}:`, error)
        continue
      }
    }

    // Sort by overall score (highest first)
    return matches.sort((a, b) => b.overallScore - a.overallScore)
  }

  /**
   * Combine vector and rule-based search results
   */
  private static combineSearchResults(
    vectorMatches: VectorMatchResult[],
    ruleBasedMatches: any[]
  ): any[] {
    const combined = new Map()

    // Add vector matches
    vectorMatches.forEach(match => {
      combined.set(match.userId, {
        ...match,
        searchType: 'vector',
        hybridScore: match.overallScore
      })
    })

    // Add rule-based matches (avoid duplicates)
    ruleBasedMatches.forEach(match => {
      if (!combined.has(match.studentId || match.candidate?.id)) {
        combined.set(match.studentId || match.candidate?.id, {
          ...match,
          searchType: 'rule-based',
          hybridScore: match.overallScore || match.aiScore || 50
        })
      } else {
        // Boost score for matches found by both methods
        const existing = combined.get(match.studentId || match.candidate?.id)
        existing.hybridScore = Math.min(100, existing.hybridScore * 1.2)
        existing.searchType = 'hybrid'
      }
    })

    // Sort by hybrid score
    return Array.from(combined.values()).sort((a, b) => b.hybridScore - a.hybridScore)
  }

  /**
   * Fallback to rule-based matching when vectors aren't available
   */
  private static async fallbackToRuleBasedMatching(params: VectorSearchParams) {
    console.log('🔄 Using rule-based matching as fallback')
    
    try {
      const ruleBasedResult = await NextGenAITalentMatcher.searchTalent({
        companyId: params.companyId,
        prompt: params.searchQuery,
        tier: 'FREE', // Default tier for fallback
        maxResults: params.limit || 20
      })

      return {
        vectorMatches: ruleBasedResult.matches.map(match => ({
          userId: match.candidate.id,
          student: match.candidate,
          vectorSimilarity: 0, // No vector similarity available
          profileMatch: match.relevanceScore / 100,
          skillsMatch: match.relevanceScore / 100,
          academicMatch: match.relevanceScore / 100,
          overallScore: match.overallScore,
          matchReasons: match.matchReasons || [],
          confidenceLevel: 'medium' as const
        })),
        searchMetadata: {
          ...ruleBasedResult.searchMetadata,
          fallbackUsed: true,
          searchMethod: 'rule-based'
        },
        fallbackUsed: true
      }

    } catch (error) {
      console.error('❌ Fallback search also failed:', error)
      throw error
    }
  }

  /**
   * Run rule-based search for hybrid approach
   */
  private static async runRuleBasedSearch(params: VectorSearchParams): Promise<{ matches: any[] }> {
    const result = await NextGenAITalentMatcher.searchTalent({
      companyId: params.companyId,
      prompt: params.searchQuery,
      tier: 'FREE',
      maxResults: params.limit || 20
    })

    return { matches: result.matches }
  }

  /**
   * Get all student vectors from database
   */
  private static async getAllStudentVectors(): Promise<StudentVector[]> {
    try {
      const dbVectors = await prisma.studentVector.findMany({
        orderBy: { lastUpdated: 'desc' }
      })

      return dbVectors.map(dbVector => ({
        userId: dbVector.userId,
        profileVector: dbVector.profileVector as number[],
        skillsVector: dbVector.skillsVector as number[],
        academicVector: dbVector.academicVector as number[],
        lastUpdated: dbVector.lastUpdated,
        vectorVersion: dbVector.vectorVersion,
      }))
    } catch (error) {
      console.error('❌ Error fetching student vectors:', error)
      return []
    }
  }

  /**
   * Store student vector in database
   */
  private static async storeStudentVector(vector: StudentVector): Promise<void> {
    try {
      await prisma.studentVector.upsert({
        where: { userId: vector.userId },
        update: {
          profileVector: vector.profileVector,
          skillsVector: vector.skillsVector,
          academicVector: vector.academicVector,
          vectorVersion: vector.vectorVersion,
          lastUpdated: vector.lastUpdated,
        },
        create: {
          userId: vector.userId,
          profileVector: vector.profileVector,
          skillsVector: vector.skillsVector,
          academicVector: vector.academicVector,
          vectorVersion: vector.vectorVersion,
          lastUpdated: vector.lastUpdated,
        },
      })
      
      console.log(`✅ Vector stored for student: ${vector.userId}`)
    } catch (error) {
      console.error(`❌ Error storing student vector:`, error)
      throw error
    }
  }

  /**
   * Check if student needs vector update
   */
  private static async checkIfStudentNeedsVectorUpdate(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { updatedAt: true }
      })

      const existingVector = await prisma.studentVector.findUnique({
        where: { userId },
        select: { lastUpdated: true, vectorVersion: true }
      })

      if (!existingVector) {
        return true // No vector exists, needs generation
      }

      // Check if profile was updated after vector generation
      if (user && user.updatedAt > existingVector.lastUpdated) {
        return true
      }

      // Check if vector version is outdated
      if (existingVector.vectorVersion !== 'v1.0') {
        return true
      }

      // Check if vector is older than 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      if (existingVector.lastUpdated < thirtyDaysAgo) {
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Error checking vector update need:', error)
      return true // Default to updating on error
    }
  }

  /**
   * Determine confidence level based on similarity score
   */
  private static determineConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= this.HIGH_CONFIDENCE_THRESHOLD) return 'high'
    if (score >= this.MEDIUM_CONFIDENCE_THRESHOLD) return 'medium'
    return 'low'
  }

  /**
   * Generate match reasons based on similarity scores
   */
  private static generateMatchReasons(
    profileSim: number,
    skillsSim: number,
    academicSim: number,
    student: any
  ): string[] {
    const reasons: string[] = []

    if (profileSim > 0.8) {
      reasons.push('Excellent overall profile match')
    } else if (profileSim > 0.7) {
      reasons.push('Strong profile alignment')
    }

    if (skillsSim > 0.8) {
      reasons.push('Highly relevant skills')
    } else if (skillsSim > 0.7) {
      reasons.push('Good skills match')
    }

    if (academicSim > 0.8) {
      reasons.push('Perfect academic background')
    } else if (academicSim > 0.7) {
      reasons.push('Relevant academic experience')
    }

    if (student.skills && student.skills.length > 5) {
      reasons.push('Diverse skill set')
    }

    if (student.university && student.university.toLowerCase().includes('university')) {
      reasons.push('University-level education')
    }

    return reasons.length > 0 ? reasons : ['Basic profile match']
  }
}

/**
 * API Endpoints for Vector Matching
 */
export class VectorMatchingAPI {
  /**
   * Initialize vector system for new student
   */
  static async POST_initializeStudentVectors(userId: string) {
    return await VectorMatchingService.onboardNewStudent(userId)
  }

  /**
   * Vector-based talent search endpoint
   */
  static async POST_vectorTalentSearch(params: VectorSearchParams) {
    return await VectorMatchingService.searchTalentWithVectors(params)
  }

  /**
   * Hybrid search endpoint
   */
  static async POST_hybridTalentSearch(params: VectorSearchParams) {
    return await VectorMatchingService.hybridTalentSearch(params)
  }

  /**
   * Batch generate embeddings
   */
  static async POST_generateAllEmbeddings() {
    return await VectorEmbeddingService.generateAllStudentEmbeddings()
  }

  /**
   * Update student vectors
   */
  static async PUT_updateStudentVectors(userId: string) {
    return await VectorMatchingService.updateStudentVectors(userId)
  }
}
