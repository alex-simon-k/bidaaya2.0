/**
 * Enhanced Chat API with CV Data Collection
 * 
 * This version automatically extracts and saves CV data from conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import { CVEntityExtractor } from '@/lib/cv-entity-extractor'
import { CVConversationManager } from '@/lib/cv-conversation-manager'
import { CVGenerator } from '@/lib/cv-generator'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

// Initialize OpenAI client
const getOpenAIClient = () => {
  const openaiKey = process.env.OPENAI_API_KEY
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey })
  }
  
  if (deepseekKey) {
    return new OpenAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    })
  }
  
  return null
}

// Enhanced System Prompt for CV Collection
const SYSTEM_PROMPT = `You are Bidaaya's AI Career Assistant specialized in building professional CVs through natural conversation.

**YOUR MISSION:**
Help students build comprehensive professional profiles by naturally collecting their:
- Education history
- Work experience and internships
- Personal projects
- Skills and certifications
- Achievements and leadership

**CONVERSATION STYLE:**
- Be warm, encouraging, and conversational
- Ask one thing at a time, don't overwhelm
- Show genuine interest in their achievements
- Acknowledge what they share ("That's impressive!" / "Great experience!")
- Keep responses brief (2-3 sentences)
- Progress naturally through their career story

**DATA COLLECTION PRIORITY:**
1. Start with basics (name, current education)
2. Then work experience (most recent first)
3. Then projects and side work
4. Then skills and certifications
5. Finally achievements and extras

**SPECIAL INSTRUCTIONS:**
- When they mention a job/internship, dig deeper: "What were your key achievements there?"
- When they mention metrics, celebrate them: "40% improvement - that's significant!"
- When they're vague, gently probe: "Can you tell me more about that?"
- After collecting enough data, offer to generate their CV

**CURRENT PROFILE STATUS:**
{profileStatus}

**LAST COLLECTED:**
{lastCollected}

Respond naturally and continue building their profile.`

interface ChatRequest {
  message: string
  conversationId?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('💬 Enhanced CV Chat API - POST request received')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.error('❌ No user session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: ChatRequest = await request.json()
    const { message, conversationId } = body

    console.log('📝 Message:', message.substring(0, 100) + '...')

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get or create conversation
    let conversation = conversationId ?
      await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20,
          },
        },
      }) : null

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
          title: message.substring(0, 50),
        },
        include: { messages: true },
      })
      console.log('✅ Created new conversation:', conversation.id)
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: message,
      },
    })

    // ============================================
    // 🎯 CV ENTITY EXTRACTION (THE KEY INNOVATION)
    // ============================================

    let extractedData = null
    let entityType: string | null = null

    // Detect if user is providing CV information
    const detectedType = await CVEntityExtractor.detectEntityType(
      message,
      conversation.messages.slice(-5).map(m => m.content)
    )

    console.log('🔍 Detected entity type:', detectedType)

    // Extract and save if CV data detected
    if (detectedType !== 'unknown') {
      entityType = detectedType

      switch (detectedType) {
        case 'experience':
          extractedData = await CVEntityExtractor.extractExperience(
            message,
            conversation.messages.slice(-5).map(m => m.content)
          )
          if (extractedData) {
            await CVEntityExtractor.saveExperience(userId, extractedData)
            console.log('✅ Saved work experience:', extractedData.employer)
          }
          break

        case 'education':
          extractedData = await CVEntityExtractor.extractEducation(
            message,
            conversation.messages.slice(-5).map(m => m.content)
          )
          if (extractedData) {
            await CVEntityExtractor.saveEducation(userId, extractedData)
            console.log('✅ Saved education:', extractedData.institution)
          }
          break

        case 'project':
          extractedData = await CVEntityExtractor.extractProject(
            message,
            conversation.messages.slice(-5).map(m => m.content)
          )
          if (extractedData) {
            await CVEntityExtractor.saveProject(userId, extractedData)
            console.log('✅ Saved project:', extractedData.name)
          }
          break

        default:
          console.log('⚠️ Entity type not yet implemented:', detectedType)
      }
    }

    // ============================================
    // 📊 CALCULATE CV COMPLETENESS
    // ============================================

    const completeness = await CVConversationManager.calculateCompleteness(userId)
    
    console.log(`📊 CV Completeness: ${completeness.overallScore}%`)
    console.log(`   Education: ${completeness.education.score}%`)
    console.log(`   Experience: ${completeness.experience.score}%`)
    console.log(`   Projects: ${completeness.projects.score}%`)

    // ============================================
    // 💬 GENERATE AI RESPONSE
    // ============================================

    let aiResponse: string

    // If we just extracted data, acknowledge it first
    if (extractedData && entityType) {
      const acknowledgment = CVConversationManager.generateAcknowledgment(
        entityType,
        extractedData
      )
      
      // Then ask the next question
      const nextQuestion = await CVConversationManager.generateNextQuestion(
        userId,
        message,
        completeness
      )

      aiResponse = `${acknowledgment} ${nextQuestion}`

    } else {
      // Regular conversation response
      const openai = getOpenAIClient()
      
      if (openai) {
        try {
          // Build profile status for context
          const profileStatus = `
Overall: ${completeness.overallScore}%
Education: ${completeness.education.entriesCount} entries
Experience: ${completeness.experience.entriesCount} entries
Projects: ${completeness.projects.entriesCount} entries
Skills: ${completeness.skills.entriesCount} skills
          `.trim()

          const lastCollected = entityType || 'None'

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: SYSTEM_PROMPT
                  .replace('{profileStatus}', profileStatus)
                  .replace('{lastCollected}', lastCollected),
              },
              ...conversation.messages.map((msg) => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content,
              })),
              {
                role: 'user',
                content: message,
              }
            ],
            temperature: 0.7,
            max_tokens: 300,
          })

          aiResponse = completion.choices[0]?.message?.content || 
            'Tell me more about your background!'

        } catch (aiError) {
          console.error('AI API Error:', aiError)
          
          // Fallback: use conversation manager
          aiResponse = await CVConversationManager.generateNextQuestion(
            userId,
            message,
            completeness
          )
        }
      } else {
        // No AI configured: use conversation manager
        aiResponse = await CVConversationManager.generateNextQuestion(
          userId,
          message,
          completeness
        )
      }
    }

    // ============================================
    // 💾 SAVE AI RESPONSE
    // ============================================

    const aiMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: 'assistant',
        content: aiResponse,
      },
    })

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    })

    // ============================================
    // 📤 RETURN RESPONSE
    // ============================================

    return NextResponse.json({
      conversationId: conversation.id,
      message: {
        id: aiMessage.id,
        role: 'assistant',
        content: aiResponse,
        createdAt: aiMessage.createdAt,
      },
      cvProgress: {
        overallScore: completeness.overallScore,
        isMinimumViable: completeness.isMinimumViable,
        nextSection: completeness.nextRecommendedSection,
        educationCount: completeness.education.entriesCount,
        experienceCount: completeness.experience.entriesCount,
        projectsCount: completeness.projects.entriesCount,
      },
      extractedData: extractedData ? {
        type: entityType,
        success: true
      } : null,
    })

  } catch (error: any) {
    console.error('❌ Enhanced Chat API error:', error)
    return NextResponse.json({
      error: 'Failed to process message',
      details: error.message,
    }, { status: 500 })
  }
}

// GET: Fetch conversation history with CV progress
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      // Return all conversations with CV progress
      const conversations = await prisma.chatConversation.findMany({
        where: { userId: session.user.id },
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      // Get CV completeness
      const completeness = await CVConversationManager.calculateCompleteness(
        session.user.id
      )

      return NextResponse.json({ 
        conversations,
        cvProgress: {
          overallScore: completeness.overallScore,
          isMinimumViable: completeness.isMinimumViable,
        }
      })
    }

    // Return specific conversation
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

