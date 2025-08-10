import { DynamicAIService } from './dynamic-ai-service'
import { PrismaClient } from '@prisma/client'
import { studentCareerGuidance } from './student-career-guidance'

const prisma = new PrismaClient()

interface StudentChatContext {
  userId: string
  previousMessages: Array<{ role: 'user' | 'assistant', content: string }>
}

interface SimpleAIResponse {
  content: string
  actionType?: string
}

interface EnhancedStudentResponse {
  content: string
  projects?: Array<{ id: string; title: string; companyId: string; companyName: string; location?: string | null; description: string }>
  proposals?: Array<{ companyId?: string; companyName: string; proposal: string }>
  companies?: Array<{ id: string; name: string; description?: string; matchScore?: number }>
  followUpQuestions?: string[]
  recommendations?: any[]
}

export class EnhancedStudentAI extends DynamicAIService {
  
  async generateStudentResponse(query: string, context: StudentChatContext): Promise<EnhancedStudentResponse> {
    try {
      // FIRST: Check if student needs career guidance
      const guidanceResponse = await studentCareerGuidance.provideGuidance(query, context)
      
      if (guidanceResponse.actionType === 'guidance') {
        if (guidanceResponse.needsAI) {
          // Complex guidance needs AI reasoning
          const enrichedContext = await this.buildStudentContext(query, context)
          const aiResponse = await this.generateResponse(query, enrichedContext)
          return {
            content: aiResponse.message,
            followUpQuestions: guidanceResponse.followUpQuestions
          }
        } else {
          // Fast guidance response
          return {
            content: guidanceResponse.content,
            followUpQuestions: guidanceResponse.followUpQuestions,
            recommendations: guidanceResponse.recommendations
          }
        }
      }

      // SECOND: Determine intent - projects vs proposals/companies
      const wantsProposals = /\bproposal(s)?\b/i.test(query) || /\bcompany|companies|employer\b/i.test(query)
      
      // Get relevant projects or companies based on intent (FAST - skip AI for speed)
      let relevantData = await this.getRelevantOpportunities(query, context, wantsProposals)

      // HARD GUARANTEE: if user asked for projects and none found, show latest live projects
      if (!wantsProposals && (!relevantData.projects || relevantData.projects.length === 0)) {
        const fallback = await prisma.project.findMany({
          where: { status: 'LIVE' },
          include: { company: { select: { id: true, companyName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 3
        })
        relevantData.projects = fallback.map(p => ({
          id: p.id,
          title: p.title,
          companyId: p.company.id,
          companyName: p.company.companyName || 'Company',
          location: p.location,
          description: p.description
        }))
      }
      
      // Generate tailored response based on what we found
      const response = this.generateTailoredResponse(query, relevantData, wantsProposals)
      
      // Convert to student chat format
      return this.formatForStudentChat(response, relevantData, wantsProposals)
    } catch (error) {
      console.error('Enhanced Student AI error:', error)
      return this.getStudentFallback(query, context)
    }
  }

  private async buildStudentContext(query: string, context: StudentChatContext) {
    // Fetch student profile
    const userProfile = await this.fetchStudentProfile(context.userId)
    
    // Gather platform data
    const platformData = await this.gatherPlatformContext()
    
    // Build conversation history
    const conversationHistory = context.previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date()
    }))

    return {
      userId: context.userId,
      userType: 'student' as const,
      profile: {
        firstName: userProfile?.name?.split(' ')[0] || 'there',
        lastName: userProfile?.name?.split(' ').slice(1).join(' ') || '',
        year: this.extractYear(userProfile?.university),
        major: userProfile?.major || 'your field',
        university: userProfile?.university || 'your university',
        skills: userProfile?.skills || [],
        interests: userProfile?.interests || [],
        goal: userProfile?.goal || [],
        location: userProfile?.location
      },
      conversationHistory,
      currentGoals: this.inferStudentGoals(query, conversationHistory),
      platformData
    }
  }

  private async fetchStudentProfile(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          university: true,
          major: true,
          skills: true,
          interests: true,
          goal: true,
          location: true
        }
      })
    } catch (error) {
      console.error('Error fetching student profile:', error)
      return null
    }
  }

  private extractYear(university?: string | null): string {
    // Simple heuristic to extract year information
    if (!university) return '3rd'
    if (university.includes('1st') || university.includes('first')) return '1st'
    if (university.includes('2nd') || university.includes('second')) return '2nd'
    if (university.includes('4th') || university.includes('fourth')) return '4th'
    return '3rd' // Default assumption
  }

  private inferStudentGoals(query: string, history: any[]): string[] {
    const goals = []
    const text = query.toLowerCase()
    
    if (text.includes('internship') || text.includes('intern')) goals.push('find-internship')
    if (text.includes('job') || text.includes('career')) goals.push('find-job')
    if (text.includes('skill') || text.includes('learn')) goals.push('develop-skills')
    if (text.includes('network') || text.includes('connect')) goals.push('build-network')
    if (text.includes('proposal') || text.includes('company')) goals.push('send-proposals')
    
    return goals.length > 0 ? goals : ['explore-opportunities']
  }

  private async getRelevantOpportunities(query: string, context: StudentChatContext, wantsProposals: boolean) {
    const wantsAlternatives = /\b(more|another|other|different|else|new|alternative)\b/i.test(query)
    
    // Extract previously shown project IDs to avoid repetition
    const previousProjectIds = new Set<string>()
    if (wantsAlternatives && context.previousMessages.length > 0) {
      // Look through recent conversation for previously shown projects
      const recentMessages = context.previousMessages.slice(-6) // Last 6 messages
      recentMessages.forEach(msg => {
        if (msg.role === 'assistant') {
          // Better pattern matching for project names/IDs
          const projectPatterns = [
            /Social Media Campaigns/gi,
            /Smart City Internship/gi,
            /Cybersecurity Internship/gi,
            /EssayPilot/gi,
            /SmartCity Analytics/gi,
            /SecureLearn Systems/gi,
            // Generic patterns
            /project[/-](\w+)/gi,
            /internship.*?(\w+)/gi,
            /opportunity.*?(\w+)/gi
          ]
          
          projectPatterns.forEach(pattern => {
            const matches = msg.content.match(pattern) || []
            matches.forEach(match => {
              // Add both the full match and extracted ID
              previousProjectIds.add(match.toLowerCase().trim())
              const id = match.split(/[/-]/).pop()?.replace(/[^a-zA-Z0-9]/g, '')
              if (id && id.length > 3) previousProjectIds.add(id.toLowerCase())
            })
          })
        }
      })
      
      console.log('🔍 Previous project tracking:', Array.from(previousProjectIds))
    }

    if (wantsProposals) {
      // Return companies for proposal sending
      const companies = await this.getRelevantCompanies(query, context.userId)
      return { companies, projects: [], proposals: this.generateProposals(companies) }
    } else {
      // Return projects for applications
      const projects = await this.getRelevantProjects(query, context.userId, previousProjectIds, wantsAlternatives)
      return { projects, companies: [], proposals: [] }
    }
  }

  private async getRelevantProjects(query: string, userId: string, excludeIds: Set<string>, wantsAlternatives: boolean) {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(term => 
        term.length > 2 && !['the', 'and', 'for', 'with', 'can', 'you', 'give', 'me', 'some', 'more', 'other', 'different'].includes(term)
      )

      // Smart matching strategy: Mix keyword relevance with variety
      let projects: any[] = []
      
      if (wantsAlternatives && excludeIds.size > 0) {
        // For "different" requests - get completely fresh projects from different categories
        // Also exclude by title similarity to avoid showing same projects with different IDs
        const excludeArray = Array.from(excludeIds)
        projects = await prisma.project.findMany({
          where: {
            status: 'LIVE',
            id: { notIn: excludeArray }
          },
          include: { company: { select: { id: true, companyName: true } } },
          take: 20,
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
        })
      } else {
        // Initial search - prioritize keyword relevance but ensure variety
        const keywordProjects = searchTerms.length > 0 ? await prisma.project.findMany({
          where: {
            status: 'LIVE',
            OR: [
              { title: { contains: searchTerms.join(' '), mode: 'insensitive' as any } },
              { description: { contains: searchTerms.join(' '), mode: 'insensitive' as any } },
              ...searchTerms.map(term => ({ title: { contains: term, mode: 'insensitive' as any } })),
              ...searchTerms.map(term => ({ description: { contains: term, mode: 'insensitive' as any } }))
            ]
          },
          include: { company: { select: { id: true, companyName: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }) : []

        // Also get some recent projects for variety (from different companies)
        const recentProjects = await prisma.project.findMany({
          where: { 
            status: 'LIVE',
            ...(keywordProjects.length > 0 && { id: { notIn: keywordProjects.map(p => p.id) } })
          },
          include: { company: { select: { id: true, companyName: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' }
        })

        // Combine and ensure variety
        projects = [...keywordProjects, ...recentProjects]
      }

      // Smart selection: ensure variety and relevance
      const uniqueProjects = projects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      )
      
      // For variety, prefer projects from different companies
      const diverseProjects: any[] = []
      const usedCompanies = new Set<string>()
      
      // First pass: get one project per company
      for (const project of uniqueProjects) {
        if (!usedCompanies.has(project.company.id) && diverseProjects.length < 3) {
          diverseProjects.push(project)
          usedCompanies.add(project.company.id)
        }
      }
      
      // Second pass: fill remaining slots if needed
      for (const project of uniqueProjects) {
        if (diverseProjects.length < 3 && !diverseProjects.find(p => p.id === project.id)) {
          diverseProjects.push(project)
        }
      }
      
      const selected = diverseProjects.slice(0, 3)

      return selected.map(p => ({
        id: p.id,
        title: p.title,
        companyId: p.company.id,
        companyName: p.company.companyName || 'Company',
        location: p.location,
        description: p.description
      }))
    } catch (error) {
      console.error('Error fetching relevant projects:', error)
      return []
    }
  }

  private async getRelevantCompanies(query: string, userId: string) {
    // Get companies with active projects for proposal sending
    const companies = await prisma.user.findMany({
      where: {
        role: 'COMPANY',
        companyName: { not: null }
      },
      select: {
        id: true,
        companyName: true,
        industry: true
      },
      take: 5
    })

    return companies.map(c => ({
      id: c.id,
      name: c.companyName || 'Company',
      description: `${c.industry || 'Technology'} company`,
      matchScore: 85
    }))
  }

  private generateProposals(companies: any[]) {
    return companies.slice(0, 3).map(company => ({
      companyId: company.id,
      companyName: company.name,
      proposal: `Hi ${company.name}, I'm interested in exploring opportunities at your company. I have relevant skills and would love to contribute to your team. Could we connect to discuss potential collaboration?`
    }))
  }

  private generateTailoredResponse(query: string, relevantData: any, wantsProposals: boolean): SimpleAIResponse {
    if (wantsProposals) {
      return {
        content: `Here are ${relevantData.companies?.length || 0} companies you can reach out to:`,
        actionType: 'guidance'
      }
    } else {
      const projectCount = relevantData.projects?.length || 0
      const queryLower = query.toLowerCase()
      
      // Tailored responses based on query content
      let message = `Here are ${projectCount} matching projects:`
      
      if (queryLower.includes('different') || queryLower.includes('other') || queryLower.includes('more')) {
        message = `Here are ${projectCount} different opportunities:`
      } else if (queryLower.includes('marketing')) {
        message = `Found ${projectCount} marketing opportunities:`
      } else if (queryLower.includes('tech') || queryLower.includes('software') || queryLower.includes('development')) {
        message = `Found ${projectCount} tech projects:`
      } else if (queryLower.includes('design')) {
        message = `Found ${projectCount} design projects:`
      } else if (queryLower.includes('remote')) {
        message = `Found ${projectCount} remote opportunities:`
      } else if (queryLower.includes('internship')) {
        message = `Found ${projectCount} internship opportunities:`
      }
      
      return {
        content: message,
        actionType: 'guidance'
      }
    }
  }

  private formatForStudentChat(response: any, data: any, wantsProposals: boolean): EnhancedStudentResponse {
    // Use the tailored content from response
    const briefContent = response.content || (wantsProposals
      ? 'Here are companies to reach out to:'
      : `Here are ${Math.min(3, (data.projects || []).length)} matching projects:`)

    if (wantsProposals) {
      return {
        content: briefContent,
        companies: data.companies,
        proposals: data.proposals
      }
    }

    return {
      content: briefContent,
      projects: data.projects
    }
  }

  private cleanStudentResponse(content: string): string {
    if (!content) return ''
    
    return content
      // Remove excessive asterisks
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Limit emojis
      .replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]){2,}/gu, 
        (match) => match.slice(0, 1))
      // Remove excessive bullet points
      .replace(/^\s*[•\-\*]\s/gm, '')
      // Keep concise
      .split('\n').slice(0, 3).join('\n')
  }

  private async getStudentFallback(query: string, context: StudentChatContext): Promise<EnhancedStudentResponse> {
    const wantsProposals = /\bproposal(s)?\b/i.test(query) || /\bcompany|companies|employer\b/i.test(query)
    
    if (wantsProposals) {
      const companies = await this.getRelevantCompanies(query, context.userId)
      return {
        content: 'Here are some companies you can reach out to with proposals.',
        companies,
        proposals: this.generateProposals(companies)
      }
    } else {
      const projects = await this.getRelevantProjects(query, context.userId, new Set(), false)
      return {
        content: 'Here are some opportunities that might interest you.',
        projects
      }
    }
  }
}

export const enhancedStudentAI = new EnhancedStudentAI()
