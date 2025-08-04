import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DatabaseInsight {
  field: string
  uniqueValues: string[]
  patterns: string[]
  suggestedTags: string[]
  frequency: { [key: string]: number }
}

interface StudentProfile {
  id: string
  university?: string | null
  major?: string | null
  skills?: string[]
  goal?: string[]
  location?: string | null
  graduationYear?: number | null
  education?: string | null
  bio?: string | null
  interests?: string[]
}

interface SmartTag {
  id: string
  category: string
  value: string
  aliases: string[]
  frequency: number
  relatedTags: string[]
}

export class AIDatabaseAnalyzer {
  private static DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  private static DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

  /**
   * Analyze entire student database and create intelligent tags
   * Results are cached in memory and optionally saved to file system
   */
  static async analyzeDatabase(): Promise<{
    insights: DatabaseInsight[]
    smartTags: SmartTag[]
    recommendations: string[]
    metadata: {
      timestamp: string
      studentsAnalyzed: number
      fieldsAnalyzed: string[]
    }
  }> {
    console.log('🔍 Starting comprehensive database analysis...')

    // Get all student data
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        university: true,
        major: true,
        skills: true,
        goal: true,
        location: true,
        graduationYear: true,
        education: true,
        bio: true,
        interests: true
      }
    })

    console.log(`📊 Analyzing ${students.length} student profiles...`)

    // Analyze each field
    const insights: DatabaseInsight[] = []
    const fieldsToAnalyze = [
      'university', 'major', 'skills', 'goal', 
      'location', 'graduationYear', 'education', 'interests'
    ]

    for (const field of fieldsToAnalyze) {
      const insight = await this.analyzeField(students, field)
      insights.push(insight)
    }

    // Generate smart tags using AI
    const smartTags = await this.generateSmartTags(insights, students)

    // Get AI recommendations
    const recommendations = await this.getAIRecommendations(insights, smartTags)

    const analysisResult = {
      insights,
      smartTags,
      recommendations,
      metadata: {
        timestamp: new Date().toISOString(),
        studentsAnalyzed: students.length,
        fieldsAnalyzed: fieldsToAnalyze
      }
    }

    // Cache the results globally (in-memory cache)
    this.cacheAnalysisResults(analysisResult)

    console.log(`✅ Analysis completed: ${smartTags.length} tags created, ${insights.length} insights generated`)

    return analysisResult
  }

  /**
   * Cache analysis results in memory for fast access
   */
  private static analysisCache: {
    data: any
    timestamp: Date
    ttl: number // Time to live in milliseconds
  } | null = null

  private static cacheAnalysisResults(data: any): void {
    this.analysisCache = {
      data,
      timestamp: new Date(),
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    }
    console.log('💾 Analysis results cached for 24 hours')
  }

  /**
   * Get cached analysis results if available and not expired
   */
  static getCachedAnalysis(): any | null {
    if (!this.analysisCache) return null
    
    const now = new Date()
    const elapsed = now.getTime() - this.analysisCache.timestamp.getTime()
    
    if (elapsed > this.analysisCache.ttl) {
      console.log('🕒 Cached analysis expired, clearing cache')
      this.analysisCache = null
      return null
    }
    
    console.log('⚡ Using cached analysis results')
    return this.analysisCache.data
  }

  /**
   * Analyze a specific field across all students
   */
  private static async analyzeField(students: StudentProfile[], fieldName: string): Promise<DatabaseInsight> {
    console.log(`🔍 Analyzing field: ${fieldName}`)

    const values: string[] = []
    const frequency: { [key: string]: number } = {}

    students.forEach(student => {
      const value = (student as any)[fieldName]
      if (value) {
        if (Array.isArray(value)) {
          // Handle array fields like skills, goal, interests
          value.forEach(item => {
            if (typeof item === 'string') {
              const cleanValue = item.trim().toLowerCase()
              if (cleanValue) {
                values.push(cleanValue)
                frequency[cleanValue] = (frequency[cleanValue] || 0) + 1
              }
            }
          })
        } else if (typeof value === 'string') {
          const cleanValue = value.trim().toLowerCase()
          if (cleanValue) {
            values.push(cleanValue)
            frequency[cleanValue] = (frequency[cleanValue] || 0) + 1
          }
        } else if (typeof value === 'number') {
          // Handle graduationYear
          const stringValue = value.toString()
          values.push(stringValue)
          frequency[stringValue] = (frequency[stringValue] || 0) + 1
        }
      }
    })

    const uniqueValues = [...new Set(values)]
    const patterns = this.extractPatterns(uniqueValues)
    const suggestedTags = await this.generateTagsForField(fieldName, uniqueValues.slice(0, 20))

    return {
      field: fieldName,
      uniqueValues: uniqueValues.slice(0, 50), // Limit for performance
      patterns,
      suggestedTags,
      frequency
    }
  }

  /**
   * Extract patterns from text values
   */
  private static extractPatterns(values: string[]): string[] {
    const patterns: string[] = []

    // Common word patterns
    const wordCounts: { [word: string]: number } = {}
    values.forEach(value => {
      const words = value.split(/\s+/)
      words.forEach(word => {
        if (word.length > 2) {
          wordCounts[word] = (wordCounts[word] || 0) + 1
        }
      })
    })

    // Find frequently used words
    Object.entries(wordCounts)
      .filter(([_, count]) => count >= 3)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .forEach(([word, count]) => {
        patterns.push(`Common word: "${word}" (${count} times)`)
      })

    return patterns
  }

  /**
   * Generate tags for a specific field using AI
   */
  private static async generateTagsForField(fieldName: string, sampleValues: string[]): Promise<string[]> {
    if (!this.DEEPSEEK_API_KEY) {
      console.log('⚠️ No DeepSeek API key, using fallback tags')
      return this.getFallbackTags(fieldName)
    }

    try {
      const prompt = `
Analyze these ${fieldName} values from a student database and suggest standardized tags:

Sample values: ${sampleValues.join(', ')}

Create 10-15 standardized tags that would help categorize and group these values effectively.
Focus on:
- Grouping similar concepts
- Creating searchable categories
- Handling variations and typos
- Making tags useful for company recruitment

Return only a JSON array of strings, no explanation.
Example: ["technology", "business", "engineering", "design"]
`

      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a data analysis expert. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(15000)
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        return JSON.parse(content)
      }
    } catch (error) {
      console.error(`❌ AI tag generation failed for ${fieldName}:`, error)
    }

    return this.getFallbackTags(fieldName)
  }

  /**
   * Fallback tags when AI is unavailable
   */
  private static getFallbackTags(fieldName: string): string[] {
    const fallbackTags = {
      university: ['technology_focused', 'business_school', 'traditional_university', 'art_design', 'medical'],
      major: ['technology', 'business', 'engineering', 'design', 'science', 'arts', 'medical'],
      skills: ['technical', 'creative', 'analytical', 'communication', 'leadership', 'language'],
      goal: ['internship', 'full_time', 'freelance', 'startup', 'learning', 'networking'],
      location: ['dubai', 'sharjah', 'abu_dhabi', 'uae', 'international'],
      graduationYear: ['2024', '2025', '2026', '2027', 'recent_graduate', 'current_student'],
      education: ['high_school', 'undergraduate', 'graduate', 'diploma', 'certification'],
      interests: ['technology', 'business', 'arts', 'sports', 'travel', 'social_impact']
    }

    return fallbackTags[fieldName as keyof typeof fallbackTags] || ['general']
  }

  /**
   * Generate comprehensive smart tags using AI analysis
   */
  private static async generateSmartTags(insights: DatabaseInsight[], students: StudentProfile[]): Promise<SmartTag[]> {
    console.log('🧠 Generating smart tags from insights...')

    const smartTags: SmartTag[] = []
    let tagId = 1

    for (const insight of insights) {
      for (const tag of insight.suggestedTags) {
        // Find related values and create aliases
        const aliases = this.findAliases(tag, insight.uniqueValues)
        const frequency = this.calculateTagFrequency(tag, aliases, insight.frequency)

        smartTags.push({
          id: `tag_${tagId++}`,
          category: insight.field,
          value: tag,
          aliases,
          frequency,
          relatedTags: []
        })
      }
    }

    // Calculate related tags
    this.calculateRelatedTags(smartTags)

    return smartTags
  }

  /**
   * Find aliases for a tag based on similarity
   */
  private static findAliases(tag: string, values: string[]): string[] {
    const aliases: string[] = []
    const tagLower = tag.toLowerCase()

    values.forEach(value => {
      const valueLower = value.toLowerCase()
      if (valueLower.includes(tagLower) || tagLower.includes(valueLower)) {
        if (aliases.length < 5) { // Limit aliases
          aliases.push(value)
        }
      }
    })

    return aliases
  }

  /**
   * Calculate frequency for a tag based on its aliases
   */
  private static calculateTagFrequency(tag: string, aliases: string[], frequency: { [key: string]: number }): number {
    let totalFreq = 0
    aliases.forEach(alias => {
      totalFreq += frequency[alias.toLowerCase()] || 0
    })
    return totalFreq
  }

  /**
   * Calculate related tags based on co-occurrence
   */
  private static calculateRelatedTags(smartTags: SmartTag[]): void {
    // This is a simplified version - could be enhanced with more sophisticated analysis
    smartTags.forEach(tag => {
      const related = smartTags
        .filter(other => other.category !== tag.category && other.frequency > 0)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(t => t.value)

      tag.relatedTags = related
    })
  }

  /**
   * Get AI recommendations for improving data quality
   */
  private static async getAIRecommendations(insights: DatabaseInsight[], smartTags: SmartTag[]): Promise<string[]> {
    if (!this.DEEPSEEK_API_KEY) {
      return [
        'Add data validation for university names',
        'Standardize major field descriptions', 
        'Implement skill categorization',
        'Create location standardization'
      ]
    }

    try {
      const prompt = `
Based on this student database analysis, provide 5-8 actionable recommendations for improving data quality and search capabilities:

Field Analysis:
${insights.map(i => `- ${i.field}: ${i.uniqueValues.length} unique values, patterns: ${i.patterns.slice(0, 2).join(', ')}`).join('\n')}

Smart Tags Generated: ${smartTags.length} tags across ${insights.length} categories

Focus on:
- Data standardization opportunities
- Search improvement suggestions  
- User experience enhancements
- Matching algorithm improvements

Return only a JSON array of recommendation strings.
`

      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a database optimization expert. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(15000)
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        return JSON.parse(content)
      }
    } catch (error) {
      console.error('❌ AI recommendations failed:', error)
    }

    return [
      'Implement fuzzy matching for university names',
      'Create skill taxonomy with synonyms',
      'Add location hierarchy (city -> emirate -> country)',
      'Standardize experience level descriptions',
      'Group similar majors into broader categories',
      'Add intention priority ranking system'
    ]
  }

  /**
   * Smart search that uses AI to understand queries and match against tags
   */
  static async intelligentSearch(query: string, limit: number = 20): Promise<{
    students: any[]
    matchCriteria: string[]
    searchInsights: string[]
  }> {
    console.log(`🔍 Intelligent search for: "${query}"`)

    // Parse query using AI
    const searchCriteria = await this.parseSearchQuery(query)
    
    // Build flexible database query
    const students = await this.executeFlexibleSearch(searchCriteria, limit)
    
    // Generate insights about the search
    const searchInsights = await this.generateSearchInsights(query, searchCriteria, students.length)

    return {
      students,
      matchCriteria: searchCriteria,
      searchInsights
    }
  }

  /**
   * Parse natural language search query using AI
   */
  private static async parseSearchQuery(query: string): Promise<string[]> {
    if (!this.DEEPSEEK_API_KEY) {
      // Fallback: simple keyword extraction
      return query.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    }

    try {
      const prompt = `
Parse this recruitment search query into structured search criteria:

Query: "${query}"

Extract and categorize these elements:
- Universities/Schools mentioned
- Fields of study/majors
- Skills required
- Location preferences  
- Experience level
- Year/Grade level
- Specific interests or intentions

Return a JSON array of search criteria strings that can be matched against a student database.
Example: ["university:dubai", "major:computer_science", "location:uae", "skills:programming"]
`

      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a search query parser. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.2
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        return JSON.parse(content)
      }
    } catch (error) {
      console.error('❌ Query parsing failed:', error)
    }

    // Fallback
    return query.toLowerCase().split(/\s+/).filter(word => word.length > 2)
  }

  /**
   * Execute flexible search based on parsed criteria
   */
  private static async executeFlexibleSearch(criteria: string[], limit: number): Promise<any[]> {
    console.log('🔍 Executing flexible search with criteria:', criteria)

    // Build dynamic where conditions
    const conditions: any[] = []

    criteria.forEach(criterion => {
      if (criterion.includes(':')) {
        const [field, value] = criterion.split(':')
        conditions.push({
          [field]: {
            contains: value,
            mode: 'insensitive'
          }
        })
      } else {
                 // Free text search across multiple fields
         conditions.push({
           OR: [
             { skills: { has: criterion } },
             { major: { contains: criterion, mode: 'insensitive' } },
             { university: { contains: criterion, mode: 'insensitive' } },
             { bio: { contains: criterion, mode: 'insensitive' } },
             { interests: { has: criterion } },
             { goal: { has: criterion } },
             { education: { contains: criterion, mode: 'insensitive' } }
           ]
         })
      }
    })

    const whereClause = conditions.length > 0 ? { AND: conditions } : {}

    return await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...whereClause
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        skills: true,
        location: true,
        graduationYear: true,
        education: true,
        goal: true,
        bio: true,
        interests: true
      },
      take: limit
    })
  }

  /**
   * Generate insights about the search results
   */
  private static async generateSearchInsights(query: string, criteria: string[], resultCount: number): Promise<string[]> {
    const insights = [
      `Found ${resultCount} students matching your criteria`,
      `Search parsed into ${criteria.length} criteria: ${criteria.slice(0, 3).join(', ')}${criteria.length > 3 ? '...' : ''}`
    ]

    if (resultCount === 0) {
      insights.push('Try broader search terms or check spelling')
      insights.push('Consider searching for related skills or fields')
    } else if (resultCount < 5) {
      insights.push('Limited results - consider expanding search criteria')
    } else if (resultCount > 50) {
      insights.push('Many results found - consider adding more specific criteria')
    }

    return insights
  }
} 