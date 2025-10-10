import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  console.log('🔧 ===================== DEBUG AUTH CONFIG START =====================');
  
  try {
    // Check environment variables
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log('🔧 Environment variables check:', envCheck);

    // Test database connection
    console.log('🔧 Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('🔧 Database connection successful. User count:', userCount);

    // Check for recent verification tokens
    const recentTokens = await prisma.verificationToken.count({
      where: {
        expires: { gt: new Date() }
      }
    });
    console.log('🔧 Active verification tokens:', recentTokens);

    console.log('🔧 ===================== DEBUG AUTH CONFIG SUCCESS =====================');

    return NextResponse.json({ 
      success: true,
      environment: envCheck,
      database: {
        connected: true,
        userCount,
        activeTokens: recentTokens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔧 ❌ Debug endpoint error:', error);
    console.error('🔧 ❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.log('🔧 ===================== DEBUG AUTH CONFIG ERROR =====================');
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
