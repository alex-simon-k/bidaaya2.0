/**
 * Custom CV Generator Service
 * 
 * Generates tailored CVs for specific opportunities
 * Uses collected CV data to create customized, relevant resumes
 */

import { PrismaClient } from '@prisma/client'
import { CVTextEnhancer } from './cv-text-enhancer'

const prisma = new PrismaClient()

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface OpportunityRequirements {
  title: string
  description: string
  required_skills: string[]
  nice_to_have_skills: string[]
  role_type: string
  industry?: string
  experience_level?: string
}

export interface GeneratedCV {
  // Profile section
  profile: {
    name: string
    headline: string
    email: string
    phone?: string
    location?: string
    linkedin?: string
    portfolio?: string
    github?: string
  }
  
  // Core sections
  professional_summary?: string
  education: EducationEntry[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  skills: SkillEntry[]
  
  // Optional sections
  certifications?: CertificationEntry[]
  languages?: LanguageEntry[]
  achievements?: AchievementEntry[]
  
  // Metadata
  customizedFor: string  // Opportunity title
  relevanceScore: number  // How well this matches
  generatedAt: Date
}

interface EducationEntry {
  institution: string
  degree: string
  field: string
  location?: string
  dates: string
  grade?: string
  highlights?: string[]  // Relevant modules/coursework
}

interface ExperienceEntry {
  title: string
  employer: string
  location?: string
  dates: string
  summary?: string
  achievements: string[]  // Relevant impact statements
  relevanceScore: number
}

interface ProjectEntry {
  name: string
  role?: string
  dates?: string
  description: string
  technologies: string[]
  outcomes: string[]
  relevanceScore: number
}

interface SkillEntry {
  name: string
  proficiency?: string
  category: string
  isHighlighted: boolean  // Whether this matches requirements
}

interface CertificationEntry {
  name: string
  issuer: string
  date: string
}

interface LanguageEntry {
  language: string
  proficiency: string
}

interface AchievementEntry {
  name: string
  description: string
  date: string
}

// ============================================
// CV GENERATOR CLASS
// ============================================

export class CVGenerator {
  
  /**
   * Generate a custom CV tailored to a specific opportunity
   */
  static async generateCustomCV(
    userId: string,
    opportunity: OpportunityRequirements
  ): Promise<GeneratedCV | null> {
    
    try {
      console.log(`📄 Generating custom CV for ${userId} → ${opportunity.title}`)
      
      // Fetch all CV data
      const cvData = await this.fetchCompleteCV(userId)
      
      if (!cvData.user) {
        console.error('❌ User not found')
        return null
      }

      // Extract opportunity keywords for relevance matching
      const opportunityKeywords = this.extractKeywords(
        opportunity.title + ' ' + opportunity.description
      )

      // Build profile section
      const profile = this.buildProfile(cvData.user, cvData.cvProfile, opportunity)

      // Build professional summary (tailored)
      const professional_summary = this.generateProfessionalSummary(
        cvData,
        opportunity
      )

      // Select and rank relevant education
      const education = this.selectRelevantEducation(
        cvData.educations,
        opportunityKeywords
      )

      // Select and rank relevant experience
      const experience = await this.selectRelevantExperience(
        cvData.experiences,
        opportunity,
        opportunityKeywords
      )

      // Select and rank relevant projects
      const projects = this.selectRelevantProjects(
        cvData.projects,
        opportunity,
        opportunityKeywords
      )

      // Prioritize and order skills
      const skills = this.prioritizeSkills(
        cvData.skills,
        opportunity
      )

      // Include relevant certifications
      const certifications = this.selectRelevantCertifications(
        cvData.certifications,
        opportunityKeywords
      )

      // Include languages
      const languages = cvData.languages.map(lang => ({
        language: lang.language,
        proficiency: lang.proficiencyLevel
      }))

      // Include achievements
      const achievements = cvData.achievements.map(ach => ({
        name: ach.name,
        description: ach.description || '',
        date: ach.date.toISOString().split('T')[0]
      }))

      // Calculate overall relevance score
      const relevanceScore = this.calculateOverallRelevance(
        experience,
        projects,
        skills,
        opportunity
      )

      const cv: GeneratedCV = {
        profile,
        professional_summary,
        education,
        experience,
        projects,
        skills,
        certifications: certifications.length > 0 ? certifications : undefined,
        languages: languages.length > 0 ? languages : undefined,
        achievements: achievements.length > 0 ? achievements : undefined,
        customizedFor: opportunity.title,
        relevanceScore,
        generatedAt: new Date()
      }

      console.log(`✅ CV generated with ${relevanceScore}% relevance`)
      return cv

    } catch (error) {
      console.error('❌ Error generating CV:', error)
      return null
    }
  }

  /**
   * Generate a generic CV (not tailored to specific opportunity)
   */
  static async generateGenericCV(userId: string): Promise<GeneratedCV | null> {
    
    try {
      console.log(`📄 Generating generic CV for ${userId}`)
      
      const cvData = await this.fetchCompleteCV(userId)
      
      if (!cvData.user) return null

      const profile = this.buildProfile(cvData.user, cvData.cvProfile)

      const professional_summary = cvData.cvProfile?.professionalSummary || 
        this.generateGenericSummary(cvData)

      const education = cvData.educations.map(edu => this.formatEducation(edu))

      const experience = cvData.experiences.map(exp => ({
        title: exp.title,
        employer: exp.employer,
        location: exp.location || undefined,
        dates: this.formatDateRange(exp.startDate, exp.endDate, exp.isCurrent),
        summary: exp.summary || undefined,
        achievements: exp.impacts?.map(imp => imp.statement) || [],
        relevanceScore: 100  // Generic, so all are equally relevant
      }))

      const projects = cvData.projects.map(proj => ({
        name: proj.name,
        role: proj.role || undefined,
        dates: proj.startDate ? this.formatDateRange(proj.startDate, proj.endDate, proj.isCurrent) : undefined,
        description: proj.summary || '',
        technologies: proj.techStack,
        outcomes: proj.impacts?.map(imp => imp.statement) || [],
        relevanceScore: 100
      }))

      const skills = cvData.skills.map(skill => ({
        name: skill.skillName,
        proficiency: skill.proficiency || undefined,
        category: skill.category,
        isHighlighted: false
      }))

      return {
        profile,
        professional_summary,
        education,
        experience,
        projects,
        skills,
        certifications: cvData.certifications.map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          date: cert.issueDate.toISOString().split('T')[0]
        })),
        languages: cvData.languages.map(lang => ({
          language: lang.language,
          proficiency: lang.proficiencyLevel
        })),
        achievements: cvData.achievements.map(ach => ({
          name: ach.name,
          description: ach.description || '',
          date: ach.date.toISOString().split('T')[0]
        })),
        customizedFor: 'General Purpose',
        relevanceScore: 100,
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('❌ Error generating generic CV:', error)
      return null
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Fetch complete CV data for a user
   */
  private static async fetchCompleteCV(userId: string, opportunityId?: string) {
    const [
      user,
      cvProfile,
      educations,
      experiences,
      projects,
      skills,
      certifications,
      languages,
      achievements,
      enhancements
    ] = await Promise.all([
      prisma.user.findUnique({ 
        where: { id: userId },
        select: { 
          name: true, 
          email: true, 
          location: true, 
          linkedin: true, 
          whatsapp: true 
        }
      }),
      prisma.cVProfile.findUnique({ where: { userId } }),
      prisma.cVEducation.findMany({ 
        where: { userId },
        orderBy: { startDate: 'desc' }
      }),
      prisma.cVExperience.findMany({ 
        where: { userId },
        include: { impacts: true },
        orderBy: { startDate: 'desc' }
      }),
      prisma.cVProject.findMany({ 
        where: { userId },
        include: { impacts: true },
        orderBy: { startDate: 'desc' }
      }),
      prisma.cVSkill.findMany({ where: { userId } }),
      prisma.cVCertification.findMany({ 
        where: { userId },
        orderBy: { issueDate: 'desc' }
      }),
      prisma.cVLanguage.findMany({ where: { userId } }),
      prisma.cVAchievement.findMany({ 
        where: { userId },
        orderBy: { date: 'desc' }
      }),
      // Fetch CV enhancements (prioritize opportunity-specific ones)
      prisma.cVEnhancement.findMany({
        where: {
          userId,
          // If opportunityId provided, include both opportunity-specific and general ones
          ...(opportunityId ? {
            OR: [
              { opportunityId },
              { opportunityId: null }
            ]
          } : {})
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Enhance all CV text using AI (fix capitalization, spelling, formatting)
    console.log('🤖 Enhancing CV text with AI...')
    const enhancedData = await this.enhanceCVData({
      educations,
      experiences,
      projects,
      skills
    })

    return {
      user,
      cvProfile,
      educations: enhancedData.educations,
      experiences: enhancedData.experiences,
      projects: enhancedData.projects,
      skills: enhancedData.skills,
      certifications,
      languages,
      achievements,
      enhancements
    }
  }

  /**
   * Enhance CV data using AI (fix capitalization, spelling, formatting)
   */
  private static async enhanceCVData(data: {
    educations: any[]
    experiences: any[]
    projects: any[]
    skills: any[]
  }) {
    try {
      // Enhance education entries
      const educations = await Promise.all(
        data.educations.map(async (edu) => {
          const enhanced = await CVTextEnhancer.enhanceEducation({
            degreeType: edu.degreeType,
            degreeTitle: edu.degreeTitle,
            fieldOfStudy: edu.fieldOfStudy,
            institution: edu.institution,
            modules: edu.modules || [],
          })
          
          return {
            ...edu,
            degreeTitle: enhanced.degreeTitle || edu.degreeTitle,
            fieldOfStudy: enhanced.fieldOfStudy || edu.fieldOfStudy,
            institution: enhanced.institution || edu.institution,
            modules: enhanced.modules || edu.modules,
          }
        })
      )

      // Enhance experience entries
      const experiences = await Promise.all(
        data.experiences.map(async (exp) => {
          const achievements = exp.impacts?.map((imp: any) => imp.statement) || []
          const enhanced = await CVTextEnhancer.enhanceExperience({
            title: exp.title,
            employer: exp.employer,
            summary: exp.summary,
            achievements,
          })
          
          return {
            ...exp,
            title: enhanced.jobTitle || exp.title,
            employer: enhanced.companyName || exp.employer,
            summary: enhanced.jobDescription || exp.summary,
            // Update impacts with enhanced achievements
            impacts: enhanced.achievements 
              ? enhanced.achievements.map((statement, idx) => ({
                  ...exp.impacts?.[idx],
                  statement,
                }))
              : exp.impacts,
          }
        })
      )

      // Enhance project entries
      const projects = await Promise.all(
        data.projects.map(async (proj) => {
          const enhanced = await CVTextEnhancer.enhanceProject({
            title: proj.name,
            description: proj.summary,
            technologies: proj.techStack || [],
          })
          
          return {
            ...proj,
            name: enhanced.projectTitle || proj.name,
            summary: enhanced.projectDescription || proj.summary,
            techStack: enhanced.technologies || proj.techStack,
          }
        })
      )

      // Enhance skills
      const skillNames = data.skills.map((s) => s.skillName)
      const enhancedSkillNames = await CVTextEnhancer.enhanceSkills(skillNames)
      const skills = data.skills.map((skill, idx) => ({
        ...skill,
        skillName: enhancedSkillNames[idx] || skill.skillName,
      }))

      console.log('✅ CV text enhancement complete')
      return { educations, experiences, projects, skills }
    } catch (error) {
      console.error('❌ CV text enhancement failed, using original data:', error)
      return data
    }
  }

  /**
   * Build profile section
   */
  private static buildProfile(
    user: any,
    cvProfile: any,
    opportunity?: OpportunityRequirements
  ): GeneratedCV['profile'] {
    
    // Generate tailored headline if opportunity provided
    let headline = cvProfile?.headline || `${user.name}`
    
    if (opportunity && cvProfile?.openToRoles && cvProfile.openToRoles.length > 0) {
      headline = `${cvProfile.openToRoles[0]} | ${user.location || 'Global'}`
    }

    return {
      name: user.name || 'Student',
      headline,
      email: user.email,
      phone: user.whatsapp || undefined,
      location: user.location || undefined,
      linkedin: user.linkedin || undefined,
      portfolio: cvProfile?.portfolioLink || undefined,
      github: cvProfile?.githubLink || undefined
    }
  }

  /**
   * Generate professional summary tailored to opportunity
   */
  private static generateProfessionalSummary(
    cvData: any,
    opportunity: OpportunityRequirements
  ): string {
    
    const experiences = cvData.experiences || []
    const education = cvData.educations[0]
    const topSkills = cvData.skills.slice(0, 3).map((s: any) => s.skillName)

    // Build components
    const educationPart = education ? 
      `${education.fieldOfStudy} student at ${education.institution}` : 
      'Motivated student'

    const experiencePart = experiences.length > 0 ? 
      `with experience in ${experiences[0].employer}` : 
      ''

    const skillsPart = topSkills.length > 0 ? 
      `skilled in ${topSkills.join(', ')}` : 
      ''

    const interestPart = `seeking ${opportunity.role_type || 'opportunities'} in ${opportunity.industry || 'the field'}`

    return `${educationPart}${experiencePart ? ' ' + experiencePart : ''}, ${skillsPart}. ${interestPart}.`
  }

  /**
   * Generate generic professional summary
   */
  private static generateGenericSummary(cvData: any): string {
    const education = cvData.educations[0]
    const experiences = cvData.experiences || []
    
    if (education) {
      return `${education.fieldOfStudy} student at ${education.institution}${experiences.length > 0 ? ` with ${experiences.length} professional experience${experiences.length > 1 ? 's' : ''}` : ''}.`
    }
    
    return 'Motivated student seeking opportunities to apply skills and grow professionally.'
  }

  /**
   * Select relevant education entries
   */
  private static selectRelevantEducation(
    educations: any[],
    keywords: string[]
  ): EducationEntry[] {
    
    return educations.map(edu => {
      // Filter modules to only include relevant ones
      const relevantModules = edu.modules?.filter((module: string) =>
        keywords.some(kw => module.toLowerCase().includes(kw.toLowerCase()))
      ) || []

      return {
        institution: edu.institution,
        degree: edu.degreeTitle,
        field: edu.fieldOfStudy,
        location: edu.institutionLocation || undefined,
        dates: this.formatDateRange(edu.startDate, edu.endDate, edu.isCurrent),
        grade: edu.predictedGrade || edu.finalGrade || undefined,
        highlights: relevantModules.length > 0 ? relevantModules : 
          (edu.modules?.slice(0, 3) || undefined)  // Show top 3 if none match
      }
    })
  }

  /**
   * Select and rank relevant experience
   */
  private static async selectRelevantExperience(
    experiences: any[],
    opportunity: OpportunityRequirements,
    keywords: string[]
  ): Promise<ExperienceEntry[]> {
    
    return experiences
      .map(exp => {
        // Calculate relevance score
        const relevanceScore = this.calculateExperienceRelevance(
          exp,
          opportunity,
          keywords
        )

        // Select most relevant impact statements
        const relevantImpacts = exp.impacts
          ?.filter((impact: any) => 
            keywords.some(kw => 
              impact.statement.toLowerCase().includes(kw.toLowerCase())
            ) || impact.metrics  // Always include statements with metrics
          )
          .map((imp: any) => imp.statement) || []

        // If no relevant impacts, include all impacts
        const achievements = relevantImpacts.length > 0 ? 
          relevantImpacts : 
          (exp.impacts?.map((imp: any) => imp.statement) || [])

        return {
          title: exp.title,
          employer: exp.employer,
          location: exp.location || undefined,
          dates: this.formatDateRange(exp.startDate, exp.endDate, exp.isCurrent),
          summary: exp.summary || undefined,
          achievements,
          relevanceScore
        }
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)  // Most relevant first
      .slice(0, 5)  // Top 5 most relevant experiences
  }

  /**
   * Select and rank relevant projects
   */
  private static selectRelevantProjects(
    projects: any[],
    opportunity: OpportunityRequirements,
    keywords: string[]
  ): ProjectEntry[] {
    
    return projects
      .map(proj => {
        const relevanceScore = this.calculateProjectRelevance(
          proj,
          opportunity,
          keywords
        )

        return {
          name: proj.name,
          role: proj.role || undefined,
          dates: proj.startDate ? 
            this.formatDateRange(proj.startDate, proj.endDate, proj.isCurrent) : 
            undefined,
          description: proj.summary || '',
          technologies: proj.techStack || [],
          outcomes: proj.impacts?.map((imp: any) => imp.statement) || [],
          relevanceScore
        }
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)  // Top 3 most relevant projects
  }

  /**
   * Prioritize skills based on opportunity requirements
   */
  private static prioritizeSkills(
    skills: any[],
    opportunity: OpportunityRequirements
  ): SkillEntry[] {
    
    const requiredSkills = opportunity.required_skills.map(s => s.toLowerCase())
    const niceToHaveSkills = opportunity.nice_to_have_skills.map(s => s.toLowerCase())

    return skills
      .map(skill => {
        const skillLower = skill.skillName.toLowerCase()
        const isRequired = requiredSkills.some(req => 
          skillLower.includes(req) || req.includes(skillLower)
        )
        const isNiceToHave = niceToHaveSkills.some(nice => 
          skillLower.includes(nice) || nice.includes(skillLower)
        )

        return {
          name: skill.skillName,
          proficiency: skill.proficiency || undefined,
          category: skill.category,
          isHighlighted: isRequired || isNiceToHave,
          _priority: isRequired ? 3 : isNiceToHave ? 2 : 1
        }
      })
      .sort((a, b) => (b._priority || 0) - (a._priority || 0))
      .map(({ _priority, ...skill }) => skill)  // Remove internal priority field
      .slice(0, 10)  // Top 10 skills
  }

  /**
   * Select relevant certifications
   */
  private static selectRelevantCertifications(
    certifications: any[],
    keywords: string[]
  ): CertificationEntry[] {
    
    return certifications
      .filter(cert => 
        keywords.some(kw => 
          cert.name.toLowerCase().includes(kw.toLowerCase()) ||
          cert.issuer.toLowerCase().includes(kw.toLowerCase())
        )
      )
      .map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        date: cert.issueDate.toISOString().split('T')[0]
      }))
      .slice(0, 5)
  }

  // ============================================
  // RELEVANCE SCORING
  // ============================================

  private static calculateExperienceRelevance(
    experience: any,
    opportunity: OpportunityRequirements,
    keywords: string[]
  ): number {
    let score = 0

    // Check title similarity
    if (experience.title.toLowerCase().includes(opportunity.role_type.toLowerCase())) {
      score += 40
    }

    // Check industry match
    if (opportunity.industry && 
        experience.employer.toLowerCase().includes(opportunity.industry.toLowerCase())) {
      score += 20
    }

    // Check impact statements for keywords
    const impactKeywordMatches = experience.impacts?.filter((impact: any) =>
      keywords.some(kw => impact.statement.toLowerCase().includes(kw.toLowerCase()))
    ).length || 0
    
    score += Math.min(impactKeywordMatches * 10, 30)

    // Bonus for quantified impact
    const hasMetrics = experience.impacts?.some((impact: any) => impact.metrics)
    if (hasMetrics) score += 10

    return Math.min(score, 100)
  }

  private static calculateProjectRelevance(
    project: any,
    opportunity: OpportunityRequirements,
    keywords: string[]
  ): number {
    let score = 0

    // Check tech stack match
    const techMatches = project.techStack?.filter((tech: string) =>
      keywords.some(kw => tech.toLowerCase().includes(kw.toLowerCase()))
    ).length || 0
    
    score += Math.min(techMatches * 20, 60)

    // Check summary/description for keywords
    const summaryMatches = keywords.filter(kw =>
      project.summary?.toLowerCase().includes(kw.toLowerCase())
    ).length
    
    score += Math.min(summaryMatches * 10, 30)

    // Bonus for impact metrics
    const hasImpact = project.impacts && project.impacts.length > 0
    if (hasImpact) score += 10

    return Math.min(score, 100)
  }

  private static calculateOverallRelevance(
    experience: ExperienceEntry[],
    projects: ProjectEntry[],
    skills: SkillEntry[],
    opportunity: OpportunityRequirements
  ): number {
    
    // Average experience relevance (40% weight)
    const avgExpRelevance = experience.length > 0 ?
      experience.reduce((sum, exp) => sum + exp.relevanceScore, 0) / experience.length :
      0

    // Average project relevance (30% weight)
    const avgProjRelevance = projects.length > 0 ?
      projects.reduce((sum, proj) => sum + proj.relevanceScore, 0) / projects.length :
      0

    // Skills match (30% weight)
    const highlightedSkills = skills.filter(s => s.isHighlighted).length
    const totalRequiredSkills = opportunity.required_skills.length + opportunity.nice_to_have_skills.length
    const skillsRelevance = totalRequiredSkills > 0 ?
      (highlightedSkills / totalRequiredSkills) * 100 :
      50

    return Math.round(
      avgExpRelevance * 0.4 +
      avgProjRelevance * 0.3 +
      skillsRelevance * 0.3
    )
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)  // Filter out short words
    
    // Remove duplicates and common stop words
    const stopWords = ['this', 'that', 'with', 'from', 'have', 'will', 'your', 'their', 'about', 'into', 'than', 'them', 'been', 'were', 'what', 'when', 'where', 'which', 'while']
    
    return [...new Set(words)].filter(word => !stopWords.includes(word))
  }

  private static formatEducation(edu: any): EducationEntry {
    return {
      institution: edu.institution,
      degree: edu.degreeTitle,
      field: edu.fieldOfStudy,
      location: edu.institutionLocation || undefined,
      dates: this.formatDateRange(edu.startDate, edu.endDate, edu.isCurrent),
      grade: edu.predictedGrade || edu.finalGrade || undefined,
      highlights: edu.modules?.slice(0, 5) || undefined
    }
  }

  private static formatDateRange(
    startDate: Date | null,
    endDate: Date | null,
    isCurrent: boolean
  ): string {
    if (!startDate) return 'Present'
    
    const start = this.formatDate(startDate)
    const end = isCurrent ? 'Present' : (endDate ? this.formatDate(endDate) : 'Present')
    
    return `${start} - ${end}`
  }

  private static formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }
}

