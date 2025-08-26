import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-config'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Company access required' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      studentId, 
      message, 
      subject, 
      searchId, 
      opportunityType = 'general' 
    } = body

    if (!studentId || !message || !subject) {
      return NextResponse.json({ error: 'Student ID, message, and subject are required' }, { status: 400 })
    }

    // Get student and company details
    const [student, company] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          email: true,
          university: true,
          major: true,
          graduationYear: true
        }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          contactEmail: true,
          contactPersonName: true,
          industry: true,
          companyWebsite: true
        }
      })
    ])

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Prepare email content
    const companyName = company.companyName || company.name || 'Company'
    const contactPersonName = company.contactPersonName || company.name || 'Hiring Team'
    const companyEmail = company.contactEmail || company.email

    const emailSubject = `${subject} | ${companyName}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">Bidaaya</h1>
          <p style="color: #6B7280; margin: 5px 0;">Student-Company Connection Platform</p>
        </div>
        
        <h2 style="color: #1F2937; margin-bottom: 20px;">Opportunity from ${companyName} 🚀</h2>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          Dear ${student.name},
        </p>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          ${contactPersonName} from ${companyName} has reached out to you through Bidaaya with an exciting opportunity!
        </p>
        
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Company Information</h3>
          <p><strong>Company:</strong> ${companyName}</p>
          <p><strong>Contact Person:</strong> ${contactPersonName}</p>
          ${company.industry ? `<p><strong>Industry:</strong> ${company.industry}</p>` : ''}
          ${company.companyWebsite ? `<p><strong>Website:</strong> <a href="${company.companyWebsite}" target="_blank">${company.companyWebsite}</a></p>` : ''}
          ${company.contactEmail ? `<p><strong>Contact Email:</strong> <a href="mailto:${company.contactEmail}">${company.contactEmail}</a></p>` : ''}
          ${company.contactWhatsapp ? `<p><strong>WhatsApp:</strong> <a href="https://wa.me/${company.contactWhatsapp.replace(/[^0-9]/g, '')}" target="_blank">${company.contactWhatsapp}</a></p>` : ''}
          ${company.calendlyLink ? `<p><strong>Schedule Meeting:</strong> <a href="${company.calendlyLink}" target="_blank">Book a time slot</a></p>` : ''}
        </div>
        
        <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Message</h3>
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        
        <div style="background: #E6FFFA; border: 1px solid #81E6D9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="color: #234E52; margin-top: 0; margin-bottom: 10px;">📞 How to Connect</h4>
          <div style="color: #234E52; font-size: 14px;">
            <p style="margin: 0 0 10px 0;"><strong>Option 1:</strong> Reply directly to this email</p>
            ${company.contactEmail && company.contactEmail !== companyEmail ? `<p style="margin: 0 0 10px 0;"><strong>Option 2:</strong> Email directly at <a href="mailto:${company.contactEmail}">${company.contactEmail}</a></p>` : ''}
            ${company.contactWhatsapp ? `<p style="margin: 0 0 10px 0;"><strong>Option 3:</strong> WhatsApp at <a href="https://wa.me/${company.contactWhatsapp.replace(/[^0-9]/g, '')}" target="_blank">${company.contactWhatsapp}</a></p>` : ''}
            ${company.calendlyLink ? `<p style="margin: 0 0 10px 0;"><strong>Option 4:</strong> <a href="${company.calendlyLink}" target="_blank">Schedule a meeting directly</a></p>` : ''}
            <p style="margin: 10px 0 0 0; font-style: italic;">💡 <strong>Note:</strong> ${contactPersonName} will be copied on any email replies for transparency.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #6B7280; font-size: 14px;">
            This message was sent through Bidaaya's secure platform.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Bidaaya - Connecting Students & Companies</p>
          <p>This message was sent through our secure platform. Reply directly to connect with the company.</p>
        </div>
      </div>
    `

    // Send email using Resend API with CC to admin
    try {
      const emailResult = await resend.emails.send({
        from: 'Bidaaya <noreply@bidaaya.ae>',
        to: [student.email],
        cc: ['alex.simon@bidaaya.ae'], // CC admin as requested
        replyTo: companyEmail, // Allow direct reply to company
        subject: emailSubject,
        html: emailHtml
      })

      if (emailResult.error) {
        console.error('❌ Failed to send opportunity email:', emailResult.error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      console.log('✅ Opportunity email sent successfully:', emailResult.data?.id)

      // If this was from an AI search, update the match record
      if (searchId) {
        try {
          await prisma.aIMatch.updateMany({
            where: {
              searchId: searchId,
              studentId: studentId
            },
            data: {
              wasContacted: true,
              contactedAt: new Date()
            }
          })
          console.log('✅ Updated AI match contact status')
        } catch (updateError) {
          console.error('⚠️ Failed to update match status:', updateError)
          // Don't fail the request if this fails
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Message sent successfully to student',
        emailId: emailResult.data?.id
      })

    } catch (emailError) {
      console.error('❌ Error sending opportunity email:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in direct message API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
