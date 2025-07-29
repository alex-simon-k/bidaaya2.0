import { NextRequest, NextResponse } from 'next/server'
import { slackService } from '@/lib/slack-service'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📅 Running scheduled daily Slack summary...')
    
    // Send the daily summary to Slack
    const success = await slackService.sendDailySummary()
    
    if (success) {
      console.log('✅ Daily Slack summary sent successfully')
      return NextResponse.json({ 
        success: true, 
        message: 'Daily summary sent to Slack',
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('❌ Failed to send daily Slack summary')
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send daily summary'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in daily summary cron job:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also allow manual triggering for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminKey } = body

    // Simple admin verification for manual testing
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📱 Manually triggering daily Slack summary...')
    
    const success = await slackService.sendDailySummary()
    
    return NextResponse.json({ 
      success,
      message: success ? 'Daily summary sent successfully' : 'Failed to send summary',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in manual daily summary trigger:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 