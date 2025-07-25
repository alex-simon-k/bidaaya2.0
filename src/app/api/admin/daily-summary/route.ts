import { NextRequest, NextResponse } from 'next/server'
import { DailySummaryService } from '@/lib/daily-summary-service'

export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json()

    if (test) {
      // Send test summary
      const success = await DailySummaryService.sendTestSummary()
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Test daily summary sent successfully'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to send test daily summary'
        }, { status: 500 })
      }
    } else {
      // Send actual daily summary
      const success = await DailySummaryService.sendDailySummary()
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Daily summary sent successfully'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to send daily summary'
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Error in daily summary API:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// GET endpoint to view stats without sending
export async function GET() {
  try {
    const stats = await DailySummaryService.getDailyStats()
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Daily stats retrieved successfully'
    })

  } catch (error) {
    console.error('Error getting daily stats:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
} 