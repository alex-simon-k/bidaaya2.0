import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { ApplicationSessionTracker } from '@/lib/application-session-tracker'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, sessionId, data } = body

    console.log(`📊 Application session API action: ${action}`)

    switch (action) {
      case 'start':
        if (!data?.projectId) {
          return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
        }

        const newSessionId = await ApplicationSessionTracker.startSession({
          userId: session.user.id,
          projectId: data.projectId,
          stepReached: data.stepReached || 1,
          deviceType: data.deviceType,
          browserInfo: data.browserInfo,
          userAgent: data.userAgent
        })

        return NextResponse.json({
          success: true,
          sessionId: newSessionId
        })

      case 'update':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        await ApplicationSessionTracker.updateProgress(sessionId, data)

        return NextResponse.json({
          success: true
        })

      case 'complete':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        await ApplicationSessionTracker.completeSession(sessionId)

        return NextResponse.json({
          success: true
        })

      case 'abandon':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        await ApplicationSessionTracker.abandonSession(sessionId)

        return NextResponse.json({
          success: true
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error in application session API:', error)
    return NextResponse.json(
      { error: 'Failed to process session request' },
      { status: 500 }
    )
  }
} 
