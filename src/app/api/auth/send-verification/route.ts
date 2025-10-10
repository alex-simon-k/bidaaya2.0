import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  console.log('📧 ===================== SEND VERIFICATION START =====================');
  console.log('📧 API Route: POST request received');
  console.log('📧 Environment: NODE_ENV =', process.env.NODE_ENV);
  console.log('📧 Resend API Key exists:', !!process.env.RESEND_API_KEY);
  
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

    // Check if Resend API key is configured
    console.log('📧 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0,
      RESEND_API_KEY_PREFIX: process.env.RESEND_API_KEY?.substring(0, 8) || 'NOT_SET',
    });

    if (!process.env.RESEND_API_KEY) {
      console.log('📧 ⚠️ Resend API key not configured - Using development mode');
      console.log('📧 🔑 DEVELOPMENT MODE: Verification code:', verificationCode);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Verification code generated (Resend not configured)',
        developmentMode: true,
        verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
        instructions: process.env.NODE_ENV === 'development' 
          ? 'Use the verification code above to complete verification' 
          : 'Please configure RESEND_API_KEY environment variable'
      });
    }

    // Send verification email using Resend
    console.log('📧 Sending verification email with Resend...');
    console.log('📧 Resend client initialized with key prefix:', process.env.RESEND_API_KEY?.substring(0, 8));
    
    try {
      console.log('📧 Calling resend.emails.send with params:', {
        from: 'Bidaaya <noreply@bidaaya.ae>',
        to: [email],
        subject: `Your Bidaaya verification code: ${verificationCode}`
      });
      
      const { data, error } = await resend.emails.send({
        from: 'Bidaaya <noreply@bidaaya.ae>',
        to: [email],
        subject: `Your Bidaaya verification code: ${verificationCode}`,
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
      });

      if (error) {
        console.log('📧 ❌ Resend error details:', {
          error,
          errorType: typeof error,
          errorMessage: error?.message,
          errorName: error?.name,
          fullError: JSON.stringify(error, null, 2)
        });
        throw new Error(`Resend failed: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
      }

      console.log('📧 ✅ Email sent successfully with Resend:', {
        emailId: data?.id,
        to: email
      });

      console.log('📧 ===================== SEND VERIFICATION SUCCESS =====================');
      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
        debug: {
          email,
          codeGenerated: true,
          emailSent: true,
          emailId: data?.id,
          service: 'resend'
        },
        ...(process.env.NODE_ENV === 'development' && { verificationCode })
      });

    } catch (emailError) {
      console.error('📧 ❌ Resend email sending failed:', emailError);
      
      // In development, still return success with code for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 🔧 Development mode - returning code for testing:', verificationCode);
        return NextResponse.json({
          success: true,
          message: 'Development mode: Verification code generated (email sending failed)',
          verificationCode,
          emailError: emailError instanceof Error ? emailError.message : 'Unknown email error',
          service: 'resend-fallback'
        });
      }
      
      return NextResponse.json({ 
        success: false,
        error: 'Failed to send email',
        message: 'Email service unavailable. Please try again later.',
        debug: {
          emailError: emailError instanceof Error ? emailError.message : 'Unknown email error',
          service: 'resend'
        }
      }, { status: 503 });
    }

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
