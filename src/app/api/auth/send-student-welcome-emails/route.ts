import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { triggerNewStudentEmails, extractStudentDataFromUser } from '@/lib/auth-email-automation'
import { SlackService } from '@/lib/slack-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, name, university, major } = body

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email and name' },
        { status: 400 }
      )
    }

    // Only send emails to the authenticated user's email
    if (email !== session.user?.email) {
      return NextResponse.json(
        { error: 'Email mismatch' },
        { status: 403 }
      )
    }

    console.log(`🎯 Sending welcome emails to student: ${email}`)

    // Create student data object for the email automation
    const studentData = extractStudentDataFromUser({
      name,
      email,
      role: 'STUDENT',
      university: university || null,
      major: major || null,
    })

    // Trigger the welcome email sequence
    await triggerNewStudentEmails(studentData)

    // Send Slack notification to admin about new student signup
    const { slackService } = await import('@/lib/slack-service')
    await slackService.notifyNewUserSignup({
      id: 'student-welcome', // Temporary ID for welcome emails
      name,
      email,
      role: 'STUDENT',
      university: university || undefined,
      signupTime: new Date().toISOString()
    })

    console.log(`✅ Welcome emails sent successfully to ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Welcome emails sent successfully'
    })

  } catch (error) {
    console.error('Error sending student welcome emails:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 