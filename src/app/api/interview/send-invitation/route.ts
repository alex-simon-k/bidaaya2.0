import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-config'
import { emailAutomation } from '@/lib/email-automation'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Company access required' }, { status: 401 })
    }

    const body = await request.json()
    const { applicationId, interviewType = 'initial' } = body

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    // Get application and company details
    const [application, company] = await Promise.all([
      prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          user: true,
          project: true
        }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionPlan: true,
          calendlyLink: true,
          name: true,
          email: true,
          companyName: true
        }
      })
    ])

    if (!application || !company) {
      return NextResponse.json({ error: 'Application or company not found' }, { status: 404 })
    }

    // Check subscription permissions
    const subscriptionPlan = company.subscriptionPlan || 'FREE'
    const hasAutomatedEmails = ['COMPANY_PREMIUM', 'COMPANY_PRO'].includes(subscriptionPlan)

    if (!hasAutomatedEmails) {
      return NextResponse.json({ 
        error: 'Automated emails not available. Upgrade to HR Booster for automated interview scheduling.' 
      }, { status: 403 })
    }

    // Check if company has Calendly link
    if (!company.calendlyLink) {
      return NextResponse.json({ 
        error: 'Please add your Calendly link in your company profile before sending interview invitations.' 
      }, { status: 400 })
    }

    // Prepare candidate info
    const candidateInfo = {
      id: application.user.id,
      name: application.user.name || 'Candidate',
      email: application.user.email,
      projectTitle: application.project.title,
      companyName: company.companyName || company.name || 'Company'
    }

    // Prepare interview scheduling info
    const schedulingInfo = {
      candidateInfo,
      calendlyLink: company.calendlyLink,
      interviewType,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      companyContactName: company.name || 'Hiring Manager',
      companyContactEmail: company.email
    }

    // Send automated interview invitation
    const emailSent = await emailAutomation.sendInterviewInvitation(schedulingInfo)

    if (emailSent) {
      // Update application status
      await prisma.application.update({
        where: { id: applicationId },
        data: { 
          status: 'INTERVIEWED',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Interview invitation sent successfully! Candidate will receive an email with your Calendly link.' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send interview invitation. Please try again.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Interview invitation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while sending the interview invitation.' 
    }, { status: 500 })
  }
} 
