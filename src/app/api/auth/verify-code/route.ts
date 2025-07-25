import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    console.log(`Verifying code for email: ${email}`);

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: code,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

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

    const encodedToken = await encode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    cookies().set('next-auth.session-token', encodedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, redirect: '/auth/setup-profile' });

  } catch (error) {
    console.error('Error verifying code:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to verify code', details: errorMessage }, { status: 500 });
  }
} 