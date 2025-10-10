import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"
import { Resend } from 'resend'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role !== 'ADMIN') {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
    }

    const body = await request.json()
    const { applicationIds, message, interviewDate, interviewType = 'video', meetingLink } = body

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: 'Application IDs array is required' },
        { status: 400 }
      )
    }

    // Admin can invite any applications, fetch them with company details
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            company: {
              select: {
                id: true,
                name: true,
                companyName: true,
                contactEmail: true,
                contactPersonName: true,
                email: true // Fallback if contactEmail not set
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
          }
        }
      },
    })

    if (applications.length !== applicationIds.length) {
      return NextResponse.json(
        { error: 'Some applications not found' },
        { status: 404 }
      )
    }

    // Update application status to INTERVIEWED (admin override)
    await prisma.application.updateMany({
      where: {
        id: { in: applicationIds }
      },
      data: {
        status: 'INTERVIEWED',
        updatedAt: new Date(),
        adminNotes: `Interview invitation sent by admin (${session.user.email}) on ${new Date().toISOString()}`
      },
    })

    // Send interview invitation emails
    const emailPromises = applications.map(async (application) => {
      const companyName = application.project.company.companyName || application.project.company.name || 'Bidaaya Company'
      const contactPerson = application.project.company.contactPersonName || 'Hiring Team'
      const companyEmail = application.project.company.contactEmail || application.project.company.email || 'noreply@bidaaya.ae'
      
      const emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Interview Invitation</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been selected for an interview!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Dear ${application.user.name},
            </p>
            
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Congratulations! We were impressed with your application for the <strong>${application.project.title}</strong> project at <strong>${companyName}</strong>.
            </p>
            
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              We would like to invite you for an interview to discuss your background and the project in more detail.
            </p>
            
            ${interviewDate ? `
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 10px 0;">📅 Interview Details</h3>
                <p style="margin: 5px 0; color: #6c757d;"><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #6c757d;"><strong>Type:</strong> ${interviewType === 'video' ? 'Video Call' : interviewType === 'phone' ? 'Phone Call' : 'In-Person'}</p>
                ${meetingLink ? `<p style="margin: 5px 0; color: #6c757d;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #667eea;">${meetingLink}</a></p>` : ''}
              </div>
            ` : ''}
            
            ${message ? `
              <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 10px 0;">💬 Message from ${contactPerson}</h3>
                <p style="margin: 0; color: #6c757d; font-style: italic;">"${message}"</p>
              </div>
            ` : ''}
            
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Please reply to this email to confirm your availability or if you need to reschedule.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://bidaaya.ae/dashboard/applications" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                View Application Status
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                📋 <strong>Note:</strong> This interview invitation was coordinated by the Bidaaya team on behalf of ${companyName}.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Best regards,<br>
              <strong>Bidaaya Team</strong> (on behalf of ${contactPerson})<br>
              ${companyName}<br>
              <a href="mailto:${companyEmail}" style="color: #667eea;">${companyEmail}</a>
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This interview invitation was sent via Bidaaya Platform<br>
                <a href="https://bidaaya.ae" style="color: #667eea;">bidaaya.ae</a>
              </p>
            </div>
          </div>
        </div>
      `

      return resend.emails.send({
        from: 'noreply@bidaaya.ae',
        to: [application.user.email],
        cc: ['alex.simon@bidaaya.ae'], // CC as per requirements
        replyTo: companyEmail, // Set company email as reply-to
        subject: `🎉 Interview Invitation - ${application.project.title} at ${companyName}`,
        html: emailContent,
      })
    })

    // Wait for all emails to be sent
    const emailResults = await Promise.allSettled(emailPromises)
    
    // Count successful and failed emails
    const successful = emailResults.filter(result => result.status === 'fulfilled').length
    const failed = emailResults.filter(result => result.status === 'rejected').length

    console.log(`✅ Admin interview invitations sent: ${successful} successful, ${failed} failed by ${session.user.email}`)

    if (failed > 0) {
      console.error('❌ Some admin email failures:', emailResults.filter(r => r.status === 'rejected'))
    }

    return NextResponse.json({
      success: true,
      emailsSent: successful,
      emailsFailed: failed,
      totalApplications: applications.length,
      message: `Admin sent interview invitations to ${successful} candidate(s)${failed > 0 ? ` (${failed} failed)` : ''}`,
      adminAction: true,
      performedBy: session.user.email,
      companyDetails: applications.map(app => ({
        companyId: app.project.company.id,
        companyName: app.project.company.companyName,
        projectTitle: app.project.title
      }))
    })

  } catch (error) {
    console.error('❌ Error sending admin interview invitations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send admin interview invitations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
