/**
 * Enhanced Chat API with CV Data Collection
 * 
 * This version automatically extracts and saves CV data from conversations
 * Updated: Oct 16, 2025 - Prisma client regeneration
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
const SYSTEM_PROMPT = `You are Bidaaya's AI Career Assistant specialized in building professional CVs through structured conversation.

**CRITICAL: START BY ACKNOWLEDGING WHAT YOU KNOW**
Always begin first message with what you already know about them:
"Hi [Name]! I see you're [studying X at Y / in a gap year / etc.]. I'd love to help build your professional CV. Let me share what I already know about you, and then we can fill in the gaps together."

Then list:
- Their name
- Their education (university, major, year)
- Their location
- Any skills they mentioned

**3-LEVEL STRUCTURE (STRICT - DO NOT SKIP LEVELS):**

**LEVEL 1: BASICS (MUST COMPLETE FIRST)**
Required before moving to Level 2:
- Full name confirmed
- Education details (institution, field, year, modules/subjects)
- Location

Questions to ask:
- "Tell me about your experience at [University] - what have you studied there?"
- "What specific modules or subjects have you focused on?"
- "What has been your favorite part of studying [Major]?"

**LEVEL 2: EXPERIENCE (MUST COMPLETE SECOND)**
Required before moving to Level 3:
- At least 1 work experience OR 1 significant project with details
- For EACH experience, get:
  - Role/title
  - Dates (when they worked there)
  - At least 1 achievement with metrics if possible

Questions to ask:
- "Have you had any internships, jobs, or work experience?"
- "What was your role at [Company]?"
- "What were your key achievements or responsibilities?"
- "Can you quantify any of your impact? (e.g., grew by X%, managed Y people)"

**LEVEL 3: ENRICHMENT (OPTIONAL BUT VALUABLE)**
Additional details:
- More projects
- Certifications/courses
- Leadership roles
- Languages

**RULES:**
1. NEVER ask for information already provided in EXISTING DATA
2. ONE question at a time
3. DO NOT move to Level 2 until Level 1 is complete
4. DO NOT move to Level 3 until Level 2 has at least 1 experience
5. After Level 2 is complete, offer to show opportunities or generate CV

**EXISTING DATA YOU ALREADY KNOW:**
{existingData}

**CURRENT CV STATUS:**
{cvStatus}

**WHAT TO FOCUS ON NOW:**
{focusArea}

Respond naturally, acknowledge what you know, and guide them through the levels systematically.`

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

    // Get user's existing data from onboarding
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        location: true,
        university: true,
        major: true,
        graduationYear: true,
        education: true, // High school, undergraduate, etc.
        highSchool: true,
        subjects: true,
        skills: true,
        interests: true,
        goal: true,
        linkedin: true,
        whatsapp: true,
        bio: true,
      },
    })

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
    // 🔄 AUTO-TRANSFER ONBOARDING DATA (ALWAYS CHECK)
    // ============================================
    
    // Check if CV tables need data from onboarding
    const existingEducation = await prisma.cVEducation.count({ where: { userId } })
    const existingSkills = await prisma.cVSkill.count({ where: { userId } })
    
    // Transfer education if we have onboarding data but no CV education entries
    if (existingEducation === 0 && user?.university && user?.major) {
      try {
        await prisma.cVEducation.create({
          data: {
            userId,
            institution: user.university,
            degreeType: user.education?.toLowerCase().includes('high school') ? 'a_levels' : 
                       user.education?.toLowerCase().includes('undergraduate') ? 'bsc' :
                       user.education?.toLowerCase().includes('postgraduate') ? 'msc' : 'bsc',
            degreeTitle: `${user.education || 'BSc'} in ${user.major}`,
            fieldOfStudy: user.major,
            institutionLocation: user.location || null,
            startDate: user.graduationYear ? new Date(user.graduationYear - 3, 8, 1) : new Date(2022, 8, 1),
            endDate: user.graduationYear ? new Date(user.graduationYear, 6, 1) : null,
            isCurrent: user.graduationYear ? user.graduationYear >= new Date().getFullYear() : true,
            modules: user.subjects ? user.subjects.split(',').map((s: string) => s.trim()) : [],
          },
        })
        console.log('✅ Transferred education:', user.university, user.major)
      } catch (e) {
        console.log('⚠️ Could not transfer education:', e)
      }
    }

    // Transfer skills
    if (existingSkills === 0 && user?.skills && user.skills.length > 0) {
      try {
        await Promise.all(
          user.skills.slice(0, 15).map((skill: string) =>
            prisma.cVSkill.create({
              data: {
                userId,
                skillName: skill,
                category: 'hard_skill',
                proficiency: 'intermediate', // Default
              },
            }).catch(() => console.log('Skill already exists:', skill))
          )
        )
        console.log('✅ Transferred', user.skills.length, 'skills to CV')
      } catch (e) {
        console.log('⚠️ Error transferring skills:', e)
      }
    }

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
          // Build existing data summary
          const existingData = `
Name: ${user?.name || 'Not set'}
Education: ${user?.university ? `${user.university} - ${user.major}${user.graduationYear ? `, graduating ${user.graduationYear}` : ''}` : 'Not set'}
Education Status: ${user?.education || 'Not set'}
Location: ${user?.location || 'Not set'}
Skills: ${user?.skills && user.skills.length > 0 ? user.skills.join(', ') : 'Not set'}
Interests: ${user?.interests && user.interests.length > 0 ? user.interests.join(', ') : 'Not set'}
Career Goals: ${user?.goal && user.goal.length > 0 ? user.goal.join(', ') : 'Not set'}
LinkedIn: ${user?.linkedin || 'Not set'}
          `.trim()

          // Build CV status
          const cvStatus = `
Overall Completeness: ${completeness.overallScore}%
✓ Education: ${completeness.education.entriesCount} ${completeness.education.entriesCount > 0 ? '✅' : '❌ NEEDED'}
✓ Experience: ${completeness.experience.entriesCount} ${completeness.experience.entriesCount > 0 ? '✅' : '❌ NEEDED (PRIORITY!)'}
✓ Projects: ${completeness.projects.entriesCount} ${completeness.projects.entriesCount > 0 ? '✅' : '⚠️ Recommended'}
✓ Skills: ${completeness.skills.entriesCount} ${completeness.skills.entriesCount >= 3 ? '✅' : '❌ NEEDED'}
          `.trim()

          // Determine focus area based on completeness
          let focusArea = ''
          let currentLevel = 1
          
          if (!completeness.education.hasMinimumData) {
            focusArea = 'LEVEL 1: Get education details (modules, subjects, experiences at university)'
            currentLevel = 1
          } else if (completeness.experience.entriesCount === 0) {
            focusArea = 'LEVEL 2: Get work experience/internships with achievements and metrics'
            currentLevel = 2
          } else if (completeness.experience.entriesCount < 2) {
            focusArea = 'LEVEL 2: Ask if they have MORE work experiences or projects'
            currentLevel = 2
          } else {
            focusArea = 'LEVEL 3: Enrich profile with certifications, leadership, languages'
            currentLevel = 3
          }

          // For first message, add special instruction
          const isFirstMessage = conversation.messages.length === 0
          if (isFirstMessage) {
            focusArea = `FIRST MESSAGE: Greet them warmly, acknowledge what you know about them, and ask about work experience at ${user?.university || 'their university'}`
          }

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: SYSTEM_PROMPT
                  .replace('{existingData}', existingData)
                  .replace('{cvStatus}', cvStatus)
                  .replace('{focusArea}', focusArea),
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
    // 🎯 DETECT USER INTENT FOR OPPORTUNITIES/CV
    // ============================================

    const messageLower = message.toLowerCase()
    let opportunityIdsToShow: string[] = []
    let opportunityTypeToShow: 'internal' | 'external' | null = null

    // User asks for opportunities
    if (messageLower.match(/\b(show|find|see|get|want|need)\b.*\b(opportunit|internship|job|position)/)) {
      if (completeness.overallScore >= 30) {
        // Fetch relevant opportunities based on their profile
        const opportunities = await prisma.externalOpportunity.findMany({
          where: { isActive: true },
          orderBy: { viewCount: 'desc' },
          take: 3,
          select: { id: true },
        })
        
        opportunityIdsToShow = opportunities.map(o => o.id)
        opportunityTypeToShow = 'external'
        
        aiResponse = `Based on your ${user?.major || 'background'} at ${user?.university || 'university'}, here are some great opportunities I found for you:`
      } else {
        aiResponse = `I'd love to show you opportunities! Let me collect a bit more about your experience first so I can find the best matches. ${aiResponse}`
      }
    }

    // User asks for CV
    if (messageLower.match(/\b(show|generate|create|build|make|see|want|need)\b.*\b(cv|resume|curriculum)/)) {
      if (completeness.isMinimumViable) {
        aiResponse = `Great! Your CV is ready. Click the "Generate My CV" button below to view it, or I can create a custom version for any specific opportunity you're applying to.`
      } else {
        aiResponse = `I'd love to generate your CV! We need just a bit more information first (currently ${completeness.overallScore}% complete). ${aiResponse}`
      }
    }

    // Auto-offer when CV is complete enough
    if (completeness.overallScore >= 60 && completeness.experience.entriesCount > 0 && !aiResponse.toLowerCase().includes('opportunit') && !aiResponse.toLowerCase().includes('cv')) {
      aiResponse += `\n\n✨ Your CV is ${completeness.overallScore}% complete! Ready to:\n1. See matching internship opportunities\n2. Generate your custom CV`
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
        opportunityType: opportunityTypeToShow || undefined,
        opportunityIds: opportunityIdsToShow.length > 0 ? opportunityIdsToShow : undefined,
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
        opportunityType: opportunityTypeToShow,
        opportunityIds: opportunityIdsToShow.length > 0 ? opportunityIdsToShow : undefined,
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

