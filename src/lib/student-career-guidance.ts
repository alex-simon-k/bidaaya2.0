import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CareerGuidanceContext {
  userId: string
  studentProfile?: any
  previousMessages: Array<{ role: 'user' | 'assistant', content: string }>
}

interface GuidanceResponse {
  content: string
  actionType: 'guidance' | 'projects' | 'companies'
  needsAI: boolean
  followUpQuestions?: string[]
  recommendations?: any[]
}

export class StudentCareerGuidance {
  
  // Analyze if student needs career guidance vs direct project search
  analyzeStudentIntent(query: string, context: CareerGuidanceContext): { needsGuidance: boolean, guidanceType?: string } {
    const queryLower = query.toLowerCase()
    
    // Clear guidance signals
    const guidancePatterns = [
      /what.*career.*path/i,
      /don't.*know.*what.*want/i,
      /confused.*about/i,
      /help.*me.*decide/i,
      /what.*should.*i.*do/i,
      /career.*advice/i,
      /not.*sure.*what/i,
      /explore.*options/i,
      /guidance.*on/i
    ]

    const skillGapPatterns = [
      /what.*skills.*need/i,
      /how.*to.*improve/i,
      /what.*missing/i,
      /prepare.*for/i,
      /learn.*for.*this/i
    ]

    const industryExplorationPatterns = [
      /what.*like.*working.*in/i,
      /tell.*me.*about.*industry/i,
      /explore.*different.*fields/i,
      /compare.*careers/i
    ]

    if (guidancePatterns.some(p => p.test(query))) {
      return { needsGuidance: true, guidanceType: 'career-exploration' }
    }
    
    if (skillGapPatterns.some(p => p.test(query))) {
      return { needsGuidance: true, guidanceType: 'skill-gap' }
    }
    
    if (industryExplorationPatterns.some(p => p.test(query))) {
      return { needsGuidance: true, guidanceType: 'industry-exploration' }
    }

    return { needsGuidance: false }
  }

  // Fast guidance for simple questions
  async provideQuickGuidance(query: string, guidanceType: string, profile: any): Promise<GuidanceResponse> {
    switch (guidanceType) {
      case 'skill-gap':
        return this.handleSkillGapAnalysis(query, profile)
      
      case 'career-exploration':
        return this.handleCareerExploration(query, profile)
        
      case 'industry-exploration':
        return this.handleIndustryExploration(query, profile)
        
      default:
        return {
          content: "I can help guide your career path! What specific area would you like to explore?",
          actionType: 'guidance',
          needsAI: false,
          followUpQuestions: [
            "What career paths interest you?",
            "What skills would you like to develop?",
            "Which industries are you curious about?"
          ]
        }
    }
  }

  private async handleSkillGapAnalysis(query: string, profile: any): Promise<GuidanceResponse> {
    // Get current skills
    const currentSkills = profile.skills || []
    
    // Quick analysis based on major
    const majorSkillMaps: { [key: string]: string[] } = {
      'computer science': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'],
      'business': ['Excel', 'PowerPoint', 'Analytics', 'Project Management'],
      'design': ['Figma', 'Photoshop', 'UI/UX', 'Prototyping'],
      'marketing': ['Digital Marketing', 'Social Media', 'Content Creation', 'Analytics']
    }
    
    const majorLower = profile.major?.toLowerCase() || ''
    const suggestedSkills = Object.keys(majorSkillMaps).find(key => majorLower.includes(key))
    const skillsToLearn = suggestedSkills ? majorSkillMaps[suggestedSkills].filter(skill => 
      !currentSkills.some((cs: string) => cs.toLowerCase().includes(skill.toLowerCase()))
    ) : []

    if (skillsToLearn.length > 0) {
      return {
        content: `Based on your ${profile.major} background, here are key skills to develop: ${skillsToLearn.slice(0, 3).join(', ')}. I can find projects that help you practice these!`,
        actionType: 'projects',
        needsAI: false,
        recommendations: skillsToLearn.slice(0, 3)
      }
    }

    return {
      content: `You have a good skill foundation! Let me find projects that match your current skills: ${currentSkills.slice(0, 3).join(', ')}`,
      actionType: 'projects', 
      needsAI: false
    }
  }

  private async handleCareerExploration(query: string, profile: any): Promise<GuidanceResponse> {
    // Get related career paths based on major/interests
    const careerPaths: { [key: string]: string[] } = {
      'computer science': ['Software Developer', 'Data Scientist', 'Product Manager', 'DevOps Engineer'],
      'business': ['Business Analyst', 'Marketing Manager', 'Operations Manager', 'Consultant'],
      'design': ['UX Designer', 'Product Designer', 'Brand Designer', 'Creative Director'],
      'engineering': ['Software Engineer', 'Systems Engineer', 'Technical Lead', 'Architect']
    }
    
    const majorLower = profile.major?.toLowerCase() || ''
    const relevantCareers = Object.keys(careerPaths).find(key => majorLower.includes(key))
    const suggestions = relevantCareers ? careerPaths[relevantCareers] : ['Tech', 'Business', 'Design', 'Marketing']

    return {
      content: `Based on your ${profile.major} background, you could explore: ${suggestions.slice(0, 3).join(', ')}. Would you like to see projects in any of these areas?`,
      actionType: 'guidance',
      needsAI: false,
      followUpQuestions: suggestions.slice(0, 3).map(career => `Show me ${career.toLowerCase()} projects`)
    }
  }

  private async handleIndustryExploration(query: string, profile: any): Promise<GuidanceResponse> {
    // Get projects from different industries
    const projects = await prisma.project.findMany({
      where: { status: 'LIVE' },
      include: { company: { select: { companyName: true, industry: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    const industries = [...new Set(projects.map(p => p.company.industry).filter(Boolean))]
    
    return {
      content: `Here are active industries on our platform: ${industries.slice(0, 4).join(', ')}. Which one interests you most?`,
      actionType: 'guidance',
      needsAI: false,
      followUpQuestions: industries.slice(0, 3).map(industry => `Show me ${industry} opportunities`),
      recommendations: industries.slice(0, 4)
    }
  }

  // Main entry point
  async provideGuidance(query: string, context: CareerGuidanceContext): Promise<GuidanceResponse> {
    const analysis = this.analyzeStudentIntent(query, context)
    
    if (!analysis.needsGuidance) {
      return {
        content: "I'll help you find specific opportunities!",
        actionType: 'projects',
        needsAI: false
      }
    }

    // Fetch student profile if not provided
    let profile = context.studentProfile
    if (!profile) {
      profile = await prisma.user.findUnique({
        where: { id: context.userId },
        select: {
          name: true,
          major: true,
          graduationYear: true,
          skills: true,
          goal: true,
          university: true
        }
      })
    }

    // Check if this needs complex AI reasoning
    const complexPatterns = [
      /compare.*different/i,
      /pros.*and.*cons/i,
      /should.*i.*choose/i,
      /help.*me.*decide.*between/i
    ]

    const needsComplexAI = complexPatterns.some(pattern => pattern.test(query))
    
    if (needsComplexAI) {
      // Route to AI for nuanced career counseling
      return {
        content: "This is a great question that requires deeper analysis. Let me think through your options...",
        actionType: 'guidance',
        needsAI: true
      }
    }

    // Use fast guidance for simple questions
    return await this.provideQuickGuidance(query, analysis.guidanceType || 'general', profile)
  }
}

export const studentCareerGuidance = new StudentCareerGuidance()
