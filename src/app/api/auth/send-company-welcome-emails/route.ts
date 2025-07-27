import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { SlackService } from '@/lib/slack-service'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, companyName, contactPersonName, industry } = await request.json()

    console.log('🔐 Company welcome email API - Request body:', { email, companyName });

    if (!email) {
      console.log('❌ Company welcome email API - No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify user exists in database (email-based authentication like other working APIs)
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`✅ Authentication successful for: ${email}, role: ${user.role}`)

    if (!email || !companyName || !contactPersonName) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Email, company name, and contact person name are required'
      }, { status: 400 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Company welcome email content
    const companyWelcomeEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🚀 Welcome to Bidaaya - Let\'s Connect Talent with Opportunity!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Bidaaya</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 16px; color: white;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 24px;">🚀</span>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to Bidaaya!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your gateway to exceptional MENA talent</p>
          </div>

          <!-- Main Content -->
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="color: #8b5cf6; margin-top: 0;">Hello ${contactPersonName}! 👋</h2>
            
            <p>Thank you for joining Bidaaya! We're excited to help <strong>${companyName}</strong> connect with exceptional talent from across the MENA region.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
              <h3 style="margin-top: 0; color: #8b5cf6;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>Explore the Platform:</strong> Browse student profiles and discover amazing talent</li>
                <li style="margin-bottom: 8px;"><strong>Post Opportunities:</strong> Share internships, projects, and job openings</li>
                <li style="margin-bottom: 8px;"><strong>Connect with Students:</strong> Start meaningful conversations with potential candidates</li>
                <li style="margin-bottom: 8px;"><strong>Build Your Network:</strong> Grow your presence in the MENA talent ecosystem</li>
              </ul>
            </div>

            ${industry ? `<p><strong>Industry Focus:</strong> We've noted that you're in the ${industry} sector. We'll help you find students with relevant skills and interests!</p>` : ''}
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://bidaaya-web-app.vercel.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Access Your Dashboard →
            </a>
          </div>

          <!-- Support Section -->
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #475569;">Need Help Getting Started?</h3>
            <p style="margin-bottom: 0;">Our team is here to support you! Feel free to reach out if you have any questions or need assistance setting up your first opportunities.</p>
            <p style="margin: 10px 0 0 0;"><strong>Email:</strong> support@bidaaya.ae</p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>Welcome to the Bidaaya community!</p>
            <p style="margin: 5px 0;">Connecting talent with opportunity across the MENA region</p>
            <div style="margin-top: 15px;">
              <a href="https://bidaaya.ae" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">Website</a>
              <a href="mailto:support@bidaaya.ae" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">Support</a>
            </div>
          </div>

        </body>
        </html>
      `
    }

    // Send the email
    await transporter.sendMail(companyWelcomeEmail)
    
    // Send Slack notification to admin about new company signup
    const { slackService } = await import('@/lib/slack-service')
    await slackService.notifyNewUserSignup({
      id: 'company-welcome', // Temporary ID for welcome emails
      name: contactPersonName,
      email,
      role: 'COMPANY',
      companyName,
      signupTime: new Date().toISOString()
    })
    
    console.log(`✅ Company welcome email sent to: ${email} (${companyName})`)

    return NextResponse.json({ 
      success: true,
      message: 'Company welcome email sent successfully'
    })

  } catch (error) {
    console.error('❌ Error sending company welcome email:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to send welcome email'
    }, { status: 500 })
  }
} 