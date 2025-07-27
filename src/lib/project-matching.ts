/**
 * Project Matching Algorithm
 * 
 * Sophisticated matching system that uses student discovery quiz data
 * to rank and recommend projects based on compatibility scores.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface StudentProfile {
  skills: string[]
  interests: string[]
  careerGoals: string[]
  workPreferences: {
    projectDuration: string
    teamSize: string
    workStyle: string
    timeCommitment: string
  }
  experienceLevel: string
  industries: string[]
  learningGoals: string[]
}

interface ProjectData {
  id: string
  title: string
  description: string
  category: string
  subcategory?: string
  skillsRequired: string[]
  experienceLevel: string
  teamSize: number
  durationMonths: number
  timeCommitment?: string
  requirements: string[]
  deliverables: string[]
  companyName: string
  location?: string
  remote: boolean
  compensation?: string
}

interface MatchScore {
  projectId: string
  overallScore: number
  breakdown: {
    skillsMatch: number
    industryMatch: number
    experienceMatch: number
    preferencesMatch: number
    goalAlignment: number
  }
  reasoning: string[]
  strengths: string[]
  considerations: string[]
  recommendationLevel: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR'
}

interface ProjectRecommendation {
  project: ProjectData
  matchScore: MatchScore
  rank: number
  appliedAlready?: boolean
}

interface MatchingResult {
  totalProjects: number
  matchedProjects: ProjectRecommendation[]
  studentProfile: StudentProfile
  topMatches: ProjectRecommendation[]
  categoryBreakdown: {
    category: string
    count: number
    avgScore: number
  }[]
  generatedAt: Date
}

class ProjectMatcher {
  
  /**
   * Main function to get project recommendations for a student
   */
  async getRecommendations(
    studentId: string,
    studentProfile: StudentProfile,
    options: {
      limit?: number
      includeApplied?: boolean
      categoryFilter?: string
      minScore?: number
    } = {}
  ): Promise<MatchingResult> {
    const {
      limit = 20,
      includeApplied = false,
      categoryFilter,
      minScore = 30
    } = options

    try {
      // Get available projects
      const projects = await this.getAvailableProjects(categoryFilter)
      
      // Get student's existing applications
      const appliedProjectIds = includeApplied ? [] : await this.getStudentApplications(studentId)

      // Filter out applied projects if requested
      const eligibleProjects = includeApplied 
        ? projects 
        : projects.filter(p => !appliedProjectIds.includes(p.id))

      // Calculate match scores for each project
      const projectRecommendations: ProjectRecommendation[] = []
      
      for (const project of eligibleProjects) {
        const matchScore = this.calculateMatchScore(studentProfile, project)
        
        if (matchScore.overallScore >= minScore) {
          projectRecommendations.push({
            project,
            matchScore,
            rank: 0, // Will be set after sorting
            appliedAlready: appliedProjectIds.includes(project.id)
          })
        }
      }

      // Sort by overall score (descending)
      projectRecommendations.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore)
      
      // Set ranks
      projectRecommendations.forEach((rec, index) => {
        rec.rank = index + 1
      })

      // Limit results
      const limitedRecommendations = projectRecommendations.slice(0, limit)

      // Generate category breakdown
      const categoryBreakdown = this.generateCategoryBreakdown(projectRecommendations)

      return {
        totalProjects: eligibleProjects.length,
        matchedProjects: limitedRecommendations,
        studentProfile,
        topMatches: limitedRecommendations.slice(0, 5),
        categoryBreakdown,
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('Error generating project recommendations:', error)
      throw error
    }
  }

  /**
   * Calculate compatibility score between student and project
   */
  private calculateMatchScore(
    student: StudentProfile, 
    project: ProjectData
  ): MatchScore {
    const breakdown = {
      skillsMatch: this.calculateSkillsMatch(student.skills, project.skillsRequired),
      industryMatch: this.calculateIndustryMatch(student.industries, project.category),
      experienceMatch: this.calculateExperienceMatch(student.experienceLevel, project.experienceLevel),
      preferencesMatch: this.calculatePreferencesMatch(student.workPreferences, project),
      goalAlignment: this.calculateGoalAlignment(student.careerGoals, student.learningGoals, project)
    }

    // Weighted overall score
    const weights = {
      skillsMatch: 0.30,
      industryMatch: 0.20,
      experienceMatch: 0.20,
      preferencesMatch: 0.15,
      goalAlignment: 0.15
    }

    const overallScore = Math.round(
      breakdown.skillsMatch * weights.skillsMatch +
      breakdown.industryMatch * weights.industryMatch +
      breakdown.experienceMatch * weights.experienceMatch +
      breakdown.preferencesMatch * weights.preferencesMatch +
      breakdown.goalAlignment * weights.goalAlignment
    )

    const reasoning = this.generateReasoning(breakdown, student, project)
    const { strengths, considerations } = this.generateInsights(breakdown, student, project)
    const recommendationLevel = this.getRecommendationLevel(overallScore)

    return {
      projectId: project.id,
      overallScore,
      breakdown,
      reasoning,
      strengths,
      considerations,
      recommendationLevel
    }
  }

  /**
   * Calculate skills compatibility
   */
  private calculateSkillsMatch(studentSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 80 // No specific requirements

    const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase())
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase())

    // Direct matches
    const exactMatches = normalizedRequiredSkills.filter(skill => 
      normalizedStudentSkills.includes(skill)
    ).length

    // Related skills (simplified - could be enhanced with skill taxonomy)
    const relatedMatches = this.findRelatedSkills(normalizedStudentSkills, normalizedRequiredSkills)

    const totalMatches = exactMatches + (relatedMatches * 0.5)
    const matchPercentage = Math.min(100, (totalMatches / normalizedRequiredSkills.length) * 100)

    // Bonus for having extra relevant skills
    const bonusSkills = Math.max(0, normalizedStudentSkills.length - normalizedRequiredSkills.length) * 2
    
    return Math.min(100, Math.round(matchPercentage + bonusSkills))
  }

  /**
   * Calculate industry/category compatibility
   */
  private calculateIndustryMatch(studentIndustries: string[], projectCategory: string): number {
    if (studentIndustries.length === 0) return 50 // Neutral if no preferences

    const normalizedIndustries = studentIndustries.map(i => i.toLowerCase())
    const normalizedCategory = projectCategory.toLowerCase()

    // Direct category match
    if (normalizedIndustries.some(industry => 
      normalizedCategory.includes(industry.split(' ')[0]) || 
      industry.includes(normalizedCategory)
    )) {
      return 95
    }

    // Related industry matches
    const relatedScore = this.findRelatedIndustries(normalizedIndustries, normalizedCategory)
    
    return Math.max(30, relatedScore) // Minimum score for exploratory matching
  }

  /**
   * Calculate experience level compatibility
   */
  private calculateExperienceMatch(studentLevel: string, projectLevel: string): number {
    const experienceLevels = {
      'high school student': 1,
      'university freshman': 2,
      'university sophomore': 2,
      'university junior': 3,
      'university senior': 4,
      'recent graduate': 4,
      'career changer': 3
    }

    const projectLevels = {
      'high school': 1,
      'university': 2,
      'entry level': 3,
      'intermediate': 4,
      'advanced': 5
    }

    const studentScore = this.getExperienceScore(studentLevel.toLowerCase(), experienceLevels)
    const projectScore = this.getExperienceScore(projectLevel.toLowerCase(), projectLevels)

    const difference = Math.abs(studentScore - projectScore)
    
    if (difference === 0) return 100
    if (difference === 1) return 85
    if (difference === 2) return 60
    if (difference === 3) return 40
    return 20
  }

  /**
   * Calculate work preferences compatibility
   */
  private calculatePreferencesMatch(preferences: StudentProfile['workPreferences'], project: ProjectData): number {
    let score = 0
    let factors = 0

    // Duration preference
    if (preferences.projectDuration) {
      const durationMatch = this.matchDuration(preferences.projectDuration, project.durationMonths)
      score += durationMatch
      factors++
    }

    // Team size preference
    if (preferences.teamSize) {
      const teamMatch = this.matchTeamSize(preferences.teamSize, project.teamSize)
      score += teamMatch
      factors++
    }

    // Time commitment
    if (preferences.timeCommitment) {
      const timeMatch = this.matchTimeCommitment(preferences.timeCommitment, project.timeCommitment)
      score += timeMatch
      factors++
    }

    return factors > 0 ? Math.round(score / factors) : 70
  }

  /**
   * Calculate goal alignment
   */
  private calculateGoalAlignment(careerGoals: string[], learningGoals: string[], project: ProjectData): number {
    const allGoals = [...careerGoals, ...learningGoals].map(g => g.toLowerCase())
    
    let alignmentScore = 50 // Base score
    
    // Check if project description mentions goal-related keywords
    const projectText = `${project.title} ${project.description} ${project.requirements.join(' ')}`.toLowerCase()
    
    const goalKeywords = {
      'technical skills': ['technical', 'coding', 'programming', 'development'],
      'real-world experience': ['real-world', 'practical', 'hands-on', 'industry'],
      'portfolio projects': ['portfolio', 'showcase', 'project', 'build'],
      'networking': ['team', 'collaboration', 'networking', 'mentorship'],
      'leadership': ['leadership', 'lead', 'manage', 'coordinate'],
      'entrepreneurship': ['startup', 'entrepreneur', 'business', 'innovation']
    }

    let matches = 0
    allGoals.forEach(goal => {
      Object.entries(goalKeywords).forEach(([keyword, variants]) => {
        if (goal.includes(keyword) && variants.some(variant => projectText.includes(variant))) {
          matches++
          alignmentScore += 10
        }
      })
    })

    return Math.min(100, alignmentScore)
  }

  /**
   * Helper methods for matching calculations
   */
  private findRelatedSkills(studentSkills: string[], requiredSkills: string[]): number {
    const skillGroups = {
      'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript'],
      'backend': ['node.js', 'python', 'java', 'php', 'ruby'],
      'data': ['sql', 'excel', 'tableau', 'python', 'statistics'],
      'design': ['figma', 'photoshop', 'ui', 'ux', 'design']
    }

    let relatedCount = 0
    requiredSkills.forEach(required => {
      Object.values(skillGroups).forEach(group => {
        if (group.includes(required) && 
            studentSkills.some(skill => group.includes(skill) && skill !== required)) {
          relatedCount++
        }
      })
    })

    return relatedCount
  }

  private findRelatedIndustries(studentIndustries: string[], projectCategory: string): number {
    const industryGroups = {
      'tech': ['technology', 'software', 'fintech', 'edtech'],
      'creative': ['design', 'media', 'entertainment', 'marketing'],
      'business': ['finance', 'consulting', 'operations', 'strategy'],
      'social': ['nonprofit', 'healthcare', 'education', 'sustainability']
    }

    let maxScore = 30
    Object.values(industryGroups).forEach(group => {
      const studentInGroup = studentIndustries.some(industry => 
        group.some(g => industry.includes(g))
      )
      const projectInGroup = group.some(g => projectCategory.includes(g))
      
      if (studentInGroup && projectInGroup) {
        maxScore = Math.max(maxScore, 70)
      }
    })

    return maxScore
  }

  private getExperienceScore(level: string, levels: Record<string, number>): number {
    for (const [key, score] of Object.entries(levels)) {
      if (level.includes(key)) return score
    }
    return 2 // Default to university level
  }

  private matchDuration(preference: string, projectMonths: number): number {
    if (preference.includes('1-2') && projectMonths <= 2) return 100
    if (preference.includes('3-4') && projectMonths >= 3 && projectMonths <= 4) return 100
    if (preference.includes('5-6') && projectMonths >= 5 && projectMonths <= 6) return 100
    if (preference.includes('flexible')) return 85
    
    // Partial matches
    const diff = Math.abs(projectMonths - 3) // 3 months as baseline
    return Math.max(40, 100 - (diff * 20))
  }

  private matchTeamSize(preference: string, teamSize: number): number {
    if (preference.includes('solo') && teamSize === 1) return 100
    if (preference.includes('small') && teamSize >= 2 && teamSize <= 3) return 100
    if (preference.includes('medium') && teamSize >= 4 && teamSize <= 6) return 100
    if (preference.includes('large') && teamSize >= 7) return 100
    if (preference.includes('no preference')) return 80
    
    return 60 // Partial match
  }

  private matchTimeCommitment(preference: string, projectCommitment?: string): number {
    if (!projectCommitment) return 70
    
    // Extract hours from preference
    const prefHours = this.extractHours(preference)
    const projHours = this.extractHours(projectCommitment)
    
    if (prefHours && projHours) {
      const diff = Math.abs(prefHours - projHours)
      return Math.max(40, 100 - (diff * 3))
    }
    
    return 60
  }

  private extractHours(text: string): number | null {
    const match = text.match(/(\d+)-?(\d+)?/)
    if (match) {
      return match[2] ? (parseInt(match[1]) + parseInt(match[2])) / 2 : parseInt(match[1])
    }
    return null
  }

  private generateReasoning(breakdown: MatchScore['breakdown'], student: StudentProfile, project: ProjectData): string[] {
    const reasons: string[] = []

    if (breakdown.skillsMatch >= 80) {
      reasons.push(`Strong skills alignment - you have ${Math.round(breakdown.skillsMatch)}% of required skills`)
    } else if (breakdown.skillsMatch >= 60) {
      reasons.push(`Good skills foundation with opportunities to learn new technologies`)
    }

    if (breakdown.industryMatch >= 80) {
      reasons.push(`Perfect industry match with your stated interests`)
    }

    if (breakdown.experienceMatch >= 80) {
      reasons.push(`Project complexity matches your experience level well`)
    }

    if (breakdown.preferencesMatch >= 80) {
      reasons.push(`Work preferences align with project structure and timeline`)
    }

    return reasons
  }

  private generateInsights(breakdown: MatchScore['breakdown'], student: StudentProfile, project: ProjectData): { strengths: string[], considerations: string[] } {
    const strengths: string[] = []
    const considerations: string[] = []

    // Strengths
    if (breakdown.skillsMatch >= 70) strengths.push('Strong technical fit')
    if (breakdown.industryMatch >= 80) strengths.push('Perfect industry alignment')
    if (breakdown.goalAlignment >= 70) strengths.push('Supports your career goals')

    // Considerations
    if (breakdown.skillsMatch < 50) considerations.push('Significant learning curve for required skills')
    if (breakdown.experienceMatch < 60) considerations.push('May be challenging given experience level')
    if (breakdown.preferencesMatch < 50) considerations.push('Schedule or work style may not align perfectly')

    return { strengths, considerations }
  }

  private getRecommendationLevel(score: number): MatchScore['recommendationLevel'] {
    if (score >= 80) return 'EXCELLENT'
    if (score >= 65) return 'GOOD'
    if (score >= 45) return 'MODERATE'
    return 'POOR'
  }

  /**
   * Data fetching methods
   */
  private async getAvailableProjects(categoryFilter?: string): Promise<ProjectData[]> {
    const where: any = {
      status: 'LIVE' // Only show approved/live projects
    }

    if (categoryFilter) {
      where.category = categoryFilter
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        company: {
          select: { companyName: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category || 'Other',
      subcategory: project.subcategory || undefined,
      skillsRequired: project.skillsRequired || [],
      experienceLevel: project.experienceLevel || 'University',
      teamSize: project.teamSize || 1,
      durationMonths: project.durationMonths || 3,
      timeCommitment: project.timeCommitment || undefined,
      requirements: project.requirements || [],
      deliverables: project.deliverables || [],
      companyName: project.company.companyName || project.company.name || 'Company',
      location: project.location || undefined,
      remote: project.remote || false,
      compensation: project.compensation || undefined
    }))
  }

  private async getStudentApplications(studentId: string): Promise<string[]> {
    const applications = await prisma.application.findMany({
      where: { userId: studentId },
      select: { projectId: true }
    })

    return applications.map(app => app.projectId)
  }

  private generateCategoryBreakdown(recommendations: ProjectRecommendation[]): MatchingResult['categoryBreakdown'] {
    const categoryMap = new Map<string, { count: number, totalScore: number }>()

    recommendations.forEach(rec => {
      const category = rec.project.category
      const current = categoryMap.get(category) || { count: 0, totalScore: 0 }
      current.count++
      current.totalScore += rec.matchScore.overallScore
      categoryMap.set(category, current)
    })

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count)
    })).sort((a, b) => b.avgScore - a.avgScore)
  }
}

// Export singleton instance
export const projectMatcher = new ProjectMatcher()

// Export types
export type {
  StudentProfile,
  ProjectData,
  MatchScore,
  ProjectRecommendation,
  MatchingResult
} 