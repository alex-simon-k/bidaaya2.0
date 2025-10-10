import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { enhancedCompanyAI } from '@/lib/enhanced-company-ai'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  console.log('🚀 AI Chat API Route - Request received')
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { userQuery, userRole, userName, detectedIntent, previousMessages } = body

    if (!userQuery || userQuery.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Please provide a valid query' 
      }, { status: 400 })
    }

    console.log(`🤖 Enhanced AI Chat Request from ${session.user.id}: "${userQuery}"`)

    // Record the query in ChatQuery table for analytics
    try {
      await prisma.chatQuery.create({
        data: {
          userId: session.user.id,
          query: userQuery.trim(),
          queryType: detectedIntent === 'find-talent' ? 'SKILL_SEARCH' : 
                    detectedIntent === 'create-project' ? 'COMPANY_RESEARCH' : 'GENERAL',
          intent: detectedIntent || 'general_chat',
          extractedSkills: [], // Could be enhanced later with AI extraction
          extractedRoles: [],
          extractedCompanies: [],
          responseGiven: true,
          timestamp: new Date()
        }
      })
      console.log('✅ Query recorded in ChatQuery table')
    } catch (queryError) {
      console.error('⚠️ Failed to record query:', queryError)
      // Don't fail the request if query recording fails
    }

    // Use enhanced company AI service
    const aiResponse = await enhancedCompanyAI.generateCompanyResponse(userQuery.trim(), {
      userId: session.user.id,
      previousMessages: previousMessages || []
    })

    console.log(`✅ Enhanced AI Response generated: ${aiResponse.actionType}`)

    return NextResponse.json(aiResponse)

  } catch (error) {
    console.error('❌ AI Chat Response Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
