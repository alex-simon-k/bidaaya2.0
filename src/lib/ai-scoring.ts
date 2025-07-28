import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ApplicationScore {
  applicationId: string
  score: number
  breakdown: {
    skillsMatch: number
    experienceLevel: number
    careerGoals: number
    industryFit: number
    availability: number
  }
  reasoning: string[]
  rank: number
}

export interface ScoringCriteria {
  requiredSkills: string[]
  preferredSkills?: string[]
  experienceLevel: 'entry' | 'mid' | 'senior'
  industry: string
  projectDuration: string
  teamSize: string
}

export class AIApplicationScoring {
  /**
   * Calculate compatibility scores for all applications to a project
   * Only returns scores if there are 20+ applications for statistical significance
   */
  async scoreApplications(projectId: string): Promise<ApplicationScore[] | null> {
    try {
      // Get project with applications
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          applications: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  skills: true,
                  major: true,
                  university: true,
                  bio: true,
                  graduationYear: true
                }
              }
            }
          }
        }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Require minimum 20 applications for statistical significance
      if (project.applications.length < 20) {
        console.log(`🤖 AI Scoring: Only ${project.applications.length} applications, need 20+ for scoring`)
        return null
      }

      console.log(`🤖 AI Scoring: Processing ${project.applications.length} applications for project ${project.title}`)

      // Extract scoring criteria from project
      const criteria = this.extractScoringCriteria(project)

      // Score each application
      const scoredApplications = project.applications.map(application => {
        return this.scoreIndividualApplication(application, criteria)
      })

      // Sort by score (highest first) and assign ranks
      const rankedApplications = scoredApplications
        .sort((a, b) => b.score - a.score)
        .map((app, index) => ({
          ...app,
          rank: index + 1
        }))

      console.log(`🤖 AI Scoring: Completed scoring for ${rankedApplications.length} applications`)
      
      return rankedApplications

    } catch (error) {
      console.error('🤖 AI Scoring Error:', error)
      return null
    }
  }

  /**
   * Extract scoring criteria from project data
   */
  private extractScoringCriteria(project: any): ScoringCriteria {
    return {
      requiredSkills: project.skillsRequired || [],
      preferredSkills: project.skillsPreferred || [],
      experienceLevel: this.mapExperienceLevel(project.experienceLevel),
      industry: project.category || project.industry || 'technology',
      projectDuration: project.durationMonths ? `${project.durationMonths} months` : '3-6 months',
      teamSize: project.teamSize ? `${project.teamSize} people` : 'small team'
    }
  }

  /**
   * Score an individual application against project criteria
   */
  private scoreIndividualApplication(application: any, criteria: ScoringCriteria): ApplicationScore {
    const user = application.user
    let reasoning: string[] = []

    // Parse discovery profile data from bio if available
    let discoveryProfile = null
    try {
      if (user.bio && user.bio.includes('discoveryProfile')) {
        const bioData = JSON.parse(user.bio)
        discoveryProfile = bioData.discoveryProfile
      }
    } catch (e) {
      // No discovery profile data
    }

    // 1. Skills Match (30% weight)
    const skillsScore = this.calculateSkillsMatch(user.skills, criteria.requiredSkills, criteria.preferredSkills)
    reasoning.push(`Skills match: ${Math.round(skillsScore * 100)}% - ${this.getSkillsReasoning(user.skills, criteria.requiredSkills)}`)

    // 2. Experience Level Match (25% weight)
    const experienceScore = this.calculateExperienceMatch(user, discoveryProfile, criteria.experienceLevel)
    reasoning.push(`Experience level: ${Math.round(experienceScore * 100)}% fit for ${criteria.experienceLevel} role`)

    // 3. Career Goals Alignment (20% weight)
    const careerGoalsScore = this.calculateCareerGoalsMatch(discoveryProfile, criteria)
    reasoning.push(`Career goals: ${Math.round(careerGoalsScore * 100)}% alignment with project objectives`)

    // 4. Industry Fit (15% weight)
    const industryScore = this.calculateIndustryFit(user, discoveryProfile, criteria.industry)
    reasoning.push(`Industry fit: ${Math.round(industryScore * 100)}% match for ${criteria.industry}`)

    // 5. Availability/Commitment (10% weight)
    const availabilityScore = this.calculateAvailabilityMatch(discoveryProfile, criteria)
    reasoning.push(`Availability: ${Math.round(availabilityScore * 100)}% match for project timeline`)

    // Calculate weighted final score
    const finalScore = (
      skillsScore * 0.30 +
      experienceScore * 0.25 +
      careerGoalsScore * 0.20 +
      industryScore * 0.15 +
      availabilityScore * 0.10
    )

    return {
      applicationId: application.id,
      score: Math.round(finalScore * 100), // Convert to 0-100 scale
      breakdown: {
        skillsMatch: Math.round(skillsScore * 100),
        experienceLevel: Math.round(experienceScore * 100),
        careerGoals: Math.round(careerGoalsScore * 100),
        industryFit: Math.round(industryScore * 100),
        availability: Math.round(availabilityScore * 100)
      },
      reasoning,
      rank: 0 // Will be assigned after sorting
    }
  }

  /**
   * Calculate skills match score
   */
  private calculateSkillsMatch(userSkills: string[], requiredSkills: string[], preferredSkills: string[] = []): number {
    if (!userSkills || userSkills.length === 0) return 0

    const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim())
    const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim())
    const normalizedPreferred = preferredSkills.map(s => s.toLowerCase().trim())

    // Check required skills match
    const requiredMatches = normalizedRequired.filter(skill => 
      normalizedUserSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    ).length

    // Check preferred skills match
    const preferredMatches = normalizedPreferred.filter(skill => 
      normalizedUserSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    ).length

    // Weight required skills more heavily
    const requiredScore = normalizedRequired.length > 0 ? requiredMatches / normalizedRequired.length : 1
    const preferredScore = normalizedPreferred.length > 0 ? preferredMatches / normalizedPreferred.length : 0.5

    return Math.min(1, requiredScore * 0.8 + preferredScore * 0.2)
  }

  /**
   * Calculate experience level match
   */
  private calculateExperienceMatch(user: any, discoveryProfile: any, targetLevel: string): number {
    // Get experience indicators
    const hasUniversity = !!user.university
    const isGraduating = user.graduationYear && user.graduationYear >= new Date().getFullYear()
    const experienceLevel = discoveryProfile?.experienceLevel

    switch (targetLevel) {
      case 'entry':
        if (experienceLevel === 'Student - No prior internship/work experience') return 1.0
        if (experienceLevel === 'Student - Some internship/work experience') return 0.8
        if (isGraduating) return 0.9
        return 0.6

      case 'mid':
        if (experienceLevel === 'Student - Some internship/work experience') return 1.0
        if (experienceLevel === 'Recent Graduate - 0-2 years experience') return 1.0
        if (experienceLevel === 'Career Changer - New field, existing skills') return 0.8
        return 0.5

      case 'senior':
        if (experienceLevel === 'Recent Graduate - 0-2 years experience') return 0.7
        if (experienceLevel === 'Career Changer - New field, existing skills') return 0.9
        return 0.4

      default:
        return 0.5
    }
  }

  /**
   * Calculate career goals alignment
   */
  private calculateCareerGoalsMatch(discoveryProfile: any, criteria: ScoringCriteria): number {
    if (!discoveryProfile?.careerGoals) return 0.5

    const careerGoals = discoveryProfile.careerGoals
    let score = 0.5 // Base score

    // Look for alignment with project type
    if (careerGoals.includes('Contribute to meaningful projects')) score += 0.3
    if (careerGoals.includes('Prepare for full-time roles')) score += 0.2
    if (careerGoals.includes('Earn recommendations/references')) score += 0.2

    return Math.min(1, score)
  }

  /**
   * Calculate industry fit
   */
  private calculateIndustryFit(user: any, discoveryProfile: any, targetIndustry: string): number {
    const userIndustries = discoveryProfile?.industries || []
    
    if (userIndustries.length === 0) return 0.5

    const industryMatch = userIndustries.some((industry: string) => 
      industry.toLowerCase().includes(targetIndustry.toLowerCase()) ||
      targetIndustry.toLowerCase().includes(industry.toLowerCase())
    )

    return industryMatch ? 1.0 : 0.3
  }

  /**
   * Calculate availability match
   */
  private calculateAvailabilityMatch(discoveryProfile: any, criteria: ScoringCriteria): number {
    if (!discoveryProfile?.workPreferences) return 0.7

    const workPrefs = discoveryProfile.workPreferences
    let score = 0.5

    // Time commitment match
    if (workPrefs.timeCommitment === '35+ hours - Full-time internship') score += 0.3
    else if (workPrefs.timeCommitment === '20-30 hours - Part-time') score += 0.2

    // Project duration preference
    if (workPrefs.projectDuration?.includes('3-4 months')) score += 0.2

    return Math.min(1, score)
  }

  /**
   * Helper methods
   */
  private mapExperienceLevel(level: string): 'entry' | 'mid' | 'senior' {
    if (!level) return 'entry'
    const l = level.toLowerCase()
    if (l.includes('senior') || l.includes('lead')) return 'senior'
    if (l.includes('mid') || l.includes('intermediate')) return 'mid'
    return 'entry'
  }

  private getSkillsReasoning(userSkills: string[], requiredSkills: string[]): string {
    if (!userSkills || userSkills.length === 0) return 'No skills listed'
    
    const matches = requiredSkills.filter(req => 
      userSkills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
    )
    
    if (matches.length === 0) return 'No required skills match'
    return `Matches: ${matches.slice(0, 3).join(', ')}`
  }
}

export const aiScoring = new AIApplicationScoring() 