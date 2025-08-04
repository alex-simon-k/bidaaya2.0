import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UniversityMapping {
  abbreviations: string[]
  fullName: string
  category: string
  region: string
  type: string
}

interface MajorMapping {
  variations: string[]
  standardName: string
  category: string
  industry: string[]
  skillCategories: string[]
}

interface SkillMapping {
  variations: string[]
  standardName: string
  category: string
  industry: string[]
  level: 'beginner' | 'intermediate' | 'advanced'
}

interface SemanticTag {
  id: string
  category: string
  value: string
  confidence: number
  relatedTerms: string[]
  semanticEmbedding?: number[]
  frequency: number
  examples: string[]
}

export class EnhancedAICategorization {
  private static DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  private static DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

  // Knowledge Base - This grows over time
  private static UNIVERSITY_MAPPINGS: UniversityMapping[] = [
    {
      abbreviations: ['aud', 'american university dubai', 'american university of dubai'],
      fullName: 'American University of Dubai',
      category: 'private_american',
      region: 'dubai',
      type: 'university'
    },
    {
      abbreviations: ['aus', 'american university sharjah', 'american university of sharjah'],
      fullName: 'American University of Sharjah', 
      category: 'private_american',
      region: 'sharjah',
      type: 'university'
    },
    {
      abbreviations: ['gmu', 'gulf medical', 'gulf medical university'],
      fullName: 'Gulf Medical University',
      category: 'medical_specialized',
      region: 'ajman',
      type: 'university'
    },
    {
      abbreviations: ['uae university', 'uaeu', 'united arab emirates university'],
      fullName: 'United Arab Emirates University',
      category: 'public_national',
      region: 'al_ain',
      type: 'university'
    },
    {
      abbreviations: ['zu', 'zayed university'],
      fullName: 'Zayed University',
      category: 'public_national',
      region: 'multiple',
      type: 'university'
    },
    {
      abbreviations: ['bits', 'birla', 'bits pilani'],
      fullName: 'BITS Pilani Dubai',
      category: 'international_branch',
      region: 'dubai',
      type: 'university'
    },
    {
      abbreviations: ['heriot watt', 'hw', 'heriot-watt'],
      fullName: 'Heriot-Watt University Dubai',
      category: 'international_branch',
      region: 'dubai',
      type: 'university'
    }
  ]

  private static MAJOR_MAPPINGS: MajorMapping[] = [
    {
      variations: ['computer science', 'cs', 'comp sci', 'compsci', 'computer engineering', 'software engineering'],
      standardName: 'Computer Science',
      category: 'technology',
      industry: ['software', 'tech', 'ai', 'cybersecurity'],
      skillCategories: ['programming', 'analytical', 'problem_solving']
    },
    {
      variations: ['business administration', 'bba', 'business admin', 'business studies', 'management'],
      standardName: 'Business Administration',
      category: 'business',
      industry: ['consulting', 'management', 'entrepreneurship', 'finance'],
      skillCategories: ['leadership', 'communication', 'analytical']
    },
    {
      variations: ['marketing', 'marketing communications', 'digital marketing', 'advertising'],
      standardName: 'Marketing',
      category: 'business',
      industry: ['advertising', 'digital', 'ecommerce', 'media'],
      skillCategories: ['creative', 'communication', 'analytical']
    },
    {
      variations: ['mechanical engineering', 'mech eng', 'mechanical', 'me'],
      standardName: 'Mechanical Engineering',
      category: 'engineering',
      industry: ['automotive', 'manufacturing', 'oil_gas', 'construction'],
      skillCategories: ['technical', 'problem_solving', 'analytical']
    },
    {
      variations: ['electrical engineering', 'ee', 'electrical', 'electronics'],
      standardName: 'Electrical Engineering',
      category: 'engineering',
      industry: ['utilities', 'tech', 'telecommunications', 'automotive'],
      skillCategories: ['technical', 'analytical', 'problem_solving']
    },
    {
      variations: ['psychology', 'psych', 'behavioral science', 'cognitive science'],
      standardName: 'Psychology',
      category: 'social_sciences',
      industry: ['healthcare', 'education', 'hr', 'research'],
      skillCategories: ['analytical', 'communication', 'empathy']
    },
    {
      variations: ['graphic design', 'visual design', 'design', 'ui design', 'ux design'],
      standardName: 'Design',
      category: 'creative',
      industry: ['advertising', 'tech', 'media', 'gaming'],
      skillCategories: ['creative', 'technical', 'visual']
    },
    {
      variations: ['finance', 'financial management', 'banking', 'accounting'],
      standardName: 'Finance',
      category: 'business',
      industry: ['banking', 'investment', 'insurance', 'consulting'],
      skillCategories: ['analytical', 'mathematical', 'detail_oriented']
    },
    {
      variations: ['medicine', 'medical', 'mbbs', 'md', 'medical science'],
      standardName: 'Medicine',
      category: 'healthcare',
      industry: ['healthcare', 'pharmaceuticals', 'research', 'public_health'],
      skillCategories: ['analytical', 'empathy', 'detail_oriented']
    },
    {
      variations: ['international business', 'ib', 'global business', 'international relations'],
      standardName: 'International Business',
      category: 'business',
      industry: ['consulting', 'trade', 'diplomacy', 'multinational'],
      skillCategories: ['communication', 'cultural_awareness', 'analytical']
    }
  ]

  /**
   * Intelligently categorize a student using AI + knowledge base
   */
  static async categorizeStudentIntelligently(studentData: {
    university?: string
    major?: string
    skills?: string[]
    location?: string
    interests?: string[]
    goal?: string[]
    bio?: string
  }): Promise<{
    university: { standard: string, category: string, confidence: number }
    major: { standard: string, category: string, confidence: number }
    skills: Array<{ standard: string, category: string, confidence: number }>
    location: { standard: string, region: string, confidence: number }
    semanticTags: SemanticTag[]
    suggestedImprovements: string[]
  }> {
    console.log('🧠 Starting intelligent categorization...')

    // Step 1: Standardize using knowledge base
    const university = this.standardizeUniversity(studentData.university || '')
    const major = this.standardizeMajor(studentData.major || '')
    const skills = this.standardizeSkills(studentData.skills || [])
    const location = this.standardizeLocation(studentData.location || '')

    // Step 2: Use AI for semantic understanding
    const aiEnhancement = await this.enhanceWithAI(studentData, { university, major, skills, location })

    // Step 3: Generate semantic tags
    const semanticTags = await this.generateSemanticTags(studentData, aiEnhancement)

    // Step 4: Suggest improvements
    const suggestedImprovements = this.generateImprovementSuggestions(studentData, { university, major, skills })

    return {
      university,
      major,
      skills,
      location,
      semanticTags,
      suggestedImprovements
    }
  }

  /**
   * Standardize university using knowledge base + fuzzy matching
   */
  private static standardizeUniversity(input: string): { standard: string, category: string, confidence: number } {
    if (!input.trim()) return { standard: 'Unknown', category: 'unknown', confidence: 0 }

    const inputLower = input.toLowerCase().trim()

    // Exact match in knowledge base
    for (const mapping of this.UNIVERSITY_MAPPINGS) {
      for (const abbrev of mapping.abbreviations) {
        if (inputLower === abbrev.toLowerCase() || inputLower.includes(abbrev.toLowerCase())) {
          return { 
            standard: mapping.fullName, 
            category: mapping.category, 
            confidence: 0.95 
          }
        }
      }
    }

    // Fuzzy matching
    for (const mapping of this.UNIVERSITY_MAPPINGS) {
      const similarity = this.calculateSimilarity(inputLower, mapping.fullName.toLowerCase())
      if (similarity > 0.7) {
        return {
          standard: mapping.fullName,
          category: mapping.category,
          confidence: similarity
        }
      }
    }

    // Fallback categorization based on keywords
    let category = 'unknown'
    if (inputLower.includes('medical')) category = 'medical_specialized'
    else if (inputLower.includes('american')) category = 'private_american'
    else if (inputLower.includes('british')) category = 'international_branch'
    else if (inputLower.includes('high school') || inputLower.includes('secondary')) category = 'high_school'

    return { 
      standard: this.toTitleCase(input), 
      category, 
      confidence: 0.3 
    }
  }

  /**
   * Standardize major using knowledge base + semantic understanding
   */
  private static standardizeMajor(input: string): { standard: string, category: string, confidence: number } {
    if (!input.trim()) return { standard: 'Unknown', category: 'unknown', confidence: 0 }

    const inputLower = input.toLowerCase().trim()

    // Check knowledge base
    for (const mapping of this.MAJOR_MAPPINGS) {
      for (const variation of mapping.variations) {
        if (inputLower === variation.toLowerCase() || 
            inputLower.includes(variation.toLowerCase()) ||
            variation.toLowerCase().includes(inputLower)) {
          return {
            standard: mapping.standardName,
            category: mapping.category,
            confidence: 0.9
          }
        }
      }
    }

    // Semantic categorization
    let category = 'unknown'
    let confidence = 0.3

    if (inputLower.includes('engineer') || inputLower.includes('technical')) {
      category = 'engineering'
      confidence = 0.6
    } else if (inputLower.includes('business') || inputLower.includes('management') || inputLower.includes('admin')) {
      category = 'business'
      confidence = 0.6
    } else if (inputLower.includes('design') || inputLower.includes('art') || inputLower.includes('creative')) {
      category = 'creative'
      confidence = 0.6
    } else if (inputLower.includes('science') || inputLower.includes('research')) {
      category = 'sciences'
      confidence = 0.6
    }

    return {
      standard: this.toTitleCase(input),
      category,
      confidence
    }
  }

  /**
   * Standardize skills with intelligent grouping
   */
  private static standardizeSkills(skills: string[]): Array<{ standard: string, category: string, confidence: number }> {
    return skills.map(skill => {
      const skillLower = skill.toLowerCase().trim()
      
      // Programming skills
      if (skillLower.includes('python') || skillLower.includes('javascript') || skillLower.includes('coding') || skillLower.includes('programming')) {
        return { standard: 'Programming', category: 'technical', confidence: 0.9 }
      }
      
      // Design skills
      if (skillLower.includes('photoshop') || skillLower.includes('figma') || skillLower.includes('design') || skillLower.includes('creative')) {
        return { standard: 'Design', category: 'creative', confidence: 0.9 }
      }
      
      // Communication skills
      if (skillLower.includes('communication') || skillLower.includes('presentation') || skillLower.includes('public speaking')) {
        return { standard: 'Communication', category: 'soft_skills', confidence: 0.9 }
      }
      
      // Marketing skills
      if (skillLower.includes('marketing') || skillLower.includes('social media') || skillLower.includes('seo')) {
        return { standard: 'Marketing', category: 'business', confidence: 0.9 }
      }
      
      // Leadership skills
      if (skillLower.includes('leadership') || skillLower.includes('management') || skillLower.includes('team lead')) {
        return { standard: 'Leadership', category: 'soft_skills', confidence: 0.9 }
      }
      
      return { 
        standard: this.toTitleCase(skill), 
        category: 'general', 
        confidence: 0.5 
      }
    })
  }

  /**
   * Standardize location with regional understanding
   */
  private static standardizeLocation(input: string): { standard: string, region: string, confidence: number } {
    if (!input.trim()) return { standard: 'Unknown', region: 'unknown', confidence: 0 }

    const inputLower = input.toLowerCase().trim()

    const locationMappings = [
      { inputs: ['dubai', 'dxb'], standard: 'Dubai', region: 'dubai', confidence: 0.95 },
      { inputs: ['sharjah', 'shj'], standard: 'Sharjah', region: 'sharjah', confidence: 0.95 },
      { inputs: ['abu dhabi', 'abudhabi', 'ad'], standard: 'Abu Dhabi', region: 'abu_dhabi', confidence: 0.95 },
      { inputs: ['ajman'], standard: 'Ajman', region: 'ajman', confidence: 0.95 },
      { inputs: ['ras al khaimah', 'rak'], standard: 'Ras Al Khaimah', region: 'rak', confidence: 0.95 },
      { inputs: ['fujairah'], standard: 'Fujairah', region: 'fujairah', confidence: 0.95 },
      { inputs: ['uae', 'emirates', 'united arab emirates'], standard: 'UAE', region: 'uae', confidence: 0.9 }
    ]

    for (const mapping of locationMappings) {
      for (const variant of mapping.inputs) {
        if (inputLower.includes(variant)) {
          return {
            standard: mapping.standard,
            region: mapping.region,
            confidence: mapping.confidence
          }
        }
      }
    }

    return {
      standard: this.toTitleCase(input),
      region: 'international',
      confidence: 0.3
    }
  }

  /**
   * Enhance categorization using AI
   */
  private static async enhanceWithAI(
    studentData: any, 
    baseCategories: any
  ): Promise<any> {
    if (!this.DEEPSEEK_API_KEY) {
      console.log('⚠️ No AI enhancement - DeepSeek API key not available')
      return baseCategories
    }

    try {
      const prompt = `Analyze this student profile and enhance the categorization:

Student Data:
- University: ${studentData.university || 'N/A'}
- Major: ${studentData.major || 'N/A'}  
- Skills: ${studentData.skills?.join(', ') || 'N/A'}
- Location: ${studentData.location || 'N/A'}
- Interests: ${studentData.interests?.join(', ') || 'N/A'}
- Goals: ${studentData.goal?.join(', ') || 'N/A'}
- Bio: ${studentData.bio || 'N/A'}

Current Categorization:
- University: ${baseCategories.university.standard}
- Major: ${baseCategories.major.standard}

Enhance this with:
1. Industry alignment predictions
2. Career trajectory insights  
3. Skill gap analysis
4. Personality/working style indicators
5. Market value assessment

Return JSON format:
{
  "industryAlignment": ["fintech", "consulting"],
  "careerTrajectory": "technical_leadership",
  "skillGaps": ["advanced_python", "project_management"],
  "workingStyle": "collaborative_analytical",
  "marketValue": "high",
  "confidence": 0.85
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
            { role: 'system', content: 'You are an expert student profiler and career analyst. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(15000)
      })

      if (response.ok) {
        const data = await response.json()
        const enhancement = JSON.parse(data.choices[0].message.content)
        console.log('✅ AI enhancement applied')
        return { ...baseCategories, aiEnhancement: enhancement }
      }
    } catch (error) {
      console.log('⚠️ AI enhancement failed, using base categories:', error)
    }

    return baseCategories
  }

  /**
   * Generate semantic tags for better search and matching
   */
  private static async generateSemanticTags(studentData: any, categorization: any): Promise<SemanticTag[]> {
    const tags: SemanticTag[] = []

    // University tags
    if (categorization.university.confidence > 0.5) {
      tags.push({
        id: `uni_${categorization.university.category}`,
        category: 'university',
        value: categorization.university.category,
        confidence: categorization.university.confidence,
        relatedTerms: [categorization.university.standard],
        frequency: 1,
        examples: [studentData.university]
      })
    }

    // Major tags
    if (categorization.major.confidence > 0.5) {
      tags.push({
        id: `major_${categorization.major.category}`,
        category: 'major',
        value: categorization.major.category,
        confidence: categorization.major.confidence,
        relatedTerms: [categorization.major.standard],
        frequency: 1,
        examples: [studentData.major]
      })
    }

    // Skill tags
    categorization.skills?.forEach((skill: any, index: number) => {
      if (skill.confidence > 0.6) {
        tags.push({
          id: `skill_${skill.category}_${index}`,
          category: 'skills',
          value: skill.category,
          confidence: skill.confidence,
          relatedTerms: [skill.standard],
          frequency: 1,
          examples: [studentData.skills?.[index]]
        })
      }
    })

    // Location tags
    if (categorization.location.confidence > 0.5) {
      tags.push({
        id: `loc_${categorization.location.region}`,
        category: 'location',
        value: categorization.location.region,
        confidence: categorization.location.confidence,
        relatedTerms: [categorization.location.standard],
        frequency: 1,
        examples: [studentData.location]
      })
    }

    // AI enhancement tags
    if (categorization.aiEnhancement) {
      const ai = categorization.aiEnhancement
      
      if (ai.industryAlignment) {
        ai.industryAlignment.forEach((industry: string) => {
          tags.push({
            id: `industry_${industry}`,
            category: 'industry_fit',
            value: industry,
            confidence: ai.confidence || 0.7,
            relatedTerms: [industry],
            frequency: 1,
            examples: ['AI predicted']
          })
        })
      }

      if (ai.careerTrajectory) {
        tags.push({
          id: `career_${ai.careerTrajectory}`,
          category: 'career_path',
          value: ai.careerTrajectory,
          confidence: ai.confidence || 0.7,
          relatedTerms: [ai.careerTrajectory],
          frequency: 1,
          examples: ['AI predicted']
        })
      }
    }

    return tags
  }

  /**
   * Generate improvement suggestions
   */
  private static generateImprovementSuggestions(studentData: any, categorization: any): string[] {
    const suggestions: string[] = []

    if (categorization.university.confidence < 0.7) {
      suggestions.push(`University "${studentData.university}" needs manual verification - low confidence match`)
    }

    if (categorization.major.confidence < 0.7) {
      suggestions.push(`Major "${studentData.major}" should be standardized - consider dropdown options`)
    }

    if (!studentData.skills || studentData.skills.length < 3) {
      suggestions.push('Student should add more skills to improve matching')
    }

    if (!studentData.bio || studentData.bio.length < 50) {
      suggestions.push('Bio is too short - encourage more detailed description')
    }

    if (!studentData.interests || studentData.interests.length === 0) {
      suggestions.push('No interests listed - this reduces matching accuracy')
    }

    return suggestions
  }

  /**
   * Utility functions
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }

  /**
   * Bulk process students with enhanced categorization
   */
  static async enhancedBulkProcessing(): Promise<{
    processed: number
    improved: number
    flaggedForReview: string[]
    newTags: number
  }> {
    console.log('🚀 Starting enhanced bulk processing...')

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        university: true,
        major: true,
        skills: true,
        location: true,
        interests: true,
        goal: true,
        bio: true
      }
    })

    let processed = 0
    let improved = 0
    const flaggedForReview: string[] = []
    const allTags = new Set<string>()

    for (const student of students) {
      try {
        // Transform null values to undefined for interface compatibility
        const studentData = {
          university: student.university || undefined,
          major: student.major || undefined,
          skills: student.skills || undefined,
          location: student.location || undefined,
          interests: student.interests || undefined,
          goal: student.goal || undefined,
          bio: student.bio || undefined
        }
        
        const categorization = await this.categorizeStudentIntelligently(studentData)
        
        // Check if this is an improvement over basic categorization
        const hasLowConfidence = [
          categorization.university.confidence,
          categorization.major.confidence,
          ...categorization.skills.map(s => s.confidence)
        ].some(conf => conf < 0.6)

        if (hasLowConfidence) {
          flaggedForReview.push(student.id)
        } else {
          improved++
        }

        // Store semantic tags
        for (const tag of categorization.semanticTags) {
          allTags.add(`${tag.category}:${tag.value}`)
        }

        processed++

        if (processed % 50 === 0) {
          console.log(`✅ Enhanced processing: ${processed}/${students.length} students`)
        }

      } catch (error) {
        console.error(`❌ Failed to enhance student ${student.id}:`, error)
        flaggedForReview.push(student.id)
      }
    }

    console.log(`🎉 Enhanced processing complete:
    - Processed: ${processed} students
    - Improved: ${improved} students  
    - Flagged for review: ${flaggedForReview.length}
    - New semantic tags: ${allTags.size}`)

    return {
      processed,
      improved,
      flaggedForReview,
      newTags: allTags.size
    }
  }
} 