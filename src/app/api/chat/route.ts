import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

// Initialize OpenAI (can switch to DeepSeek)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : undefined,
})

// AI System Prompt - Guides the conversation
const SYSTEM_PROMPT = `You are Bidaaya's AI Career Assistant. Your role is to help students find internships and build their careers.

**YOUR GOALS:**
1. Learn about the student (skills, interests, education, career goals)
2. Recommend relevant internship opportunities (internal Bidaaya projects & external opportunities)
3. Help students create custom CVs for external applications
4. Guide students through their career journey

**CONVERSATION FLOW:**
- Start by greeting the student warmly
- Ask about their background, skills, interests, and goals (if not already known)
- Based on their profile, recommend relevant opportunities
- When recommending opportunities, use the format: [OPPORTUNITY:id1,id2,id3:type] where type is "internal" or "external"
- Encourage students to apply to opportunities that match their profile
- Be encouraging, supportive, and professional

**IMPORTANT:**
- Keep responses concise (2-3 sentences max unless explaining something complex)
- Always be encouraging and positive
- Focus on actionable next steps
- When you recommend opportunities, they will be displayed as beautiful cards in the chat

**STUDENT PROFILE:**
{profile}

Respond naturally and help the student progress in their career journey.`

interface ChatRequest {
  message: string
  conversationId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ChatRequest = await request.json()
    const { message, conversationId } = body

    if (!message || message.trim().length === 0) {
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

    // Call AI (OpenAI or DeepSeek)
    const completion = await openai.chat.completions.create({
      model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT.replace('{profile}', profileContext),
        },
        ...conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Parse AI response for opportunity recommendations
    // Format: [OPPORTUNITY:id1,id2,id3:internal] or [OPPORTUNITY:id1,id2:external]
    const opportunityMatch = aiResponse.match(/\[OPPORTUNITY:(.*?):(internal|external)\]/i)
    let opportunityIds: string[] = []
    let opportunityType: string | null = null

    if (opportunityMatch) {
      opportunityIds = opportunityMatch[1].split(',').map((id) => id.trim())
      opportunityType = opportunityMatch[2]
      
      // Remove the tag from the response text
      const cleanResponse = aiResponse.replace(/\[OPPORTUNITY:.*?\]/gi, '').trim()
      
      // Save AI message with opportunity data
      const aiMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          userId: session.user.id,
          role: 'assistant',
          content: cleanResponse,
          opportunityType,
          opportunityIds,
        },
      })

      // Update conversation timestamp
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      })

      return NextResponse.json({
        conversationId: conversation.id,
        message: {
          id: aiMessage.id,
          role: 'assistant',
          content: cleanResponse,
          opportunityType,
          opportunityIds,
          createdAt: aiMessage.createdAt,
        },
      })
    }

    // Save AI message without opportunities
    const aiMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId: session.user.id,
        role: 'assistant',
        content: aiResponse,
      },
    })

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    })

    return NextResponse.json({
      conversationId: conversation.id,
      message: {
        id: aiMessage.id,
        role: 'assistant',
        content: aiResponse,
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

