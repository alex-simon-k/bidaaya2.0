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

**YOUR ROLE:**
Guide users section-by-section through their profile, checking off items as you collect information. Work through incomplete sections systematically.

**PROFILE SECTIONS (CHECK ONE AT A TIME):**

1. **Education** - University, major, year, modules/subjects
2. **Skills** - Technical skills, soft skills, languages, tools
3. **Work Experience** - Internships, jobs, roles, achievements with metrics
4. **Projects** - Personal or academic projects with impact
5. **Additional Info** - Certifications, leadership, volunteering

**CONVERSATION FLOW:**

**WHEN USER STARTS ("I'm ready to start"):**
1. Warmly greet them: "Great! Let's build your profile together. I'll guide you through each section step by step. 🚀"
2. Check what information you already have from {existingData}
3. Identify the FIRST incomplete section from the list above
4. Focus ONLY on that section until complete

**FOR EACH SECTION:**
1. Announce the section: "Let's start with your [SECTION NAME] 📝"
2. Ask 1-2 focused questions at a time
3. When section feels complete, SUMMARIZE what you collected:
   "Great! I've captured:
   - [Point 1]
   - [Point 2]
   - [Point 3]
   
   Ready to move to the next section?"
4. Move to the NEXT incomplete section

**EXAMPLE - EDUCATION SECTION:**
"Let's start with your Education 📚

Tell me about your studies at [University]. What specific modules or subjects have you focused on that you're most proud of?"

[After they respond, ask 1-2 follow-up questions]

[When complete:]
"Perfect! I've captured:
- Studying [Major] at [University]
- Year: [X]
- Key modules: [A, B, C]
- Favorite part: [Y]

Let's move to Skills next! 💡"

**CRITICAL RULES - MUST FOLLOW:**
1. ⛔ NEVER ask for Name, University, Major, Education Level - these are in {existingData}
2. ⛔ DO ask for DETAILED education info (modules, subjects, grades) even if university is in {existingData}
3. ⛔ {existingData} contains BASIC info from signup - you must collect DETAILED info for their CV
4. ⛔ Check {cvStatus} to see what's actually in their CV database - if it says "Education: 0 ❌", you MUST ask about education details
5. ⛔ NEVER go BACKWARDS - if you're on Work Experience, DO NOT ask about Education
6. ⛔ ONLY ask about what {focusArea} tells you to focus on
7. ONE or TWO questions maximum per message
8. ALWAYS acknowledge what they just told you before asking next question
9. Stay on {focusArea} until that section is complete

**BEFORE EVERY MESSAGE YOU WRITE:**
Step 1: Read {focusArea} - this tells you EXACTLY what to ask about
Step 2: Check {existingData} - this tells you what you ALREADY KNOW
Step 3: Ask ONLY about {focusArea} topic, avoiding anything in {existingData}
Step 4: NEVER ask about Name, University, Major, Education Status - these are ALWAYS known

**EXAMPLES OF WHAT NOT TO DO:**
❌ "What's your full name?" (Name is in existingData)
❌ "What university do you attend?" (University is in existingData)
❌ "Tell me about your education" when focusArea says "WORK EXPERIENCE"
❌ Saying "I see you already have education filled out" when cvStatus shows "Education: 0"

**EXAMPLES OF CORRECT BEHAVIOR:**
✅ If cvStatus shows "Education: 0" but university is in existingData → ASK: "I see you study Computer Science at AUD. Tell me about the modules or subjects you've taken that you're most proud of?"
✅ If focusArea = "WORK EXPERIENCE" and cvStatus shows "Experience: 0" → Ask about internships, jobs, achievements
✅ If focusArea = "SKILLS" → Ask about technical skills, tools, languages
✅ Always acknowledge their answer: "Great! I've noted your Operations Manager role at Revolut. What were your key achievements there?"

**KEY DISTINCTION:**
- existingData = BASIC info they entered at signup (name, university, major)
- cvStatus = What's ACTUALLY in their CV database (detailed education, experience, projects)
- You must collect DETAILED info to fill the CV database, even if basic info exists

**EXISTING DATA YOU ALREADY KNOW:**
{existingData}

**CURRENT CV STATUS:**
{cvStatus}

**WHAT TO FOCUS ON NOW:**
{focusArea}

Guide them systematically, celebrate progress, and make profile building feel like a natural conversation.`

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
    
    console.log('🔄 Checking auto-transfer...')
    console.log('   User has university?', user?.university)
    console.log('   User has major?', user?.major)
    
    // Check if CV tables need data from onboarding
    const existingEducation = await prisma.cVEducation.count({ where: { userId } })
    const existingSkills = await prisma.cVSkill.count({ where: { userId } })
    
    console.log('   Existing CVEducation entries:', existingEducation)
    console.log('   Existing CVSkill entries:', existingSkills)
    
    // Transfer education if we have onboarding data but no CV education entries
    if (existingEducation === 0 && user?.university && user?.major) {
      console.log('🔄 AUTO-TRANSFERRING education data from Phase 1...')
      try {
        const transferred = await prisma.cVEducation.create({
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
        console.log('✅ TRANSFERRED education:', transferred.institution, transferred.fieldOfStudy)
      } catch (e) {
        console.error('❌ FAILED to transfer education:', e)
      }
    } else {
      if (existingEducation > 0) {
        console.log('✅ Education already in CV tables, no transfer needed')
      } else {
        console.log('⚠️ No Phase 1 data to transfer (missing university or major)')
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
    let dataSaved = false

    // Detect if user is providing CV information
    const detectedType = await CVEntityExtractor.detectEntityType(
      message,
      conversation.messages.slice(-5).map(m => m.content)
    )

    console.log('🔍 Detected entity type:', detectedType)

    // Extract and save if CV data detected
    if (detectedType !== 'unknown') {
      entityType = detectedType
      console.log('💾 Attempting to extract and save:', detectedType)

      switch (detectedType) {
        case 'experience':
          extractedData = await CVEntityExtractor.extractExperience(
            message,
            conversation.messages.slice(-5).map(m => m.content)
          )
          if (extractedData) {
            console.log('📤 Extracted experience data:', JSON.stringify(extractedData, null, 2))
            const saved = await CVEntityExtractor.saveExperience(userId, extractedData)
            if (saved) {
              console.log('✅ Saved work experience:', extractedData.employer)
              dataSaved = true
            } else {
              console.error('❌ FAILED to save work experience')
            }
          } else {
            console.log('⚠️ Extraction returned null - could not parse experience from message')
          }
          break

        case 'education':
          extractedData = await CVEntityExtractor.extractEducation(
            message,
            conversation.messages.slice(-5).map(m => m.content)
          )
          if (extractedData) {
            console.log('📤 Extracted education data:', JSON.stringify(extractedData, null, 2))
            const saved = await CVEntityExtractor.saveEducation(userId, extractedData)
            if (saved) {
              console.log('✅ Saved education:', extractedData.institution)
              dataSaved = true
            } else {
              console.error('❌ FAILED to save education')
            }
          } else {
            console.log('⚠️ Extraction returned null - could not parse education from message')
          }
          break

        case 'project':
          extractedData = await CVEntityExtractor.extractProject(
            message,
            conversation.messages.slice(-5).map(m => m.content)
          )
          if (extractedData) {
            console.log('📤 Extracted project data:', JSON.stringify(extractedData, null, 2))
            const saved = await CVEntityExtractor.saveProject(userId, extractedData)
            if (saved) {
              console.log('✅ Saved project:', extractedData.name)
              dataSaved = true
            } else {
              console.error('❌ FAILED to save project')
            }
          } else {
            console.log('⚠️ Extraction returned null - could not parse project from message')
          }
          break

        default:
          console.log('⚠️ Entity type not yet implemented:', detectedType)
      }
    } else {
      console.log('ℹ️ No CV entity detected in this message (type: unknown)')
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
          // Build existing data summary - BASIC INFO ONLY (from Phase 1)
          const existingData = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ YOU ALREADY KNOW THESE - NEVER ASK AGAIN ⛔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Name: ${user?.name || 'Not set'}
✓ University: ${user?.university || 'Not set'}  
✓ Major: ${user?.major || 'Not set'}
✓ Education Level: ${user?.education || 'Not set'}
✓ Graduation Year: ${user?.graduationYear || 'Not set'}
✓ Location: ${user?.location || 'Not set'}

⚠️ CRITICAL INSTRUCTIONS:
1. DO NOT ask "what's your full name?" - you already know it's "${user?.name}"
2. DO NOT ask "what university?" - you already know it's "${user?.university}"
3. DO NOT ask "what's your major?" - you already know it's "${user?.major}"
4. DO ask for DETAILED info: modules, subjects, grades, specific experiences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `.trim()

          // Build CV status
          const cvStatus = `
Overall Completeness: ${completeness.overallScore}%
✓ Education: ${completeness.education.entriesCount} ${completeness.education.entriesCount > 0 ? '✅' : '❌ NEEDED'}
✓ Experience: ${completeness.experience.entriesCount} ${completeness.experience.entriesCount > 0 ? '✅' : '❌ NEEDED (PRIORITY!)'}
✓ Projects: ${completeness.projects.entriesCount} ${completeness.projects.entriesCount > 0 ? '✅' : '⚠️ Recommended'}
✓ Skills: ${completeness.skills.entriesCount} ${completeness.skills.entriesCount >= 3 ? '✅' : '❌ NEEDED'}
          `.trim()

          // Determine focus area - guide section by section based on CV DATABASE (not Phase 1 data)
          let focusArea = ''
          let currentLevel = 1
          
          console.log('🎯 Determining focus area based on CV completeness:', {
            educationCount: completeness.education.entriesCount,
            skillsCount: completeness.skills.entriesCount,
            experienceCount: completeness.experience.entriesCount,
            projectsCount: completeness.projects.entriesCount
          })
          
          // Check sections in order and focus on first incomplete one IN THE CV DATABASE
          if (completeness.education.entriesCount === 0) {
            focusArea = 'SECTION 1 - EDUCATION: The CV database shows 0 education entries. Even though you know their university/major from signup, you MUST ask for DETAILED info (modules, subjects, grades, achievements) and save it to the CV database.'
            currentLevel = 1
          } else if (completeness.skills.entriesCount < 3) {
            focusArea = 'SECTION 2 - SKILLS: Ask about technical skills, soft skills, languages, and tools they use'
            currentLevel = 1
          } else if (completeness.experience.entriesCount === 0) {
            focusArea = 'SECTION 3 - WORK EXPERIENCE: The CV database shows 0 work experience. Ask about internships, jobs, roles, and key achievements with metrics'
            currentLevel = 2
          } else if (completeness.projects.entriesCount === 0) {
            focusArea = 'SECTION 4 - PROJECTS: Ask about personal or academic projects they\'re proud of'
            currentLevel = 2
          } else if (completeness.experience.entriesCount < 2 || completeness.projects.entriesCount < 2) {
            focusArea = 'SECTION 5 - MORE DETAILS: Ask if they have additional experiences, projects, or want to enrich any section'
            currentLevel = 2
          } else {
            focusArea = 'SECTION 6 - FINAL TOUCHES: Certifications, leadership roles, volunteering, or anything else they want to add'
            currentLevel = 3
          }
          
          console.log('🎯 Selected focus area:', focusArea)

          // For first message, add special instruction
          const isFirstMessage = conversation.messages.length === 0
          if (isFirstMessage) {
            // CRITICAL: If education is empty, ALWAYS start there regardless of other logic
            if (completeness.education.entriesCount === 0) {
              focusArea = `FIRST MESSAGE: They clicked "Start Building Your Profile". 
              
CRITICAL: Their CV database shows ZERO education entries. You MUST start by asking about their education details.

Say something like: "Great! Let's build your profile together. I can see you're studying ${user?.major || 'at university'}${user?.university ? ` at ${user.university}` : ''}. Tell me about the specific modules or courses you've taken that you're most proud of, and what you've learned from them! 📚"

DO NOT ask about work experience yet - focus ONLY on education details first.`
            } else {
              focusArea = `FIRST MESSAGE: They clicked "Start Building Your Profile". Welcome them warmly and start with the FIRST incomplete section from above. Make it exciting!`
            }
          }

          // 🔍 DEBUG LOGGING - What data is AI receiving?
          console.log('📊 ========== AI CONTEXT DEBUG ==========')
          console.log('👤 Existing Data:\n', existingData)
          console.log('📈 CV Status:\n', cvStatus)
          console.log('🎯 Focus Area:', focusArea)
          console.log('💬 Conversation Length:', conversation.messages.length)
          console.log('======================================')

          // Limit conversation history to last 4 messages to prevent confusion
          const recentMessages = conversation.messages.slice(-4)

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
              ...recentMessages.map((msg) => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content,
              })),
              {
                role: 'user',
                content: message,
              }
            ],
            temperature: 0.5, // Lower temperature for more consistent behavior
            max_tokens: 300,
          })

          aiResponse = completion.choices[0]?.message?.content || 
            'Tell me more about your background!'

          // ⛔ POST-PROCESSING FILTER: Block AI from asking forbidden questions
          const forbiddenPatterns = [
            /what'?s?\s+your\s+(full\s+)?name/i,
            /tell\s+me\s+your\s+name/i,
            /what\s+university/i,
            /which\s+university/i,
            /what'?s?\s+your\s+major/i,
            /what\s+are\s+you\s+studying/i,
          ];

          const hasForbiddenQuestion = forbiddenPatterns.some(pattern => pattern.test(aiResponse));
          
          if (hasForbiddenQuestion) {
            console.error('⛔ AI ASKED FORBIDDEN QUESTION! Blocking and regenerating...');
            console.error('   Blocked response:', aiResponse);
            
            // Force AI to focus on next appropriate question
            if (completeness.education.entriesCount === 0) {
              aiResponse = `Great! I've noted that you're studying ${user?.major} at ${user?.university}. Now tell me about the specific modules or courses you've taken - which ones did you enjoy most and what did you learn from them?`;
            } else if (completeness.skills.entriesCount < 3) {
              aiResponse = `Perfect! Now let's talk about your skills. What technical skills, tools, or languages are you proficient in?`;
            } else if (completeness.experience.entriesCount === 0) {
              aiResponse = `Great progress! Now let's discuss your work experience. Have you had any internships, jobs, or work experience? Tell me about your roles and achievements.`;
            } else {
              aiResponse = `Tell me more about your experiences and what you've accomplished!`;
            }
          }

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
        success: dataSaved,
        data: extractedData
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

