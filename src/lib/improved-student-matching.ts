/**
 * Improved Student-Project Matching Algorithm
 * Provides relative scoring where the best match is ~100% and others are scaled accordingly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface StudentProfile {
  id: string
  major?: string | null
  university?: string | null
  skills?: string[]
  interests?: string[]
  goal?: string[]
  location?: string | null
}

export interface ProjectMatch {
  id: string
  title: string
  description: string
  companyId: string
  companyName: string | null
  category?: string | null
  skillsRequired?: string[]
  location?: string | null
  rawScore: number
  matchScore: number // Relative score 0-100
  matchReasons: string[]
}

export class ImprovedStudentMatcher {
  
  /**
   * Get ranked projects for a student with relative scoring
   */
  async getMatchedProjects(
    studentProfile: StudentProfile, 
    excludeProjectIds: string[] = [],
    limit: number = 10,
    searchQuery?: string
  ): Promise<ProjectMatch[]> {
    
    // Get all available projects
    const projects = await prisma.project.findMany({
      where: {
        status: 'LIVE',
        ...(excludeProjectIds.length > 0 && { id: { notIn: excludeProjectIds } })
      },
      include: {
        company: { select: { companyName: true } }
      },
      take: 50 // Get more to ensure good variety
    })

    if (projects.length === 0) {
      return []
    }

    // Calculate raw scores for all projects
    const projectsWithRawScores = projects.map(project => {
      const { score, reasons } = this.calculateRawMatchScore(studentProfile, project, searchQuery)
      
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        companyId: project.companyId,
        companyName: project.company?.companyName || null,
        category: project.category,
        skillsRequired: project.skillsRequired || [],
        location: project.location,
        rawScore: score,
        matchScore: 0, // Will be calculated after normalization
        matchReasons: reasons
      }
    })

    // Find min/max scores for normalization
    const rawScores = projectsWithRawScores.map(p => p.rawScore)
    const maxScore = Math.max(...rawScores)
    const minScore = Math.min(...rawScores)
    
    // Normalize scores to 15-100 range (avoiding 0-15 to prevent very low scores)
    const scoreRange = maxScore - minScore
    
    const normalizedProjects = projectsWithRawScores.map(project => ({
      ...project,
      matchScore: scoreRange === 0 
        ? 85 // If all scores are the same, give them a good score
        : Math.round(15 + ((project.rawScore - minScore) / scoreRange) * 85)
    }))

    // Sort by match score (highest first) and return limited results
    return normalizedProjects
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  }

  /**
   * Calculate raw compatibility score between student and project
   */
  private calculateRawMatchScore(
    student: StudentProfile, 
    project: any,
    searchQuery?: string
  ): { score: number, reasons: string[] } {
    
    let score = 0
    const reasons: string[] = []

    // 1. MAJOR/FIELD ALIGNMENT (40 points max)
    if (student.major && project.category) {
      const majorScore = this.calculateMajorAlignment(student.major, project.category)
      if (majorScore > 0) {
        score += majorScore
        reasons.push(`${student.major} aligns with ${project.category}`)
      }
    }

    // 2. SKILLS MATCHING (35 points max)
    if (student.skills && project.skillsRequired) {
      const skillsScore = this.calculateSkillsMatch(student.skills, project.skillsRequired)
      if (skillsScore > 0) {
        score += skillsScore
        const matchingSkills = student.skills.filter(skill =>
          project.skillsRequired.some((req: string) => 
            skill.toLowerCase().includes(req.toLowerCase()) ||
            req.toLowerCase().includes(skill.toLowerCase())
          )
        )
        if (matchingSkills.length > 0) {
          reasons.push(`Skills: ${matchingSkills.slice(0, 2).join(', ')}`)
        }
      }
    }

    // 3. INTERESTS/GOALS ALIGNMENT (15 points max)
    if (student.interests || student.goal) {
      const allInterests = [...(student.interests || []), ...(student.goal || [])]
      const interestScore = this.calculateInterestAlignment(allInterests, project)
      if (interestScore > 0) {
        score += interestScore
        reasons.push('Career interests align')
      }
    }

    // 4. LOCATION PREFERENCE (10 points max)
    if (student.location && project.location) {
      if (student.location.toLowerCase().includes(project.location.toLowerCase()) ||
          project.location.toLowerCase().includes(student.location.toLowerCase())) {
        score += 10
        reasons.push('Location match')
      }
    }

    // 5. SEARCH QUERY RELEVANCE BOOST (50 points max) - HIGH PRIORITY
    if (searchQuery) {
      const queryScore = this.calculateQueryRelevance(searchQuery, project)
      if (queryScore > 0) {
        score += queryScore
        reasons.push('Matches your search')
      }
    }

    // Base score to ensure everyone gets some points
    score += 20

    return { score: Math.min(score, 170), reasons } // Cap at 170 for normalization (increased for query boost)
  }

  /**
   * Calculate major to project category alignment
   */
  private calculateMajorAlignment(major: string, category: string): number {
    const majorLower = major.toLowerCase()
    const categoryLower = category.toLowerCase()

    // Direct matches
    const alignments: Record<string, string[]> = {
      'marketing': ['marketing', 'business', 'communications', 'media', 'advertising'],
      'computer_science': ['computer', 'software', 'programming', 'tech', 'data', 'engineering', 'it'],
      'finance': ['finance', 'economics', 'business', 'accounting', 'investment'],
      'psychology': ['psychology', 'social', 'behavioral', 'mental health', 'counseling'],
      'business_development': ['business', 'management', 'entrepreneurship', 'strategy']
    }

    for (const [cat, keywords] of Object.entries(alignments)) {
      if (categoryLower.includes(cat.replace('_', ' ')) || categoryLower === cat.replace('_', '_')) {
        if (keywords.some(keyword => majorLower.includes(keyword))) {
          return 40 // Perfect match
        }
      }
    }

    // Partial matches
    const generalBusinessTerms = ['business', 'management', 'admin']
    const generalTechTerms = ['science', 'technology', 'engineering']
    
    if (generalBusinessTerms.some(term => majorLower.includes(term)) &&
        ['marketing', 'business_development', 'finance'].includes(categoryLower.replace(' ', '_'))) {
      return 25
    }
    
    if (generalTechTerms.some(term => majorLower.includes(term)) &&
        categoryLower.includes('computer')) {
      return 25
    }

    return 0
  }

  /**
   * Calculate skills matching score
   */
  private calculateSkillsMatch(studentSkills: string[], requiredSkills: string[]): number {
    if (!studentSkills.length || !requiredSkills.length) return 0

    let matches = 0
    const maxMatches = Math.min(studentSkills.length, requiredSkills.length)

    for (const studentSkill of studentSkills) {
      for (const requiredSkill of requiredSkills) {
        if (this.skillsOverlap(studentSkill, requiredSkill)) {
          matches++
          break // Count each student skill only once
        }
      }
    }

    // Score based on percentage of skills matched
    const matchPercentage = matches / Math.max(requiredSkills.length, 1)
    return Math.round(matchPercentage * 35)
  }

  /**
   * Check if two skills overlap
   */
  private skillsOverlap(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase().trim()
    const s2 = skill2.toLowerCase().trim()
    
    // Direct match
    if (s1 === s2) return true
    
    // Partial match (one contains the other)
    if (s1.includes(s2) || s2.includes(s1)) return true
    
    // Common skill mappings
    const skillMappings: Record<string, string[]> = {
      'javascript': ['js', 'react', 'node', 'web development'],
      'python': ['data analysis', 'machine learning', 'ai'],
      'design': ['ui', 'ux', 'graphics', 'creative'],
      'marketing': ['social media', 'content creation', 'branding'],
      'analysis': ['analytics', 'data', 'research']
    }

    for (const [base, variants] of Object.entries(skillMappings)) {
      if ((s1.includes(base) && variants.some(v => s2.includes(v))) ||
          (s2.includes(base) && variants.some(v => s1.includes(v)))) {
        return true
      }
    }

    return false
  }

  /**
   * Calculate interest alignment with project
   */
  private calculateInterestAlignment(interests: string[], project: any): number {
    if (!interests.length) return 0

    const projectText = `${project.title} ${project.description} ${project.category || ''}`.toLowerCase()
    
    let alignmentCount = 0
    for (const interest of interests) {
      if (projectText.includes(interest.toLowerCase())) {
        alignmentCount++
      }
    }

    return Math.min(alignmentCount * 5, 15) // Cap at 15 points
  }

  /**
   * Calculate search query relevance to project
   */
  private calculateQueryRelevance(query: string, project: any): number {
    const queryLower = query.toLowerCase()
    const projectText = `${project.title} ${project.description} ${project.category || ''}`.toLowerCase()
    
    let score = 0
    
    // Extract keywords from query
    const keywords = queryLower.split(/\s+/).filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'can', 'you', 'give', 'me', 'some', 'want', 'need', 'looking'].includes(word)
    )
    
    // Direct keyword matches in title (highest priority)
    for (const keyword of keywords) {
      if (project.title.toLowerCase().includes(keyword)) {
        score += 25 // High score for title match
      }
    }
    
    // Category/field matches
    const fieldMappings: Record<string, string[]> = {
      'finance': ['finance', 'financial', 'investment', 'banking', 'accounting'],
      'data': ['data', 'analytics', 'science', 'analysis', 'database'],
      'marketing': ['marketing', 'social', 'media', 'advertising', 'branding'],
      'technology': ['tech', 'software', 'programming', 'coding', 'development'],
      'design': ['design', 'ui', 'ux', 'graphics', 'creative']
    }
    
    for (const [field, terms] of Object.entries(fieldMappings)) {
      if (keywords.some(keyword => terms.includes(keyword))) {
        // Check if project matches this field
        if (project.category?.toLowerCase().includes(field) || 
            terms.some(term => projectText.includes(term))) {
          score += 30 // High score for field match
          break // Only count one field match
        }
      }
    }
    
    // Description keyword matches (lower priority)
    for (const keyword of keywords) {
      if (project.description.toLowerCase().includes(keyword)) {
        score += 10 // Lower score for description match
      }
    }
    
    return Math.min(score, 50) // Cap at 50 points
  }
}

export const studentMatcher = new ImprovedStudentMatcher()
