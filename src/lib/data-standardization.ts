import { PrismaClient } from '@prisma/client'

interface StandardizedUniversity {
  id: string
  name: string
  shortName: string
  abbreviations: string[]
  country: string
  region: string
}

interface StandardizedMajor {
  id: string
  name: string
  category: string
  aliases: string[]
  keywords: string[]
}

export class DataStandardizationService {
  private static prisma = new PrismaClient()

  // Standardized Universities Database
  private static STANDARD_UNIVERSITIES: StandardizedUniversity[] = [
    {
      id: 'aud',
      name: 'American University of Dubai',
      shortName: 'AUD',
      abbreviations: ['aud', 'au dubai', 'american university dubai'],
      country: 'UAE',
      region: 'Dubai'
    },
    {
      id: 'aus',
      name: 'American University of Sharjah',
      shortName: 'AUS',
      abbreviations: ['aus', 'au sharjah', 'american university sharjah'],
      country: 'UAE',
      region: 'Sharjah'
    },
    {
      id: 'cud',
      name: 'Canadian University Dubai',
      shortName: 'CUD',
      abbreviations: ['cud', 'canadian university', 'canadian dubai'],
      country: 'UAE',
      region: 'Dubai'
    },
    {
      id: 'hw',
      name: 'Heriot-Watt University Dubai',
      shortName: 'Heriot-Watt',
      abbreviations: ['heriot watt', 'heriot-watt', 'hw dubai', 'hwu'],
      country: 'UAE',
      region: 'Dubai'
    },
    {
      id: 'zu',
      name: 'Zayed University',
      shortName: 'ZU',
      abbreviations: ['zayed', 'zu', 'zayed uni'],
      country: 'UAE',
      region: 'UAE'
    },
    {
      id: 'ku',
      name: 'Khalifa University',
      shortName: 'KU',
      abbreviations: ['khalifa', 'ku', 'khalifa uni'],
      country: 'UAE',
      region: 'Abu Dhabi'
    },
    {
      id: 'uaeu',
      name: 'United Arab Emirates University',
      shortName: 'UAEU',
      abbreviations: ['uae university', 'uaeu', 'emirates university'],
      country: 'UAE',
      region: 'Al Ain'
    },
    {
      id: 'au',
      name: 'Ajman University',
      shortName: 'AU',
      abbreviations: ['ajman', 'ajman uni', 'au ajman'],
      country: 'UAE',
      region: 'Ajman'
    },
    {
      id: 'uos',
      name: 'University of Sharjah',
      shortName: 'UoS',
      abbreviations: ['sharjah university', 'uos', 'u of sharjah'],
      country: 'UAE',
      region: 'Sharjah'
    }
  ]

  // Standardized Majors Database
  private static STANDARD_MAJORS: StandardizedMajor[] = [
    {
      id: 'computer-science',
      name: 'Computer Science',
      category: 'Technology',
      aliases: ['cs', 'comp sci', 'computer science', 'computing'],
      keywords: ['programming', 'software', 'algorithms', 'coding']
    },
    {
      id: 'software-engineering',
      name: 'Software Engineering',
      category: 'Technology',
      aliases: ['software eng', 'se', 'software development'],
      keywords: ['development', 'software', 'engineering', 'coding']
    },
    {
      id: 'business-administration',
      name: 'Business Administration',
      category: 'Business',
      aliases: ['business', 'business admin', 'bba', 'mba'],
      keywords: ['management', 'business', 'administration', 'leadership']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      category: 'Business',
      aliases: ['marketing', 'digital marketing', 'marketing communications'],
      keywords: ['advertising', 'promotion', 'branding', 'digital']
    },
    {
      id: 'mechanical-engineering',
      name: 'Mechanical Engineering',
      category: 'Engineering',
      aliases: ['mechanical eng', 'mech eng', 'mechanical'],
      keywords: ['mechanics', 'design', 'manufacturing', 'machines']
    },
    {
      id: 'civil-engineering',
      name: 'Civil Engineering',
      category: 'Engineering',
      aliases: ['civil eng', 'civil', 'construction engineering'],
      keywords: ['construction', 'infrastructure', 'buildings', 'roads']
    },
    {
      id: 'electrical-engineering',
      name: 'Electrical Engineering',
      category: 'Engineering',
      aliases: ['electrical eng', 'ee', 'electrical'],
      keywords: ['electricity', 'circuits', 'electronics', 'power']
    },
    {
      id: 'graphic-design',
      name: 'Graphic Design',
      category: 'Design',
      aliases: ['design', 'graphic design', 'visual design'],
      keywords: ['graphics', 'visual', 'creative', 'design']
    },
    {
      id: 'ui-ux-design',
      name: 'UI/UX Design',
      category: 'Design',
      aliases: ['ui/ux', 'user experience', 'interface design', 'ux design'],
      keywords: ['user experience', 'interface', 'usability', 'design']
    },
    {
      id: 'finance',
      name: 'Finance',
      category: 'Business',
      aliases: ['finance', 'financial', 'banking'],
      keywords: ['money', 'investment', 'banking', 'financial']
    },
    {
      id: 'accounting',
      name: 'Accounting',
      category: 'Business',
      aliases: ['accounting', 'accountancy', 'cpa'],
      keywords: ['books', 'financial records', 'auditing', 'taxation']
    },
    {
      id: 'international-business',
      name: 'International Business',
      category: 'Business',
      aliases: ['international business', 'global business', 'ib'],
      keywords: ['global', 'international', 'trade', 'business']
    },
    {
      id: 'psychology',
      name: 'Psychology',
      category: 'Social Sciences',
      aliases: ['psychology', 'psych', 'behavioral science'],
      keywords: ['behavior', 'mind', 'mental health', 'therapy']
    },
    {
      id: 'communications',
      name: 'Communications',
      category: 'Liberal Arts',
      aliases: ['communications', 'comm', 'media studies'],
      keywords: ['media', 'journalism', 'public relations', 'communication']
    }
  ]

  /**
   * Standardize a university name
   */
  static standardizeUniversity(input: string): string | null {
    if (!input) return null
    
    const inputLower = input.toLowerCase().trim()
    
    // Find exact match
    for (const uni of this.STANDARD_UNIVERSITIES) {
      if (uni.name.toLowerCase() === inputLower || 
          uni.shortName.toLowerCase() === inputLower) {
        return uni.name
      }
      
      // Check abbreviations and aliases
      for (const abbrev of uni.abbreviations) {
        if (abbrev.toLowerCase() === inputLower || 
            inputLower.includes(abbrev.toLowerCase())) {
          return uni.name
        }
      }
    }
    
    return null // Return null if no match found
  }

  /**
   * Standardize a major name
   */
  static standardizeMajor(input: string): string | null {
    if (!input) return null
    
    const inputLower = input.toLowerCase().trim()
    
    // Find exact match
    for (const major of this.STANDARD_MAJORS) {
      if (major.name.toLowerCase() === inputLower) {
        return major.name
      }
      
      // Check aliases
      for (const alias of major.aliases) {
        if (alias.toLowerCase() === inputLower ||
            inputLower.includes(alias.toLowerCase())) {
          return major.name
        }
      }
      
      // Check keywords (partial match)
      for (const keyword of major.keywords) {
        if (inputLower.includes(keyword.toLowerCase())) {
          return major.name
        }
      }
    }
    
    return null // Return null if no match found
  }

  /**
   * Get suggestions for university names
   */
  static getUniversitySuggestions(input: string): StandardizedUniversity[] {
    if (!input || input.length < 2) return this.STANDARD_UNIVERSITIES.slice(0, 5)
    
    const inputLower = input.toLowerCase()
    const suggestions: Array<{ uni: StandardizedUniversity, score: number }> = []
    
    for (const uni of this.STANDARD_UNIVERSITIES) {
      let score = 0
      
      // Exact name match
      if (uni.name.toLowerCase().includes(inputLower)) score += 10
      
      // Short name match
      if (uni.shortName.toLowerCase().includes(inputLower)) score += 8
      
      // Abbreviation match
      for (const abbrev of uni.abbreviations) {
        if (abbrev.toLowerCase().includes(inputLower)) {
          score += 6
          break
        }
      }
      
      if (score > 0) {
        suggestions.push({ uni, score })
      }
    }
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.uni)
  }

  /**
   * Get suggestions for major names
   */
  static getMajorSuggestions(input: string): StandardizedMajor[] {
    if (!input || input.length < 2) return this.STANDARD_MAJORS.slice(0, 5)
    
    const inputLower = input.toLowerCase()
    const suggestions: Array<{ major: StandardizedMajor, score: number }> = []
    
    for (const major of this.STANDARD_MAJORS) {
      let score = 0
      
      // Exact name match
      if (major.name.toLowerCase().includes(inputLower)) score += 10
      
      // Alias match
      for (const alias of major.aliases) {
        if (alias.toLowerCase().includes(inputLower)) {
          score += 8
          break
        }
      }
      
      // Keyword match
      for (const keyword of major.keywords) {
        if (keyword.toLowerCase().includes(inputLower)) {
          score += 4
          break
        }
      }
      
      if (score > 0) {
        suggestions.push({ major, score })
      }
    }
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.major)
  }

  /**
   * Batch standardize existing user data
   */
  static async standardizeExistingData(): Promise<{
    universitiesUpdated: number
    majorsUpdated: number
    errors: string[]
  }> {
    const errors: string[] = []
    let universitiesUpdated = 0
    let majorsUpdated = 0
    
    try {
      console.log('🔄 Starting data standardization...')
      
      // Get all users with university or major data
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { university: { not: null } },
            { major: { not: null } }
          ]
        },
        select: {
          id: true,
          university: true,
          major: true
        }
      })
      
      console.log(`📊 Found ${users.length} users with education data`)
      
      for (const user of users) {
        const updates: any = {}
        
        // Standardize university
        if (user.university) {
          const standardizedUni = this.standardizeUniversity(user.university)
          if (standardizedUni && standardizedUni !== user.university) {
            updates.university = standardizedUni
            universitiesUpdated++
            console.log(`🏛️ ${user.university} → ${standardizedUni}`)
          }
        }
        
        // Standardize major
        if (user.major) {
          const standardizedMajor = this.standardizeMajor(user.major)
          if (standardizedMajor && standardizedMajor !== user.major) {
            updates.major = standardizedMajor
            majorsUpdated++
            console.log(`📚 ${user.major} → ${standardizedMajor}`)
          }
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: updates
          })
        }
      }
      
      console.log(`✅ Standardization complete: ${universitiesUpdated} universities, ${majorsUpdated} majors updated`)
      
    } catch (error) {
      console.error('❌ Error during standardization:', error)
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }
    
    return {
      universitiesUpdated,
      majorsUpdated,
      errors
    }
  }

  /**
   * Get data quality report
   */
  static async getDataQualityReport(): Promise<{
    totalUsers: number
    standardizedUniversities: number
    nonStandardizedUniversities: number
    standardizedMajors: number
    nonStandardizedMajors: number
    topUniversities: Array<{ name: string, count: number }>
    topMajors: Array<{ name: string, count: number }>
  }> {
    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        university: true,
        major: true
      }
    })
    
    let standardizedUniversities = 0
    let nonStandardizedUniversities = 0
    let standardizedMajors = 0
    let nonStandardizedMajors = 0
    
    const universityCount: Record<string, number> = {}
    const majorCount: Record<string, number> = {}
    
    for (const user of users) {
      // Check universities
      if (user.university) {
        universityCount[user.university] = (universityCount[user.university] || 0) + 1
        
        const isStandardized = this.STANDARD_UNIVERSITIES.some(uni => 
          uni.name === user.university
        )
        
        if (isStandardized) {
          standardizedUniversities++
        } else {
          nonStandardizedUniversities++
        }
      }
      
      // Check majors
      if (user.major) {
        majorCount[user.major] = (majorCount[user.major] || 0) + 1
        
        const isStandardized = this.STANDARD_MAJORS.some(major => 
          major.name === user.major
        )
        
        if (isStandardized) {
          standardizedMajors++
        } else {
          nonStandardizedMajors++
        }
      }
    }
    
    const topUniversities = Object.entries(universityCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
    
    const topMajors = Object.entries(majorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
    
    return {
      totalUsers: users.length,
      standardizedUniversities,
      nonStandardizedUniversities,
      standardizedMajors,
      nonStandardizedMajors,
      topUniversities,
      topMajors
    }
  }
}

export const dataStandardization = new DataStandardizationService() 