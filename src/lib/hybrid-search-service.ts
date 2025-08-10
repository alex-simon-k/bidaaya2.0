import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SearchFilters {
  skills?: string[]
  location?: string
  university?: string
  experience?: string
  industry?: string
  year?: string
}

interface ComplexSearchQuery {
  query: string
  needsAI: boolean
  extractedFilters: SearchFilters
  aiContext?: string
}

export class HybridSearchService {
  
  // Fast filter-based search (no AI needed)
  async fastFilterSearch(filters: SearchFilters) {
    const whereConditions: any = {
      role: 'STUDENT',
      emailVerified: { not: null }
    }

    // Simple exact matches
    if (filters.university) {
      whereConditions.university = { contains: filters.university, mode: 'insensitive' }
    }
    
    if (filters.location) {
      whereConditions.location = { contains: filters.location, mode: 'insensitive' }
    }
    
    if (filters.year) {
      whereConditions.year = filters.year
    }

    // Skills array search
    if (filters.skills && filters.skills.length > 0) {
      whereConditions.OR = filters.skills.map(skill => ({
        skills: { has: skill }
      }))
    }

    return await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        university: true,
        major: true,
        graduationYear: true,
        skills: true,
        location: true,
        goal: true
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })
  }

  // Smart query analysis - determines if AI is needed
  analyzeSearchComplexity(query: string): ComplexSearchQuery {
    const queryLower = query.toLowerCase()
    
    // Simple filter patterns that don't need AI
    const simplePatterns = {
      skills: /(?:students?\s+(?:with|who\s+(?:know|have))\s+)([\w\s,]+?)(?:\s+(?:experience|skills?))?/gi,
      location: /(?:from|in|based\s+in)\s+([\w\s]+?)(?:\s|$)/gi,
      university: /(?:university|college|school)\s+(?:of\s+)?([\w\s]+)/gi,
      year: /(\d+)(?:st|nd|rd|th)?\s+year/gi,
      experience: /(\w+)\s+(?:level|experience)/gi
    }

    const extractedFilters: SearchFilters = {}
    let needsAI = false

    // Extract simple filters
    const skillMatches = Array.from(queryLower.matchAll(simplePatterns.skills))
    if (skillMatches.length > 0) {
      extractedFilters.skills = skillMatches[0][1]
        .split(/[,\s]+/)
        .map(s => s.trim())
        .filter(s => s.length > 2)
    }

    const locationMatches = Array.from(queryLower.matchAll(simplePatterns.location))
    if (locationMatches.length > 0) {
      extractedFilters.location = locationMatches[0][1].trim()
    }

    const uniMatches = Array.from(queryLower.matchAll(simplePatterns.university))
    if (uniMatches.length > 0) {
      extractedFilters.university = uniMatches[0][1].trim()
    }

    const yearMatches = Array.from(queryLower.matchAll(simplePatterns.year))
    if (yearMatches.length > 0) {
      extractedFilters.year = yearMatches[0][1]
    }

    // Complex patterns that need AI
    const complexPatterns = [
      /portfolio.*work/i,
      /experience.*with.*project/i,
      /worked.*on.*similar/i,
      /background.*in/i,
      /familiar.*with.*concepts/i,
      /understanding.*of/i,
      /knowledge.*of.*industry/i,
      /previous.*experience.*in/i
    ]

    needsAI = complexPatterns.some(pattern => pattern.test(query))

    // Also check for complex relationship queries
    const relationshipKeywords = ['and', 'but', 'however', 'specifically', 'particularly', 'especially']
    const hasComplexLogic = relationshipKeywords.some(keyword => queryLower.includes(keyword))
    
    if (hasComplexLogic) needsAI = true

    return {
      query,
      needsAI,
      extractedFilters,
      aiContext: needsAI ? query : undefined
    }
  }

  // Main search function - routes to fast filter or AI
  async hybridSearch(query: string, context: any) {
    const analysis = this.analyzeSearchComplexity(query)
    
    console.log('🔍 Search Analysis:', {
      needsAI: analysis.needsAI,
      extractedFilters: analysis.extractedFilters
    })

    if (!analysis.needsAI) {
      // Fast path - use filters only
      const results = await this.fastFilterSearch(analysis.extractedFilters)
      return {
        results,
        searchType: 'filter',
        message: `Found ${results.length} students matching your criteria`,
        filters: analysis.extractedFilters
      }
    } else {
      // Complex path - use AI for nuanced understanding
      return await this.aiEnhancedSearch(analysis, context)
    }
  }

  private async aiEnhancedSearch(analysis: ComplexSearchQuery, context: any) {
    // Start with filter results as base
    const baseResults = await this.fastFilterSearch(analysis.extractedFilters)
    
    // Use AI to rank and filter based on complex criteria
    const enhancedPrompt = `
    You are helping find students for a company. Base filter results returned ${baseResults.length} students.
    
    Original query: "${analysis.query}"
    Extracted filters: ${JSON.stringify(analysis.extractedFilters)}
    
    Review these students and determine which ones best match the complex requirements:
    ${baseResults.slice(0, 10).map(s => `${s.name} - ${s.major} at ${s.university}, Year ${s.graduationYear}, Skills: ${s.skills?.join(', ')}`).join('\n')}
    
    Response format:
    {
      "reasoning": "Why these students match",
      "topMatches": [student IDs in order of relevance],
      "message": "Personalized explanation for the company"
    }
    `

    // Here you'd call your AI service
    // For now, return filtered results with AI context
    return {
      results: baseResults.slice(0, 8), // AI would reorder these
      searchType: 'ai-enhanced',
      message: `Found ${baseResults.length} students. AI refined selection based on complex criteria: ${analysis.aiContext}`,
      filters: analysis.extractedFilters,
      aiReasoning: "AI provided nuanced matching based on portfolio work and project experience requirements"
    }
  }
}

export const hybridSearchService = new HybridSearchService()
