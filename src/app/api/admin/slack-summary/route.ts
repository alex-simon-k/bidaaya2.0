import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { slackAutomation } from '@/lib/slack-service'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'daily-summary') {
      console.log('📊 Triggering daily Slack summary...')
      const success = await slackAutomation.triggerDailySummary()
      
      return NextResponse.json({
        success,
        message: success ? 'Daily summary sent to Slack' : 'Failed to send daily summary',
        timestamp: new Date().toISOString()
      })
      
    } else if (action === 'test-signup') {
      // Test user signup notification
      const { userId } = await request.json()
      if (!userId) {
        return NextResponse.json({ error: 'userId required for test-signup' }, { status: 400 })
      }
      
      console.log('🔔 Testing user signup notification...')
      const success = await slackAutomation.notifyUserSignup(userId)
      
      return NextResponse.json({
        success,
        message: success ? 'Test signup notification sent' : 'Failed to send test notification',
        timestamp: new Date().toISOString()
      })
      
    } else if (action === 'check-milestones') {
      console.log('🎯 Checking application milestones...')
      await slackAutomation.checkApplicationMilestones()
      
      return NextResponse.json({
        success: true,
        message: 'Application milestones checked',
        timestamp: new Date().toISOString()
      })
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "daily-summary", "test-signup", or "check-milestones"' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error triggering Slack automation:', error)
    return NextResponse.json({ 
      error: 'Failed to trigger Slack automation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      info: {
        description: 'Slack Automation Management API',
        webhookConfigured: !!process.env.SLACK_WEBHOOK_URL,
        actions: {
          'daily-summary': 'POST with {"action": "daily-summary"} - Sends daily platform summary to Slack',
          'test-signup': 'POST with {"action": "test-signup", "userId": "user_id"} - Tests user signup notification',
          'check-milestones': 'POST with {"action": "check-milestones"} - Checks and notifies application milestones'
        },
        notifications: [
          'Real-time user signup alerts',
          'Daily platform summary with growth trends',
          'Application milestone notifications (10, 25, 50, 100)',
          'Project approval notifications',
          'Revenue and subscription alerts',
          'Weekly summary reports'
        ],
        setup: {
          required: 'Set SLACK_WEBHOOK_URL environment variable',
          format: 'https://hooks.slack.com/services/...',
          testing: 'Without webhook URL, notifications will be logged to console'
        }
      }
    })

  } catch (error) {
    console.error('❌ Error getting Slack automation info:', error)
    return NextResponse.json({ 
      error: 'Failed to get Slack automation information' 
    }, { status: 500 })
  }
} 
