import { DynamicAIService } from './dynamic-ai-service'
import { PrismaClient } from '@prisma/client'
import { hybridSearchService } from './hybrid-search-service'

const prisma = new PrismaClient()

interface CompanyChatContext {
  userId: string
  companyName?: string
  industry?: string
  subscriptionPlan?: string
  previousMessages: Array<{ role: 'user' | 'assistant', content: string }>
}

interface EnhancedCompanyResponse {
  content: string
  actionType: 'search' | 'project-creation' | 'guidance' | 'contact' | 'navigate'
  data?: any
  suggestedActions?: Array<{
    label: string
    action: string
    description: string
  }>
}

export class EnhancedCompanyAI extends DynamicAIService {
  
  async generateCompanyResponse(query: string, context: CompanyChatContext): Promise<EnhancedCompanyResponse> {
    try {
      // IMMEDIATE project creation check - before any AI processing
      const queryLower = query.toLowerCase()
      
      // Enhanced detection for exact phrases from your examples
      const directProjectPhrases = [
        'want to create a project',
        'create a project',
        'make a project',
        'marketing project',
        'how do i make it',
        'post a project',
        'posting a project',
        'new project'
      ]
      
      const hasDirectPhrase = directProjectPhrases.some(phrase => queryLower.includes(phrase))
      
      // Keyword-based detection as backup
      const projectKeywords = ['create', 'post', 'posting', 'publish', 'new', 'make', 'build']
      const projectNouns = ['project', 'internship', 'job', 'position', 'opportunity', 'role']
      const hasKeywordMatch = projectKeywords.some(keyword => queryLower.includes(keyword)) && 
                             (projectNouns.some(noun => queryLower.includes(noun)) || 
                              queryLower.includes('campaign') || 
                              queryLower.includes('listing'))
      
      const isProjectCreation = hasDirectPhrase || hasKeywordMatch
      
      // Force immediate redirect for project creation
      if (isProjectCreation) {
        return {
          content: `Let's create your project! I'll take you to our project setup page.`,
          actionType: 'navigate',
          data: { redirectUrl: '/dashboard/projects/new' },
          suggestedActions: [{
            label: 'Create Project',
            action: 'navigate',
            description: 'Set up your project details'
          }]
        }
      }
      
      // Build enriched context for the dynamic AI service
      const enrichedContext = await this.buildCompanyContext(query, context)
      
      // Use the dynamic AI service
      const response = await this.generateResponse(query, enrichedContext)
      
      // Convert to company chat format
      return await this.formatForCompanyChat(response, context)
    } catch (error) {
      console.error('Enhanced Company AI error:', error)
      return this.getCompanyFallback(query, context)
    }
  }

  private async buildCompanyContext(query: string, context: CompanyChatContext) {
    // Fetch user profile
    const userProfile = await this.fetchCompanyProfile(context.userId)
    
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
      userType: 'company' as const,
      profile: {
        companyName: userProfile?.companyName || context.companyName || 'your company',
        industry: userProfile?.industry || context.industry || 'Not specified',
        subscriptionPlan: userProfile?.subscriptionPlan || context.subscriptionPlan || 'FREE',
        calendlyLink: userProfile?.calendlyLink
      },
      conversationHistory,
      currentGoals: this.inferCompanyGoals(query, conversationHistory),
      platformData
    }
  }

  private async fetchCompanyProfile(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          companyName: true,
          industry: true,
          subscriptionPlan: true,
          calendlyLink: true
        }
      })
    } catch (error) {
      console.error('Error fetching company profile:', error)
      return null
    }
  }

  private inferCompanyGoals(query: string, history: any[]): string[] {
    const goals = []
    const text = query.toLowerCase()
    
    if (text.includes('find') || text.includes('hire') || text.includes('talent')) {
      goals.push('find-talent')
    }
    if (text.includes('create') || text.includes('post') || text.includes('project')) {
      goals.push('create-project')
    }
    if (text.includes('contact') || text.includes('reach') || text.includes('interview')) {
      goals.push('contact-candidates')
    }
    
    return goals.length > 0 ? goals : ['general-guidance']
  }

  private async formatForCompanyChat(response: any, context: CompanyChatContext): Promise<EnhancedCompanyResponse> {
    // Handle specific company intents with direct actions
    const userMessages = context.previousMessages.filter(msg => msg.role === 'user')
    const lastUserMessage = userMessages[userMessages.length - 1]?.content?.toLowerCase() || ''
    
    // Enhanced project creation detection
    const projectKeywords = ['create', 'post', 'posting', 'publish', 'new']
    const projectNouns = ['project', 'internship', 'job', 'position', 'opportunity', 'role']
    const isProjectCreation = projectKeywords.some(keyword => lastUserMessage.includes(keyword)) && 
                             (projectNouns.some(noun => lastUserMessage.includes(noun)) || lastUserMessage.includes('campaign'))
    
    if (isProjectCreation) {
      return {
        content: `Let's create your project! I'll take you to our project setup page.`,
        actionType: 'navigate',
        data: { redirectUrl: '/dashboard/projects/new' },
        suggestedActions: [{
          label: 'Create Project',
          action: 'navigate',
          description: 'Set up your project details'
        }]
      }
    }

    // Talent search gets hybrid search treatment
    if (lastUserMessage.includes('find') || lastUserMessage.includes('search') || lastUserMessage.includes('talent') || lastUserMessage.includes('candidate')) {
      // Use hybrid search service to determine complexity
      const searchResult = await hybridSearchService.hybridSearch(lastUserMessage, context)
      
      return {
        content: searchResult.message,
        actionType: 'search',
        data: { 
          searchQuery: lastUserMessage,
          results: searchResult.results,
          searchType: searchResult.searchType,
          filters: searchResult.filters,
          aiReasoning: (searchResult as any).aiReasoning || '',
          useIntelligentMatching: searchResult.searchType === 'ai-enhanced'
        },
        suggestedActions: [{
          label: 'View Results',
          action: 'search', 
          description: `Found ${searchResult.results.length} matching candidates (${searchResult.searchType})`
        }]
      }
    }

    // Default response with cleaning
    return {
      content: this.ensureCleanResponse(response.message, context),
      actionType: response.actionType || 'guidance',
      data: response.data,
      suggestedActions: response.actions
    }
  }

  private ensureCleanResponse(content: string, context: CompanyChatContext): string {
    let cleaned = content
      // Remove asterisks completely
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Force correct student count
      .replace(/\b1,?500\+?\s*(active\s+)?students?/gi, '6000+ students')
      .replace(/\b5,?000\+?\s*students?/gi, '6000+ students')
      // Limit to 1 emoji max
      .replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]){2,}/gu, 
        (match) => match.slice(0, 1))
      // Remove excessive bullet points
      .replace(/^\s*[•\-\*]\s/gm, '')

    // Ensure company name is used naturally
    if (context.companyName && !cleaned.includes(context.companyName)) {
      cleaned = cleaned.replace(/your company/gi, context.companyName)
    }

    // Keep responses concise and actionable
    if (cleaned.length > 300) {
      const sentences = cleaned.split(/[.!?]+/)
      cleaned = sentences.slice(0, 3).join('. ') + '.'
    }

    return cleaned
  }

  private getCompanyFallback(query: string, context: CompanyChatContext): EnhancedCompanyResponse {
    const queryLower = query.toLowerCase()
    
    // Enhanced project creation detection for fallback
    const projectKeywords = ['create', 'post', 'posting', 'publish', 'new']
    const projectNouns = ['project', 'internship', 'job', 'position', 'opportunity', 'role']
    const isProjectCreation = projectKeywords.some(keyword => queryLower.includes(keyword)) && 
                             (projectNouns.some(noun => queryLower.includes(noun)) || queryLower.includes('campaign'))
    
    if (isProjectCreation) {
      return {
        content: `Let's create your project! I'll take you to our project setup page.`,
        actionType: 'navigate',
        data: { redirectUrl: '/dashboard/projects/new' }
      }
    }
    
    if (queryLower.includes('find') || queryLower.includes('search') || queryLower.includes('talent')) {
      return {
        content: `I'll help you find talent from our 6000+ students. What type of skills are you looking for?`,
        actionType: 'search',
        data: { searchQuery: query }
      }
    }

    const companyName = context.companyName || 'your company'
    return {
      content: `I'm here to help ${companyName} find great talent. What would you like to do today - find candidates or create a new project?`,
      actionType: 'guidance'
    }
  }
}

export const enhancedCompanyAI = new EnhancedCompanyAI()
