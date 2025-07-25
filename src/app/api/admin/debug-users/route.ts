import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Debug endpoint - Looking for users with email:', email);

    // Find all users with this email
    const users = await prisma.user.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('📊 Debug endpoint - Found users:', users);

    // Also try findUnique to see what it returns
    const uniqueUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('📊 Debug endpoint - findUnique result:', uniqueUser);

    return NextResponse.json({
      success: true,
      email,
      users,
      findUniqueResult: uniqueUser,
      userCount: users.length
    });

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 