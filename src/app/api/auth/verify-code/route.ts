import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  console.log('🔍 ===================== VERIFY CODE START =====================');
  
  try {
    const { email, code } = await req.json();
    console.log('🔍 Verification attempt:', { email, code });
    
    if (!email || !code) {
      console.log('🔍 ❌ Missing email or code in request');
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    console.log('🔍 Searching for verification token...');
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: code,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      console.log('🔍 ❌ Invalid or expired verification code:', {
        email,
        code,
        currentTime: new Date().toISOString()
      });
      
      // Let's also check if there are any tokens for this email
      const allTokensForEmail = await prisma.verificationToken.findMany({
        where: { identifier: email }
      });
      console.log('🔍 All verification tokens for this email:', allTokensForEmail.map(t => ({
        token: t.token,
        expires: t.expires,
        expired: t.expires < new Date()
      })));
      
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    console.log('🔍 ✅ Valid verification token found:', {
      identifier: verificationToken.identifier,
      token: verificationToken.token,
      expires: verificationToken.expires
    });

    console.log('🔍 Updating user emailVerified status...');
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    console.log('🔍 ✅ User updated with email verification:', {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      profileCompleted: user.profileCompleted
    });

    console.log('🔍 Deleting used verification token...');
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });
    console.log('🔍 ✅ Verification token deleted');

    console.log('🔍 Creating new session token...');
    const sessionToken = {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      profileCompleted: user.profileCompleted,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    };

    console.log('🔍 Session token data:', {
      id: sessionToken.id,
      email: sessionToken.email,
      role: sessionToken.role,
      emailVerified: sessionToken.emailVerified,
      profileCompleted: sessionToken.profileCompleted
    });

    console.log('🔍 Encoding session token...');
    const encodedToken = await encode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    console.log('🔍 Setting session cookie...');
    cookies().set('next-auth.session-token', encodedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    const redirectUrl = user.profileCompleted ? '/dashboard' : '/auth/setup-profile';
    console.log('🔍 ✅ Verification successful, redirecting to:', redirectUrl);
    console.log('🔍 ===================== VERIFY CODE SUCCESS =====================');

    return NextResponse.json({ 
      success: true, 
      redirect: redirectUrl,
      debug: {
        userFound: true,
        emailVerified: true,
        profileCompleted: user.profileCompleted,
        redirectUrl
      }
    });

  } catch (error) {
    console.error('🔍 ❌ Error in verify code:', error);
    console.error('🔍 ❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('🔍 ❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('🔍 ===================== VERIFY CODE ERROR =====================');
    
    return NextResponse.json({ 
      error: 'An error occurred during verification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 