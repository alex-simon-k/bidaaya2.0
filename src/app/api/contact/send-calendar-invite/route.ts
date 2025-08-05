import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-config'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Company access required' }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, candidateEmail, candidateName } = body

    if (!candidateId || !candidateEmail || !candidateName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get company details and verify calendly link
    const company = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        calendlyLink: true,
        name: true,
        email: true,
        companyName: true,
        contactPersonName: true,
        contactEmail: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if company has Calendly link
    if (!company.calendlyLink) {
      return NextResponse.json({ 
        error: 'Please add your Calendly link in your company profile before sending calendar invites.' 
      }, { status: 400 })
    }

    // Get candidate details
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Email template for calendar invite
    const companyDisplayName = company.companyName || company.name || 'the company'
    const contactPersonName = company.contactPersonName || company.name || 'Hiring Manager'
    const contactEmail = company.contactEmail || company.email
    // Always CC the company's registered email (from Google auth) for transparency
    const registeredEmail = company.email

    const emailTemplate = {
      from: `"Bidaaya Team" <${process.env.EMAIL_USER}>`,
      to: candidateEmail,
      cc: registeredEmail, // CC the company's registered email
      subject: `🎯 You've been selected by ${companyDisplayName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">You've been selected for an interview!</p>
            </div>

            <!-- Main Content -->
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                Hey <strong>${candidateName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                You've been luckily selected by <strong>${companyDisplayName}</strong> who's seen your profile and would love to get to know you more in an interview.
              </p>

              <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                Please use the following link to schedule an interview at your convenience.
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0; padding: 25px; background: #f1f5f9; border-radius: 8px;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0;">📅 Schedule Your Interview</h3>
              <p style="color: #475569; margin: 0 0 20px 0;">Click the button below to choose a time that works best for you:</p>
              
              <a href="${company.calendlyLink}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🗓️ Book Interview Slot
              </a>
            </div>

            <!-- Next Steps -->
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h4 style="color: #047857; margin: 0 0 10px 0;">📋 What to expect:</h4>
              <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                <li>Interview duration: 30-45 minutes</li>
                <li>Format: Video call (Zoom/Teams link will be provided)</li>
                <li>Discussion about your experience and the opportunity</li>
                <li>Q&A session about the role and company</li>
              </ul>
            </div>

            <!-- Contact Information -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 14px; color: #64748b; margin: 0;">
                <strong>Contact Person:</strong> ${contactPersonName}<br>
                <strong>Email:</strong> ${contactEmail}<br>
                <strong>Company:</strong> ${companyDisplayName}
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                This email was sent through Bidaaya's recruitment platform.<br>
                If you have any questions, please contact ${contactPersonName} directly.
              </p>
            </div>

          </div>
        </div>
      `,
      text: `
You've been selected by ${companyDisplayName}!

Hey ${candidateName},

You've been luckily selected by ${companyDisplayName} who's seen your profile and would love to get to know you more in an interview.

Please use the following link to schedule an interview at your convenience.

📅 Schedule Your Interview:
Please visit the following link to choose a time that works best for you:
${company.calendlyLink}

📋 What to expect:
- Interview duration: 30-45 minutes
- Format: Video call (Zoom/Teams link will be provided)
- Discussion about your experience and the opportunity
- Q&A session about the role and company

Contact Information:
Contact Person: ${contactPersonName}
Email: ${contactEmail}
Company: ${companyDisplayName}

This email was sent through Bidaaya's recruitment platform.
If you have any questions, please contact ${contactPersonName} directly.
      `
    }

    // Send the email
    await transporter.sendMail(emailTemplate)

    // Log the interaction for analytics (simple console log for now)
    console.log(`📊 Analytics: Calendar invite sent`, {
      companyId: session.user.id,
      candidateId,
      candidateName,
      candidateEmail,
      timestamp: new Date().toISOString()
    })

    console.log(`📅 Calendar invite sent from ${companyDisplayName} to ${candidateName} (${candidateEmail})`)

    return NextResponse.json({ 
      success: true, 
      message: `Calendar invite sent successfully to ${candidateName}! They will receive an email with your Calendly link.` 
    })

  } catch (error) {
    console.error('❌ Calendar invite error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while sending the calendar invite.' 
    }, { status: 500 })
  }
} 