import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProcessedStudent {
  id: string
  name: string
  email: string
  university: string
  major: string
  skills: string[]
  location: string
  graduationYear: number
  interests: string[]
  goals: string[]
  
  // Processed fields
  universityCategory: string
  majorCategory: string
  skillCategories: string[]
  locationRegion: string
  experienceLevel: string
  
  // Activity scoring
  activityScore: number
  lastActiveDate: Date
  applicationCount: number
  responseRate: number
  profileCompleteness: number
  
  // Matching metadata
  searchableKeywords: string[]
  matchingTags: string[]
  overallScore: number
}

interface MatchingCriteria {
  query: string
  preferredLocations?: string[]
  skillRequirements?: string[]
  experienceLevel?: string
  universityTypes?: string[]
  majorCategories?: string[]
  activityThreshold?: number
}

interface MatchResult {
  student: ProcessedStudent
  matchScore: number
  matchReasons: string[]
  activityBonus: number
  keywordMatches: string[]
}

export class StudentProcessingEngine {
  private static DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  private static DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

  /**
   * Automatically process new/updated students (runs on user creation/update)
   */
  static async processStudent(userId: string): Promise<void> {
    console.log(`🔄 Auto-processing student: ${userId}`)

    try {
      // Get student data
      const user = await prisma.user.findUnique({
        where: { id: userId, role: 'STUDENT' },
        include: {
          applications: {
            select: {
              createdAt: true,
              project: {
                select: { companyId: true }
              }
            }
          }
        }
      })

      if (!user) {
        console.log(`❌ Student not found: ${userId}`)
        return
      }

      // Process and categorize student data
      const processedData = await this.categorizeStudent(user)
      
      // Calculate activity metrics
      const activityMetrics = this.calculateActivityMetrics(user)
      
      // Generate searchable keywords
      const searchableKeywords = this.generateSearchableKeywords(user, processedData)
      
      // Calculate overall matching score
      const overallScore = this.calculateOverallScore(processedData, activityMetrics)

      // Clear existing tags for this student
      await prisma.studentTag.deleteMany({
        where: { userId }
      })

      // Create new smart tags
      const tags = await this.generateSmartTags(processedData, searchableKeywords)
      
      for (const tag of tags) {
        // Create or get existing tag
        const smartTag = await prisma.smartTag.upsert({
          where: {
            category_value: {
              category: tag.category,
              value: tag.value
            }
          },
          create: {
            category: tag.category,
            value: tag.value,
            aliases: tag.aliases,
            frequency: 1
          },
          update: {
            frequency: {
              increment: 1
            }
          }
        })

        // Link student to tag
        await prisma.studentTag.create({
          data: {
            userId,
            tagId: smartTag.id,
            confidence: tag.confidence,
            source: 'auto_processing'
          }
        })
      }

      console.log(`✅ Student processed: ${userId} - ${tags.length} tags created`)

    } catch (error) {
      console.error(`❌ Error processing student ${userId}:`, error)
    }
  }

  /**
   * Categorize student data using AI
   */
  private static async categorizeStudent(user: any): Promise<any> {
    const categories = {
      universityCategory: this.categorizeUniversity(user.university),
      majorCategory: this.categorizeMajor(user.major),
      skillCategories: this.categorizeSkills(user.skills || []),
      locationRegion: this.categorizeLocation(user.location),
      experienceLevel: this.determineExperienceLevel(user)
    }

    // Use AI for more sophisticated categorization if available
    if (this.DEEPSEEK_API_KEY) {
      try {
        const aiCategories = await this.getAICategories(user)
        return { ...categories, ...aiCategories }
      } catch (error) {
        console.log('AI categorization failed, using rule-based fallback')
      }
    }

    return categories
  }

  /**
   * Rule-based categorization (fallback)
   */
  private static categorizeUniversity(university: string): string {
    if (!university) return 'unknown'
    const uni = university.toLowerCase()
    
    if (uni.includes('aud') || uni.includes('american university of dubai')) return 'aud'
    if (uni.includes('aus') || uni.includes('american university of sharjah')) return 'aus'
    if (uni.includes('uae') || uni.includes('emirates')) return 'uae_university'
    if (uni.includes('british') || uni.includes('heriot')) return 'british_system'
    if (uni.includes('high school') || uni.includes('secondary')) return 'high_school'
    
    return 'other_university'
  }

  private static categorizeMajor(major: string): string {
    if (!major) return 'unknown'
    const maj = major.toLowerCase()
    
    if (maj.includes('computer') || maj.includes('software') || maj.includes('cs')) return 'technology'
    if (maj.includes('business') || maj.includes('management') || maj.includes('mba')) return 'business'
    if (maj.includes('engineering') || maj.includes('engineer')) return 'engineering'
    if (maj.includes('design') || maj.includes('art') || maj.includes('creative')) return 'design'
    if (maj.includes('marketing') || maj.includes('communications')) return 'marketing'
    if (maj.includes('finance') || maj.includes('accounting')) return 'finance'
    
    return 'other'
  }

  private static categorizeSkills(skills: string[]): string[] {
    const categories: string[] = []
    const skillText = skills.join(' ').toLowerCase()
    
    if (skillText.includes('programming') || skillText.includes('coding') || skillText.includes('python') || skillText.includes('javascript')) {
      categories.push('programming')
    }
    if (skillText.includes('design') || skillText.includes('photoshop') || skillText.includes('figma')) {
      categories.push('design')
    }
    if (skillText.includes('marketing') || skillText.includes('social media') || skillText.includes('seo')) {
      categories.push('marketing')
    }
    if (skillText.includes('communication') || skillText.includes('presentation') || skillText.includes('writing')) {
      categories.push('communication')
    }
    if (skillText.includes('leadership') || skillText.includes('management') || skillText.includes('team')) {
      categories.push('leadership')
    }
    
    return categories.length > 0 ? categories : ['general']
  }

  private static categorizeLocation(location: string): string {
    if (!location) return 'unknown'
    const loc = location.toLowerCase()
    
    if (loc.includes('dubai')) return 'dubai'
    if (loc.includes('sharjah')) return 'sharjah'
    if (loc.includes('abu dhabi')) return 'abu_dhabi'
    if (loc.includes('uae') || loc.includes('emirates')) return 'uae'
    
    return 'international'
  }

  private static determineExperienceLevel(user: any): string {
    const currentYear = new Date().getFullYear()
    const gradYear = user.graduationYear
    
    if (!gradYear) return 'unknown'
    
    if (gradYear > currentYear + 2) return 'high_school'
    if (gradYear > currentYear) return 'current_student'
    if (gradYear >= currentYear - 2) return 'recent_graduate'
    
    return 'experienced'
  }

  /**
   * Calculate activity metrics for scoring
   */
  private static calculateActivityMetrics(user: any): any {
    const now = new Date()
    const lastActive = user.updatedAt || user.createdAt
    const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    
    const applicationCount = user.applications?.length || 0
    const uniqueCompanies = new Set(user.applications?.map((app: any) => app.project?.companyId) || []).size
    
    // Activity score (0-100)
    let activityScore = 100
    if (daysSinceActive > 30) activityScore -= 30
    else if (daysSinceActive > 7) activityScore -= 10
    
    if (applicationCount === 0) activityScore -= 20
    else if (applicationCount >= 5) activityScore += 10
    
    // Profile completeness
    let completeness = 0
    if (user.university) completeness += 20
    if (user.major) completeness += 20
    if (user.skills?.length > 0) completeness += 20
    if (user.bio) completeness += 20
    if (user.interests?.length > 0) completeness += 20
    
    return {
      activityScore: Math.max(0, Math.min(100, activityScore)),
      lastActiveDate: lastActive,
      applicationCount,
      responseRate: uniqueCompanies > 0 ? (applicationCount / uniqueCompanies) : 0,
      profileCompleteness: completeness,
      daysSinceActive
    }
  }

  /**
   * Generate searchable keywords from student data
   */
  private static generateSearchableKeywords(user: any, processedData: any): string[] {
    const keywords: string[] = []
    
    // Add all basic fields
    if (user.university) keywords.push(...user.university.toLowerCase().split(' '))
    if (user.major) keywords.push(...user.major.toLowerCase().split(' '))
    if (user.location) keywords.push(...user.location.toLowerCase().split(' '))
    
    // Add processed categories
    keywords.push(processedData.universityCategory)
    keywords.push(processedData.majorCategory)
    keywords.push(processedData.locationRegion)
    keywords.push(processedData.experienceLevel)
    keywords.push(...processedData.skillCategories)
    
    // Add skills and interests
    if (user.skills) keywords.push(...user.skills.map((s: string) => s.toLowerCase()))
    if (user.interests) keywords.push(...user.interests.map((i: string) => i.toLowerCase()))
    if (user.goal) keywords.push(...user.goal.map((g: string) => g.toLowerCase()))
    
    // Clean and deduplicate
    return [...new Set(keywords.filter(k => k.length > 2))]
  }

  /**
   * Calculate overall matching score
   */
  private static calculateOverallScore(processedData: any, activityMetrics: any): number {
    let score = 50 // Base score
    
    // Activity bonus
    score += (activityMetrics.activityScore * 0.3)
    
    // Profile completeness bonus
    score += (activityMetrics.profileCompleteness * 0.2)
    
    // Application activity bonus
    if (activityMetrics.applicationCount > 0) score += 10
    if (activityMetrics.applicationCount >= 3) score += 5
    
    // Recency bonus
    if (activityMetrics.daysSinceActive <= 7) score += 10
    else if (activityMetrics.daysSinceActive <= 30) score += 5
    
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Generate smart tags for student
   */
  private static async generateSmartTags(processedData: any, keywords: string[]): Promise<any[]> {
    const tags = []
    
    // University tag
    tags.push({
      category: 'university',
      value: processedData.universityCategory,
      aliases: keywords.filter(k => k.includes('university') || k.includes('college')),
      confidence: 0.9
    })
    
    // Major tag
    tags.push({
      category: 'major',
      value: processedData.majorCategory,
      aliases: keywords.filter(k => ['business', 'computer', 'engineering', 'design'].some(m => k.includes(m))),
      confidence: 0.9
    })
    
    // Location tag
    tags.push({
      category: 'location',
      value: processedData.locationRegion,
      aliases: keywords.filter(k => ['dubai', 'sharjah', 'abu'].some(l => k.includes(l))),
      confidence: 0.8
    })
    
    // Experience tag
    tags.push({
      category: 'experience',
      value: processedData.experienceLevel,
      aliases: [],
      confidence: 0.7
    })
    
    // Skill tags
    for (const skillCategory of processedData.skillCategories) {
      tags.push({
        category: 'skills',
        value: skillCategory,
        aliases: keywords.filter(k => k.includes(skillCategory)),
        confidence: 0.8
      })
    }
    
    return tags
  }

  /**
   * AI-powered categorization (optional enhancement)
   */
  private static async getAICategories(user: any): Promise<any> {
    if (!this.DEEPSEEK_API_KEY) return {}

    try {
      const prompt = `Categorize this student profile:
University: ${user.university || 'N/A'}
Major: ${user.major || 'N/A'}
Skills: ${user.skills?.join(', ') || 'N/A'}
Location: ${user.location || 'N/A'}
Interests: ${user.interests?.join(', ') || 'N/A'}

Return JSON with these categories:
{
  "industryFit": "technology|business|creative|healthcare|other",
  "careerStage": "student|entry_level|experienced",
  "specialization": "specific area of expertise",
  "marketValue": "high|medium|low"
}`

      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a student categorization expert. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json()
        return JSON.parse(data.choices[0].message.content)
      }
    } catch (error) {
      console.log('AI categorization failed:', error)
    }

    return {}
  }

  /**
   * Match students based on company query (the main search function)
   */
  static async matchStudents(criteria: MatchingCriteria, limit: number = 20): Promise<MatchResult[]> {
    console.log(`🎯 Matching students for query: "${criteria.query}"`)

    // Parse natural language query into structured criteria
    const parsedCriteria = await this.parseQuery(criteria.query)
    const combinedCriteria = { ...criteria, ...parsedCriteria }

    // Build search conditions
    const searchConditions = this.buildSearchConditions(combinedCriteria)

    // Get students with their tags
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...searchConditions
      },
      include: {
        studentTags: {
          include: {
            tag: true
          }
        },
        applications: {
          select: {
            createdAt: true
          }
        }
      },
      take: limit * 2 // Get more for scoring
    })

    // Score and rank students
    const scoredResults = students.map(student => {
      const matchScore = this.calculateMatchScore(student, combinedCriteria)
      const activityMetrics = this.calculateActivityMetrics(student)
      
      return {
        student: this.formatStudentForResults(student, activityMetrics),
        matchScore: matchScore.totalScore,
        matchReasons: matchScore.reasons,
        activityBonus: activityMetrics.activityScore,
        keywordMatches: matchScore.keywordMatches
      }
    })

    // Sort by score and return top results
    return scoredResults
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  }

  /**
   * Parse natural language query into structured criteria
   */
  private static async parseQuery(query: string): Promise<any> {
    const queryLower = query.toLowerCase()
    const parsed: any = {}

    // Location parsing
    if (queryLower.includes('dubai')) parsed.preferredLocations = ['dubai']
    if (queryLower.includes('sharjah')) parsed.preferredLocations = ['sharjah']
    if (queryLower.includes('uae')) parsed.preferredLocations = ['uae']

    // Major/field parsing
    if (queryLower.includes('business')) parsed.majorCategories = ['business']
    if (queryLower.includes('computer') || queryLower.includes('cs')) parsed.majorCategories = ['technology']
    if (queryLower.includes('engineering')) parsed.majorCategories = ['engineering']
    if (queryLower.includes('design')) parsed.majorCategories = ['design']

    // University parsing
    if (queryLower.includes('aud')) parsed.universityTypes = ['aud']
    if (queryLower.includes('aus')) parsed.universityTypes = ['aus']

    // Experience level
    if (queryLower.includes('student')) parsed.experienceLevel = 'current_student'
    if (queryLower.includes('graduate')) parsed.experienceLevel = 'recent_graduate'

    // Skills
    const skillKeywords = []
    if (queryLower.includes('programming') || queryLower.includes('coding')) skillKeywords.push('programming')
    if (queryLower.includes('marketing')) skillKeywords.push('marketing')
    if (queryLower.includes('design')) skillKeywords.push('design')
    if (skillKeywords.length > 0) parsed.skillRequirements = skillKeywords

    return parsed
  }

  /**
   * Build Prisma search conditions
   */
  private static buildSearchConditions(criteria: any): any {
    const conditions: any = {}

    // Text search across multiple fields
    if (criteria.query) {
      const searchTerms = criteria.query.toLowerCase().split(' ').filter((term: string) => term.length > 2)
      if (searchTerms.length > 0) {
        conditions.OR = searchTerms.map((term: string) => ({
          OR: [
            { university: { contains: term, mode: 'insensitive' } },
            { major: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
            { bio: { contains: term, mode: 'insensitive' } },
            { skills: { has: term } },
            { interests: { has: term } },
            { goal: { has: term } }
          ]
        }))
      }
    }

    return conditions
  }

  /**
   * Calculate match score for a student
   */
  private static calculateMatchScore(student: any, criteria: any): any {
    let totalScore = 0
    const reasons: string[] = []
    const keywordMatches: string[] = []

    // Location matching (30 points)
    if (criteria.preferredLocations) {
      const studentLocation = student.location?.toLowerCase() || ''
      const locationMatch = criteria.preferredLocations.some((loc: string) => 
        studentLocation.includes(loc.toLowerCase())
      )
      if (locationMatch) {
        totalScore += 30
        reasons.push(`Located in ${student.location}`)
      }
    }

    // Major matching (25 points)
    if (criteria.majorCategories) {
      const studentMajor = student.major?.toLowerCase() || ''
      const majorMatch = criteria.majorCategories.some((maj: string) => 
        studentMajor.includes(maj) || this.categorizeMajor(student.major) === maj
      )
      if (majorMatch) {
        totalScore += 25
        reasons.push(`Studying ${student.major}`)
      }
    }

    // Skill matching (20 points)
    if (criteria.skillRequirements) {
      const studentSkills = (student.skills || []).join(' ').toLowerCase()
      const skillMatches = criteria.skillRequirements.filter((skill: string) =>
        studentSkills.includes(skill.toLowerCase())
      )
      if (skillMatches.length > 0) {
        totalScore += 20 * (skillMatches.length / criteria.skillRequirements.length)
        reasons.push(`Has skills: ${skillMatches.join(', ')}`)
        keywordMatches.push(...skillMatches)
      }
    }

    // University matching (15 points)
    if (criteria.universityTypes) {
      const universityCategory = this.categorizeUniversity(student.university)
      const universityMatch = criteria.universityTypes.includes(universityCategory)
      if (universityMatch) {
        totalScore += 15
        reasons.push(`Studies at ${student.university}`)
      }
    }

    // Activity bonus (10 points)
    const activityMetrics = this.calculateActivityMetrics(student)
    totalScore += activityMetrics.activityScore * 0.1

    if (activityMetrics.activityScore > 70) {
      reasons.push('Highly active on platform')
    }

    return {
      totalScore: Math.round(totalScore),
      reasons,
      keywordMatches
    }
  }

  /**
   * Format student data for search results
   */
  private static formatStudentForResults(student: any, activityMetrics: any): ProcessedStudent {
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      university: student.university,
      major: student.major,
      skills: student.skills || [],
      location: student.location,
      graduationYear: student.graduationYear,
      interests: student.interests || [],
      goals: student.goal || [],
      
      universityCategory: this.categorizeUniversity(student.university),
      majorCategory: this.categorizeMajor(student.major),
      skillCategories: this.categorizeSkills(student.skills || []),
      locationRegion: this.categorizeLocation(student.location),
      experienceLevel: this.determineExperienceLevel(student),
      
      activityScore: activityMetrics.activityScore,
      lastActiveDate: activityMetrics.lastActiveDate,
      applicationCount: activityMetrics.applicationCount,
      responseRate: activityMetrics.responseRate,
      profileCompleteness: activityMetrics.profileCompleteness,
      
      searchableKeywords: this.generateSearchableKeywords(student, {}),
      matchingTags: student.studentTags?.map((st: any) => st.tag.value) || [],
      overallScore: this.calculateOverallScore({}, activityMetrics)
    }
  }

  /**
   * Bulk process all existing students (one-time setup)
   */
  static async bulkProcessAllStudents(): Promise<void> {
    console.log('🔄 Starting bulk processing of all students...')

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true }
    })

    console.log(`📊 Found ${students.length} students to process`)

    let processed = 0
    for (const student of students) {
      try {
        await this.processStudent(student.id)
        processed++
        
        if (processed % 10 === 0) {
          console.log(`✅ Processed ${processed}/${students.length} students`)
        }
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ Failed to process student ${student.id}:`, error)
      }
    }

    console.log(`🎉 Bulk processing complete: ${processed}/${students.length} students processed`)
  }
} 