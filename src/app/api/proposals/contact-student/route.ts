import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
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
      proposalId, 
      message, 
      subject 
    } = body

    if (!proposalId || !message || !subject) {
      return NextResponse.json({ error: 'Proposal ID, message, and subject are required' }, { status: 400 })
    }

    // Get the proposal data from ChatQuery table
    const proposal = await prisma.chatQuery.findUnique({
      where: { id: proposalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
            graduationYear: true
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Verify this proposal belongs to the requesting company
    if (!proposal.extractedCompanies.includes(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized - This proposal is not for your company' }, { status: 403 })
    }

    // Get company details
    const company = await prisma.user.findUnique({
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

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const student = proposal.user
    const companyName = company.companyName || company.name || 'Company'
    const contactPersonName = company.contactPersonName || company.name || 'Hiring Team'
    const companyEmail = company.contactEmail || company.email

    // Parse proposal data
    let proposalData
    try {
      proposalData = JSON.parse(proposal.intent || '{}')
    } catch (error) {
      return NextResponse.json({ error: 'Invalid proposal data' }, { status: 400 })
    }

    const emailSubject = `${subject} | ${companyName}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">Bidaaya</h1>
          <p style="color: #6B7280; margin: 5px 0;">Student-Company Connection Platform</p>
        </div>
        
        <h2 style="color: #1F2937; margin-bottom: 20px;">Response to Your Proposal 🎉</h2>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          Dear ${student.name},
        </p>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          ${contactPersonName} from ${companyName} has reviewed your proposal and would like to connect with you!
        </p>
        
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Company Information</h3>
          <p><strong>Company:</strong> ${companyName}</p>
          <p><strong>Contact Person:</strong> ${contactPersonName}</p>
          ${company.industry ? `<p><strong>Industry:</strong> ${company.industry}</p>` : ''}
          ${company.companyWebsite ? `<p><strong>Website:</strong> <a href="${company.companyWebsite}" target="_blank">${company.companyWebsite}</a></p>` : ''}
        </div>
        
        <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Message</h3>
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        
        <div style="background: #EBF8FF; border: 1px solid #BEE3F8; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #2B6CB0; margin-top: 0; margin-bottom: 10px;">Your Original Proposal</h4>
          <p style="color: #2C5282; font-size: 14px; margin: 0;">
            <strong>Role:</strong> ${proposalData.proposalContent?.specificRole || 'N/A'}<br>
            <strong>Submitted:</strong> ${new Date(proposal.timestamp).toLocaleDateString()}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #374151; margin-bottom: 15px;">
            <strong>Reply directly to this email to continue the conversation with ${companyName}.</strong>
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>© 2024 Bidaaya - Connecting Students & Companies</p>
          <p>This message was sent through our secure platform. Reply directly to connect with the company.</p>
        </div>
      </div>
    `

    // Send email to student with CC to admin
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
        console.error('❌ Failed to send proposal response email:', emailResult.error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      console.log('✅ Proposal response email sent successfully:', emailResult.data?.id)

      // Update proposal status to mark as contacted
      try {
        await prisma.chatQuery.update({
          where: { id: proposalId },
          data: {
            // We can store contact status in a field or use the existing structure
            // For now, we'll just log it as the system doesn't have a specific field for this
          }
        })
      } catch (updateError) {
        console.error('⚠️ Failed to update proposal status:', updateError)
        // Don't fail the request if this fails
      }

      return NextResponse.json({
        success: true,
        message: 'Student contacted successfully',
        emailId: emailResult.data?.id
      })

    } catch (emailError) {
      console.error('❌ Error sending proposal response email:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in proposal contact API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
