import { DynamicAIService } from './dynamic-ai-service'
import { PrismaClient } from '@prisma/client'
import { studentCareerGuidance } from './student-career-guidance'
import { studentMatcher } from './improved-student-matching'

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

      // SECOND: Analyze intent and generate appropriate response
      const intent = this.analyzeUserIntent(query)
      
      if (intent.type === 'projects') {
        return await this.handleProjectSearch(query, context, intent)
      } else if (intent.type === 'proposals') {
        return await this.handleProposalSearch(query, context, intent)
      } else {
        // Default to project search with guidance
        return await this.handleProjectSearch(query, context, { type: 'projects', keywords: [] })
      }
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
    const wantsAlternatives = /\b(more|another|other|different|else|new|alternative|various|diverse)\b/i.test(query)
    
    // Extract previously shown items to avoid repetition
    const previousProjectIds = new Set<string>()
    const previousCompanyIds = new Set<string>()
    
    if (wantsAlternatives && context.previousMessages.length > 0) {
      // Look through recent conversation for previously shown items
      const recentMessages = context.previousMessages.slice(-8) // Last 8 messages
      recentMessages.forEach(msg => {
        if (msg.role === 'assistant') {
          // Track projects by name patterns
          const projectNames = [
            'Social Media Campaigns', 'Smart City Internship', 'Cybersecurity Internship',
            'EssayPilot', 'SmartCity Analytics', 'SecureLearn Systems'
          ]
          projectNames.forEach(name => {
            if (msg.content.includes(name)) {
              previousProjectIds.add(name.toLowerCase())
            }
          })
          
          // Track companies by name patterns  
          const companyNames = [
            'NeoBank Solutions', 'ContentAI Labs', 'EcoThread Fashion',
            'TechFlow Systems', 'GreenTech Solutions', 'DataViz Corp'
          ]
          companyNames.forEach(name => {
            if (msg.content.includes(name)) {
              previousCompanyIds.add(name.toLowerCase())
            }
          })
        }
      })
      
      console.log('🔍 Previous tracking - Projects:', Array.from(previousProjectIds), 'Companies:', Array.from(previousCompanyIds))
    }

    if (wantsProposals) {
      // Return companies for proposal sending
      const companies = await this.getRelevantCompanies(query, context.userId, previousCompanyIds, wantsAlternatives)
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

      console.log('🔍 Search terms extracted:', searchTerms)

      // Smart matching strategy: Mix keyword relevance with variety
      let projects: any[] = []
      
      if (wantsAlternatives && excludeIds.size > 0) {
        // For "different" requests - get completely fresh projects from different categories
        const excludeArray = Array.from(excludeIds)
        
        // First, try to exclude by project title patterns to avoid similar projects
        const excludeTitles = ['Social Media Campaigns', 'Smart City Internship', 'Cybersecurity Internship']
        const shouldExcludeTitles = excludeArray.some(id => 
          excludeTitles.some(title => id.includes(title.toLowerCase().replace(/\s+/g, '')))
        )
        
        projects = await prisma.project.findMany({
          where: {
            status: 'LIVE',
            ...(shouldExcludeTitles && {
              NOT: {
                OR: excludeTitles.map(title => ({
                  title: { contains: title, mode: 'insensitive' as any }
                }))
              }
            })
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

        console.log('🔍 Keyword projects found:', keywordProjects.length, keywordProjects.map(p => p.title))

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

        // Combine and ensure variety - prioritize keyword matches
        if (keywordProjects.length >= 3) {
          // If we have enough keyword matches, use those primarily
          projects = keywordProjects
        } else {
          // Mix keyword projects with recent ones, but put keyword matches first
          projects = [...keywordProjects, ...recentProjects]
        }
      }

      // Smart selection: ensure variety and relevance
      const uniqueProjects = projects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      )
      
      // Smart selection: prioritize keyword relevance over company diversity for specific searches
      let selected: any[] = []
      
      if (searchTerms.length > 0) {
        // For keyword searches, prioritize relevance over diversity
        const keywordMatches = uniqueProjects.filter(project => 
          searchTerms.some(term => 
            project.title.toLowerCase().includes(term) || 
            project.description.toLowerCase().includes(term)
          )
        )
        
        if (keywordMatches.length >= 3) {
          selected = keywordMatches.slice(0, 3)
        } else {
          // Mix keyword matches with other projects
          const others = uniqueProjects.filter(p => !keywordMatches.find(k => k.id === p.id))
          selected = [...keywordMatches, ...others].slice(0, 3)
        }
      } else {
        // For general searches, prioritize company diversity
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
        
        selected = diverseProjects.slice(0, 3)
      }

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

  private async getRelevantCompanies(query: string, userId: string, excludeCompanies: Set<string> = new Set(), wantsAlternatives: boolean = false) {
    // Get companies with active projects for proposal sending
    let companies = await prisma.user.findMany({
      where: {
        role: 'COMPANY',
        companyName: { not: null }
      },
      select: {
        id: true,
        companyName: true,
        industry: true
      },
      take: 15,
      orderBy: wantsAlternatives ? { updatedAt: 'desc' } : { createdAt: 'desc' }
    })

    // Filter out previously shown companies if requesting alternatives
    if (wantsAlternatives && excludeCompanies.size > 0) {
      companies = companies.filter(c => 
        !excludeCompanies.has((c.companyName || '').toLowerCase())
      )
    }

    // If no companies after filtering, get different ones
    if (companies.length === 0) {
      companies = await prisma.user.findMany({
        where: {
          role: 'COMPANY',
          companyName: { not: null }
        },
        select: {
          id: true,
          companyName: true,
          industry: true
        },
        take: 5,
        orderBy: { createdAt: 'asc' } // Get oldest companies for variety
      })
    }

    // Shuffle for variety and take 5
    const shuffled = companies.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 5)

    return selected.map(c => ({
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

  /**
   * Analyze user intent from query
   */
  private analyzeUserIntent(query: string): { type: 'projects' | 'proposals', keywords: string[] } {
    const queryLower = query.toLowerCase()
    
    // Check for proposal/company intent
    if (/\b(proposal|proposals|company|companies|employer|reach out|connect)\b/i.test(query)) {
      return { type: 'proposals', keywords: this.extractKeywords(query) }
    }
    
    // Default to projects
    return { type: 'projects', keywords: this.extractKeywords(query) }
  }

  /**
   * Extract relevant keywords from query
   */
  private extractKeywords(query: string): string[] {
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !['the', 'and', 'for', 'with', 'can', 'you', 'give', 'me', 'some', 'more', 'other', 'different', 'looking', 'want', 'need'].includes(word)
      )
    return keywords
  }

  /**
   * Handle project search with improved messaging and one-at-a-time display
   */
  private async handleProjectSearch(query: string, context: StudentChatContext, intent: any): Promise<any> {
    // Get student profile for matching
    const studentProfile = await this.getStudentProfile(context.userId)
    
    // Get previously shown projects to exclude
    const excludeProjectIds = this.getPreviouslyShownProjects(context.previousMessages)
    
    // Get matched projects using improved algorithm
    const matchedProjects = await studentMatcher.getMatchedProjects(
      studentProfile, 
      excludeProjectIds, 
      10
    )

    // Show only ONE project at a time
    const selectedProject = matchedProjects[0]
    
    if (!selectedProject) {
      return {
        content: "I've looked through all available opportunities, but it seems we've shown you everything that matches your profile right now. New projects are added regularly, so check back soon!",
        projects: [],
        companies: [],
        proposals: [],
        showMoreButton: false
      }
    }

    // Generate contextual message based on search keywords
    const contextualMessage = this.generateContextualMessage(query, intent.keywords, selectedProject)
    
    return {
      content: contextualMessage,
      projects: [this.formatProjectForResponse(selectedProject)],
      companies: [],
      proposals: [],
      showMoreButton: matchedProjects.length > 1
    }
  }

  /**
   * Handle proposal/company search
   */
  private async handleProposalSearch(query: string, context: StudentChatContext, intent: any): Promise<any> {
    // Get companies with detailed information
    const companies = await this.getCompaniesWithDetails(intent.keywords)
    
    if (companies.length === 0) {
      return {
        content: "I couldn't find any companies that match your criteria right now. Try searching for different industries or fields!",
        projects: [],
        companies: [],
        proposals: [],
        showMoreButton: false
      }
    }

    // Show one company at a time for proposals
    const selectedCompany = companies[0]
    const contextualMessage = this.generateProposalContextualMessage(query, intent.keywords, selectedCompany)
    
    return {
      content: contextualMessage,
      projects: [],
      companies: [selectedCompany],
      proposals: [],
      showMoreButton: companies.length > 1
    }
  }

  /**
   * Get student profile for matching
   */
  private async getStudentProfile(userId: string) {
    try {
      const profile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          major: true,
          university: true,
          skills: true,
          interests: true,
          goal: true,
          location: true
        }
      })
      
      return {
        id: userId,
        major: profile?.major,
        university: profile?.university,
        skills: profile?.skills || [],
        interests: profile?.interests || [],
        goal: profile?.goal || [],
        location: profile?.location
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
      return {
        id: userId,
        major: null,
        university: null,
        skills: [],
        interests: [],
        goal: [],
        location: null
      }
    }
  }

  /**
   * Get previously shown projects from conversation history
   */
  private getPreviouslyShownProjects(messages: Array<{ role: string, content: string }>): string[] {
    const projectIds: string[] = []
    
    // Look for project names in recent messages to avoid repetition
    const recentMessages = messages.slice(-6) // Last 6 messages
    recentMessages.forEach(msg => {
      if (msg.role === 'assistant') {
        // Try to extract project titles (this is a simple heuristic)
        const projectMatches = msg.content.match(/([A-Z][a-z\s]+(?:Intern|Developer|Analyst|Manager))/g)
        if (projectMatches) {
          projectIds.push(...projectMatches)
        }
      }
    })
    
    return projectIds
  }

  /**
   * Generate contextual message for project search
   */
  private generateContextualMessage(query: string, keywords: string[], project: any): string {
    const field = this.detectField(keywords)
    const queryLower = query.toLowerCase()
    
    let contextual = ""
    
    if (field) {
      contextual = `I see you're looking for ${field} opportunities. `
    } else if (queryLower.includes('internship') || queryLower.includes('intern')) {
      contextual = `I see you're looking for internship opportunities. `
    } else {
      contextual = `I found something that might interest you. `
    }
    
    contextual += `Here's the best match we have on the platform right now:\n\n`
    contextual += `**${project.title}** at ${project.companyName}\n`
    contextual += `Match Score: ${project.matchScore}%\n`
    
    if (project.matchReasons && project.matchReasons.length > 0) {
      contextual += `Why it's a good fit: ${project.matchReasons.join(', ')}\n\n`
    }
    
    contextual += `Not what you're looking for? You can also ask me to help you send proposals to companies or discover more opportunities in different fields.`
    
    return contextual
  }

  /**
   * Generate contextual message for proposal search
   */
  private generateProposalContextualMessage(query: string, keywords: string[], company: any): string {
    const field = this.detectField(keywords)
    
    let contextual = ""
    
    if (field) {
      contextual = `I see you want to reach out to ${field} companies. `
    } else {
      contextual = `I see you want to reach out to companies. `
    }
    
    contextual += `Here's a great company you could connect with:\n\n`
    contextual += `**${company.name}**\n`
    
    if (company.industry) {
      contextual += `Industry: ${company.industry}\n`
    }
    if (company.location) {
      contextual += `Location: ${company.location}\n`
    }
    if (company.activeProjects) {
      contextual += `Active Projects: ${company.activeProjects}\n`
    }
    if (company.teamSize) {
      contextual += `Team Size: ${company.teamSize}\n`
    }
    
    contextual += `\nReady to reach out? Click the button below to send them a proposal!`
    
    return contextual
  }

  /**
   * Detect field/industry from keywords
   */
  private detectField(keywords: string[]): string | null {
    const fieldMappings: Record<string, string[]> = {
      'marketing': ['marketing', 'social', 'media', 'advertising', 'branding'],
      'technology': ['tech', 'software', 'programming', 'coding', 'development', 'engineering'],
      'finance': ['finance', 'accounting', 'investment', 'banking', 'financial'],
      'design': ['design', 'ui', 'ux', 'graphics', 'creative'],
      'data science': ['data', 'analytics', 'science', 'machine', 'learning', 'ai']
    }
    
    for (const [field, terms] of Object.entries(fieldMappings)) {
      if (keywords.some(keyword => terms.some(term => keyword.includes(term)))) {
        return field
      }
    }
    
    return null
  }

  /**
   * Format project for response
   */
  private formatProjectForResponse(project: any) {
    return {
      id: project.id,
      title: project.title,
      companyId: project.companyId,
      companyName: project.companyName || 'Company',
      location: project.location,
      description: project.description,
      matchScore: project.matchScore,
      skills: project.skillsRequired || []
    }
  }

  /**
   * Get companies with detailed information instead of generic proposals
   */
  private async getCompaniesWithDetails(keywords: string[]) {
    try {
      const companies = await prisma.user.findMany({
        where: {
          role: 'COMPANY',
          companyName: { not: null }
        },
        select: {
          id: true,
          companyName: true,
          industry: true,
          location: true,
          projects: {
            where: { status: 'LIVE' },
            select: { id: true, title: true }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      return companies.map(company => ({
        id: company.id,
        companyId: company.id,
        name: company.companyName || 'Company',
        companyName: company.companyName || 'Company',
        industry: company.industry || 'Technology',
        location: company.location || 'Remote',
        activeProjects: company.projects.length,
        teamSize: company.projects.length > 3 ? 'Growing team' : 'Small team',
        description: `${company.industry || 'Technology'} company based in ${company.location || 'various locations'}`
      }))
    } catch (error) {
      console.error('Error fetching companies:', error)
      return []
    }
  }
}

export const enhancedStudentAI = new EnhancedStudentAI()
