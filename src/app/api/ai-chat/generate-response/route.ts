import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { aiChatService } from '@/lib/ai-chat-responses'

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

    console.log(`🤖 AI Chat Request from ${session.user.id}: "${userQuery}"`)

    // Generate AI response
    const aiResponse = await aiChatService.generateResponse({
      userQuery: userQuery.trim(),
      userRole: userRole || 'COMPANY',
      userName: userName || session.user.id,
      detectedIntent,
      previousMessages
    })

    console.log(`✅ AI Response generated: ${aiResponse.actionType}`)

    return NextResponse.json(aiResponse)

  } catch (error) {
    console.error('❌ AI Chat Response Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 