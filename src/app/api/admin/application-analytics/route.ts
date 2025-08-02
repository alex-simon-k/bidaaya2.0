import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { ApplicationSessionTracker } from '@/lib/application-session-tracker'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admin access
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    // Parse filters
    const filters: any = {}
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    if (projectId) filters.projectId = projectId
    if (userId) filters.userId = userId

    console.log('📊 Fetching application session analytics with filters:', filters)

    // Get analytics data
    const analytics = await ApplicationSessionTracker.getSessionAnalytics(filters)

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error fetching application analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admin access
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, sessionId } = body

    console.log('📊 Application analytics action:', action, sessionId)

    switch (action) {
      case 'get_session':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }
        
        const sessionData = await ApplicationSessionTracker.getSession(sessionId)
        if (!sessionData) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: sessionData
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error in application analytics action:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 