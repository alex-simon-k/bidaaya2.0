import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  console.log('📧 ===================== SEND VERIFICATION START =====================');
  
  try {
    const { email } = await req.json();
    console.log('📧 Verification request for email:', email);

    if (!email) {
      console.log('📧 ❌ No email provided in request');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    console.log('📧 Checking if user exists in database...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('📧 ❌ User not found in database for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('📧 ✅ User found:', {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role
    });

    // Generate verification code
    const verificationCode = generateVerificationCode();
    console.log('📧 Generated verification code:', verificationCode);

    // Store verification token in database
    console.log('📧 Storing verification token in database...');
    
    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });
    console.log('📧 Deleted existing verification tokens');

    // Create new verification token
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
    console.log('📧 ✅ Verification token created:', {
      identifier: verificationToken.identifier,
      token: verificationToken.token,
      expires: verificationToken.expires
    });

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 ⚠️ Email credentials not configured - Using development mode');
      console.log('📧 🔑 DEVELOPMENT MODE: Verification code:', verificationCode);
      
      // In development, return the code in the response for testing
      return NextResponse.json({ 
        success: true, 
        message: 'Verification code generated (Email service not configured)',
        developmentMode: true,
        verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
        instructions: process.env.NODE_ENV === 'development' 
          ? 'Use the verification code above to complete verification' 
          : 'Please configure EMAIL_USER and EMAIL_PASS environment variables'
      });
    }

    // Configure email transporter
    console.log('📧 Configuring email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('📧 Email configuration:', {
      service: 'gmail',
      user: process.env.EMAIL_USER ? 'Set' : 'Not set',
      pass: process.env.EMAIL_PASS ? 'Set' : 'Not set'
    });

    // Send verification email
    console.log('📧 Sending verification email...');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Bidaaya - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Bidaaya</h1>
            <p style="color: #6B7280; margin: 5px 0;">Student-Company Internship Platform</p>
          </div>
          
          <h2 style="color: #1F2937; margin-bottom: 20px;">Welcome to Bidaaya! 🚀</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining our platform connecting talented students with innovative companies. 
            Please verify your email address to complete your registration and start your journey.
          </p>
          
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 25px; margin: 25px 0; text-align: center; border-radius: 12px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Your verification code is:</p>
            <h3 style="margin: 0; font-size: 32px; letter-spacing: 8px; font-weight: bold;">${verificationCode}</h3>
          </div>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #6B7280; font-size: 14px;">
              ⏰ This code will expire in <strong>10 minutes</strong><br>
              🔒 Keep this code secure and don't share it with anyone
            </p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            If you didn't create a Bidaaya account, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
            <p>© 2024 Bidaaya - Connecting Students & Companies</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 ✅ Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });

    console.log('📧 ===================== SEND VERIFICATION SUCCESS =====================');
    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent successfully',
      debug: {
        email,
        codeGenerated: true,
        emailSent: true,
        messageId: info.messageId
      }
    });

  } catch (error) {
    console.error('📧 ❌ Error sending verification email:', error);
    console.log('📧 ===================== SEND VERIFICATION ERROR =====================');
    
    return NextResponse.json({ 
      error: 'Failed to send verification email',
      details: error instanceof Error ? error.message : 'Unknown error',
      instructions: 'Please check email configuration or use development mode'
    }, { status: 500 });
  }
} 