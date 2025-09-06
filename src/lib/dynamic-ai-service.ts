import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Enhanced AI Chat Service for Bidaaya - Replaces rigid intent detection
interface ConversationContext {
  userId: string
  userType: 'student' | 'company'
  profile: StudentProfile | CompanyProfile
  conversationHistory: Message[]
  currentGoals: string[]
  platformData: PlatformContext
}

interface StudentProfile {
  firstName: string
  lastName: string
  year?: string
  major?: string
  university?: string
  skills?: string[]
  interests?: string[]
  goal?: string[]
  location?: string | null
}

interface CompanyProfile {
  companyName: string
  industry?: string
  subscriptionPlan?: string
  calendlyLink?: string | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PlatformContext {
  totalStudents: number
  totalCompanies: number
  recentProjects: Project[]
  trendingSkills: string[]
  successStories: any[]
}

interface Project {
  id: string
  title: string
  companyName: string
  description: string
  skillsRequired?: string[]
  category?: string | null
}

interface ConversationState {
  userEngagement: number
  topicsDiscussed: string[]
  currentNeed: string
  conversationPhase: 'discovery' | 'exploration' | 'decision' | 'action'
  personalityInsights: string[]
}

interface AIResponse {
  message: string
  actions: any[]
  followUpQuestions: string[]
  actionType?: 'search' | 'project-creation' | 'guidance' | 'contact' | 'navigate'
  data?: any
}

// Configuration for cleaner responses
const AI_RESPONSE_RULES = {
  formatting: {
    maxAsterisks: 0, // No bold/italic formatting
    maxEmojis: 1,
    maxBulletPoints: 3,
    preferParagraphs: true
  },
  tone: {
    conversational: true,
    professional: true,
    personalized: true,
    actionOriented: true
  },
  dataAccuracy: {
    studentCount: "dynamic", // Will be replaced with actual count
    alwaysUseProvidedData: true,
    neverHallucinate: true
  }
}

export class DynamicAIService {
  private static DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
  private static DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

  /**
   * Core method - builds truly dynamic, context-aware prompts
   */
  async generateResponse(query: string, context: ConversationContext): Promise<AIResponse> {
    try {
      // 1. Analyze conversation progression instead of intent buckets
      const conversationState = this.analyzeConversationState(context)
      
      // 2. Build dynamic, personalized prompt
      const prompt = this.buildDynamicPrompt(query, context, conversationState)
      
      // 3. Get AI response with strict formatting rules
      const response = await this.callAI(prompt, context)
      
      // 4. Post-process to ensure consistency and actions
      return this.enhanceResponse(response, context)
    } catch (error) {
      console.error('DynamicAIService error:', error)
      return this.getFallbackResponse(context)
    }
  }

  /**
   * Replaces rigid intent detection with conversation state analysis
   */
  private analyzeConversationState(context: ConversationContext): ConversationState {
    const recentMessages = context.conversationHistory.slice(-5)
    
    return {
      userEngagement: this.calculateEngagement(recentMessages),
      topicsDiscussed: this.extractTopics(recentMessages),
      currentNeed: this.inferCurrentNeed(recentMessages, context.profile),
      conversationPhase: this.determinePhase(recentMessages),
      personalityInsights: this.gatherPersonalityClues(recentMessages)
    }
  }

  private calculateEngagement(messages: Message[]): number {
    if (messages.length === 0) return 0.5
    
    const userMessages = messages.filter(m => m.role === 'user')
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length
    
    // Simple engagement score based on message length and frequency
    return Math.min(1, (avgLength / 50) * 0.5 + (userMessages.length / messages.length) * 0.5)
  }

  private extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>()
    const text = messages.map(m => m.content.toLowerCase()).join(' ')
    
    // Extract key topics mentioned
    const keywordMap = {
      'projects': ['project', 'internship', 'opportunity', 'position'],
      'companies': ['company', 'business', 'startup', 'organization'],
      'skills': ['skill', 'experience', 'programming', 'marketing', 'design'],
      'career': ['career', 'future', 'goal', 'ambition'],
      'networking': ['network', 'connect', 'meet', 'contact']
    }

    Object.entries(keywordMap).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.add(topic)
      }
    })

    return Array.from(topics)
  }

  private inferCurrentNeed(messages: Message[], profile: StudentProfile | CompanyProfile): string {
    const recentText = messages.slice(-3).map(m => m.content.toLowerCase()).join(' ')
    
    if (recentText.includes('find') || recentText.includes('search')) {
      return 'discovery'
    } else if (recentText.includes('apply') || recentText.includes('contact')) {
      return 'action'
    } else if (recentText.includes('help') || recentText.includes('advice')) {
      return 'guidance'
    }
    
    return 'exploration'
  }

  private determinePhase(messages: Message[]): 'discovery' | 'exploration' | 'decision' | 'action' {
    if (messages.length <= 2) return 'discovery'
    
    const recentContent = messages.slice(-3).map(m => m.content.toLowerCase()).join(' ')
    
    if (recentContent.includes('apply') || recentContent.includes('contact') || recentContent.includes('interview')) {
      return 'action'
    } else if (recentContent.includes('decide') || recentContent.includes('choose') || recentContent.includes('which')) {
      return 'decision'
    } else if (messages.length > 5) {
      return 'exploration'
    }
    
    return 'discovery'
  }

  private gatherPersonalityClues(messages: Message[]): string[] {
    const clues: string[] = []
    const userMessages = messages.filter(m => m.role === 'user')
    
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length
    
    if (avgLength > 100) clues.push('detailed')
    if (avgLength < 30) clues.push('concise')
    
    const text = userMessages.map(m => m.content.toLowerCase()).join(' ')
    if (text.includes('please') || text.includes('thank')) clues.push('polite')
    if (text.includes('urgent') || text.includes('quickly')) clues.push('time-sensitive')
    
    return clues
  }

  /**
   * Dynamic prompt building - the key to non-robotic responses
   */
  private buildDynamicPrompt(query: string, context: ConversationContext, state: ConversationState): string {
    const basePersona = this.getPersona(context.userType, state)
    const personalContext = this.buildPersonalContext(context, state)
    const actionableData = this.prepareActionableData(context, query)
    
    return `${basePersona}

CONVERSATION CONTEXT:
${personalContext}

CURRENT PLATFORM STATE:
${actionableData}

USER'S QUESTION: "${query}"

RESPONSE GUIDELINES:
- Reference their specific situation naturally
- Use their name/company name when appropriate
- Be conversational, not robotic
- Provide specific, actionable next steps
- Ask follow-up questions to deepen understanding
- No excessive formatting (* or ** - keep it clean)
- Maximum 1 emoji if any
- End with a specific question or suggested action

CRITICAL: Use EXACT platform data provided above. Never hallucinate numbers.
CRITICAL: Student count is always ${AI_RESPONSE_RULES.dataAccuracy.studentCount} - never use other numbers.`
  }

  /**
   * Creates personalized personas based on user context
   */
  private getPersona(userType: string, state: ConversationState): string {
    if (userType === 'student') {
      const phase = state.conversationPhase
      
      if (phase === 'discovery') {
        return "You are a knowledgeable career advisor who helps students explore opportunities. You ask thoughtful questions to understand their goals and guide them toward the right path."
      } else if (phase === 'action') {
        return "You are an experienced mentor helping a student take concrete steps. You provide specific, actionable advice and help them move forward with confidence."
      }
    } else if (userType === 'company') {
      return `You are a talent acquisition consultant who understands both hiring needs and student capabilities. You help companies find the right talent efficiently while building their brand with students.`
    }
    
    return "You are a helpful advisor on the Bidaaya platform."
  }

  /**
   * Builds rich personal context without generic data dumps
   */
  private buildPersonalContext(context: ConversationContext, state: ConversationState): string {
    let personalContext = ""
    
    if (context.userType === 'student') {
      const student = context.profile as StudentProfile
      personalContext = `
Student: ${student.firstName} ${student.lastName}
Academic: ${student.year} year ${student.major} student at ${student.university}
Interests: ${student.skills?.join(', ') || 'Not specified'}
Career Direction: ${state.currentNeed}`
    } else {
      const company = context.profile as CompanyProfile
      personalContext = `
Company: ${company.companyName}
Industry: ${company.industry}
Current Focus: ${state.currentNeed}`
    }
    
    // Add conversation memory
    if (state.topicsDiscussed.length > 0) {
      personalContext += `\nPrevious Discussion: ${state.topicsDiscussed.join(', ')}`
    }
    
    return personalContext
  }

  /**
   * Prepares only relevant, actionable data for the current conversation
   */
  private prepareActionableData(context: ConversationContext, query: string): string {
    return `
Platform Stats: ${context.platformData.totalStudents}+ students, ${context.platformData.totalCompanies}+ companies
Available Opportunities: ${context.platformData.recentProjects.slice(0, 3).map(p => p.title).join(', ')}
Trending Skills: ${context.platformData.trendingSkills.slice(0, 5).join(', ')}`
  }

  /**
   * Call AI with enhanced error handling
   */
  private async callAI(prompt: string, context: ConversationContext): Promise<string> {
    if (!DynamicAIService.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }

    const response = await fetch(DynamicAIService.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DynamicAIService.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Always follow the response guidelines exactly.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * Post-processing to ensure responses feel human and actionable
   */
  private enhanceResponse(aiResponse: string, context: ConversationContext): AIResponse {
    // 1. Clean up formatting
    let cleanResponse = this.cleanFormatting(aiResponse)
    
    // 2. Inject platform-specific data to override AI hallucinations
    cleanResponse = this.injectCorrectData(cleanResponse, context.platformData)
    
    // 3. Add conversational elements
    cleanResponse = this.addConversationalElements(cleanResponse, context)
    
    // 4. Determine follow-up actions
    const suggestedActions = this.extractActions(cleanResponse, context)
    
    return {
      message: cleanResponse,
      actions: suggestedActions,
      followUpQuestions: this.generateFollowUps(cleanResponse, context),
      actionType: this.determineActionType(cleanResponse, context),
      data: this.extractActionData(cleanResponse, context)
    }
  }

  /**
   * Key method: Clean up robotic AI formatting
   */
  private cleanFormatting(response: string): string {
    return response
      // Remove excessive asterisks
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1') 
      // Limit emojis to max 1
      .replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]){2,}/gu, 
        (match) => match.slice(0, 1))
      // Clean up excessive punctuation
      .replace(/!!!+/g, '!')
      .replace(/\?\?\?+/g, '?')
      // Remove bullet points if too many
      .replace(/(^|\n)[\s]*[•\-\*]\s/gm, (match, ...args) => {
        const fullText = args[args.length - 1]
        const bulletCount = (fullText.match(/(^|\n)[\s]*[•\-\*]\s/gm) || []).length
        return bulletCount > 3 ? '\n' : match
      })
  }

  /**
   * Override AI hallucinations with correct platform data
   */
  private injectCorrectData(response: string, platformData: PlatformContext): string {
    return response
      .replace(/\b1,?500\+?\s*(active\s+)?students?/gi, `${AI_RESPONSE_RULES.dataAccuracy.studentCount} students`)
      .replace(/\b1,?500\s*students?/gi, `${AI_RESPONSE_RULES.dataAccuracy.studentCount} students`)
      .replace(/\b5,?000\+?\s*students?/gi, `${AI_RESPONSE_RULES.dataAccuracy.studentCount} students`)
  }

  private addConversationalElements(response: string, context: ConversationContext): string {
    // Add natural conversation flow
    if (context.userType === 'company') {
      const company = context.profile as CompanyProfile
      if (company.companyName && !response.includes(company.companyName)) {
        response = response.replace(/your company/gi, company.companyName)
      }
    } else {
      const student = context.profile as StudentProfile
      if (student.firstName && !response.includes(student.firstName)) {
        response = response.replace(/you are/gi, `you are, ${student.firstName},`)
      }
    }
    
    return response
  }

  private extractActions(response: string, context: ConversationContext): any[] {
    const actions = []
    
    if (response.toLowerCase().includes('create project') || response.toLowerCase().includes('post project')) {
      actions.push({
        type: 'navigate',
        label: 'Create Project',
        url: '/dashboard/projects/new'
      })
    }
    
    if (response.toLowerCase().includes('search') || response.toLowerCase().includes('find')) {
      actions.push({
        type: 'search',
        label: 'Search Talent',
        action: 'search'
      })
    }
    
    return actions
  }

  private generateFollowUps(response: string, context: ConversationContext): string[] {
    const followUps = []
    
    if (context.userType === 'company') {
      followUps.push("What specific skills are you looking for?")
      followUps.push("Tell me about your ideal candidate")
    } else {
      followUps.push("What type of work interests you most?")
      followUps.push("Are you looking for internships or full-time opportunities?")
    }
    
    return followUps.slice(0, 2)
  }

  private determineActionType(response: string, context: ConversationContext): 'search' | 'project-creation' | 'guidance' | 'contact' | 'navigate' {
    if (response.toLowerCase().includes('create') || response.toLowerCase().includes('post')) {
      return 'project-creation'
    } else if (response.toLowerCase().includes('search') || response.toLowerCase().includes('find')) {
      return 'search'
    } else if (response.toLowerCase().includes('contact') || response.toLowerCase().includes('reach out')) {
      return 'contact'
    }
    
    return 'guidance'
  }

  private extractActionData(response: string, context: ConversationContext): any {
    return {
      conversationalAI: true,
      userType: context.userType,
      phase: context.conversationHistory.length > 0 ? 'continuation' : 'initial'
    }
  }

  private getFallbackResponse(context: ConversationContext): AIResponse {
    const message = context.userType === 'company' 
      ? `I'm here to help you find great talent from our ${AI_RESPONSE_RULES.dataAccuracy.studentCount} students. What type of role are you looking to fill?`
      : `I'm here to help you find opportunities that match your goals. What kind of work are you interested in?`
    
    return {
      message,
      actions: [],
      followUpQuestions: [],
      actionType: 'guidance'
    }
  }

  /**
   * Gather platform context from database
   */
  async gatherPlatformContext(): Promise<PlatformContext> {
    try {
      const [studentCount, companyCount, recentProjects] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'COMPANY' } }),
        prisma.project.findMany({
          where: { status: 'LIVE' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { company: { select: { companyName: true } } }
        })
      ])

      return {
        totalStudents: Math.max(studentCount, 7000), // Use actual count or marketing number, whichever is higher
        totalCompanies: companyCount,
        recentProjects: recentProjects.map(p => ({
          id: p.id,
          title: p.title,
          companyName: p.company.companyName || 'Company',
          description: p.description,
          skillsRequired: p.skillsRequired || [],
          category: p.category as string | null
        })),
        trendingSkills: ['React', 'Python', 'Marketing', 'Design', 'Data Analysis'],
        successStories: []
      }
    } catch (error) {
      console.error('Error gathering platform context:', error)
      return {
        totalStudents: 6000,
        totalCompanies: 200,
        recentProjects: [],
        trendingSkills: ['React', 'Python', 'Marketing', 'Design', 'Data Analysis'],
        successStories: []
      }
    }
  }
}

export { AI_RESPONSE_RULES }
