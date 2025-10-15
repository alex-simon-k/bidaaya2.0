import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

// Initialize OpenAI (prioritize OpenAI over DeepSeek)
const getOpenAIClient = () => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  
  console.log('🔑 API Key Check:', {
    openai: openaiKey ? '✅ Configured' : '❌ Missing',
    deepseek: deepseekKey ? '✅ Configured' : '❌ Missing',
  });
  
  // Prioritize OpenAI
  if (openaiKey) {
    console.log('✅ Using OpenAI API');
    return new OpenAI({
      apiKey: openaiKey,
    });
  }
  
  // Fallback to DeepSeek
  if (deepseekKey) {
    console.log('✅ Using DeepSeek API');
    return new OpenAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    });
  }
  
  console.warn('⚠️ No AI API key configured');
  return null;
}

// AI System Prompt - Guides the conversation with 3-level structure
const SYSTEM_PROMPT = `You are Bidaaya's AI Career Assistant. Your role is to help students find internships and build their careers through a structured 3-level conversation.

**3-LEVEL CONVERSATION STRUCTURE:**

**LEVEL 1 - Essential Basics (Most Important):**
Collect core information to understand the student:
- Name, university, major, graduation year
- Current education level (high school, undergraduate, graduate)
- Location and availability
- Primary field of interest

**LEVEL 2 - Experience & Skills:**
Understand their capabilities:
- Technical and soft skills
- Previous internships or work experience
- Projects they've worked on
- Languages they speak
- Tools/technologies they know

**LEVEL 3 - Goals & Preferences:**
Deep dive into aspirations:
- Career goals and dream roles
- Industries they're interested in
- Company size preferences (startup vs corporate)
- Work style preferences (remote, hybrid, in-office)
- Long-term career vision

**YOUR APPROACH:**
1. Start with Level 1 questions if profile is incomplete
2. Move to Level 2 once basics are covered
3. Progress to Level 3 for deeper understanding
4. After collecting sufficient data, recommend opportunities using: [OPPORTUNITY:id1,id2,id3:type] where type is "internal" or "external"
5. Update the conversation level indicator: [LEVEL:1], [LEVEL:2], or [LEVEL:3]

**IMPORTANT:**
- Keep responses concise (2-3 sentences max)
- Ask 1-2 questions at a time, don't overwhelm
- Be encouraging and supportive
- Focus on collecting data naturally through conversation
- When you have enough info, recommend opportunities

**CURRENT STUDENT PROFILE:**
{profile}

**CURRENT CONVERSATION LEVEL:** {level}

Respond naturally and help the student progress through the levels.`

interface ChatRequest {
  message: string
  conversationId?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('💬 Chat API - POST request received')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.error('❌ Chat API - No user session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Chat API - User authenticated:', session.user.id)

    const body: ChatRequest = await request.json()
    const { message, conversationId } = body

    console.log('📝 Chat API - Message:', message.substring(0, 50) + '...')
    console.log('🆔 Chat API - Conversation ID:', conversationId || 'new conversation')

    if (!message || message.trim().length === 0) {
      console.error('❌ Chat API - Empty message')
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user profile for context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        university: true,
        major: true,
        graduationYear: true,
        skills: true,
        interests: true,
        goal: true,
        bio: true,
        location: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // Last 20 messages for context
          },
        },
      })
    }

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.chatConversation.create({
        data: {
          userId: session.user.id,
          title: message.substring(0, 50), // First message as title
        },
        include: {
          messages: true,
        },
      })
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId: session.user.id,
        role: 'user',
        content: message,
      },
    })

    // Build context from user profile
    const profileContext = `
Name: ${user.name || 'Not set'}
University: ${user.university || 'Not set'}
Major: ${user.major || 'Not set'}
Graduation Year: ${user.graduationYear || 'Not set'}
Skills: ${user.skills?.length ? user.skills.join(', ') : 'Not set'}
Interests: ${user.interests?.length ? user.interests.join(', ') : 'Not set'}
Career Goals: ${user.goal?.length ? user.goal.join(', ') : 'Not set'}
Location: ${user.location || 'Not set'}
Bio: ${user.bio || 'Not set'}
    `.trim()

    // Build conversation history
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    // Add current user message
    conversationHistory.push({
      role: 'user',
      content: message,
    })

    let aiResponse: string;

    // Check if AI is configured
    const openai = getOpenAIClient();
    
    if (openai) {
      // Call AI (OpenAI or DeepSeek)
      try {
        // Determine model based on which API is configured
        const model = process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'deepseek-chat';
        console.log(`🤖 Using model: ${model}`);
        
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
                .replace('{profile}', profileContext)
                .replace('{level}', `Level ${conversation.conversationLevel || 1}`),
            },
            ...conversationHistory,
          ],
          temperature: 0.7,
          max_tokens: 500,
        })

        aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
        console.log('✅ AI Response generated successfully')
      } catch (aiError: any) {
        console.error('AI API Error:', aiError)
        
        // Fallback response
        // Try to include a few internal opportunities in the fallback
        try {
          const topProjects = await prisma.project.findMany({
            where: { status: 'LIVE' },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
            take: 3,
          })
          const ids = topProjects.map(p => p.id).join(',')
          aiResponse = ids.length
            ? `I'm having trouble connecting to my AI right now, but I pulled a few internships you might like. [OPPORTUNITY:${ids}:internal]`
            : `I'm currently having trouble connecting to my AI service. Let me help you manually! I can see you're looking for opportunities. Would you like me to show you some internships that match your profile?`
        } catch {
          aiResponse = `I'm currently having trouble connecting to my AI service. Let me help you manually! I can see you're looking for opportunities. Would you like me to show you some internships that match your profile?`
        }
      }
    } else {
      // No AI configured - provide helpful fallback response
      console.log('📝 No AI configured, using smart fallback response')
      
      // Smart fallback based on message content
      const lowerMessage = message.toLowerCase()
      
      if (lowerMessage.includes('internship') || lowerMessage.includes('opportunit')) {
        // Try to include live internal opportunities
        try {
          const topProjects = await prisma.project.findMany({
            where: { status: 'LIVE' },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
            take: 3,
          })
          const ids = topProjects.map(p => p.id).join(',')
          aiResponse = ids.length
            ? `Great! I'd love to help you find internships. Based on your profile (${user.major || 'your field'}), here are some to consider. [OPPORTUNITY:${ids}:internal]`
            : `Great! I'd love to help you find internships. Based on your profile (${user.major || 'your field'}), I can recommend some opportunities. What location are you targeting?`
        } catch {
          aiResponse = `Great! I'd love to help you find internships. Based on your profile (${user.major || 'your field'}), I can recommend some opportunities. What location are you targeting?`
        }
      } else if (lowerMessage.includes('cv') || lowerMessage.includes('resume')) {
        aiResponse = `I can help you build a custom CV! To get started, I'll need to know more about your experience and the role you're applying for. What type of position are you targeting?`
      } else if (lowerMessage.includes('career') || lowerMessage.includes('advice')) {
        aiResponse = `I'm here to help guide your career journey! Based on your profile, I can recommend internships, help you build your CV, and provide career advice. What would you like to focus on first?`
      } else {
        // Generic greeting – still try to surface a few opportunities
        try {
          const topProjects = await prisma.project.findMany({
            where: { status: 'LIVE' },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
            take: 3,
          })
          const ids = topProjects.map(p => p.id).join(',')
          aiResponse = ids.length
            ? `Hello! I can help you find internships, build CVs, and plan your career. Here are a few internships to get started. [OPPORTUNITY:${ids}:internal]`
            : `Hello! I'm your Bidaaya career assistant. I can help you with:\n\n• Finding internship opportunities\n• Building custom CVs\n• Career planning and advice\n\nWhat would you like help with?`
        } catch {
          aiResponse = `Hello! I'm your Bidaaya career assistant. I can help you with:\n\n• Finding internship opportunities\n• Building custom CVs\n• Career planning and advice\n\nWhat would you like help with?`
        }
      }
    }

    // Parse AI response for level updates and opportunity recommendations
    // Format: [LEVEL:1], [LEVEL:2], [LEVEL:3]
    const levelMatch = aiResponse.match(/\[LEVEL:(\d)\]/i)
    let newLevel: number | null = null
    
    if (levelMatch) {
      newLevel = parseInt(levelMatch[1])
      aiResponse = aiResponse.replace(/\[LEVEL:\d\]/gi, '').trim()
      console.log(`📊 Level update detected: ${newLevel}`)
    }
    
    // Format: [OPPORTUNITY:id1,id2,id3:internal] or [OPPORTUNITY:id1,id2:external]
    const opportunityMatch = aiResponse.match(/\[OPPORTUNITY:(.*?):(internal|external)\]/i)
    let opportunityIds: string[] = []
    let opportunityType: string | null = null

    if (opportunityMatch) {
      opportunityIds = opportunityMatch[1].split(',').map((id) => id.trim())
      opportunityType = opportunityMatch[2]
      
      // Remove the tag from the response text
      aiResponse = aiResponse.replace(/\[OPPORTUNITY:.*?\]/gi, '').trim()
    }
    
    const cleanResponse = aiResponse.trim()
    
    // Save AI message
    const aiMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId: session.user.id,
        role: 'assistant',
        content: cleanResponse,
        opportunityType,
        opportunityIds: opportunityIds.length > 0 ? opportunityIds : undefined,
      },
    })

    // Update conversation (timestamp and level if changed)
    const updateData: any = { lastMessageAt: new Date() }
    if (newLevel && newLevel !== conversation.conversationLevel) {
      updateData.conversationLevel = newLevel
      console.log(`✅ Conversation level updated to ${newLevel}`)
    }
    
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: updateData,
    })

    return NextResponse.json({
      conversationId: conversation.id,
      conversationLevel: newLevel || conversation.conversationLevel,
      message: {
        id: aiMessage.id,
        role: 'assistant',
        content: cleanResponse,
        opportunityType,
        opportunityIds: opportunityIds.length > 0 ? opportunityIds : undefined,
        createdAt: aiMessage.createdAt,
      },
    })

  } catch (error: any) {
    console.error('❌ Chat API error:', error)
    
    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json({
        error: 'AI service quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED',
      }, { status: 429 })
    }

    return NextResponse.json({
      error: 'Failed to process chat message',
      code: 'CHAT_ERROR',
      details: error.message,
    }, { status: 500 })
  }
}

// GET: Fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      // Return all conversations for user
      const conversations = await prisma.chatConversation.findMany({
        where: { userId: session.user.id },
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Just the last message for preview
          },
        },
      })

      return NextResponse.json({ conversations })
    }

    // Return specific conversation with all messages
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ conversation })

  } catch (error: any) {
    console.error('❌ Get conversation error:', error)
    return NextResponse.json({
      error: 'Failed to fetch conversation',
      details: error.message,
    }, { status: 500 })
  }
}

