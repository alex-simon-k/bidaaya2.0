import { PrismaClient } from '@prisma/client'

interface ChatContext {
  userQuery: string
  userRole: 'COMPANY' | 'STUDENT'
  userName?: string
  previousMessages?: Array<{ role: 'user' | 'ai', content: string }>
  detectedIntent?: 'find-talent' | 'create-project' | 'guidance' | 'contact-students'
}

interface AIResponse {
  content: string
  actionType: 'search' | 'project-creation' | 'guidance' | 'contact' | 'navigate'
  data?: any
  suggestedActions?: Array<{
    label: string
    action: string
    description: string
  }>
}

export class AIChatResponseService {
  private static DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
  private static DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  private prisma = new PrismaClient()

  /**
   * Generate intelligent AI response using DeepSeek
   */
  async generateResponse(context: ChatContext): Promise<AIResponse> {
    try {
      // Detect intent if not provided
      const intent = context.detectedIntent || this.detectIntent(context.userQuery)
      
      // Get relevant context data
      const contextData = await this.gatherContextData(context, intent)
      
      // Generate response using DeepSeek
      const prompt = this.buildPrompt(context, intent, contextData)
      const aiResponse = await this.callDeepSeekAPI(prompt)
      
      // Parse and structure the response
      return this.parseAIResponse(aiResponse, intent, context)
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      return this.getFallbackResponse(context)
    }
  }

  /**
   * Detect user intent from query
   */
  private detectIntent(query: string): string {
    const queryLower = query.toLowerCase()
    
    // Find talent intent
    if (queryLower.includes('find') || queryLower.includes('search') || 
        queryLower.includes('talent') || queryLower.includes('candidate') ||
        queryLower.includes('student') || queryLower.includes('hire')) {
      return 'find-talent'
    }
    
    // Create project intent
    if (queryLower.includes('create') || queryLower.includes('post') || 
        queryLower.includes('project') || queryLower.includes('job') ||
        queryLower.includes('internship') || queryLower.includes('position')) {
      return 'create-project'
    }
    
    // Contact students intent
    if (queryLower.includes('contact') || queryLower.includes('reach out') ||
        queryLower.includes('email') || queryLower.includes('invite') ||
        queryLower.includes('calendar') || queryLower.includes('interview')) {
      return 'contact-students'
    }
    
    return 'guidance'
  }

  /**
   * Gather relevant context data based on intent
   */
  private async gatherContextData(context: ChatContext, intent: string): Promise<any> {
    const data: any = {}
    
    try {
      if (intent === 'find-talent') {
        // Get student statistics for context
        const studentStats = await this.prisma.user.aggregate({
          where: { role: 'STUDENT' },
          _count: { id: true }
        })
        
        // Get popular universities and majors
        const popularData = await this.prisma.user.groupBy({
          by: ['university'],
          where: { 
            role: 'STUDENT',
            university: { not: null }
          },
          _count: { university: true },
          orderBy: { _count: { university: 'desc' } },
          take: 5
        })
        
        data.totalStudents = studentStats._count.id
        data.popularUniversities = popularData.map(u => u.university)
      }
      
      if (intent === 'create-project') {
        // Get project statistics
        const projectStats = await this.prisma.project.aggregate({
          where: { status: 'LIVE' },
          _count: { id: true }
        })
        
        data.activeProjects = projectStats._count.id
      }
      
      if (context.userRole === 'COMPANY') {
        // Get company-specific data
        const companyData = await this.prisma.user.findUnique({
          where: { id: context.userName },
          select: {
            calendlyLink: true,
            subscriptionPlan: true,
            companyName: true,
            industry: true
          }
        })
        
        data.hasCalendlyLink = !!companyData?.calendlyLink
        data.subscriptionPlan = companyData?.subscriptionPlan || 'FREE'
        data.companyName = companyData?.companyName
        data.industry = companyData?.industry
      }
      
    } catch (error) {
      console.error('Error gathering context data:', error)
    }
    
    return data
  }

  /**
   * Build optimized prompt for DeepSeek
   */
  private buildPrompt(context: ChatContext, intent: string, contextData: any): string {
    const systemContext = `You are Bidaaya's AI Recruitment Assistant. You help companies find talent and students find opportunities.

PLATFORM CONTEXT:
- Total active students: ${contextData.totalStudents || '500+'}
- Popular universities: ${contextData.popularUniversities?.join(', ') || 'AUD, AUS, Zayed University'}
- Active projects: ${contextData.activeProjects || '50+'}
- User role: ${context.userRole}
- Company: ${contextData.companyName || 'Not provided'}
- Industry: ${contextData.industry || 'Not specified'}
- Subscription: ${contextData.subscriptionPlan || 'FREE'}
- Has calendar link: ${contextData.hasCalendlyLink ? 'Yes' : 'No'}

INTENT: ${intent}

USER QUERY: "${context.userQuery}"

INSTRUCTIONS:
- Be conversational and helpful
- Provide specific, actionable guidance
- Reference Bidaaya's features naturally
- Include relevant statistics when helpful
- Suggest next steps
- Be concise but informative
- Use emojis sparingly but effectively

Response should be in JSON format:
{
  "content": "Your conversational response (use markdown for formatting)",
  "actionType": "search|project-creation|guidance|contact",
  "suggestedActions": [
    {"label": "Action Label", "action": "action_type", "description": "Brief description"}
  ],
  "data": {
    "extractedSkills": ["skill1", "skill2"],
    "suggestedUniversities": ["uni1", "uni2"],
    "recommendedFilters": {}
  }
}`

    return systemContext
  }

  /**
   * Call DeepSeek API
   */
  private async callDeepSeekAPI(prompt: string): Promise<any> {
    if (!AIChatResponseService.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }

    const response = await fetch(AIChatResponseService.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIChatResponseService.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are Bidaaya\'s AI Recruitment Assistant. Always respond in the specified JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(aiResponse: any, intent: string, context: ChatContext): AIResponse {
    try {
      return {
        content: aiResponse.content || 'I\'m here to help with your recruitment needs!',
        actionType: this.mapIntentToActionType(intent),
        data: aiResponse.data || {},
        suggestedActions: aiResponse.suggestedActions || []
      }
    } catch (error) {
      return this.getFallbackResponse(context)
    }
  }

  /**
   * Map intent to action type
   */
  private mapIntentToActionType(intent: string): 'search' | 'project-creation' | 'guidance' | 'contact' | 'navigate' {
    switch (intent) {
      case 'find-talent': return 'search'
      case 'create-project': return 'project-creation'
      case 'contact-students': return 'contact'
      default: return 'guidance'
    }
  }

  /**
   * Fallback response for errors
   */
  private getFallbackResponse(context: ChatContext): AIResponse {
    const responses = {
      COMPANY: {
        content: `I'm here to help with your recruitment needs! I can help you:

🔍 **Find Talent** - Search our database of 500+ active students
🎯 **Create Projects** - Post internships and job opportunities  
📧 **Contact Candidates** - Reach out to promising matches
⚡ **Get Guidance** - Receive personalized hiring recommendations

What would you like to do today?`,
        actionType: 'guidance' as const
      },
      STUDENT: {
        content: `Welcome to Bidaaya! I can help you:

🔍 **Find Opportunities** - Discover internships and projects
📝 **Apply for Projects** - Submit applications to companies
⚡ **Get Guidance** - Receive career advice and tips

What are you looking for today?`,
        actionType: 'guidance' as const
      }
    }

    return responses[context.userRole] || responses.COMPANY
  }
}

export const aiChatService = new AIChatResponseService() 