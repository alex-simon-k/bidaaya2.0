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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Bidaaya!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${verificationCode}</h3>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
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
    console.error('📧 ❌ Error in send verification:', error);
    console.error('📧 ❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('📧 ❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('📧 ===================== SEND VERIFICATION ERROR =====================');
    
    return NextResponse.json({ 
      error: 'Failed to send verification code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 