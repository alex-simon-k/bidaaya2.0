/**
 * CV Conversation Manager
 * 
 * Manages the conversational flow for collecting CV data
 * Tracks progress, determines next questions, calculates completeness
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ConversationState {
  // Progress tracking
  currentPhase: 1 | 2 | 3 | 4 | 5 | 6  // Which collection phase
  completedSections: string[]
  incompleteSections: string[]
  
  // Context awareness
  lastCollectedEntity: string | null
  lastAskedQuestion: string | null
  pendingFollowUps: string[]
  
  // User behavior
  engagementLevel: 'high' | 'medium' | 'low'
  answerStyle: 'brief' | 'detailed'
  
  // Data quality
  fieldsNeedingClarification: string[]
  
  // Conversation metrics
  totalMessagesExchanged: number
  timeInConversation: number  // minutes
}

export interface CVCompleteness {
  // Overall
  overallScore: number  // 0-100
  isMinimumViable: boolean  // Can we generate a basic CV?
  
  // By section
  profile: SectionCompleteness
  education: SectionCompleteness
  experience: SectionCompleteness
  projects: SectionCompleteness
  skills: SectionCompleteness
  certifications: SectionCompleteness
  languages: SectionCompleteness
  achievements: SectionCompleteness
  
  // Actionable insights
  nextRecommendedSection: string
  estimatedTimeToComplete: number  // minutes
  missingCriticalFields: string[]
}

export interface SectionCompleteness {
  score: number  // 0-100
  entriesCount: number
  hasMinimumData: boolean
  missingFields: string[]
  priority: 'critical' | 'important' | 'optional'
}

// ============================================
// CONVERSATION MANAGER CLASS
// ============================================

export class CVConversationManager {
  
  /**
   * Calculate CV completeness for a user
   */
  static async calculateCompleteness(userId: string): Promise<CVCompleteness> {
    
    // Fetch all CV data
    const [
      user,
      cvProfile,
      educations,
      experiences,
      projects,
      skills,
      certifications,
      languages,
      achievements
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.cVProfile.findUnique({ where: { userId } }),
      prisma.cVEducation.findMany({ where: { userId } }),
      prisma.cVExperience.findMany({ where: { userId }, include: { impacts: true } }),
      prisma.cVProject.findMany({ where: { userId }, include: { impacts: true } }),
      prisma.cVSkill.findMany({ where: { userId } }),
      prisma.cVCertification.findMany({ where: { userId } }),
      prisma.cVLanguage.findMany({ where: { userId } }),
      prisma.cVAchievement.findMany({ where: { userId } })
    ])

    // Calculate section completeness
    const profileCompleteness = this.calculateProfileCompleteness(user, cvProfile)
    const educationCompleteness = this.calculateEducationCompleteness(educations)
    const experienceCompleteness = this.calculateExperienceCompleteness(experiences)
    const projectsCompleteness = this.calculateProjectsCompleteness(projects)
    const skillsCompleteness = this.calculateSkillsCompleteness(skills)
    const certificationsCompleteness = this.calculateCertificationsCompleteness(certifications)
    const languagesCompleteness = this.calculateLanguagesCompleteness(languages)
    const achievementsCompleteness = this.calculateAchievementsCompleteness(achievements)

    // Calculate overall score (weighted)
    const overallScore = Math.round(
      profileCompleteness.score * 0.20 +
      educationCompleteness.score * 0.20 +
      experienceCompleteness.score * 0.25 +
      projectsCompleteness.score * 0.15 +
      skillsCompleteness.score * 0.10 +
      certificationsCompleteness.score * 0.05 +
      languagesCompleteness.score * 0.03 +
      achievementsCompleteness.score * 0.02
    )

    // Minimum viable CV requires: name, education, some skills
    const isMinimumViable = 
      !!user?.name &&
      educationCompleteness.hasMinimumData &&
      skillsCompleteness.hasMinimumData

    // Determine next recommended section
    const nextSection = this.determineNextSection({
      profile: profileCompleteness,
      education: educationCompleteness,
      experience: experienceCompleteness,
      projects: projectsCompleteness,
      skills: skillsCompleteness,
    })

    // Collect all missing critical fields
    const missingCriticalFields = [
      ...profileCompleteness.missingFields.filter(_ => profileCompleteness.priority === 'critical'),
      ...educationCompleteness.missingFields.filter(_ => educationCompleteness.priority === 'critical'),
      ...experienceCompleteness.missingFields.filter(_ => experienceCompleteness.priority === 'critical'),
    ]

    // Estimate time to complete (rough heuristic)
    const sectionsRemaining = 
      (profileCompleteness.score < 80 ? 1 : 0) +
      (educationCompleteness.score < 80 ? 1 : 0) +
      (experienceCompleteness.score < 80 ? 1 : 0) +
      (projectsCompleteness.score < 80 ? 1 : 0) +
      (skillsCompleteness.score < 80 ? 1 : 0)
    
    const estimatedTimeToComplete = sectionsRemaining * 3  // ~3 minutes per section

    return {
      overallScore,
      isMinimumViable,
      profile: profileCompleteness,
      education: educationCompleteness,
      experience: experienceCompleteness,
      projects: projectsCompleteness,
      skills: skillsCompleteness,
      certifications: certificationsCompleteness,
      languages: languagesCompleteness,
      achievements: achievementsCompleteness,
      nextRecommendedSection: nextSection,
      estimatedTimeToComplete,
      missingCriticalFields,
    }
  }

  /**
   * Generate next question based on conversation state and completeness
   */
  static async generateNextQuestion(
    userId: string,
    lastMessage: string,
    completeness: CVCompleteness
  ): Promise<string> {
    
    // If minimum viable not met, prioritize critical sections
    if (!completeness.isMinimumViable) {
      if (completeness.profile.score < 50) {
        return "Let's start with the basics - what's your full name?"
      }
      if (!completeness.education.hasMinimumData) {
        return "Great! Now tell me about your education - where are you currently studying?"
      }
      if (!completeness.skills.hasMinimumData) {
        return "What are some of your key skills? For example, programming languages, tools, or professional skills?"
      }
    }

    // Move through phases systematically
    const nextSection = completeness.nextRecommendedSection

    switch (nextSection) {
      case 'experience':
        if (completeness.experience.entriesCount === 0) {
          return "Have you had any work experience, internships, or jobs? Tell me about them!"
        }
        return "Do you have any other work experience you'd like to add?"

      case 'projects':
        if (completeness.projects.entriesCount === 0) {
          return "Have you worked on any personal projects, side hustles, or entrepreneurial ventures?"
        }
        return "Any other projects you'd like to highlight?"

      case 'education':
        return "Tell me more about your education - any other degrees, A-Levels, or courses?"

      case 'skills':
        return "What other technical or professional skills do you have?"

      case 'certifications':
        return "Have you completed any certifications, courses, or professional training?"

      case 'languages':
        return "What languages do you speak, and how fluently?"

      case 'achievements':
        return "Do you have any leadership roles, awards, or achievements you'd like to mention?"

      default:
        return "Your CV is looking great! Would you like to add anything else, or shall we generate your customized CV?"
    }
  }

  /**
   * Determine which section to collect next
   */
  private static determineNextSection(sections: {
    profile: SectionCompleteness
    education: SectionCompleteness
    experience: SectionCompleteness
    projects: SectionCompleteness
    skills: SectionCompleteness
  }): string {
    
    // Priority order for minimum viable CV
    if (sections.profile.score < 50) return 'profile'
    if (sections.education.score < 50) return 'education'
    if (sections.skills.score < 50) return 'skills'
    
    // Then focus on experience (most impactful)
    if (sections.experience.score < 80) return 'experience'
    if (sections.projects.score < 60) return 'projects'
    
    // Finally, enrich with additional data
    if (sections.education.score < 80) return 'education'
    if (sections.skills.score < 80) return 'skills'
    
    return 'certifications'  // Default to least critical
  }

  // ============================================
  // SECTION COMPLETENESS CALCULATORS
  // ============================================

  private static calculateProfileCompleteness(user: any, cvProfile: any): SectionCompleteness {
    const missingFields: string[] = []
    let score = 0

    // Critical fields (60 points)
    if (user?.name) score += 20; else missingFields.push('name')
    if (user?.email) score += 20; else missingFields.push('email')
    if (user?.location) score += 20; else missingFields.push('location')

    // Important fields (30 points)
    if (user?.linkedin) score += 10; else missingFields.push('linkedin')
    if (user?.whatsapp || user?.phone) score += 10; else missingFields.push('phone')
    if (cvProfile?.headline) score += 10; else missingFields.push('headline')

    // Optional fields (10 points)
    if (cvProfile?.professionalSummary) score += 5
    if (cvProfile?.githubLink || cvProfile?.portfolioLink) score += 5

    return {
      score: Math.min(score, 100),
      entriesCount: 1,
      hasMinimumData: !!user?.name && !!user?.email,
      missingFields,
      priority: 'critical'
    }
  }

  private static calculateEducationCompleteness(educations: any[]): SectionCompleteness {
    const missingFields: string[] = []
    let score = 0

    if (educations.length === 0) {
      missingFields.push('education_entries')
      return {
        score: 0,
        entriesCount: 0,
        hasMinimumData: false,
        missingFields,
        priority: 'critical'
      }
    }

    // Has at least one education entry (50 points)
    score += 50

    // Check quality of entries
    const primaryEdu = educations[0]
    if (primaryEdu.degreeTitle) score += 15
    if (primaryEdu.startDate) score += 10
    if (primaryEdu.gpa || primaryEdu.predictedGrade) score += 10
    if (primaryEdu.modules && primaryEdu.modules.length > 0) score += 10
    if (primaryEdu.honorsAwards && primaryEdu.honorsAwards.length > 0) score += 5

    return {
      score: Math.min(score, 100),
      entriesCount: educations.length,
      hasMinimumData: educations.length > 0,
      missingFields,
      priority: 'critical'
    }
  }

  private static calculateExperienceCompleteness(experiences: any[]): SectionCompleteness {
    const missingFields: string[] = []
    let score = 0

    if (experiences.length === 0) {
      missingFields.push('work_experience')
      return {
        score: 0,
        entriesCount: 0,
        hasMinimumData: false,
        missingFields,
        priority: 'important'
      }
    }

    // Base score for having experience (40 points)
    score += 40

    // Quality of experience entries
    const hasImpact = experiences.some(exp => exp.impacts && exp.impacts.length > 0)
    const hasMetrics = experiences.some(exp => 
      exp.impacts && exp.impacts.some((impact: any) => impact.metrics)
    )
    const hasDates = experiences.every(exp => exp.startDate)
    const hasSummaries = experiences.some(exp => exp.summary)

    if (hasImpact) score += 25
    if (hasMetrics) score += 20
    if (hasDates) score += 10
    if (hasSummaries) score += 5

    return {
      score: Math.min(score, 100),
      entriesCount: experiences.length,
      hasMinimumData: experiences.length > 0,
      missingFields,
      priority: 'important'
    }
  }

  private static calculateProjectsCompleteness(projects: any[]): SectionCompleteness {
    const missingFields: string[] = []
    let score = 0

    if (projects.length === 0) {
      return {
        score: 0,
        entriesCount: 0,
        hasMinimumData: false,
        missingFields: ['projects'],
        priority: 'important'
      }
    }

    // Base score (50 points)
    score += 50

    // Quality indicators
    const hasTechStack = projects.some(p => p.techStack && p.techStack.length > 0)
    const hasImpact = projects.some(p => p.impacts && p.impacts.length > 0)
    const hasLinks = projects.some(p => p.projectUrl || p.githubUrl)

    if (hasTechStack) score += 20
    if (hasImpact) score += 20
    if (hasLinks) score += 10

    return {
      score: Math.min(score, 100),
      entriesCount: projects.length,
      hasMinimumData: projects.length > 0,
      missingFields,
      priority: 'important'
    }
  }

  private static calculateSkillsCompleteness(skills: any[]): SectionCompleteness {
    const missingFields: string[] = []
    let score = 0

    if (skills.length === 0) {
      return {
        score: 0,
        entriesCount: 0,
        hasMinimumData: false,
        missingFields: ['skills'],
        priority: 'critical'
      }
    }

    // Minimum 3 skills (60 points)
    if (skills.length >= 3) score += 60
    else score += skills.length * 20

    // Has categorization (20 points)
    const hasCategorization = skills.some(s => s.category)
    if (hasCategorization) score += 20

    // Has proficiency levels (20 points)
    const hasProficiency = skills.some(s => s.proficiency)
    if (hasProficiency) score += 20

    return {
      score: Math.min(score, 100),
      entriesCount: skills.length,
      hasMinimumData: skills.length >= 3,
      missingFields,
      priority: 'critical'
    }
  }

  private static calculateCertificationsCompleteness(certifications: any[]): SectionCompleteness {
    return {
      score: certifications.length > 0 ? Math.min(certifications.length * 33, 100) : 0,
      entriesCount: certifications.length,
      hasMinimumData: certifications.length > 0,
      missingFields: certifications.length === 0 ? ['certifications'] : [],
      priority: 'optional'
    }
  }

  private static calculateLanguagesCompleteness(languages: any[]): SectionCompleteness {
    return {
      score: languages.length > 0 ? Math.min(languages.length * 33, 100) : 0,
      entriesCount: languages.length,
      hasMinimumData: languages.length > 0,
      missingFields: languages.length === 0 ? ['languages'] : [],
      priority: 'optional'
    }
  }

  private static calculateAchievementsCompleteness(achievements: any[]): SectionCompleteness {
    return {
      score: achievements.length > 0 ? Math.min(achievements.length * 25, 100) : 0,
      entriesCount: achievements.length,
      hasMinimumData: achievements.length > 0,
      missingFields: achievements.length === 0 ? ['achievements'] : [],
      priority: 'optional'
    }
  }

  /**
   * Generate acknowledgment message for collected data
   */
  static generateAcknowledgment(entityType: string, data: any): string {
    switch (entityType) {
      case 'experience':
        if (data.impact && data.impact.length > 0) {
          return `Excellent! I've saved your role at ${data.employer}. Impressive ${data.impact[0].statement.toLowerCase()}!`
        }
        return `Great! I've saved your ${data.title} role at ${data.employer}.`

      case 'education':
        // Safe fallback for missing fields
        const degreeType = data.degree_type ? data.degree_type.toUpperCase() : 'education'
        const field = data.field_of_study || 'your studies'
        const institution = data.institution || ''
        return `Perfect! I've added your ${degreeType} in ${field}${institution ? ` from ${institution}` : ''}.`

      case 'project':
        if (data.tech_stack && data.tech_stack.length > 0) {
          return `Nice! I've saved ${data.name}. ${data.tech_stack.slice(0, 3).join(', ')} - great tech stack!`
        }
        return `Awesome! I've added ${data.name} to your projects.`

      case 'certification':
        return `Great! I've added your ${data.name} certification from ${data.issuer}.`

      case 'skill':
        return `Got it! Added ${data.skill_name} to your skills.`

      default:
        return `Thank you! I've saved that information.`
    }
  }

  /**
   * Determine user's engagement level based on response length and detail
   */
  static analyzeEngagement(message: string, messageCount: number): 'high' | 'medium' | 'low' {
    const wordCount = message.split(/\s+/).length

    // High engagement: detailed responses
    if (wordCount > 30) return 'high'

    // Low engagement: very brief responses
    if (wordCount < 5 && messageCount > 3) return 'low'

    return 'medium'
  }
}

