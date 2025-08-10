import { DynamicAIService } from './dynamic-ai-service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface StudentChatContext {
  userId: string
  previousMessages: Array<{ role: 'user' | 'assistant', content: string }>
}

interface EnhancedStudentResponse {
  content: string
  projects?: Array<{ id: string; title: string; companyId: string; companyName: string; location?: string | null; description: string }>
  proposals?: Array<{ companyId?: string; companyName: string; proposal: string }>
  companies?: Array<{ id: string; name: string; description?: string; matchScore?: number }>
}

export class EnhancedStudentAI extends DynamicAIService {
  
  async generateStudentResponse(query: string, context: StudentChatContext): Promise<EnhancedStudentResponse> {
    try {
      // Build enriched context for the dynamic AI service
      const enrichedContext = await this.buildStudentContext(query, context)
      
      // Determine intent - projects vs proposals/companies
      const wantsProposals = /\bproposal(s)?\b/i.test(query) || /\bcompany|companies|employer\b/i.test(query)
      
      // Use the dynamic AI service
      const response = await this.generateResponse(query, enrichedContext)
      
      // Get relevant projects or companies based on intent
      const relevantData = await this.getRelevantOpportunities(query, context, wantsProposals)
      
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
      context.previousMessages.forEach(msg => {
        if (msg.role === 'assistant') {
          // Look for project IDs in the content (improved detection)
          const matches = msg.content.match(/project[/-](\w+)|apply to (\w+)|opportunity (\w+)/gi) || []
          matches.forEach(match => {
            const id = match.split(/[/-]/).pop()?.replace(/[^a-zA-Z0-9]/g, '')
            if (id && id.length > 5) previousProjectIds.add(id)
          })
        }
      })
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

      const whereConditions: any = {
        status: 'LIVE',
        ...(excludeIds.size > 0 && { id: { notIn: Array.from(excludeIds) } })
      }

      if (searchTerms.length > 0) {
        whereConditions.OR = [
          { title: { contains: searchTerms.join(' '), mode: 'insensitive' } },
          { description: { contains: searchTerms.join(' '), mode: 'insensitive' } },
          { category: { contains: searchTerms.join(' '), mode: 'insensitive' } },
          // Also try individual terms
          ...searchTerms.map(term => ({ title: { contains: term, mode: 'insensitive' } })),
          ...searchTerms.map(term => ({ description: { contains: term, mode: 'insensitive' } }))
        ]
      }

      const projects = await prisma.project.findMany({
        where: whereConditions,
        include: {
          company: {
            select: {
              id: true,
              companyName: true
            }
          }
        },
        take: 15,
        orderBy: wantsAlternatives ? { updatedAt: 'desc' } : { createdAt: 'desc' }
      })

      return projects.map(p => ({
        id: p.id,
        title: p.title,
        companyId: p.company.id,
        companyName: p.company.companyName || 'Company',
        location: p.location,
        description: p.description
      })).slice(0, 3) // Return top 3
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

  private formatForStudentChat(response: any, data: any, wantsProposals: boolean): EnhancedStudentResponse {
    // Clean the response content
    const cleanContent = this.cleanStudentResponse(response.message)
    
    if (wantsProposals) {
      return {
        content: cleanContent || 'Here are some companies you can send proposals to.',
        companies: data.companies,
        proposals: data.proposals
      }
    } else {
      return {
        content: cleanContent || 'Here are some great opportunities for you to explore.',
        projects: data.projects
      }
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
