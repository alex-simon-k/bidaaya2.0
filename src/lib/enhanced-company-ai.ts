import { DynamicAIService } from './dynamic-ai-service'
import { PrismaClient } from '@prisma/client'

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
      // Build enriched context for the dynamic AI service
      const enrichedContext = await this.buildCompanyContext(query, context)
      
      // Use the dynamic AI service
      const response = await this.generateResponse(query, enrichedContext)
      
      // Convert to company chat format
      return this.formatForCompanyChat(response, context)
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

  private formatForCompanyChat(response: any, context: CompanyChatContext): EnhancedCompanyResponse {
    // Handle specific company intents with direct actions
    const query = context.previousMessages[context.previousMessages.length - 1]?.content?.toLowerCase() || ''
    
    // Project creation gets immediate redirect
    if (query.includes('create') && (query.includes('project') || query.includes('internship') || query.includes('job'))) {
      return {
        content: `Perfect! Let's get your project set up. I'll take you to our project creation page where you can define your requirements and start attracting talent.`,
        actionType: 'navigate',
        data: { redirectUrl: '/dashboard/projects/new' },
        suggestedActions: [{
          label: 'Create Project',
          action: 'navigate',
          description: 'Set up your project details'
        }]
      }
    }

    // Talent search gets search action
    if (query.includes('find') || query.includes('search') || query.includes('talent') || query.includes('candidate')) {
      return {
        content: response.message.length > 200 
          ? `I'll help you find the right talent. Let me search our database of 6000+ students for candidates that match your needs.`
          : response.message,
        actionType: 'search',
        data: { 
          searchQuery: query,
          useIntelligentMatching: true 
        },
        suggestedActions: response.actions
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
    
    if (queryLower.includes('create') && (queryLower.includes('project') || queryLower.includes('job'))) {
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
