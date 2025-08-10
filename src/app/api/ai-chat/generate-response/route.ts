import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { enhancedCompanyAI } from '@/lib/enhanced-company-ai'

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