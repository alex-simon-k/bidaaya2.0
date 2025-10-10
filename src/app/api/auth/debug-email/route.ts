import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth-config";
import nodemailer from 'nodemailer';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin or development access
    if (process.env.NODE_ENV !== 'development' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('🔍 Email debug check initiated');

    const debugInfo = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        timestamp: new Date().toISOString()
      },
      emailConfig: {
        EMAIL_USER_SET: !!process.env.EMAIL_USER,
        EMAIL_USER_LENGTH: process.env.EMAIL_USER?.length || 0,
        EMAIL_USER_PREVIEW: process.env.EMAIL_USER ? 
          `${process.env.EMAIL_USER.substring(0, 3)}***@${process.env.EMAIL_USER.split('@')[1]}` : 
          'NOT_SET',
        EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
        EMAIL_PASS_LENGTH: process.env.EMAIL_PASS?.length || 0
      },
      connectionTest: null as any,
      recommendations: [] as string[]
    };

    // Test email connection if credentials are available
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        console.log('🔍 Testing email connection...');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.verify();
        debugInfo.connectionTest = {
          status: 'SUCCESS',
          message: 'Email connection verified successfully'
        };
        console.log('🔍 ✅ Email connection test passed');

      } catch (connectionError) {
        debugInfo.connectionTest = {
          status: 'FAILED',
          error: connectionError instanceof Error ? connectionError.message : 'Unknown connection error',
          details: connectionError
        };
        console.log('🔍 ❌ Email connection test failed:', connectionError);

        // Add specific recommendations based on error
        if (connectionError instanceof Error) {
          if (connectionError.message.includes('535')) {
            debugInfo.recommendations.push('Check Gmail app password - ensure 2FA is enabled and app password is correct');
          }
          if (connectionError.message.includes('timeout')) {
            debugInfo.recommendations.push('Check network connectivity and firewall settings');
          }
          if (connectionError.message.includes('authentication')) {
            debugInfo.recommendations.push('Verify EMAIL_USER and EMAIL_PASS environment variables');
          }
        }
      }
    } else {
      debugInfo.connectionTest = {
        status: 'SKIPPED',
        message: 'Email credentials not configured'
      };
      debugInfo.recommendations.push('Set EMAIL_USER and EMAIL_PASS environment variables');
    }

    // General recommendations
    if (!debugInfo.emailConfig.EMAIL_USER_SET) {
      debugInfo.recommendations.push('Set EMAIL_USER to your Gmail address');
    }
    if (!debugInfo.emailConfig.EMAIL_PASS_SET) {
      debugInfo.recommendations.push('Set EMAIL_PASS to your Gmail app-specific password');
    }
    if (debugInfo.emailConfig.EMAIL_PASS_LENGTH > 0 && debugInfo.emailConfig.EMAIL_PASS_LENGTH < 16) {
      debugInfo.recommendations.push('Gmail app passwords are typically 16 characters long');
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      instructions: {
        setup: 'Follow EMAIL_SETUP.md for detailed configuration instructions',
        testing: 'Use POST /api/auth/send-verification with a test email to verify email sending',
        fallback: 'If email fails, verification codes will be logged to console in development mode'
      }
    });

  } catch (error) {
    console.error('🔍 ❌ Debug email check failed:', error);
    return NextResponse.json({ 
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
