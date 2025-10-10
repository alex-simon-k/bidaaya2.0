import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || (session.user?.role !== 'STUDENT' && session.user?.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count total applications
    let count = 0
    
    if (session.user?.role === 'STUDENT') {
      // Count applications for this student
      count = await prisma.application.count({
        where: {
          userId: session.user?.id
        }
      })
    } else if (session.user?.role === 'ADMIN') {
      // For admins, return 0 (they don't have personal applications)
      count = 0
    }

    return NextResponse.json({ count })

  } catch (error) {
    console.error('Error counting applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
