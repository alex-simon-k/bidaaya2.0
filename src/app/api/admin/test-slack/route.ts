import { NextRequest, NextResponse } from 'next/server'
import { SlackService } from '@/lib/slack-service'
import { DailySummaryService } from '@/lib/daily-summary-service'

export async function POST(request: NextRequest) {
  try {
    const { message, type } = await request.json()

    let success = false

    switch (type) {
      case 'student':
        success = await SlackService.notifyNewStudentSignup({
          name: 'Test Student',
          email: 'test@university.edu',
          university: 'Test University',
          major: 'Computer Science',
          role: 'STUDENT'
        })
        break

      case 'company':
        success = await SlackService.notifyNewCompanySignup({
          name: 'Test Contact',
          email: 'test@company.com',
          companyName: 'Test Company',
          industry: 'Technology',
          role: 'COMPANY'
        })
        break

      case 'daily-summary':
        success = await DailySummaryService.sendTestSummary()
        break

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid test type. Use: student, company, or daily-summary'
        }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Slack notification sent successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send Slack notification. Check your webhook URL.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error testing Slack integration:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
} 