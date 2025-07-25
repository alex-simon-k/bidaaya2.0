import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';

export async function GET() {
  console.log('🧪 Testing NextAuth configuration...');
  
  try {
    // Check if authOptions is properly configured
    const config = {
      providersCount: authOptions.providers?.length || 0,
      hasGoogleProvider: authOptions.providers?.some(p => p.id === 'google'),
      hasSignInPage: !!authOptions.pages?.signIn,
      hasCallbacks: !!authOptions.callbacks,
      sessionStrategy: authOptions.session?.strategy,
      environment: {
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      }
    };

    console.log('🧪 NextAuth config check:', config);
    
    return NextResponse.json({
      success: true,
      config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 ❌ NextAuth config error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 