import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check user verification status
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        role: true,
        profileCompleted: true,
      }
    })

    if (!user) {
      return NextResponse.json({ 
        isVerified: false,
        exists: false 
      })
    }

    console.log(`📊 User verification status for ${email}:`, {
      isVerified: !!user.emailVerified,
      role: user.role,
      profileCompleted: user.profileCompleted
    });

    return NextResponse.json({
      isVerified: !!user.emailVerified,
      exists: true,
      role: user.role,
      profileCompleted: user.profileCompleted
    })

  } catch (error) {
    console.error('❌ Error checking verification status:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      isVerified: false 
    }, { status: 500 })
  }
} 
